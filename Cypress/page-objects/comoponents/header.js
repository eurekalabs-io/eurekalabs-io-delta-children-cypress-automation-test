import BasePage from '../BasePage';

export default class Header extends BasePage {
  static menu = '.site-header__wrapper--top > :nth-child(1)';
  static cart = '.js-open-mini-cart';
  static optionMenu='#navigation-mobile > div > div:nth-child(2) > ul';
  static category = 'Nursery';
  static subCategory = 'Nursery Sets';

  static clickMenu() {
    cy.get(this.menu).click({ force: true });
  }

  static clickMenuCategory() {
    cy.get(this.optionMenu).contains(this.category).click({ force: true });
  }
  
  static clickMenuSubCategory() {
    cy.get(this.optionMenu).contains(this.subCategory).click({ force: true });
  }

  static clickCart() {
    cy.get(this.cart).click();
  }

}
