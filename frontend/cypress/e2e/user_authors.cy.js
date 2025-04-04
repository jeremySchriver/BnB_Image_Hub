describe('My Account', () => {
  beforeEach(() => {
    cy.login('cypress_test@bnb.com', 'cyp-test')
    cy.visit('/authors')
  })

  it('Authors - Page Available', () => {
    cy.url().should('include', '/authors')
    cy.get('h1').should('contain', 'Author Management')
  })

})