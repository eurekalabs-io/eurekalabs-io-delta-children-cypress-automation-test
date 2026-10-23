/// <reference types="cypress" />

import CartPage from "../page-objects/pages/CartPage.js";
import CheckoutPage from "../page-objects/pages/CheckoutPage.js";
import ProductDetailsPage from "../page-objects/pages/ProductDetailsPage.js";

const contact = require("../fixtures/Checkout.json");
const orders = require("../fixtures/ShippingValidation.json");
// One extra request while this page is up keeps the block in place.
// Wait three minutes, then try the product page once more.
const RATE_LIMIT_WAIT_MS = 180000;
let nextProductVisitAt = 0;

const isShopifyRateLimitPage = (status, bodyText) =>
  status === 429 || /too many requests|try again soon/i.test(String(bodyText || "").slice(0, 1200));

/**
 * Shopify answers 429 when many product pages are opened in a row.
 * Visit with failOnStatusCode: false and, if the edge rate-limits, wait
 * before Add To Cart runs. Do not restart the suite during that wait.
 */
const openProductPage = (productPath, attempt = 1) => {
  const maxAttempts = 2;
  cy.step(`Given the product page opens (attempt ${attempt} of ${maxAttempts}) — ${productPath}`);
  cy.then(() => {
    const waitMs = Math.max(0, nextProductVisitAt - Date.now());
    if (waitMs > 0) {
      cy.step(`Given Shopify asked to try again soon. Waiting ${Math.round(waitMs / 1000)}s before the next product page`);
      return cy.wait(waitMs);
    }
  }).then(() => {
    cy.visit(productPath, { failOnStatusCode: false }).then(() => {
      cy.window().then((win) => {
        const entry = win.performance.getEntriesByType("navigation")[0];
        const status = entry && entry.responseStatus;
        const bodyText = (win.document.body && win.document.body.innerText) || "";
        const rateLimited = isShopifyRateLimitPage(status, bodyText);

        if (rateLimited && attempt < maxAttempts) {
          nextProductVisitAt = Date.now() + RATE_LIMIT_WAIT_MS;
          cy.step(
            "Given Shopify is showing Too many requests. Waiting 3 minutes. Do not restart the suite"
          );
          cy.wait(RATE_LIMIT_WAIT_MS).then(() => openProductPage(productPath, attempt + 1));
          return;
        }

        if (rateLimited) {
          nextProductVisitAt = Date.now() + RATE_LIMIT_WAIT_MS;
          throw new Error(
            "Shopify is still showing Too many requests. You have sent too many requests. Try again soon. Stop this suite and wait several minutes before running it again."
          );
        }

        nextProductVisitAt = Date.now() + 5000;
        if (status) {
          expect(status, "product page HTTP status").to.be.within(200, 399);
        }
      });
    });
  });
};

const isPersonalizedProduct = (item) =>
  /personal/i.test(`${item.product || ""} ${item.productPath || ""}`);

const STOCK_FALLBACKS = [
  {
    product: "By The Bed Twin City Sleeper Bassinet",
    productPath: "/products/by-the-bed-twin-city-sleeper-bassinet",
  },
  {
    product: "Collins Wood Toddler Bed",
    productPath: "/products/collins-wood-toddler-bed-greenguard-gold-certified",
  },
  {
    product: "Nest 4-in-1 Convertible Crib",
    productPath: "/products/nest-4-in-1-convertible-crib",
  },
  {
    product: "Blue Gingham Fitted Crib Sheets - 2 Pack",
    productPath: "/products/blue-gingham-fitted-crib-sheets-2-pack",
  },
];

const shipToLabel = (order) =>
  `${order.address1}, ${order.city}, ${order.stateCode} ${order.zip}, United States`;

const destination = (order) => ({
  ...contact,
  address1: order.address1,
  city: order.city,
  state: order.state,
  stateCode: order.stateCode,
  zip: order.zip,
  country: "United States",
});

const clearCartSession = () => {
  // A leftover cart or checkout token from the previous address would
  // ship the next scenario to the wrong destination.
  cy.step("Given cookies and storage are cleared so this address starts from an empty cart");
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => win.sessionStorage.clear());
};

