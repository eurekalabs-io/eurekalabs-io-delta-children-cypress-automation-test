import BasePage from '../BasePage';
import 'cypress-xpath';


export default class ProductsListCribsBestSellers extends BasePage { 
  static selectCribs(id) { 
    cy.get(`:nth-child(2) > div:nth-child(${id}) > div.product__item.mb4.old-crib-mobile-layout > div > div.col-12.col-md-8.product__item-swatches > ul`).should(`exist`).then(() => {
      cy.log(`El elemento está disponible`);
      cy.xpath(`//*[@id="shopify-section-collection-cribs"]/div[1]/div[1]/div[${id}]/div[1]/div/div[4]/ul/li[2]/span/img`).click({force: true});
         });
   
  }
}
