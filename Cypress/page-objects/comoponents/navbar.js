import BasePage from '../BasePage';
import Header from './header';

export default class NavBar extends BasePage {
  static allProducts = '.all-collections';
  static Nursery = '.all-collections__nursery';
  static subcategory= '.navigation-mega-subitem-wrapper > :nth-child(1)';

  static loadAllProducts() {
    Header.clickMenu();
    Header.clickMenuCategory ('Nursery');
    cy.get(this.Nursery).should('have.length', 60);
  
  }

  static selectCategory(category) {
    cy.get(this.Nursery).contains(category).click({ force: true });
  }

  static clickNavSubCategory(subcategory) {
    cy.get(this.subcategory).within(() => {
      cy.get(`[alt="${subcategory}"]`).click();
    });
  }
}
