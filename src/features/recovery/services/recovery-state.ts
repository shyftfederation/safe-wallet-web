import { SENTINEL_ADDRESS } from '@safe-global/safe-core-sdk/dist/src/utils/constants'
import memoize from 'lodash/memoize'
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments'
import { hexZeroPad } from 'ethers/lib/utils'
import type { BigNumber } from 'ethers'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { Delay } from '@gnosis.pm/zodiac'
import type { TransactionAddedEvent } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'
import type { JsonRpcProvider } from '@ethersproject/providers'
import type { TransactionReceipt } from '@ethersproject/abstract-provider'

import { trimTrailingSlash } from '@/utils/url'
import { sameAddress } from '@/utils/addresses'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { decodeMultiSendTxs } from '@/utils/transactions'

export const MAX_RECOVERER_PAGE_SIZE = 100

export type RecoveryQueueItem = TransactionAddedEvent & {
  timestamp: BigNumber
  validFrom: BigNumber
  expiresAt: BigNumber | null
  isMalicious: boolean
  executor: string
}

export type RecoveryStateItem = {
  address: string
  recoverers: Array<string>
  expiry: BigNumber
  delay: BigNumber
  txNonce: BigNumber
  queueNonce: BigNumber
  queue: Array<RecoveryQueueItem>
}

export type RecoveryState = Array<RecoveryStateItem>

export function _isMaliciousRecovery({
  chainId,
  version,
  safeAddress,
  transaction,
}: {
  chainId: string
  version: SafeInfo['version']
  safeAddress: string
  transaction: Pick<TransactionAddedEvent['args'], 'to' | 'data'>
}) {
  const BASE_MULTI_SEND_CALL_ONLY_VERSION = '1.3.0'

  const isMultiSend = isMultiSendCalldata(transaction.data)
  const transactions = isMultiSend ? decodeMultiSendTxs(transaction.data) : [transaction]

  if (!isMultiSend) {
    // Calling the Safe itself
    return !sameAddress(transaction.to, safeAddress)
  }

  const multiSendDeployment =
    getMultiSendCallOnlyDeployment({ network: chainId, version: version ?? undefined }) ??
    getMultiSendCallOnlyDeployment({ network: chainId, version: BASE_MULTI_SEND_CALL_ONLY_VERSION })

  if (!multiSendDeployment) {
    return true
  }

  const multiSendAddress = multiSendDeployment.networkAddresses[chainId] ?? multiSendDeployment.defaultAddress

  // Calling official MultiSend contract with a batch of transactions to the Safe itself
  return (
    !sameAddress(transaction.to, multiSendAddress) ||
    transactions.some((transaction) => !sameAddress(transaction.to, safeAddress))
  )
}

export const _getRecoveryQueueItemTimestamps = async ({
  delayModifier,
  transactionAdded,
  delay,
  expiry,
}: {
  delayModifier: Delay
  transactionAdded: TransactionAddedEvent
  delay: BigNumber
  expiry: BigNumber
}): Promise<Pick<RecoveryQueueItem, 'timestamp' | 'validFrom' | 'expiresAt'>> => {
  const timestamp = await delayModifier.txCreatedAt(transactionAdded.args.queueNonce)

  const validFrom = timestamp.add(delay)
  const expiresAt = expiry.isZero()
    ? null // Never expires
    : validFrom.add(expiry).mul(1_000)

  return {
    timestamp: timestamp.mul(1_000),
    validFrom: validFrom.mul(1_000),
    expiresAt,
  }
}

export const _getSafeCreationReceipt = memoize(
  async ({
    transactionService,
    safeAddress,
    provider,
  }: {
    transactionService: string
    safeAddress: string
    provider: JsonRpcProvider
  }): Promise<TransactionReceipt> => {
    const url = `${trimTrailingSlash(transactionService)}/api/v1/safes/${safeAddress}/creation/`

    const { transactionHash } = await fetch(url).then((res) => {
      if (res.ok && res.status === 200) {
        return res.json() as Promise<{ transactionHash: string } & unknown>
      } else {
        throw new Error('Error fetching Safe creation details')
      }
    })

    return provider.getTransactionReceipt(transactionHash)
  },
  ({ transactionService, safeAddress }) => transactionService + safeAddress,
)

