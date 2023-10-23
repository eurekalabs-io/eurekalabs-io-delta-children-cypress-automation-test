import BasePage from '../BasePage';

export default class ProductsPage extends BasePage { 
    static selectBundle = ':nth-child(2) > .v2-container > .js-bundle-list-container > :nth-child(1) > .js-bundle-product-item > .align-items-center > .col-md-5 > .js-variant-url'
    
    static selectFirstBundle() {
        cy.get(this.selectBundle).click()
      }
}
