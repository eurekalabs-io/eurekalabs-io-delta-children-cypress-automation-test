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
  cy.waitForCollectionGrid();
  // Evitar scroll automático - asegurar que estamos en la parte superior
  cy.scrollTo(0, 0);
  cy.wait(1000);
  // Deshabilitar scroll automático de Cypress
  cy.window().then((win) => {
    win.scrollTo(0, 0);
  });
});

it("Select Crib PDP second variant for each product", () => {
  // PASO 1: Buscar todos los productos en la página de cunas
  cy.get('a.product__title.product__item-title').then(($elements) => {
    cy.log(`PASO 1: Encontrados ${$elements.length} productos en la página de cunas`);
    
    // PASO 2: Convertir elementos jQuery a array JavaScript para manipulación
    const elements = $elements.toArray();
    cy.log(`PASO 2: Convertidos ${elements.length} elementos a array JavaScript`);
    
    // PASO 3: Mezclar aleatoriamente todos los productos disponibles
    const shuffled = elements.sort(() => Math.random() - 0.5);
    cy.log(`PASO 3: Productos mezclados aleatoriamente`);
    
    // PASO 4: Seleccionar máximo 4 productos aleatorios
    const selectedElements = shuffled.slice(0, Math.min(4, elements.length));
    cy.log(`PASO 4: Seleccionados ${selectedElements.length} productos aleatorios para procesar`);
    
    // PASO 5: Procesar cada producto seleccionado uno por uno
    cy.wrap(selectedElements).each(($title, index) => {
      cy.log(`PASO 5: Iniciando procesamiento del producto ${index + 1} de ${selectedElements.length}`);
      
      // PASO 6: Obtener el href del producto para re-seleccionarlo después del click
      cy.wrap($title).invoke('attr', 'href').then((href) => {
        cy.log(`PASO 6: Obtenido href del producto: ${href}`);
        
        // PASO 7: Hacer click en el producto usando su href para evitar errores de DOM detached
        cy.get(`a.product__title.product__item-title[href="${href}"]`).click({ force: true });
        cy.log(`PASO 7: Click realizado en el producto, navegando a PDP (Product Detail Page)`);
        
        // PASO 8: Esperar que la página PDP cargue completamente
        cy.url().should('contain', '/products/');
        cy.log(`PASO 8: PDP cargada correctamente`);
        
        // PASO 9: Seleccionar la segunda variante en la página de detalles del producto
        cy.selectSecondVariantOnPDP();
        cy.log(`PASO 9: Segunda variante seleccionada en PDP`);
        
        // PASO 10: Volver a la página de colección de cunas
        cy.go('back');
        cy.log(`PASO 10: Regresando a la página de colección de cunas`);
        
        // PASO 11: Esperar que la grid de productos esté cargada antes de continuar
        cy.waitForCollectionGrid();
        cy.log(`PASO 11: Grid de productos cargada, continuando con el siguiente producto`);
      });
    });
    
    cy.log(`PASO FINAL: Todos los ${selectedElements.length} productos procesados exitosamente`);
  });
});


it("Select second variant on collection for items with multiple swatches", () => {
  // PASO 1: Buscar todos los productos en la página de cunas
  cy.get('a.product__title.product__item-title').then(($elements) => {
    cy.log(`PASO 1: Encontrados ${$elements.length} productos en la página de cunas`);
    
    // PASO 2: Convertir elementos jQuery a array JavaScript para manipulación
    const elements = $elements.toArray();
    cy.log(`PASO 2: Convertidos ${elements.length} elementos a array JavaScript`);
    
    // PASO 3: Mezclar aleatoriamente todos los productos disponibles
    const shuffled = elements.sort(() => Math.random() - 0.5);
    cy.log(`PASO 3: Productos mezclados aleatoriamente`);
    
    // PASO 4: Seleccionar máximo 4 productos aleatorios
    const selectedElements = shuffled.slice(0, Math.min(4, elements.length));
    cy.log(`PASO 4: Seleccionados ${selectedElements.length} productos aleatorios para procesar`);
    
    // PASO 5: Procesar cada producto seleccionado uno por uno (SIN NAVEGAR A PDP)
    cy.wrap(selectedElements).each(($title, index) => {
      cy.log(`PASO 5: Iniciando procesamiento del producto ${index + 1} de ${selectedElements.length}`);
      
      // PASO 6: Obtener el href del producto para re-seleccionarlo después del click
      cy.wrap($title).invoke('attr', 'href').then((href) => {
        cy.log(`PASO 6: Obtenido href del producto: ${href}`);
        
        // PASO 7: Buscar el contenedor del producto usando el href con timeout robusto
        cy.get(`a.product__title.product__item-title[href="${href}"]`, { timeout: 10000 })
          .should('exist')
          .closest('.product__item')
          .then(($productContainer) => {
            if ($productContainer.length > 0) {
              cy.log(`PASO 7: Contenedor del producto encontrado`);
              
              // PASO 8: Verificar si el contenedor es realmente visible (maneja CSS visibility: hidden)
              return cy.wrap($productContainer).isElementReallyVisible().then((isReallyVisible) => {
                if (isReallyVisible) {
                  cy.log(`PASO 8: Contenedor del producto es realmente visible`);
                  cy.wait(500); // Espera adicional para elementos dinámicos
                  
                  // PASO 9: Buscar swatches en la grid (sin navegar a PDP)
                  return cy.wrap($productContainer).findAndSelectSecondSwatch();
                } else {
                  cy.log(`PASO 8: Contenedor del producto no es realmente visible (CSS visibility: hidden), saltando este producto`);
                  return cy.wrap(null);
                }
              });
            } else {
              cy.log(`PASO 7: No se encontró contenedor de producto`);
              return cy.wrap(null);
            }
          });
      });
    });
    
    cy.log(`PASO FINAL: Todos los ${selectedElements.length} productos procesados exitosamente en la grid`);
  });
});