const queryAddedTransactions = async (
  delayModifier: Delay,
  queueNonce: BigNumber,
  txNonce: BigNumber,
  transactionService: string,
  provider: JsonRpcProvider,
  safeAddress: string,
) => {
  if (queueNonce.eq(txNonce)) {
    // There are no queued txs
    return []
  }

  const transactionAddedFilter = delayModifier.filters.TransactionAdded()

  if (transactionAddedFilter.topics) {
    // We filter for the valid nonces while fetching the event logs.
    // The nonce has to be one between the current queueNonce and the txNonce.
    const diff = queueNonce.sub(txNonce).toNumber()
    const queueNonceFilter = Array.from({ length: diff }, (_, idx) => hexZeroPad(txNonce.add(idx).toHexString(), 32))
    transactionAddedFilter.topics[1] = queueNonceFilter
  }

  const { blockNumber } = await _getSafeCreationReceipt({ transactionService, provider, safeAddress })

  return await delayModifier.queryFilter(transactionAddedFilter, blockNumber, 'latest')
}

const getRecoveryQueueItem = async ({
  delayModifier,
  transactionAdded,
  delay,
  expiry,
  provider,
  chainId,
  version,
  safeAddress,
}: {
  delayModifier: Delay
  transactionAdded: TransactionAddedEvent
  delay: BigNumber
  expiry: BigNumber
  provider: JsonRpcProvider
  chainId: string
  version: SafeInfo['version']
  safeAddress: string
}): Promise<RecoveryQueueItem> => {
  const [timestamps, receipt] = await Promise.all([
    _getRecoveryQueueItemTimestamps({
      delayModifier,
      transactionAdded,
      delay,
      expiry,
    }),
    provider.getTransactionReceipt(transactionAdded.transactionHash),
  ])

  const isMalicious = _isMaliciousRecovery({
    chainId,
    version,
    safeAddress,
    transaction: transactionAdded.args,
  })

  return {
    ...transactionAdded,
    ...timestamps,
    isMalicious,
    executor: receipt.from,
  }
}

export const _getRecoveryStateItem = async ({
  delayModifier,
  transactionService,
  safeAddress,
  provider,
  chainId,
  version,
}: {
  delayModifier: Delay
  transactionService: string
  safeAddress: string
  provider: JsonRpcProvider
  chainId: string
  version: SafeInfo['version']
}): Promise<RecoveryStateItem> => {
  const [[recoverers], expiry, delay, txNonce, queueNonce] = await Promise.all([
    delayModifier.getModulesPaginated(SENTINEL_ADDRESS, MAX_RECOVERER_PAGE_SIZE),
    delayModifier.txExpiration(),
    delayModifier.txCooldown(),
    delayModifier.txNonce(),
    delayModifier.queueNonce(),
  ])

  const queuedTransactionsAdded = await queryAddedTransactions(
    delayModifier,
    queueNonce,
    txNonce,
    transactionService,
    provider,
    safeAddress,
  )

  const queue = await Promise.all(
    queuedTransactionsAdded.map((transactionAdded) => {
      return getRecoveryQueueItem({
        delayModifier,
        transactionAdded,
        delay,
        expiry,
        provider,
        chainId,
        version,
        safeAddress,
      })
    }),
  )

  return {
    address: delayModifier.address,
    recoverers,
    expiry,
    delay,
    txNonce,
    queueNonce,
    queue: queue.filter((item) => !item.removed),
  }
}

export function getRecoveryState({
  delayModifiers,
  ...rest
}: {
  delayModifiers: Array<Delay>
  transactionService: string
  safeAddress: string
  provider: JsonRpcProvider
  chainId: string
  version: SafeInfo['version']
}): Promise<RecoveryState> {
  return Promise.all(delayModifiers.map((delayModifier) => _getRecoveryStateItem({ delayModifier, ...rest })))
}
