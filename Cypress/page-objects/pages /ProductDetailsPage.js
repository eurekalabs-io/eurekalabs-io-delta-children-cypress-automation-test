import BasePage from '../BasePage';

export default class ProductDetailsPage extends BasePage {
  static productInfo = '.info-title';
  static addDiaperBtn = '#add-diaper';
  static addWipeBtn = '#add-wipe';

  static isProductLoaded() {
    cy.get(this.productInfo, { timeout: 10000 }).should('be.visible');
  }

  static addDiaper() {
    cy.get(this.addDiaperBtn).click({ force: true });
  }

  static addWipe() {
    cy.get(this.addWipeBtn).click({ force: true });
  }

  static invokeProductNameText() {
    cy.get(this.productName).invoke('text').as('expectedName');
  }

  static invokeProductPriceText() {
    cy.get(this.productPrice).invoke('text').as('expectedPrice');
  }
}
