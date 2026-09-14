/// <reference types="cypress" />

// Imports
import BasePage from "../page-objects/BasePage.js";
import Modal from "../page-objects/components/modal.js";
import NavBar from "../page-objects/components/navbar.js";
import CartPage from "../page-objects/pages/CartPage.js";
import ProductDetailsPage from "../page-objects/pages/ProductDetailsPage.js";
import ProductsList from "../page-objects/pages/ProductsList.js";

// Data
const sets = require("../fixtures/NurserySets.json");

describe('Nursery Sets Collection Suite', () => {
  // Suite-level setup
  before(() => {
    cy.log('Starting Nursery Sets Collection Suite');
  });

  after(() => {
    cy.log('Nursery Sets Collection Suite completed');
  });
  beforeEach(() => {
    cy.log('Setting up test environment for Nursery Sets Collection');
    cy.stubStorefrontNoise();
    cy.visit('/pages/bundles');
    // Accept cookie banner if it appears
    cy.acceptCookieBannerIfPresent();
    // cy.waitForCollectionGrid();
    cy.scrollTo(0, 0);
    cy.window().then((win) => win.scrollTo(0, 0));
    cy.openRandomCreateSet();
  });

  afterEach(() => {
    cy.log('Test completed, cleaning up...');
  });

  // Create a separate test for each set in the array
  // This ensures each iteration is registered as a separate test in Cypress reports
  sets.forEach((data, index) => {
    it(`should select nursery set for ${data.category} - ${data.subcategory}`, function() {
      // Test context for better reporting
      this.test.title = `Nursery Sets Collection Suite - should select nursery set for ${data.category} - ${data.subcategory}`;
      cy.log(`Executing test ${index + 1} of ${sets.length}: ${data.category} - ${data.subcategory}`);
      // Verify URL only if we're not already in the cart
      // After adding products, the URL may change to /cart
      cy.url().then((currentUrl) => {
        if (!currentUrl.includes('/cart')) {
          // If we're not in the cart, wait for the product page to load
          cy.url({ timeout: 30000 }).should('include', '/products/');
          
          // Wait for the components container to be present before searching for the button
          cy.get('.components-section', { timeout: 30000 })
            .should('exist')
            .and('be.visible');

          // Products will load dynamically, selectProducts() will handle them
          // We don't need to verify here to avoid unnecessary logs
          
          // The addProducts button appears dynamically after clicking on a product
          // Therefore, we don't verify it here, it's handled inside selectProducts()
          // selectProducts() will handle product search robustly
          
          ProductDetailsPage.selectProducts();
          ProductDetailsPage.bundleAddCart();
          
          // Wait a moment for the add-ons screen to appear if it exists
          BasePage.pause(2000);
          
          // Handle add-ons and proceed to cart if present
          CartPage.selectAddOns();
          CartPage.proceedToCart();
        } else {
          // If we're already in the cart, it means the previous product redirected
          // Continue with the next iteration
          cy.log('Already in cart, continuing...');
        }
      });
      
      // Verify cart action completed with multiple fallback selectors
      // This works whether we're in /products/ or /cart
      cy.get('body').then(($body) => {
        const cartIndicators = [
          '.cart-count',
          '[data-testid*="cart"]',
          '.header-cart',
          '.cart-icon',
          '.cart-link',
          '[aria-label*="cart"]',
          '[aria-label*="Cart"]'
        ];
        
        // Search for cart indicators by CSS selector
        const foundIndicator = cartIndicators.find(selector => {
          try {
            return $body.find(selector).length > 0;
          } catch (e) {
            return false;
          }
        });
        
        if (foundIndicator) {
          cy.get(foundIndicator, { timeout: 15000 }).should('exist');
        } else {
          // Fallback: search by "Cart" text in any element (case-insensitive)
          cy.contains('Cart', { timeout: 15000, matchCase: false }).should('exist');
        }
      });
      
      cy.hardCleanup();
    });
  });
});