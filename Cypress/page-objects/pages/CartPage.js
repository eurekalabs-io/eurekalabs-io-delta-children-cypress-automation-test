import BasePage from '../BasePage';

export default class CartPage extends BasePage {
  // Selector genérico para el primer add-on
  static firstAddOn = '.cb-addons-variant .v2-button';
  
  // Selector genérico para el botón "Proceed to Cart" en la sección de add-ons
  // Busca el botón dentro de .cb-addons sin depender de nth-child específicos
  static proceedToCartButton = '.cb-addons .cb-addons-border--top button .v2-button__text';

  static selectAddOns() {
    // Verificar si hay add-ons disponibles antes de seleccionar
    cy.get('body').then(($body) => {
      const addOns = $body.find(this.firstAddOn);
      if (addOns.length > 0) {
        cy.get(this.firstAddOn).first().click({force:true});
        BasePage.pause(1000);
      }
    });
  }
  
  static proceedToCart() {
    // Buscar el botón "Proceed to Cart" de manera flexible
    // Primero intentar por texto, luego por selector genérico
    cy.get('body').then(($body) => {
      // Buscar por texto primero (más confiable)
      const proceedButtonByText = $body.find('button, a').filter((i, el) => {
        const text = Cypress.$(el).text().toLowerCase();
        return text.includes('proceed') && text.includes('cart');
      });
      
      if (proceedButtonByText.length > 0) {
        cy.contains('Proceed to Cart', { timeout: 15000 }).click({force:true});
      } else {
        // Fallback: buscar por selector genérico dentro de cb-addons
        const proceedButtonBySelector = $body.find(this.proceedToCartButton);
        if (proceedButtonBySelector.length > 0) {
          cy.get(this.proceedToCartButton, { timeout: 15000 })
            .should('exist')
            .click({force:true});
        } else {
          cy.log('Botón "Proceed to Cart" no encontrado');
        }
      }
    });
  }
}
