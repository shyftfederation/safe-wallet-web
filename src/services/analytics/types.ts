/**
 * These event names are passed straight to GTM
 */
export enum EventType {
  PAGEVIEW = 'pageview',
  CLICK = 'customClick',
  META = 'metadata',
  SAFE_APP = 'safeApp',
}

export type EventLabel = string | number | boolean | null

export type AnalyticsEvent = {
  event?: EventType
  category: string
  action: string
  label?: EventLabel
  chainId?: string
}

export type SafeAppSDKEvent = {
  method: string
  ethMethod: string
  version: string
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

export enum AnalyticsUserProperties {
  WALLET_LABEL = 'walletLabel',
}
