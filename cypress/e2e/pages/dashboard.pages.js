import * as constants from '../../support/constants'

const connectAndTransactStr = 'Connect & transact'
const transactionQueueStr = 'Pending transactions'
const noTransactionStr = 'This Safe has no queued transactions'
const overviewStr = 'Overview'
const viewAssetsStr = 'View assets'
const tokensStr = 'Tokens'
const nftStr = 'NFTs'
const viewAllStr = 'View all'
const transactionBuilderStr = 'Use Transaction Builder'
const walletConnectStr = 'Use WalletConnect'
const safeAppStr = 'Safe Apps'
const exploreSafeApps = 'Explore Safe Apps'

const txBuilder = 'a[href*="tx-builder"]'
const walletConnect = 'a[href*="wallet-connect"]'
const safeSpecificLink = 'a[href*="&appUrl=http"]'

export function verifyConnectTransactStrIsVisible() {
  cy.contains(connectAndTransactStr).should('be.visible')
}

export function verifyOverviewWidgetData() {
  // Alias for the Overview section
  cy.contains('h2', overviewStr).parents('section').as('overviewSection')

  cy.get('@overviewSection').within(() => {
    // Prefix is separated across elements in EthHashInfo
    cy.contains(constants.SEPOLIA_TEST_SAFE_5).should('exist')
    cy.get('h2').contains('Overview')
    cy.get(`a[href="${constants.BALANCE_URL}${encodeURIComponent(constants.SEPOLIA_TEST_SAFE_5)}"]`).contains(
      viewAssetsStr,
    )
  })
}

export function verifyTxQueueWidget() {
  // Alias for the Transaction queue section
  cy.contains('h2', transactionQueueStr).parents('section').as('txQueueSection')

  cy.get('@txQueueSection').within(() => {
    // There should be queued transactions
    cy.contains(noTransactionStr).should('not.exist')

    // Queued txns
    cy.contains(
      `a[href^="/transactions/tx?id=multisig_0x"]`,
      '13' + 'Send' + `-0.00002 ${constants.tokenAbbreviation.sep}` + '1/1',
    ).should('exist')

    cy.contains(
      `a[href="${constants.transactionQueueUrl}${encodeURIComponent(constants.SEPOLIA_TEST_SAFE_5)}"]`,
      viewAllStr,
    )
  })
}

export function verifyFeaturedAppsSection() {
  // Alias for the featured Safe Apps section
  cy.contains('h2', connectAndTransactStr).parents('section').as('featuredSafeAppsSection')

  // Tx Builder app
  cy.get('@featuredSafeAppsSection').within(() => {
    // Transaction Builder
    cy.contains(transactionBuilderStr)
    cy.get(txBuilder).should('exist')

    // WalletConnect app
    cy.contains(walletConnectStr)
    cy.get(walletConnect).should('exist')

    // Featured apps have a Safe-specific link
    cy.get(safeSpecificLink).should('have.length', 2)
  })
}

export function verifySafeAppsSection() {
  cy.contains('h2', safeAppStr).parents('section').as('safeAppsSection')
  cy.get('@safeAppsSection').contains(exploreSafeApps)
}
