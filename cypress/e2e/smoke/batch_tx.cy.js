import * as batch from '../pages/batches.pages'
import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'

const currentNonce = 3
const funds_first_tx = '0.001'
const funds_second_tx = '0.002'

describe('Batch transaction tests', () => {
  before(() => {
    cy.clearLocalStorage()
    cy.visit(constants.BALANCE_URL + constants.SEPOLIA_TEST_SAFE_5)
    main.acceptCookies()
  })

  it('Verify empty batch list can be opened [C56082]', () => {
    batch.openBatchtransactionsModal()
    batch.openNewTransactionModal()
  })

  it('Verify the Add batch button is present in a transaction form [C56084]', () => {
    //The "true" is to validate that the add to batch button is not visible if "Yes, execute" is selected
    batch.addToBatch(constants.EOA, currentNonce, funds_first_tx)
  })

  it('Verify a transaction can be added to the batch [C56085]', () => {
    cy.contains(batch.transactionAddedToBatchStr).should('be.visible')
    //The batch button in the header shows the transaction count
    batch.verifyBatchIconCount(1)
    batch.clickOnBatchCounter()
    batch.verifyAmountTransactionsInBatch(1)
  })

  it('Verify a second transaction can be added to the batch [C56086]', () => {
    batch.openNewTransactionModal()
    batch.addToBatch(constants.EOA, currentNonce, funds_second_tx)
    batch.verifyBatchIconCount(2)
    batch.clickOnBatchCounter()
    batch.verifyAmountTransactionsInBatch(2)
  })

  it('Verify the batch can be confirmed and related transactions exist in the form [C56088]', () => {
    batch.clickOnConfirmBatchBtn()
    batch.verifyBatchTransactionsCount(2)
    cy.contains(funds_first_tx).parents('ul').as('TransactionList')
    cy.get('@TransactionList').find('li').eq(0).find('span').eq(0).contains(funds_first_tx)
    cy.get('@TransactionList').find('li').eq(1).find('span').eq(0).contains(funds_second_tx)
  })

  it('Verify a transaction can be removed from the batch [C56089]', () => {
    batch.clickOnBatchCounter()
    cy.contains(batch.batchedTransactionsStr).should('be.visible').parents('aside').find('ul > li').as('BatchList')
    cy.get('@BatchList').find(batch.deleteTransactionbtn).eq(0).click()
    cy.get('@BatchList').should('have.length', 1)
    cy.get('@BatchList').contains(funds_first_tx).should('not.exist')
  })
})
