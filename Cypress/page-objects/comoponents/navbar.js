import BasePage from '../BasePage';
import Header from './header';

export default class NavBar extends BasePage {
  static allProducts = '.all-collections';
  static allCategories = '.all-collections__collection';
  static circleList = '.circle-list';

  static loadAllProducts() {
    Header.clickMenu();
    Header.clickMenuCategory('All Categories');
    cy.get(this.allCategories).should('have.length', 60);
  }

  static selectCategory(category) {
    cy.get(this.allProducts).contains(category).click({ force: true });
  }

  static clickNavSubCategory(subcategory) {
    cy.get(this.circleList).within(() => {
      cy.get(`[alt="${subcategory}"]`).click();
    });
  }
}
