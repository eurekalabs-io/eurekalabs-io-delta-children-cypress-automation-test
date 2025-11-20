// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Comando robusto para encontrar y seleccionar el segundo swatch en un contenedor de producto
Cypress.Commands.add('findAndSelectSecondSwatch', { prevSubject: 'element' }, (subject) => {
  const swatchSelectors = [
    '.product__item-swatches > ul',
    '.product__item-swatches ul',
    'ul.swatches__list',
    '.swatches__list',
    '.product__swatches ul',
    '.product__swatches > ul'
  ];
  
  // Función recursiva para probar selectores secuencialmente
  const trySelector = (index) => {
    if (index >= swatchSelectors.length) {
      cy.log(`No se encontró lista de swatches visible con ningún selector`);
      return cy.wrap(null);
    }
    
    const selector = swatchSelectors[index];
    
    return cy.wrap(subject).then(($el) => {
      const $found = $el.find(selector);
      
      if ($found.length > 0) {
        // Verificar si el elemento encontrado es visible
        const $visibleFound = $found.filter(':visible');
        if ($visibleFound.length > 0) {
          cy.log(`Lista de swatches visible encontrada con selector: ${selector}`);
          
          // Buscar todos los componentes disponibles (clickeables) en la lista de swatches
          return cy.wrap($visibleFound.first()).then(($swatchList) => {
            // Buscar todos los elementos clickeables: li, button, a, span con clase swatch, etc.
            const allComponents = $swatchList.find('li, button, a, [class*="swatch"], [data-swatch]');
            const availableComponents = allComponents.filter((i, el) => {
              // Usar el objeto jQuery del elemento padre para crear un wrapper del elemento actual
              const $elem = $swatchList.constructor(el);
              const style = window.getComputedStyle(el);
              // Verificar que el elemento esté visible y no esté deshabilitado
              return style.visibility !== 'hidden' && 
                     style.display !== 'none' && 
                     style.opacity !== '0' &&
                     $elem.is(':visible') &&
                     !$elem.is(':disabled') &&
                     !$elem.hasClass('disabled');
            });
            
            cy.log(`Encontrados ${availableComponents.length} componentes disponibles en la lista de swatches`);
            
            if (availableComponents.length > 1) {
              cy.log(`Tiene ${availableComponents.length} componentes disponibles, seleccionando el segundo`);
              
              // Seleccionar el segundo componente disponible (índice 1)
              const secondComponent = availableComponents.eq(1);
              cy.wrap(secondComponent).click({ force: true });
              cy.wait(1500); // Aumentar tiempo de espera para estabilización
              cy.log(`Segundo componente disponible seleccionado exitosamente`);
            } else if (availableComponents.length === 1) {
              cy.log(`Solo tiene 1 componente disponible, no se puede seleccionar segundo`);
            } else {
              cy.log(`No tiene componentes disponibles en la lista de swatches`);
            }
          });
        } else {
          cy.log(`Selector ${selector} encontró elementos pero no están visibles`);
          return trySelector(index + 1);
        }
      } else {
        cy.log(`Selector ${selector} no encontró elementos`);
        return trySelector(index + 1);
      }
    });
  };
  
  return trySelector(0);
});

// Select the second swatch inside a given swatch list element if it exists
Cypress.Commands.add('selectSecondSwatchInList', { prevSubject: 'element' }, (subject) => {
  const swatchItems = 'li';
  cy.wrap(subject).children(swatchItems).then(($items) => {
    if ($items.length > 1) {
      // Usar first() para asegurar que solo se seleccione un elemento
      cy.wrap($items.eq(1)).first().click({ force: true });
    }
  });
});

// On collection pages: for each visible swatch list, click the second swatch if available
Cypress.Commands.add('selectSecondVariantAcrossCollection', () => {
  cy.get('ul.swatches__list').each(($ul) => {
    cy.wrap($ul).selectSecondSwatchInList();
  });
});

// On product page: click second variant if swatches exist
Cypress.Commands.add('selectSecondVariantOnPDP', () => {
  cy.get('ul.swatches__list').then(($uls) => {
    if ($uls.length > 0) {
      cy.wrap($uls.first()).selectSecondSwatchInList();
    }
  });
});

// Safe wait for page content by asserting a key selector exists (esperar a que se vuelvan visibles)
Cypress.Commands.add('waitForCollectionGrid', () => {
  const selector = 'a.product__title.product__item-title';
  
  // Primero esperar a que los elementos existan
  cy.get(selector, { timeout: 25000 }).should('exist');
  
  // Luego verificar que al menos uno esté visible con retry automático
  cy.get(selector).should(($elements) => {
    const hasVisible = $elements.toArray().some((el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && 
             style.display !== 'none' &&
             Cypress.$(el).is(':visible');
    });
    
    expect(hasVisible).to.be.true;
  });
});

// Comando para esperar a que los elementos se vuelvan visibles
Cypress.Commands.add('waitForElementsToBeVisible', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should(($elements) => {
    // Verificar que al menos uno esté visible (manejar CSS visibility: hidden)
    const visibleElements = $elements.filter((i, el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
    expect(visibleElements.length).to.be.greaterThan(0);
  });
});

// Comando para esperar a que se resuelva el CSS y los elementos se vuelvan visibles
Cypress.Commands.add('waitForCSSVisibility', (selector, timeout = 15000) => {
  cy.get(selector, { timeout }).should(($elements) => {
    // Esperar a que se resuelva el CSS visibility: hidden
    const visibleElements = $elements.filter((i, el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
    expect(visibleElements.length).to.be.greaterThan(0);
  });
});

// Comando para verificar si un elemento es realmente visible (maneja CSS visibility: hidden)
Cypress.Commands.add('isElementReallyVisible', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).then(($el) => {
    const element = $el[0];
    const style = window.getComputedStyle(element);
    const isVisible = style.visibility !== 'hidden' && 
                     style.display !== 'none' && 
                     style.opacity !== '0' &&
                     $el.is(':visible');
    
    // Verificar también el elemento padre
    const parent = $el.parent();
    const parentStyle = parent.length > 0 ? window.getComputedStyle(parent[0]) : null;
    const parentVisible = !parentStyle || 
                         (parentStyle.visibility !== 'hidden' && 
                          parentStyle.display !== 'none' && 
                          parentStyle.opacity !== '0');
    
    return isVisible && parentVisible;
  });
});

// Hard cleanup to reduce memory pressure between heavy flows
Cypress.Commands.add('hardCleanup', () => {
  // Limpiar cookies del dominio actual (sin especificar domain para que sea genérico)
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window({ log: false }).then((win) => {
    if (win.performance && win.performance.clearResourceTimings) {
      win.performance.clearResourceTimings();
    }
    if (win.gc) {
      try { win.gc(); } catch (e) { /* ignore */ }
    }
  });
});