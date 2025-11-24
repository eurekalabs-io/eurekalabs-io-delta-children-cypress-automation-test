/// <reference types="cypress" />

// Hide TypeError
Cypress.on("uncaught:exception", () => {
  return false;
});

// Hide fetch/XHR requests
const app = window.top;
if (!app.document.head.querySelector("[data-hide-command-log-request]")) {
  const style = app.document.createElement("style");
  style.innerHTML =
    ".command-name-request, .command-name-xhr { display: none }";
  style.setAttribute("data-hide-command-log-request", "");
  app.document.head.appendChild(style);
}

// Imports
import BasePage from "../page-objects/BasePage.js";
import Modal from "../page-objects/components/modal.js";
import NavBar from "../page-objects/components/navbar.js";
import CartPage from "../page-objects/pages/CartPage.js";
import ProductDetailsPage from "../page-objects/pages/ProductDetailsPage.js";
import ProductsList from "../page-objects/pages/ProductsList.js";
import ProductsListCribsBestSellers from "../page-objects/pages/ProductsListCribsBestSellers.js";
import ProductsListCribs from "../page-objects/pages/ProductsListCribsBestSellers.js";
import ProductsListCribsExclusivelyTarget from "../page-objects/pages/ProductsListCribsExclusivelyTarget.js";


// Data
const sets = require("../fixtures/Cribs.json");

beforeEach(() => {
  cy.visit("https://www.deltachildren.com/collections/cribs");
  // Accept cookie banner if it appears
  cy.acceptCookieBannerIfPresent();
  cy.waitForCollectionGrid();
  // Avoid automatic scroll - ensure we're at the top
  cy.scrollTo(0, 0);
  cy.wait(1000);
  // Disable Cypress automatic scroll
  cy.window().then((win) => {
    win.scrollTo(0, 0);
  });
});

it("Select Crib PDP second variant for each product", () => {
  // STEP 1: Find all products on the cribs page
  cy.get('a.product__title.product__item-title').then(($elements) => {
    cy.log(`STEP 1: Found ${$elements.length} products on the cribs page`);
    
    // STEP 2: Convert jQuery elements to JavaScript array for manipulation
    const elements = $elements.toArray();
    cy.log(`STEP 2: Converted ${elements.length} elements to JavaScript array`);
    
    // STEP 3: Randomly shuffle all available products
    const shuffled = elements.sort(() => Math.random() - 0.5);
    cy.log(`STEP 3: Products randomly shuffled`);
    
    // STEP 4: Select maximum 4 random products
    const selectedElements = shuffled.slice(0, Math.min(4, elements.length));
    cy.log(`STEP 4: Selected ${selectedElements.length} random products to process`);
    
    // STEP 5: Process each selected product one by one
    cy.wrap(selectedElements).each(($title, index) => {
      cy.log(`STEP 5: Starting processing of product ${index + 1} of ${selectedElements.length}`);
      
      // STEP 6: Get the product href to re-select it after the click
      cy.wrap($title).invoke('attr', 'href').then((href) => {
        cy.log(`STEP 6: Obtained product href: ${href}`);
        
        // STEP 7: Click on the product using its href to avoid DOM detached errors
        cy.get(`a.product__title.product__item-title[href="${href}"]`).click({ force: true });
        cy.log(`STEP 7: Click performed on product, navigating to PDP (Product Detail Page)`);
        
        // STEP 8: Wait for PDP page to load completely
        cy.url().should('contain', '/products/');
        cy.log(`STEP 8: PDP loaded correctly`);
        
        // STEP 9: Select the second variant on the product detail page
        cy.selectSecondVariantOnPDP();
        cy.log(`STEP 9: Second variant selected on PDP`);
        
        // STEP 10: Go back to the cribs collection page
        cy.go('back');
        cy.log(`STEP 10: Returning to cribs collection page`);
        
        // STEP 11: Wait for product grid to be loaded before continuing
        cy.waitForCollectionGrid();
        cy.log(`STEP 11: Product grid loaded, continuing with next product`);
      });
    });
    
    cy.log(`FINAL STEP: All ${selectedElements.length} products processed successfully`);
  });
});


it("Select second variant on collection for items with multiple swatches", () => {
  // STEP 1: Find all products on the cribs page
  cy.get('a.product__title.product__item-title').then(($elements) => {
    cy.log(`STEP 1: Found ${$elements.length} products on the cribs page`);
    
    // STEP 2: Convert jQuery elements to JavaScript array for manipulation
    const elements = $elements.toArray();
    cy.log(`STEP 2: Converted ${elements.length} elements to JavaScript array`);
    
    // STEP 3: Randomly shuffle all available products
    const shuffled = elements.sort(() => Math.random() - 0.5);
    cy.log(`STEP 3: Products randomly shuffled`);
    
    // STEP 4: Select maximum 4 random products
    const selectedElements = shuffled.slice(0, Math.min(4, elements.length));
    cy.log(`STEP 4: Selected ${selectedElements.length} random products to process`);
    
    // STEP 5: Process each selected product one by one (WITHOUT NAVIGATING TO PDP)
    cy.wrap(selectedElements).each(($title, index) => {
      cy.log(`STEP 5: Starting processing of product ${index + 1} of ${selectedElements.length}`);
      
      // STEP 6: Get the product href to re-select it after the click
      cy.wrap($title).invoke('attr', 'href').then((href) => {
        cy.log(`STEP 6: Obtained product href: ${href}`);
        
        // STEP 7: Find the product container using the href with robust timeout
        cy.get(`a.product__title.product__item-title[href="${href}"]`, { timeout: 10000 })
          .should('exist')
          .closest('.product__item')
          .then(($productContainer) => {
            if ($productContainer.length > 0) {
              cy.log(`STEP 7: Product container found`);
              
              // STEP 8: Verify if the container is really visible (handles CSS visibility: hidden)
              return cy.wrap($productContainer).isElementReallyVisible().then((isReallyVisible) => {
                if (isReallyVisible) {
                  cy.log(`STEP 8: Product container is really visible`);
                  cy.wait(500); // Additional wait for dynamic elements
                  
                  // STEP 9: Find swatches in the grid (without navigating to PDP)
                  return cy.wrap($productContainer).findAndSelectSecondSwatch();
                } else {
                  cy.log(`STEP 8: Product container is not really visible (CSS visibility: hidden), skipping this product`);
                  return cy.wrap(null);
                }
              });
            } else {
              cy.log(`STEP 7: Product container not found`);
              return cy.wrap(null);
            }
          });
      });
    });
    
    cy.log(`FINAL STEP: All ${selectedElements.length} products processed successfully in the grid`);
  });
});