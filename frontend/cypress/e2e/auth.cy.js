describe('Authentication', () => {
    beforeEach(() => {
      cy.visit('/login')
    })
  
    it('Auth - Login Page Available', () => {
      cy.get('h1').should('contain', 'ImageHub')
      cy.get('form').should('exist')
    })
  
    it('Auth - Login Successful', () => {
      cy.login('cypress_test@bnb.com', 'cyp-test')
      cy.url().should('include', '/upload')
    })
  
    it('Auth - Login Failure', () => {
      cy.get('input[type="email"]').type('invalid@example.com')
      cy.get('input[type="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      cy.contains('Incorrect username or password').should('be.visible')
    })

    it('Auth - Logout Successful', () => {
      cy.login('cypress_test@bnb.com', 'cyp-test')
      cy.url().should('include', '/upload')
      cy.wait(1000)
      cy.get('button').contains('Log out').click()
      cy.url().should('include', '/login')
    })
  })