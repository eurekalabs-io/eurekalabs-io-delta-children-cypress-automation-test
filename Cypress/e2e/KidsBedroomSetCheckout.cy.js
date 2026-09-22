/// <reference types="cypress" />

import BasePage from "../page-objects/BasePage.js";
import CartPage from "../page-objects/pages/CartPage.js";
import CheckoutPage from "../page-objects/pages/CheckoutPage.js";
import ProductDetailsPage from "../page-objects/pages/ProductDetailsPage.js";

const sets = require("../fixtures/KidsSets.json");
const checkoutData = require("../fixtures/Checkout.json");

describe('Kids Bedroom Set Checkout Suite', () => {
  before(() => {
    cy.log('Starting Kids Bedroom Set Checkout Suite');
  });

  after(() => {
    cy.log('Kids Bedroom Set Checkout Suite completed');
  });

  beforeEach(() => {
    cy.log('Setting up test environment for Kids Bedroom Sets Collection');
    cy.stubStorefrontNoise();
    // Reset cookies/storage before building the bundle so a poisoned
    // Shopify checkout token from a previous run is not reused. Do not
    // clear again after add-to-cart: that drops the cart cookie and
    // /checkout cannot calculate shipping.
    cy.clearCookies();
    cy.visit('/pages/kids-bedroom-sets');
    cy.clearLocalStorage();
    cy.window().then((win) => win.sessionStorage.clear());
    cy.acceptCookieBannerIfPresent();
    cy.scrollTo(0, 0);
    cy.window().then((win) => win.scrollTo(0, 0));
    cy.openRandomCreateSet();
  });

  afterEach(() => {
    cy.log('Test completed — cart cookies were kept until the next beforeEach reset');
  });

  sets.forEach((data, index) => {
    it(`Kids-Bedroom-Set-Checkout ${data.category} - ${data.subcategory}`, function() {
      this.test.title = `Kids Bedroom Set Checkout - Complete checkout ${data.category} - ${data.subcategory}`;
      cy.log(`Executing test ${index + 1} of ${sets.length}: ${data.category} - ${data.subcategory}`);

      cy.url().then((currentUrl) => {
        // Entire cart + checkout must stay inside this .then(). Commands
        // queued after it run too early and used to empty the cart / hit
        // checkout before items were added.
        if (!currentUrl.includes('/cart')) {
          if (!currentUrl.includes('/products/')) {
            cy.openRandomCreateSet();
          }

          cy.url({ timeout: 45000 }).should('include', '/products/');
          cy.get('.components-section', { timeout: 30000 })
            .should('exist')
            .and('be.visible');

          ProductDetailsPage.selectProductsKidsSets();
          ProductDetailsPage.bundleAddCart();
          BasePage.pause(2000);
          CartPage.selectAddOns();
          CartPage.proceedToCart();
        }

        cy.url({ timeout: 45000 }).should('include', '/cart');
        CartPage.assertShopifyCartHasItems();
        CheckoutPage.endingCheckoutProcess(checkoutData);
      });
    });
  });
});
