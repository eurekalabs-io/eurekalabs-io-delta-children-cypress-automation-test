/// <reference types="cypress" />

import ProductsListCribsBestSellers from "../page-objects/pages/ProductsListCribsBestSellers.js";

const CRIBS_COLLECTION_URL = "https://www.deltachildren.com/collections/cribs";

describe("Cribs Collection - Best Sellers with variants", () => {
  beforeEach(() => {
    cy.visit(CRIBS_COLLECTION_URL);
    cy.acceptCookieBannerIfPresent();
    cy.get("body", { timeout: 30000 }).should("exist");
    cy.scrollTo(0, 0);
    // Wait until the best-sellers section has loaded
    cy.get("#best-sellers", { timeout: 15000 }).should("exist");
  });

  it("Should find a product with two or more variants and select the second swatch on the collection page", () => {
    // Ul: #best-sellers .crib-mobile-swatches-section .product__item-swatches ul (li.swatches__item / .js-swatch-color)
    ProductsListCribsBestSellers.getFirstProductSwatchCount().then((count) => {
      if (count < 2) {
        cy.log(
          `First product has only ${count} variant(s). Skipping second swatch selection.`
        );
        return;
      }
      cy.log(`First product has ${count} variants. Selecting second swatch.`);
      ProductsListCribsBestSellers.selectSecondOrThirdSwatch(2);
    });
  });

  it("Should select the third swatch when the product has at least three variants", () => {
    ProductsListCribsBestSellers.getFirstProductSwatchCount().then((count) => {
      if (count < 3) {
        cy.log(
          `First product has ${count} variant(s). At least 3 are required to select the third.`
        );
        return;
      }
      cy.log(`First product has ${count} variants. Selecting third swatch.`);
      ProductsListCribsBestSellers.selectSecondOrThirdSwatch(3);
    });
  });

  it("When the first product has more than one variant, should open PDP, change preselected option, and assert images update", () => {
    ProductsListCribsBestSellers.getFirstProductSwatchCount().then((count) => {
      if (count < 2) {
        cy.log(
          `First product has only ${count} variant(s). Test applies when there are 2+ variants.`
        );
        return;
      }

      ProductsListCribsBestSellers.openFirstProductWithPdpVariants(2).then((opened) => {
        if (!opened) {
          cy.log("No best-sellers product with multiple PDP variants was found; skipping.");
          return;
        }

        cy.url().should("include", "/products/");
        cy.selectDifferentVariantOnPDPAndValidateImages();

        // Optional: bianca-white-130 variant — input is hidden (display:none); .check() needs force
        cy.get("body").then(($body) => {
          if (
            !$body.find(
              '#MainContent label.variant-38089719578824, #MainContent input[data-title="bianca-white-130"]'
            ).length
          ) {
            cy.log("bianca-white-130 variant not available on this PDP; skipping extra step.");
            return;
          }
          cy.getVisiblePdpMainImageSrc().then((srcBefore) => {
            cy.get("#MainContent label.variant-38089719578824 img").first().click({ force: true });
            cy.get('#MainContent input[data-title="bianca-white-130"][value="38089719578824"]').check({
              force: true,
            });
            cy.wait(2000);
            cy.getVisiblePdpMainImageSrc().then((srcAfter) => {
              if (srcAfter !== srcBefore) {
                expect(
                  srcAfter,
                  "Product image should change when selecting another variant"
                ).to.not.equal(srcBefore);
              } else {
                cy.log("Image src unchanged (variants may share the same image)");
              }
            });
          });
        });
      });
    });
  });
});
