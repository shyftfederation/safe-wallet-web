import type { Palette } from '@mui/material'
import { Box, CircularProgress, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import { type Transaction, TransactionInfoType, TransactionStatus } from '@safe-global/safe-gateway-typescript-sdk'

import DateTime from '@/components/common/DateTime'
import TxInfo from '@/components/transactions/TxInfo'
import SignTxButton from '@/components/transactions/SignTxButton'
import ExecuteTxButton from '@/components/transactions/ExecuteTxButton'
import css from './styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { isAwaitingExecution, isMultisigExecutionInfo, isTxQueued } from '@/utils/transaction-guards'
import RejectTxButton from '@/components/transactions/RejectTxButton'
import useTransactionStatus from '@/hooks/useTransactionStatus'
import TxType from '@/components/transactions/TxType'
import TxConfirmations from '../TxConfirmations'
import useIsPending from '@/hooks/useIsPending'
import useABTesting from '@/services/tracking/useAbTesting'
import { AbTest } from '@/services/tracking/abTesting'

const getStatusColor = (value: TransactionStatus, palette: Palette | Record<string, Record<string, string>>) => {
  switch (value) {
    case TransactionStatus.SUCCESS:
      return palette.success.main
    case TransactionStatus.FAILED:
    case TransactionStatus.CANCELLED:
      return palette.error.main
    case TransactionStatus.AWAITING_CONFIRMATIONS:
    case TransactionStatus.AWAITING_EXECUTION:
      return palette.warning.main
    default:
      return palette.primary.main
  }
}

type TxSummaryProps = {
  isGrouped?: boolean
  item: Transaction
}

const TxSummary = ({ item, isGrouped }: TxSummaryProps): ReactElement => {
  const tx = item.transaction
  const wallet = useWallet()
  const txStatusLabel = useTransactionStatus(tx)
  const isPending = useIsPending(tx.id)
  const shouldDisplayHumanDescription = useABTesting(AbTest.HUMAN_DESCRIPTION)
  const isQueue = isTxQueued(tx.txStatus)
  const awaitingExecution = isAwaitingExecution(tx.txStatus)
  const nonce = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined
  const requiredConfirmations = isMultisigExecutionInfo(tx.executionInfo)
    ? tx.executionInfo.confirmationsRequired
    : undefined
  const submittedConfirmations = isMultisigExecutionInfo(tx.executionInfo)
    ? tx.executionInfo.confirmationsSubmitted
    : undefined

  const displayConfirmations = isQueue && !!submittedConfirmations && !!requiredConfirmations
  const displayInfo =
    (!tx.txInfo.richDecodedInfo && tx.txInfo.type !== TransactionInfoType.TRANSFER) || !shouldDisplayHumanDescription

  return (
    <Box
      className={`${css.gridContainer} ${
        isQueue
          ? displayInfo
            ? css.columnTemplate
            : css.columnTemplateShort
          : displayInfo
          ? css.columnTemplateTxHistory
          : css.columnTemplateTxHistoryShort
      }`}
      id={tx.id}
    >
      {nonce && !isGrouped && <Box gridArea="nonce">{nonce}</Box>}

      <Box gridArea="type" className={css.columnWrap}>
        <TxType tx={tx} />
      </Box>

      {displayInfo && (
        <Box gridArea="info" className={css.columnWrap}>
          <TxInfo info={tx.txInfo} />
        </Box>
      )}

      <Box gridArea="date">
        <DateTime value={tx.timestamp} />
      </Box>

      {displayConfirmations && (
        <Box gridArea="confirmations" display="flex" alignItems="center" gap={1}>
          <TxConfirmations
            submittedConfirmations={submittedConfirmations}
            requiredConfirmations={requiredConfirmations}
          />
        </Box>
      )}

      {wallet && isQueue && (
        <Box gridArea="actions" display="flex" justifyContent={{ sm: 'center' }} gap={1}>
          {awaitingExecution ? (
            <ExecuteTxButton txSummary={item.transaction} compact />
          ) : (
            <SignTxButton txSummary={item.transaction} compact />
          )}
          <RejectTxButton txSummary={item.transaction} compact />
        </Box>
      )}

      <Box
        gridArea="status"
        marginLeft={{ sm: 'auto' }}
        marginRight={1}
        display="flex"
        alignItems="center"
        gap={1}
        color={({ palette }) => getStatusColor(tx.txStatus, palette)}
      >
        {isPending && <CircularProgress size={14} color="inherit" />}

        <Typography variant="caption" fontWeight="bold" color={({ palette }) => getStatusColor(tx.txStatus, palette)}>
          {txStatusLabel}
        </Typography>
      </Box>
    </Box>
  )
}

export default TxSummary
