/// <reference types="cypress" />

import CartPage from "../page-objects/pages/CartPage.js";
import CheckoutPage from "../page-objects/pages/CheckoutPage.js";
import ProductDetailsPage from "../page-objects/pages/ProductDetailsPage.js";
import ProductsListCribsBestSellers from "../page-objects/pages/ProductsListCribsBestSellers.js";

const cribs = require("../fixtures/Cribs.json");
const checkoutData = require("../fixtures/Checkout.json");

const CRIBS_COLLECTION_URL =
  "https://www.deltachildren.com/collections/cribs";

describe("Cribs Checkout Suite", () => {
  before(() => {
    cy.log("Starting Cribs Checkout Suite");
  });

  after(() => {
    cy.log("Cribs Checkout Suite completed");
  });

  beforeEach(() => {
    cy.log("Setting up test environment for Cribs collection");
    cy.stubStorefrontNoise();
    // Reset cookies/storage before choosing a crib so a poisoned Shopify
    // checkout token from a previous run is not reused. Do not clear again
    // after Add To Cart: that drops the cart cookie and /checkout cannot
    // calculate shipping.
    cy.clearCookies();
    cy.visit(CRIBS_COLLECTION_URL);
    cy.clearLocalStorage();
    cy.window().then((win) => win.sessionStorage.clear());
    cy.acceptCookieBannerIfPresent();
    cy.scrollTo(0, 0);
    cy.window().then((win) => win.scrollTo(0, 0));
    ProductsListCribsBestSellers.waitForBestSellersSwatches();
  });

  afterEach(() => {
    cy.log("Test completed — cart cookies were kept until the next beforeEach reset");
  });

  cribs.forEach((data, index) => {
    it(`Cribs-Checkout ${data.category} - ${data.subcategory}`, function () {
      this.test.title = `Cribs Checkout - Complete checkout ${data.category} - ${data.subcategory}`;
      cy.log(`Executing test ${index + 1} of ${cribs.length}: ${data.category} - ${data.subcategory}`);

      ProductsListCribsBestSellers.pickRandomProductWithMinSwatches(2).then(({ index: productIndex, count }) => {
        expect(productIndex, "best-sellers crib with 2+ swatches").to.not.equal(null);

        cy.log(`Product ${productIndex + 1} has ${count} variants. Selecting the second swatch.`);
        ProductsListCribsBestSellers.selectSecondOrThirdSwatch(2, productIndex);

        if (count >= 3) {
          cy.log(`Product ${productIndex + 1} has ${count} variants. Selecting the third swatch.`);
          ProductsListCribsBestSellers.selectSecondOrThirdSwatch(3, productIndex);
        }

        ProductsListCribsBestSellers.openProductWithPdpVariantsAtIndex(productIndex, 2).then((opened) => {
          // Cart and checkout stay inside this .then() so they cannot run
          // before the crib PDP is open and Add To Cart has fired.
          cy.url({ timeout: 45000 }).should("include", "/products/");

          if (opened) {
            ProductDetailsPage.selectDifferentVariantAndValidateImages();
          } else {
            cy.log("Selected crib does not expose 2+ PDP variants; adding the current selection.");
          }

          ProductDetailsPage.addStandardProductToCart();
          CartPage.assertShopifyCartHasItems();
          CheckoutPage.endingCheckoutProcess(checkoutData);
        });
      });
    });
  });
});
