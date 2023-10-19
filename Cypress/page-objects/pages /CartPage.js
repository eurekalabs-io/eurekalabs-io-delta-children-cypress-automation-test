import BasePage from '../BasePage';

export default class CartPage extends BasePage {
  static load() {
    cy.visit('/cart');
  }

  static isLoaded() {
    cy.url().should('eq', 'https://www.deltachildren.com/cart');
  }
}
