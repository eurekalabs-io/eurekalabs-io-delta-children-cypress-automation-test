import BasePage from '../BasePage';
import 'cypress-xpath';

export default class ProductsListCribsExclusivelyTarget extends BasePage { 

  static selectCribsExclusivelyTarget(id) {

    cy.xpath(`:nth-child(2) > div:nth-child(${id}) > div.product__item.mb4.old-crib-mobile-layout > div > div.col-12.col-md-8.product__item-swatches > ul`).should('be.visible').then(() => {
      // Perform some action after the element is visible.
        cy.xpath(`//*[@id="shopify-section-collection-cribs"]/div[1]/div[2]/div[${id}]/div[1]/div/div[4]/ul/li[2]/span/img`).click({force: true});
         })    
    }
}
