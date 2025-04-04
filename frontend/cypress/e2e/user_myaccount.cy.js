describe('My Account', () => {
  beforeEach(() => {
    cy.login('cypress_test@bnb.com', 'cyp-test')
    cy.visit('/account')
  })

  it('Account - Page Available', () => {
    cy.url().should('include', '/account')
    cy.get('h1').should('contain', 'Account Settings')
  })

})