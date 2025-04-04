/// <reference types="cypress" />

declare global {
    namespace Cypress {
      interface Chainable {
        login(email: string, password: string): Chainable<void>
        logout(): Chainable<void>
      }
    }
  }
  
  // Login command
  Cypress.Commands.add('login', (email: string, password: string) => {
    cy.visit('/login')
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })
  
  // Logout command
  Cypress.Commands.add('logout', () => {
    cy.window().then((win) => {
      win.localStorage.clear()
    })
    cy.clearCookies()
    cy.visit('/login')
  })
  
  export {}