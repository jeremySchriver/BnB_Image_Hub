describe('Image Upload', () => {
  beforeEach(() => {
    cy.login('cypress_test@bnb.com', 'cyp-test')
    cy.visit('/upload')
  })

  it('Upload - Page Available', () => {
    cy.url().should('include', '/upload')
    cy.get('h1').should('contain', 'Image Upload')
  })

})