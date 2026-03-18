import BasePage from '../BasePage';
import 'cypress-xpath';

// Selectors for the Best Sellers section on /collections/cribs
const BEST_SELLERS = '#best-sellers';
const FIRST_PRODUCT_SWATCHES_UL = `${BEST_SELLERS} .crib-mobile-swatches-section .product__item-swatches ul`;
const FIRST_PRODUCT_TITLE_LINK = `${BEST_SELLERS} .crib-mobile-title-section .col-8 a`;
// Fallback if DOM structure changes
const FIRST_PRODUCT_SWATCHES_UL_ALT = `${BEST_SELLERS} .product__item-swatches ul`;

export default class ProductsListCribsBestSellers extends BasePage {
  /** Swatch list for the first product (ul with li.swatches__item) */
  static getFirstProductSwatchesList() {
    return cy.get(FIRST_PRODUCT_SWATCHES_UL, { timeout: 15000 }).first();
  }

  /** Link to the first best-sellers product PDP */
  static getFirstProductLink() {
    return cy.get(FIRST_PRODUCT_TITLE_LINK, { timeout: 10000 }).first();
  }

  /**
   * Returns the number of swatches (variants) for the first best-sellers product.
   * Uses the generic .product__item-swatches > ul for that product.
   */
  static getFirstProductSwatchCount() {
    return cy.get(FIRST_PRODUCT_SWATCHES_UL, { timeout: 15000 })
      .first()
      .find('li.swatches__item, li.js-swatch-color, li[class*="swatch"]')
      .its('length');
  }

  /**
   * Selects the second or third swatch in the first product's list.
   * @param {number} position - 2 = second item, 3 = third item
   */
  static selectSecondOrThirdSwatch(position = 2) {
    const itemSelector = 'li.swatches__item, li.js-swatch-color';
    cy.get(`${BEST_SELLERS} .product__item-swatches ul`, { timeout: 10000 })
      .first()
      .find(itemSelector)
      .should('have.length.at.least', 2)
      .then(($items) => {
        const index = position === 3 && $items.length >= 3 ? 2 : 1;
        cy.wrap($items[index]).click({ force: true });
      });
    BasePage.pause(800);
  }

  /** Click first product link to open PDP */
  static openFirstProductPDP() {
    cy.get(FIRST_PRODUCT_TITLE_LINK, { timeout: 10000 }).first().click({ force: true });
    BasePage.pause(1500);
  }

  static selectCribs(id) {
    cy.get(`:nth-child(2) > div:nth-child(${id}) > div.product__item.mb4.old-crib-mobile-layout > div > div.col-12.col-md-8.product__item-swatches > ul`).should(`exist`).then(() => {
      cy.log(`Element is available`);
      cy.xpath(`//*[@id="shopify-section-collection-cribs"]/div[1]/div[1]/div[${id}]/div[1]/div/div[4]/ul/li[2]/span/img`).click({force: true});
    });
  }
}
