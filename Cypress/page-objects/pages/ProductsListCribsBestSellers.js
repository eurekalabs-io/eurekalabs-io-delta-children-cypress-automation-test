import BasePage from '../BasePage';
import 'cypress-xpath';
import { countPdpSwatchOptions } from '../../support/pdpVariantHelpers';

// Selectors for the Best Sellers section on /collections/cribs
const BEST_SELLERS = '#best-sellers';
const PRODUCT_ITEM = `${BEST_SELLERS} .product__item`;
const PRODUCT_SWATCHES_LIST = '.product__item-swatches .swatches__list';
const PRODUCT_TITLE_LINK = `${BEST_SELLERS} .crib-mobile-title-section .col-8 a`;
const SWATCH_ITEM_SELECTOR =
  '.swatches__item, .js-swatch-color, li.swatches__item, li.js-swatch-color';

export default class ProductsListCribsBestSellers extends BasePage {
  /** Ensures best-sellers products and swatch lists are present in the DOM. */
  static waitForBestSellersSwatches() {
    cy.get(BEST_SELLERS, { timeout: 15000 }).should('exist').scrollIntoView();
    cy.get(`${BEST_SELLERS} ${PRODUCT_SWATCHES_LIST}`, { timeout: 20000 })
      .should('have.length.at.least', 1);
  }

  /**
   * Picks a random best-sellers product whose swatch list has at least minSwatches items.
   * @param {number} minSwatches
   * @returns Cypress chainable<{ index: number|null, count: number }>
   */
  static pickRandomProductWithMinSwatches(minSwatches = 2) {
    this.waitForBestSellersSwatches();

    return cy.get(PRODUCT_ITEM, { timeout: 15000 }).then(($products) => {
      const eligible = [];

      $products.each((index, product) => {
        const count = Cypress.$(product)
          .find(`${PRODUCT_SWATCHES_LIST} ${SWATCH_ITEM_SELECTOR}`)
          .length;

        if (count >= minSwatches) {
          eligible.push({ index, count });
        }
      });

      if (eligible.length === 0) {
        cy.log(`No best-sellers product with ${minSwatches}+ swatch(es) found.`);
        return cy.wrap({ index: null, count: 0 });
      }

      const picked = eligible[Math.floor(Math.random() * eligible.length)];
      cy.log(
        `Random product ${picked.index + 1} selected (${picked.count} swatch(es), ${eligible.length} eligible).`
      );
      return cy.wrap(picked);
    });
  }

  /** Swatch list container for a product at the given index */
  static getProductSwatchesList(productIndex = 0) {
    return cy
      .get(PRODUCT_ITEM, { timeout: 15000 })
      .eq(productIndex)
      .find(PRODUCT_SWATCHES_LIST)
      .first();
  }

  /** Link to a best-sellers product PDP at the given index */
  static getProductLink(productIndex = 0) {
    return cy.get(PRODUCT_TITLE_LINK, { timeout: 10000 }).eq(productIndex);
  }

  /**
   * Returns the number of swatches (variants) for a product at the given index.
   */
  static getProductSwatchCount(productIndex = 0) {
    return cy
      .get(PRODUCT_ITEM, { timeout: 15000 })
      .eq(productIndex)
      .find(`${PRODUCT_SWATCHES_LIST} ${SWATCH_ITEM_SELECTOR}`)
      .its('length');
  }

  /**
   * Selects the second or third swatch in a product's list.
   * @param {number} position - 2 = second item, 3 = third item
   * @param {number} productIndex - zero-based product index in best-sellers
   */
  static selectSecondOrThirdSwatch(position = 2, productIndex = 0) {
    cy.get(PRODUCT_ITEM, { timeout: 10000 })
      .eq(productIndex)
      .find(`${PRODUCT_SWATCHES_LIST} ${SWATCH_ITEM_SELECTOR}`)
      .should('have.length.at.least', 2)
      .then(($items) => {
        const index = position === 3 && $items.length >= 3 ? 2 : 1;
        cy.wrap($items[index]).click({ force: true });
      });
    BasePage.pause(800);
  }

  /** Click product link at index to open PDP */
  static openProductPDPAtIndex(productIndex = 0) {
    cy.get(PRODUCT_TITLE_LINK, { timeout: 10000 })
      .eq(productIndex)
      .click({ force: true });
    BasePage.pause(1500);
  }

  /**
   * Opens a best-sellers product PDP and confirms it exposes at least minVariants color options.
   * @param {number} productIndex
   * @param {number} minVariants
   * @returns Cypress chainable<boolean>
   */
  static openProductWithPdpVariantsAtIndex(productIndex = 0, minVariants = 2) {
    return cy
      .get(PRODUCT_TITLE_LINK, { timeout: 10000 })
      .eq(productIndex)
      .click({ force: true })
      .then(() => {
        BasePage.pause(1500);
        cy.url({ timeout: 15000 }).should('include', '/products/');
        return cy.get('body', { timeout: 15000 });
      })
      .then(($body) => {
        const variantCount = countPdpSwatchOptions($body);
        if (variantCount >= minVariants) {
          cy.log(
            `Best-sellers product ${productIndex + 1} has ${variantCount} PDP variant option(s).`
          );
          return cy.wrap(true);
        }

        cy.log(
          `Best-sellers product ${productIndex + 1} has ${variantCount} PDP variant option(s); skipping.`
        );
        return cy.wrap(false);
      });
  }

  static selectCribs(id) {
    cy.get(`:nth-child(2) > div:nth-child(${id}) > div.product__item.mb4.old-crib-mobile-layout > div > div.col-12.col-md-8.product__item-swatches > ul`).should(`exist`).then(() => {
      cy.log(`Element is available`);
      cy.xpath(`//*[@id="shopify-section-collection-cribs"]/div[1]/div[1]/div[${id}]/div[1]/div/div[4]/ul/li[2]/span/img`).click({force: true});
    });
  }
}
