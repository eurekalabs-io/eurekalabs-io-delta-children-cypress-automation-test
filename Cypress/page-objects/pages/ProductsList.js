import BasePage from '../BasePage';

export default class ProductsList extends BasePage { 
    static selectBundle(id) {
        cy.get(`div:nth-child(2) > div > div > div:nth-child(${id}) > article > div.v2-row.align-items-center.bundle-product__item__actions > div.col-md-5.single-item-footer-section--right.tr--md > a.js-variant-url.js-create-set-button.v2-button.v2-button--tertiary.v2-button--sm`).click({force:true}) ; 
    }

    static selectBundleKidsSets(id) {
      cy.get(`div:nth-child(${id}) > article > div.v2-row.align-items-center.bundle-product__item__actions > div.col-md-5.tr--md > a.js-variant-url.js-create-set-button.v2-button.v2-button--tertiary.v2-button--sm`).click({force:true}) ; 
    }
}