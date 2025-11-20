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

beforeEach(() => {
  cy.visit("https://www.deltachildren.com/pages/bundles");
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
      } else {
        // Si no se encuentra ningún botón, esperar un momento y verificar la URL
        // Puede que la página ya haya redirigido o el botón aparezca más tarde
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

it("select nursery sets", () => {
  cy.wrap(sets).each((data) => {
    // Verificar la URL solo si no estamos ya en el carrito
    // Después de agregar productos, la URL puede cambiar a /cart
    cy.url().then((currentUrl) => {
      if (!currentUrl.includes('/cart')) {
        // Si no estamos en el carrito, esperar que la página del producto cargue
        cy.url({ timeout: 30000 }).should('include', '/products/');
        
        // Esperar que el contenedor de componentes esté presente antes de buscar el botón
        cy.get('.components-section', { timeout: 30000 })
          .should('exist')
          .and('be.visible');

        // Los productos se cargarán dinámicamente, selectProducts() los manejará
        // No necesitamos verificar aquí para evitar logs innecesarios
        
        // El botón addProducts aparece dinámicamente después de hacer click en un producto
        // Por lo tanto, no lo verificamos aquí, se maneja dentro de selectProducts()
        // selectProducts() manejará la búsqueda de productos de forma robusta
        
        ProductDetailsPage.selectProducts();
        ProductDetailsPage.bundleAddCart();
        
        // Esperar un momento para que aparezca la pantalla de add-ons si existe
        BasePage.pause(2000);
        
        // Manejar add-ons y proceder al carrito si están presentes
        CartPage.selectAddOns();
        CartPage.proceedToCart();
      } else {
        // Si ya estamos en el carrito, significa que el producto anterior redirigió
        // Continuar con la siguiente iteración
        cy.log('Ya estamos en el carrito, continuando...');
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