const candidateProducts = (order) => {
  const primary = { product: order.product, productPath: order.productPath, primary: true };
  const alternates = STOCK_FALLBACKS.filter(
    (item) => item.productPath !== order.productPath && !isPersonalizedProduct(item)
  ).map(
    (item) => ({ ...item, primary: false })
  );
  return [primary, ...alternates];
};

const buyProduct = (order, address, next) => {
  cy.step(`Given the scenario "${order.id}" buys ${order.product}`);
  cy.recordSelectedProduct(order.productPath, {
    product: order.product,
    address,
  });

  const purchaseFirstInStock = (remaining) => {
    const current = remaining[0];
    if (!current) {
      cy.step(
        `Selected product is out of stock — ${order.product}. No different in-stock product was available.`
      );
      return;
    }

    openProductPage(current.productPath);
    cy.step("Given the cookie banner is dismissed when it is on the product page");
    cy.acceptCookieBannerIfPresent();
    cy.step("Then the browser is on the product page");
    cy.url({ timeout: 45000 }).should("include", "/products/");

    ProductDetailsPage.findInStockVariant().then((result) => {
      if (!result || !result.available) {
        cy.step(`Selected product is out of stock — ${current.product}`);
        if (current.primary) {
          cy.step("Selecting a different in-stock product");
        }
        purchaseFirstInStock(remaining.slice(1));
        return;
      }

      const product = result.variant ? `${current.product} — ${result.variant}` : current.product;
      const recorded = current.primary
        ? product
        : `${product} (replaced out-of-stock ${order.product})`;
      cy.step(
        current.primary
          ? `Given the purchased variant is recorded — ${recorded}`
          : `Selected a different in-stock product — ${recorded}`
      );
      cy.recordSelectedProduct(current.productPath, { product: recorded, address });
      cy.step("When the product is added to the cart");
      ProductDetailsPage.addStandardProductToCart();
      cy.step("Then Shopify cart.js has at least one line item");
      CartPage.assertShopifyCartHasItems();
      next();
    });
  };

  purchaseFirstInStock(candidateProducts(order));
};

const suiteOrders = orders.filter((order) => !isPersonalizedProduct(order));
const ordersById = Object.fromEntries(suiteOrders.map((order) => [order.id, order]));

const runShippable = (orderId) => {
  const order = ordersById[orderId];
  const address = shipToLabel(order);
  buyProduct(order, address, () => {
    cy.step(`When checkout confirms shipping to ${address}`);
    CheckoutPage.validateShippingDestination(destination(order));
  });
};

const runPoBox = (orderId) => {
  const order = ordersById[orderId];
  const quotedAddress = `"${order.address1}, ${order.city}, ${order.stateCode} ${order.zip}"`;
  const address = shipToLabel(order);
  cy.step(`Given shipping is not available for PO Box ${quotedAddress}`);
  buyProduct(order, address, () => {
    cy.step(`When checkout is filled for PO Box ${quotedAddress}`);
    CheckoutPage.validateShippingNotAvailableForPoBox(destination(order));
  });
};

