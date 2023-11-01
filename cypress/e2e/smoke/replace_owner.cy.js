import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as owner from '../pages/owners.pages'
import * as addressBook from '../pages/address_book.page'

describe('Replace Owners tests', () => {
  beforeEach(() => {
    cy.visit(constants.setupUrl + constants.SEPOLIA_TEST_SAFE_1)
    cy.clearLocalStorage()
    main.acceptCookies()
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
  })

  it('Verify that "Replace" icon is visible [C55998]', () => {
    owner.verifyReplaceBtnIsEnabled()
  })

  it('Verify Tooltip displays correct message for Non-Owner [C56016]', () => {
    cy.visit(constants.setupUrl + constants.SEPOLIA_TEST_SAFE_2)
    owner.waitForConnectionStatus()
    owner.hoverOverReplaceOwnerBtn()
    owner.verifyTooltipLabel(owner.nonOwnerErrorMsg)
  })

  it('Verify Tooltip displays correct message for disconnected user [C56006]', () => {
    owner.waitForConnectionStatus()
    owner.clickOnWalletExpandMoreIcon()
    owner.clickOnDisconnectBtn()
    owner.hoverOverReplaceOwnerBtn()
    owner.verifyTooltipLabel(owner.disconnectedUserErrorMsg)
  })

  it('Verify that the owner replacement form is opened [C56007]', () => {
    owner.waitForConnectionStatus()
    owner.openReplaceOwnerWindow()
  })

  it('Verify max characters in name field [C56008]', () => {
    owner.waitForConnectionStatus()
    owner.openReplaceOwnerWindow()
    owner.typeOwnerName(main.generateRandomString(51))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.exceedChars)
  })

  it('Verify that Address input auto-fills with related value [C56009]', () => {
    cy.visit(constants.addressBookUrl + constants.SEPOLIA_TEST_SAFE_1)
    addressBook.clickOnCreateEntryBtn()
    addressBook.typeInName(constants.addresBookContacts.user1.name)
    addressBook.typeInAddress(constants.addresBookContacts.user1.address)
    addressBook.clickOnSaveEntryBtn()
    addressBook.verifyNewEntryAdded(constants.addresBookContacts.user1.name, constants.addresBookContacts.user1.address)
    cy.visit(constants.setupUrl + constants.SEPOLIA_TEST_SAFE_1)
    owner.waitForConnectionStatus()
    owner.openReplaceOwnerWindow()
    owner.typeOwnerAddress(constants.addresBookContacts.user1.address)
    owner.selectNewOwner(constants.addresBookContacts.user1.name)
    owner.verifyNewOwnerName(constants.addresBookContacts.user1.name)
  })

  it('Verify that Name field not mandatory. Verify confirmation for owner replacement is displayed [C56011]', () => {
    owner.waitForConnectionStatus()
    owner.openReplaceOwnerWindow()
    owner.typeOwnerAddress(constants.SEPOLIA_OWNER_2)
    owner.clickOnNextBtn()
    owner.verifyConfirmTransactionWindowDisplayed()
  })

  it('Verify relevant error messages are displayed in Address input [C56012]', () => {
    owner.waitForConnectionStatus()
    owner.openReplaceOwnerWindow()
    owner.typeOwnerAddress(main.generateRandomString(10))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidFormat)

    owner.typeOwnerAddress(constants.addresBookContacts.user1.address.toUpperCase())
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    owner.typeOwnerAddress(constants.SEPOLIA_TEST_SAFE_1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.ownSafe)

    owner.typeOwnerAddress(constants.addresBookContacts.user1.address.replace('F', 'f'))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    owner.typeOwnerAddress(constants.DEFAULT_OWNER_ADDRESS)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.alreadyAdded)
  })
})
