import BasePage from '../BasePage';

export default class Header extends BasePage {
  static menu = 'Menu';
  static cart = '#cart-button';
  static sidemenu = '.side-menu-container';

  static clickMenu() {
    cy.get(`[alt="${this.menu}"]`).click({ force: true });
  }

  static clickMenuCategory(category) {
    cy.get(this.sidemenu).contains(category).click({ force: true });
  }

  static clickCart() {
    cy.get(this.cart).click();
  }

  static verifyCartCount(number) {
    cy.get(this.cart).should('contain.text', number);
  }
}
