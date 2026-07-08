/// <reference types="cypress" />



import ProductsListCribsBestSellers from "../page-objects/pages/ProductsListCribsBestSellers.js";



const CRIBS_COLLECTION_URL = "https://www.deltachildren.com/collections/cribs";



describe("Cribs Collection - Best Sellers with variants", () => {

  beforeEach(() => {

    cy.visit(CRIBS_COLLECTION_URL);

    cy.acceptCookieBannerIfPresent();

    cy.get("body", { timeout: 30000 }).should("exist");

    cy.scrollTo(0, 0);

    ProductsListCribsBestSellers.waitForBestSellersSwatches();

  });



  it("Should find a product with two or more variants and select the second swatch on the collection page", () => {

    ProductsListCribsBestSellers.pickRandomProductWithMinSwatches(2).then(

      ({ index, count }) => {

        if (index === null) {

          cy.log("No product with 2+ variants found. Skipping second swatch selection.");

          return;

        }

        cy.log(`Product ${index + 1} has ${count} variants. Selecting second swatch.`);

        ProductsListCribsBestSellers.selectSecondOrThirdSwatch(2, index);

      }

    );

  });



  it("Should select the third swatch when the product has at least three variants", () => {

    ProductsListCribsBestSellers.pickRandomProductWithMinSwatches(3).then(

      ({ index, count }) => {

        if (index === null) {

          cy.log(

            "No product with 3+ variants found. At least 3 are required to select the third."

          );

          return;

        }

        cy.log(`Product ${index + 1} has ${count} variants. Selecting third swatch.`);

        ProductsListCribsBestSellers.selectSecondOrThirdSwatch(3, index);

      }

    );

  });



  it("When the first product has more than one variant, should open PDP, change preselected option, and assert images update", () => {

    ProductsListCribsBestSellers.pickRandomProductWithMinSwatches(2).then(

      ({ index, count }) => {

        if (index === null) {

          cy.log(

            "No product with 2+ variants found. Test applies when there are 2+ variants."

          );

          return;

        }



        cy.log(`Product ${index + 1} has ${count} collection swatch(es). Opening PDP.`);

        ProductsListCribsBestSellers.openProductWithPdpVariantsAtIndex(index, 2).then(

          (opened) => {

            if (!opened) {

              cy.log(

                "Selected product does not have multiple PDP variants; skipping."

              );

              return;

            }



            cy.url().should("include", "/products/");

            cy.selectDifferentVariantOnPDPAndValidateImages();

          }

        );

      }

    );

  });

});



