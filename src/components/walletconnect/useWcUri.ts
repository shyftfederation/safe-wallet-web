import { useCallback } from 'react'
import { useWalletConnectSearchParamUri } from '@/services/walletconnect/useWalletConnectSearchParamUri'

const useWcUri = (): [string, () => void] => {
  const [searchParamWcUri, setSearchParamWcUri] = useWalletConnectSearchParamUri()
  const uri = searchParamWcUri || ''

  const clearUri = useCallback(() => {
    setSearchParamWcUri(null)
  }, [setSearchParamWcUri])

  return [uri, clearUri]
}

export default useWcUri
