import BasePage from '../BasePage';

export default class NavBar extends BasePage {
  static menu = '.site-header__wrapper--top > :nth-child(1)';
  static optionMenuCat = ':nth-child(2) > .navigation-mobile__nav-list >';
  static optionMenuSubCat = '.navigation-mobile__scroll-wrapper > .navigation-mega-subitem-wrapper >';

  static clickMenu() {
    cy.get(this.menu).click();
  }

  static clickMenuCategory(cat) {
    cy.get(this.optionMenuCat).contains(cat).click();
  }

  static clickMenuSubCategory(subCat) {
    cy.get(this.optionMenuSubCat).contains(subCat).click();
  }
}
