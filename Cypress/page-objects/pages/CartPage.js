import BasePage from '../BasePage';

export default class CartPage extends BasePage {
  // Generic selector for the first add-on
  static firstAddOn = '.cb-addons-variant .v2-button';
  
  // Generic selector for the "Proceed to Cart" button in the add-ons section
  // Searches for the button within .cb-addons without depending on specific nth-child
  static proceedToCartButton = '.cb-addons .cb-addons-border--top button .v2-button__text';

  static selectAddOns() {
    // Check if there are add-ons available before selecting
    cy.get('body').then(($body) => {
      const addOns = $body.find(this.firstAddOn);
      if (addOns.length > 0) {
        cy.get(this.firstAddOn).first().click({force:true});
        BasePage.pause(1000);
      }
    });
  }
  
  static proceedToCart() {
    // Search for "Proceed to Cart" button flexibly
    // First try by text, then by generic selector
    cy.get('body').then(($body) => {
      // Search by text first (more reliable)
      const proceedButtonByText = $body.find('button, a').filter((i, el) => {
        const text = Cypress.$(el).text().toLowerCase();
        return text.includes('proceed') && text.includes('cart');
      });
      
      if (proceedButtonByText.length > 0) {
        cy.contains('Proceed to Cart', { timeout: 15000 }).click({force:true});
      } else {
        // Fallback: search by generic selector within cb-addons
        const proceedButtonBySelector = $body.find(this.proceedToCartButton);
        if (proceedButtonBySelector.length > 0) {
          cy.get(this.proceedToCartButton, { timeout: 15000 })
            .should('exist')
            .click({force:true});
        } else {
          cy.log('"Proceed to Cart" button not found');
        }
      }
    });
  }
}
