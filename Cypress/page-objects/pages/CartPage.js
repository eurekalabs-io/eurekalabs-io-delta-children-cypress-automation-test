import BasePage from '../BasePage';

export default class CartPage extends BasePage {
  static firstAddOn = ':nth-child(1) > .cb-addons-variant > :nth-child(4) > .v2-button';
  static addToProceed = '.cb-addons-header__section-right > .d-flex > .v2-button';

  static selectAddOns() {
    cy.get(this.firstAddOn).click()
    BasePage.pause(1000)
  }

  static proceedToCart() {
    cy.get(this.addToProceed).click()
  }
}
