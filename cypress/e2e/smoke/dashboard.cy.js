import * as constants from '../../support/constants'
import * as dashboard from '../pages/dashboard.pages'
import * as main from '../pages/main.page'

describe('Dashboard tests', () => {
  before(() => {
    cy.clearLocalStorage()
    cy.visit(constants.BALANCE_URL + constants.SEPOLIA_TEST_SAFE_5)
    main.acceptCookies()
    main.clickOnSideMenuItem(constants.mainSideMenuOptions.home)
    dashboard.verifyConnectTransactStrIsVisible()
  })

  it.skip('Verify the overview widget is displayed [C56107]', () => {
    dashboard.verifyOverviewWidgetData()
  })

  it.skip('Verify the transaction queue widget is displayed [C56108]', () => {
    dashboard.verifyTxQueueWidget()
  })

  it.skip('Verify the featured Safe Apps are displayed [C56109]', () => {
    dashboard.verifyFeaturedAppsSection()
  })

  it.skip('Verify the Safe Apps Section is displayed [C56110]', () => {
    dashboard.verifySafeAppsSection()
  })
})
