import BasePage from '../BasePage';
import 'cypress-xpath';

export default class ProductsListCribsExclusivelyTarget extends BasePage { 
  static selectCribsExclusivelyTarget(id) {

    cy.xpath(`:nth-child(2) > div:nth-child(${id}) > div.product__item.mb4.old-crib-mobile-layout > div > div.col-12.col-md-8.product__item-swatches > ul`).should('be.visible').then(() => {
      // Realizar alguna acción después de que el elemento esté visible
      //cy.get(`:nth-child(2) > div:nth-child(${id}) > div.product__item.mb4.old-crib-mobile-layout > div > div.col-12.col-md-8.product__item-swatches > ul > li.swatches__item.2.js-swatch-color > span > img`).click();
      cy.xpath(`//*[@id="shopify-section-collection-cribs"]/div[1]/div[2]/div[${id}]/div[1]/div/div[4]/ul/li[2]/span/img`).click({force: true});
      cy.log('El elemento está visible');

      //nth-child(2) > div:nth-child(3) > div.product__item.mb4.old-crib-mobile-layout > div > div.col-12.col-md-8.product__item-swatches > ul > li.swatches__item.variant-43287803658440.js-swatch-color > span > img
    })    
    }
}
