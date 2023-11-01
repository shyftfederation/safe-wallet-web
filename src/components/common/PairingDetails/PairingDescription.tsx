import { Typography } from '@mui/material'
import type { ReactElement } from 'react'

import AppStoreButton from '@/components/common/AppStoreButton'
import ExternalLink from '../ExternalLink'
import { HelpCenterArticle } from '@/config/constants'

const PairingDescription = (): ReactElement => {
  return (
    <>
      <Typography variant="caption" align="center">
Not supported
      </Typography>

      <AppStoreButton placement="pairing" />
    </>
  )
}

export default PairingDescription
