describe('Image Search', () => {
  beforeEach(() => {
    cy.login('cypress_test@bnb.com', 'cyp-test')
    cy.visit('/search')
  })

  it('Search - Page Available', () => {
    cy.url().should('include', '/search')
    cy.get('h1').should('contain', 'Image Gallery')
  })

  it('Search - Filter by Tag', () => {   
    // Add a tag filter
    cy.get('input[placeholder="Add tags to filter by..."]').type('cypress_test{enter}')
    
    // Verify filter is applied
    cy.get('.grid').should('exist')
    cy.get('.grid div').should('have.length.greaterThan', 0)
    cy.get('.grid div').first().within(() => {
      cy.get('.bg-secondary.text-xs.rounded-full').contains('cypress_test')
    })
  })

  it('Search - Filter by Author', () => {   
    // Add author filter
    cy.get('input[placeholder="Enter author name..."]').type('sasquatch designs{enter}')
    
    // Verify filter is applied
    cy.get('.grid').should('exist')
    cy.get('.grid div').should('have.length.greaterThan', 0)
    cy.get('.grid div').first().within(() => {
      cy.get('.text-sm.font-medium').contains('sasquatch designs')
    })
  })

  it('Search - Clear Filters', () => {
    // Add a tag filter first to test clearing
    cy.get('input[placeholder="Add tags to filter by..."]').type('cypress_test{enter}', { scrollBehavior: false })
    
    // Clear filters
    cy.get('.bg-card span.flex-1').contains('Clear All').click({ force: true })

    // Verify filters are cleared
    cy.get('input[placeholder="Add tags to filter by..."]').should('have.value', '')

    // Add author filter again to test clearing
    cy.get('input[placeholder="Enter author name..."]').type('sasquatch designs{enter}', { scrollBehavior: false })

    // Clear filters
    cy.get('.bg-card span.flex-1').contains('Clear All').click({ force: true })
    
    cy.get('input[placeholder="Enter author name..."]').should('have.value', '')
  })

  it('Search - Image Modal View', () => {
    // Click first image in grid
    cy.get('.grid').find('div').first().click()
    
    // Verify modal opens with correct structure
    cy.get('.fixed.inset-0.z-50').should('exist')
    cy.get('.bg-card').should('be.visible')
    
    // Verify image is displayed in modal
    cy.get('.fixed.inset-0.bg-background\\/80').should('exist')  // Modal backdrop
    
    // Verify modal content is visible
    cy.get('.w-full.max-w-4xl').should('be.visible')
    
    // Verify modal header text
    //cy.get('.text-lg.font-medium').contains('Image Details')
    cy.get('h3').contains('Image Details').should('be.visible')
    
    // Verify image is displayed
    cy.get('.bg-secondary\\/30 img').should('be.visible')

    // Verify footer buttons exist
    cy.get('.sticky.bottom-0').should('exist')
    cy.get('.sticky.bottom-0').contains('Download').should('be.visible')
    cy.get('.sticky.bottom-0').contains('Delete').should('be.visible')
    cy.get('.sticky.bottom-0').contains('Close').should('be.visible')
    
    // Close modal using the Close button in footer
    cy.get('.sticky.bottom-0').contains('Close').click()
    
    // Verify modal is closed
    cy.get('.fixed.inset-0.z-50').should('not.exist')
  })

  it('Search - Download Image', () => {
    // Click first image in grid
    cy.get('.grid').find('div').first().click()
    
    // Verify modal opens with correct structure
    cy.get('.fixed.inset-0.z-50').should('exist')
    cy.get('.bg-card').should('be.visible')
    
    // Verify image is displayed in modal
    cy.get('.fixed.inset-0.bg-background\\/80').should('exist')  // Modal backdrop
    
    // Verify modal content is visible
    cy.get('.w-full.max-w-4xl').should('be.visible')
    
    // Verify modal header text
    //cy.get('.text-lg.font-medium').contains('Image Details')
    cy.get('h3').contains('Image Details').should('be.visible')
    
    // Verify image is displayed
    cy.get('.bg-secondary\\/30 img').should('be.visible')

    // Verify footer buttons exist
    cy.get('.sticky.bottom-0').should('exist')
    cy.get('.sticky.bottom-0').contains('Download').should('be.visible')

    cy.get('.sticky.bottom-0').contains('Download').click()
    // Verify download starts
    cy.get('.fixed.inset-0.z-50').should('exist') // Ensure modal is still open
  })

  it('Search - Edit Image Information', () => {
    // Click first image in grid
    cy.get('.grid').find('div').first().click()
    
    // Verify modal opens with correct structure
    cy.get('.fixed.inset-0.z-50').should('exist')
    cy.get('.bg-card').should('be.visible')
    
    // Verify image is displayed in modal
    cy.get('.fixed.inset-0.bg-background\\/80').should('exist')  // Modal backdrop
    
    // Verify modal content is visible
    cy.get('.w-full.max-w-4xl').should('be.visible')
    
    // Verify modal header text
    //cy.get('.text-lg.font-medium').contains('Image Details')
    cy.get('h3').contains('Image Details').should('be.visible')
    
    // Verify image is displayed
    cy.get('.bg-secondary\\/30 img').should('be.visible')
    
    cy.get('.space-y-4').should('be.visible')

    cy.get('.relative.inline-flex.items-center').contains('Edit Details').click({ force: true })

    cy.get('.relative.inline-flex.items-center').contains('Cancel').click({ force: true })
  })
})