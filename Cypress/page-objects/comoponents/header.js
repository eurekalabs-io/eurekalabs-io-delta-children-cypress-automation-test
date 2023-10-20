import BasePage from '../BasePage';

export default class Header extends BasePage {
  static menu = 'Menu';
  static cart = '.js-open-mini-cart';
  static sidemenu = '.site-header__wrapper--top > :nth-child(1)';

  static clickMenu() {
    cy.get(`[alt="${this.menu}"]`).click({ force: true });
  }

  static clickMenuCategory(category) {
    cy.get(this.sidemenu).contains(category).click({ force: true });
  }

  static clickCart() {
    cy.get(this.cart).click();
  }

}