describe("SHIPPING VALIDATION", () => {
  beforeEach(clearCartSession);

  it("Ship to 350 5th Ave, New York, NY 10118", () => runShippable("Ship to 350 5th Ave, New York, NY 10118"));
  it("Ship to 1600 Pennsylvania Ave NW, Washington, DC 20500", () => runShippable("Ship to 1600 Pennsylvania Ave NW, Washington, DC 20500"));
  it("Ship to 1 City Hall Sq, Boston, MA 02201, and the ZIP stays 02201", () => runShippable("Ship to 1 City Hall Sq, Boston, MA 02201, and the ZIP stays 02201"));
  it("Ship to 94 Washington St, Hoboken, NJ 07030, and the ZIP stays 07030", () => runShippable("Ship to 94 Washington St, Hoboken, NJ 07030, and the ZIP stays 07030"));
  it("Ship to 25 Dorrance St, Providence, RI 02903, and the ZIP stays 02903", () => runShippable("Ship to 25 Dorrance St, Providence, RI 02903, and the ZIP stays 02903"));
  it("Ship to 149 Church St, Burlington, VT 05401, and the ZIP stays 05401", () => runShippable("Ship to 149 Church St, Burlington, VT 05401, and the ZIP stays 05401"));
  it("Ship to 550 Main St, Hartford, CT 06103, and the ZIP stays 06103", () => runShippable("Ship to 550 Main St, Hartford, CT 06103, and the ZIP stays 06103"));
  it("Ship to 107 N Main St, Concord, NH 03301, and the ZIP stays 03301", () => runShippable("Ship to 107 N Main St, Concord, NH 03301, and the ZIP stays 03301"));
  it("Ship to 800 N French St, Wilmington, DE 19801", () => runShippable("Ship to 800 N French St, Wilmington, DE 19801"));
  it("Ship to 3500 Pan American Dr, Miami, FL 33133", () => runShippable("Ship to 3500 Pan American Dr, Miami, FL 33133"));
  it("Ship to 55 Trinity Ave SW, Atlanta, GA 30303", () => runShippable("Ship to 55 Trinity Ave SW, Atlanta, GA 30303"));
  it("Ship to 901 Bagby St, Houston, TX 77002", () => runShippable("Ship to 901 Bagby St, Houston, TX 77002"));
  it("Ship to 1300 Perdido St, New Orleans, LA 70112", () => runShippable("Ship to 1300 Perdido St, New Orleans, LA 70112"));
  it("Ship to 233 S Wacker Dr, Chicago, IL 60606", () => runShippable("Ship to 233 S Wacker Dr, Chicago, IL 60606"));
  it("Ship to 350 S 5th St, Minneapolis, MN 55415", () => runShippable("Ship to 350 S 5th St, Minneapolis, MN 55415"));
  it("Ship to 225 4th St N, Fargo, ND 58102", () => runShippable("Ship to 225 4th St N, Fargo, ND 58102"));
  it("Ship to 1 Apple Park Way, Cupertino, CA 95014", () => runShippable("Ship to 1 Apple Park Way, Cupertino, CA 95014"));
  it("Ship to 455 N Rexford Dr, Beverly Hills, CA 90210", () => runShippable("Ship to 455 N Rexford Dr, Beverly Hills, CA 90210"));
  it("Ship to 400 Broad St, Seattle, WA 98109", () => runShippable("Ship to 400 Broad St, Seattle, WA 98109"));
  it("Ship to 1221 SW 4th Ave, Portland, OR 97204", () => runShippable("Ship to 1221 SW 4th Ave, Portland, OR 97204"));
  it("Ship to 1437 Bannock St, Denver, CO 80202", () => runShippable("Ship to 1437 Bannock St, Denver, CO 80202"));
  it("Ship to 495 S Main St, Las Vegas, NV 89101", () => runShippable("Ship to 495 S Main St, Las Vegas, NV 89101"));
  it("Ship to 451 S State St, Salt Lake City, UT 84111", () => runShippable("Ship to 451 S State St, Salt Lake City, UT 84111"));
  it("Ship to 210 N 27th St, Billings, MT 59101", () => runShippable("Ship to 210 N 27th St, Billings, MT 59101"));
  it("Ship to 300 N Highland Ave, Marfa, TX 79843", () => runShippable("Ship to 300 N Highland Ave, Marfa, TX 79843"));
  it("Ship to 1338 Rumsey Ave, Cody, WY 82414", () => runShippable("Ship to 1338 Rumsey Ave, Cody, WY 82414"));
  it("Ship to 39 Screaming Eagle Blvd, Fort Campbell, KY 42223", () => runShippable("Ship to 39 Screaming Eagle Blvd, Fort Campbell, KY 42223"));
  it("Ship to 100 S Main St, Texhoma, OK 73949", () => runShippable("Ship to 100 S Main St, Texhoma, OK 73949"));
  it("Ship to 1 Market St, San Francisco, CA 94105-1234, and the ZIP stays 94105-1234", () => runShippable("Ship to 1 Market St, San Francisco, CA 94105-1234, and the ZIP stays 94105-1234"));
  it("Ship to 1 City Hall Sq, Boston, MA 02201-1234, and the ZIP stays 02201-1234", () => runShippable("Ship to 1 City Hall Sq, Boston, MA 02201-1234, and the ZIP stays 02201-1234"));
});

describe("SHIPPING NOT AVAILABLE FOR PO BOX", () => {
  beforeEach(clearCartSession);

  it("Shipping is not available to PO Box 1234, Austin, TX 78767", () => runPoBox("Shipping is not available to PO Box 1234, Austin, TX 78767"));
});
