import BasePage from '../BasePage';

export default class Header extends BasePage {
  static menu = '.site-header__wrapper--top > :nth-child(1)';
  static cart = '.js-open-mini-cart';
  static optionMenuCat=':nth-child(2) > .navigation-mobile__nav-list >';
  static optionMenuSubCat='#nursery > .navigation-mobile__scroll-wrapper > .navigation-mega-subitem-wrapper >';

  static clickMenu() {
    cy.get(this.menu).click({ force: true });
  }

  static clickMenuCategory(cat) {
    cy.get(this.optionMenuCat).contains(cat).click({ force: true });
  }
  
  static clickMenuSubCategory(subCat) {
    cy.get(this.optionMenuSubCat).contains(subCat).click({ force: true });
  }

  static clickCart() {
    cy.get(this.cart).click();
  }

  static selectFirstBundle(){
    cy.get(':nth-child(2) > .v2-container > .js-bundle-list-container > :nth-child(1) > .js-bundle-product-item > .align-items-center > .col-md-5 > .js-variant-url').click({ force: true })
  }

}
