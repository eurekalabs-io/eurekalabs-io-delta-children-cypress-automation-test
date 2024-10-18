import BasePage from '../BasePage';

export default class CartPage extends BasePage {
  static firstAddOn = ':nth-child(1) > .cb-addons-variant > :nth-child(4) > .v2-button';
  static addToProceed = ':nth-child(141) > div.cb-addons > div > div.v2-row.cb-addons-border.cb-addons-border--top > div > div > button > span.v2-button__text';

  static selectAddOns() {
    cy.get(this.firstAddOn).click()
    BasePage.pause(1000)
  }
  
  static proceedToCart() {
    cy.contains('Proceed to Cart').click({force:true}) 
    // Deprecated cy.get(this.addToProceed).click({force:true})
  }
}
