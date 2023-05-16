import { APPROVAL_SIGNATURE_HASH } from '@/components/tx/ApprovalEditor/utils/approvals'
import { ERC20__factory } from '@/types/contracts'
import { decodeMultiSendTxs } from '@/utils/transactions'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { id } from 'ethers/lib/utils'
import { type SecurityResponse, type SecurityModule, SecuritySeverity } from '..'

export type ApprovalModuleResponse = Approval[]

export type ApprovalModuleRequest = {
  safeTransaction: SafeTransaction
}

export type Approval = {
  spender: any
  amount: any
  tokenAddress: string
}

const MULTISEND_SIGNATURE_HASH = id('multiSend(bytes)').slice(0, 10)
const ERC20_INTERFACE = ERC20__factory.createInterface()

export class ApprovalModule implements SecurityModule<ApprovalModuleRequest, ApprovalModuleResponse> {
  private scanInnerTransaction(txPartial: { to: string; data: string }): Approval[] {
    if (txPartial.data.startsWith(APPROVAL_SIGNATURE_HASH)) {
      const [spender, amount] = ERC20_INTERFACE.decodeFunctionData('approve', txPartial.data)
      return [
        {
          amount,
          spender,
          tokenAddress: txPartial.to,
        },
      ]
    }
    return []
  }

  scanTransaction(
    request: ApprovalModuleRequest,
    callback: (response: SecurityResponse<ApprovalModuleResponse>) => void,
  ): void {
    const { safeTransaction } = request
    const safeTxData = safeTransaction.data.data
    const approvalInfos: Approval[] = []

    if (safeTxData.startsWith(MULTISEND_SIGNATURE_HASH)) {
      const innerTxs = decodeMultiSendTxs(safeTxData)
      approvalInfos.push(...innerTxs.flatMap((tx) => this.scanInnerTransaction(tx)))
    } else {
      approvalInfos.push(...this.scanInnerTransaction({ to: safeTransaction.data.to, data: safeTxData }))
    }

    if (approvalInfos.length > 0) {
      callback({
        severity: SecuritySeverity.LOW,
        payload: approvalInfos,
      })
    }
  }
}
