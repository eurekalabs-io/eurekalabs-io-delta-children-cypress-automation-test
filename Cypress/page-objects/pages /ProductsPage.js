import BasePage from '../BasePage';

export default class ProductsPage extends BasePage {
  static prodcontainer =
    '[class="MuiGrid-root filter__item MuiGrid-container MuiGrid-item MuiGrid-justify-content-xs-center MuiGrid-grid-xs-2 MuiGrid-grid-sm-3"]';
  static prodcontainer2 =
    '[class="MuiGrid-root filter__item undefined MuiGrid-container MuiGrid-item MuiGrid-justify-content-xs-center MuiGrid-grid-xs-2 MuiGrid-grid-sm-3"]';

  static isCategoryLoaded(category) {
    switch (category) {
      case 'Diapers':
        cy.get(this.prodcontainer).should('have.length', 47);
        cy.get(this.prodcontainer2).should('have.length', 8);
        break;
      case 'Wipes':
        cy.get(this.prodcontainer2).should('have.length', 21);
        break;
      case 'Creams & Powders':
        cy.get(this.prodcontainer2).should('have.length', 8);
        break;
      default:
        cy.log(`No category found for: ${category}`);
    }
  }

  static clickOnProduct(name) {
    cy.get(this.prodcontainer).within(() => {
      cy.get(`[alt="${name}"]`).click({ force: true });
    });
  }

  static clickOnProduct2(name) {
    cy.get(this.prodcontainer2).within(() => {
      cy.get(`[alt="${name}"]`).click({ force: true });
    });
  }
}
