describe('Image Upload', () => {
    beforeEach(() => {
      cy.login('cypress_test@bnb.com', 'cyp-test')
      cy.visit('/upload')
    })
  
    it('should show upload interface', () => {
      cy.get('[data-cy="upload-dropzone"]').should('exist')
    })
  
    it('should upload image successfully', () => {
      cy.get('[data-cy="upload-dropzone"]').attachFile('sample-image.jpg')
      cy.contains('Upload complete').should('be.visible')
    })
  })