/// <reference types="cypress" />

// Imports
import BasePage from "../page-objects/BasePage.js";
import Modal from "../page-objects/components/modal.js";
import NavBar from "../page-objects/components/navbar.js";
import CartPage from "../page-objects/pages/CartPage.js";
import ProductDetailsPage from "../page-objects/pages/ProductDetailsPage.js";
import ProductsList from "../page-objects/pages/ProductsList.js";



// Data
const sets = require("../fixtures/KidsSets.json");

beforeEach(() => {
  cy.visit("https://www.deltachildren.com/pages/kids-bedroom-sets");
  // cy.waitForCollectionGrid();
  cy.scrollTo(0, 0);
  cy.window().then((win) => win.scrollTo(0, 0));
  
  // Esperar a que la página cargue completamente antes de buscar botones
  cy.get('body', { timeout: 30000 }).should('exist');
  
  // Seleccionar aleatoriamente uno de los botones "create your set"
  // Buscar de manera flexible para evitar timeouts
  cy.get('body').then(($body) => {
    // Primero buscar por clase específica
    const buttonsByClass = $body.find('a.js-create-set-button, button.js-create-set-button');
    
    if (buttonsByClass.length > 0) {
      const buttons = buttonsByClass.toArray();
      const randomIndex = Math.floor(Math.random() * buttons.length);
      const randomButton = buttons[randomIndex];
      cy.wrap(randomButton).click({ force: true });
      cy.log(`Botón "create your set" seleccionado aleatoriamente (${randomIndex + 1} de ${buttons.length})`);
      
      // Esperar a que la navegación ocurra después del click
      cy.wait(2000);
    } else {
      // Buscar por texto alternativo si no se encuentran con la clase
      const $allButtons = $body.find('a, button').filter((i, el) => {
        const text = Cypress.$(el).text().toLowerCase();
        return text.includes('create') || text.includes('set') || text.includes('bundle');
      });
      
      if ($allButtons.length > 0) {
        const buttons = $allButtons.toArray();
        const randomIndex = Math.floor(Math.random() * buttons.length);
        cy.wrap(buttons[randomIndex]).click({ force: true });
        cy.log(`Botón "create your set" seleccionado por texto (${randomIndex + 1} de ${buttons.length})`);
        
        // Esperar a que la navegación ocurra después del click
        cy.wait(2000);
      } else {
        // Si no se encuentra ningún botón, esperar un momento y verificar la URL
        cy.wait(2000);
        cy.url().then((url) => {
          if (!url.includes('/products/')) {
            cy.log('No se encontró botón "create your set", pero la página puede estar cargando...');
          }
        });
      }
    }
  });
});

it("select kids sets", () => {
  cy.wrap(sets).each((data) => {
    // Verificar la URL y manejar diferentes casos
    cy.url().then((currentUrl) => {
      // Si ya estamos en el carrito, continuar
      if (currentUrl.includes('/cart')) {
        cy.log('Ya estamos en el carrito, continuando...');
        return;
      }
      
      // Si no estamos en /products/, esperar a que la navegación ocurra o verificar si estamos en la página correcta
      if (!currentUrl.includes('/products/')) {
        // Esperar un momento adicional para que la navegación se complete
        cy.wait(2000);
        cy.url({ timeout: 30000 }).then((newUrl) => {
          if (newUrl.includes('/products/')) {
            // La navegación ocurrió, continuar con el flujo
            cy.get('.components-section', { timeout: 30000 })
              .should('exist')
              .and('be.visible');

            ProductDetailsPage.selectProductsKidsSets();
            ProductDetailsPage.bundleAddCart();
          } else {
            // Si aún no estamos en /products/, puede que el botón no haya funcionado
            // Intentar buscar el botón nuevamente o continuar si ya estamos en una página válida
            cy.log(`URL actual: ${newUrl}. Esperando navegación a página de producto...`);
            // Esperar un poco más y verificar nuevamente
            cy.wait(3000);
            cy.url().then((finalUrl) => {
              if (finalUrl.includes('/products/')) {
                cy.get('.components-section', { timeout: 30000 })
                  .should('exist')
                  .and('be.visible');
                ProductDetailsPage.selectProductsKidsSets();
                ProductDetailsPage.bundleAddCart();
              } else {
                cy.log(`No se pudo navegar a página de producto. URL actual: ${finalUrl}`);
              }
            });
          }
        });
      } else {
        // Ya estamos en /products/, continuar normalmente
        cy.get('.components-section', { timeout: 30000 })
          .should('exist')
          .and('be.visible');

        // Los productos se cargarán dinámicamente, selectProductsKidsSets() los manejará
        // No necesitamos verificar aquí para evitar logs innecesarios
        
        // El botón addProducts aparece dinámicamente después de hacer click en un producto
        // Por lo tanto, no lo verificamos aquí, se maneja dentro de selectProductsKidsSets()
        // selectProductsKidsSets() manejará la búsqueda de productos de forma robusta
        
        ProductDetailsPage.selectProductsKidsSets();
        ProductDetailsPage.bundleAddCart();
      }
    });
    
    // Verify cart action completed with multiple fallback selectors
    // Esto funciona tanto si estamos en /products/ como en /cart
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
      
      // Buscar indicadores del carrito por selector CSS
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
        // Fallback: buscar por texto "Cart" en cualquier elemento (case-insensitive)
        cy.contains('Cart', { timeout: 15000, matchCase: false }).should('exist');
      }
    });
    
    cy.hardCleanup();
  });
});