import { SvgIcon, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import WalletConnect from '@/public/images/common/walletconnect.svg'
import Alert from '@/public/images/notifications/alert.svg'
import css from './styles.module.css'

const WcLogoHeader = ({ error }: { error?: boolean }): ReactElement => {
  return (
    <>
      <div>
        <SvgIcon component={WalletConnect} inheritViewBox className={css.icon} />
        {error && <SvgIcon component={Alert} inheritViewBox className={css.errorBadge} fontSize="small" />}
      </div>

      <Typography variant="h5" mt={2} mb={0.5}>
        Connect dApps to {`Safe{Wallet}`}
      </Typography>
    </>
  )
}

export default WcLogoHeader
