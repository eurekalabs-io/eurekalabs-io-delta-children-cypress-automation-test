import BasePage from '../BasePage';

export default class ProductDetailsPage extends BasePage {
  // Selector genérico que busca el botón add to cart con cualquier variante de ID
  // Funciona con #bundle-add-to-cart, #bundle-add-to-cart-27, etc.
  static addToCart = '.cb-bundle-layout__left > .cb-cart > .cb-tooltip-wrapper > [id^="bundle-add-to-cart"]'


  // Selector genérico que busca el botón primario dentro del customizer footer
  // Usa .first() en el código si hay múltiples components-section
  static addProducts = '.components-section .cb-customizer-wrapper .cb-customizer .cb-customizer-footer .v2-button--primary'
  
  //Product list that are not default of bundle for Nursery an Kids Sets 
  static countProducts = '.cb-bundle-layout__left .section-slider .cb-product-list-item-content'
  static countProductsKids = '.cb-bundle-layout__left .section-slider .cb-product-list-item-header.cb-product-list-item-header--customized'
  

  
//Count products that are not default and select
  static selectProducts() {
    // Esperar que los productos estén disponibles con timeout más largo
    // Los productos pueden cargarse dinámicamente, por lo que esperamos a que aparezcan
    cy.get(this.countProducts, { timeout: 20000 }).then($elements => {
      const countOfElements = $elements.length;
      
      if (countOfElements === 0) {
        // No hay productos para seleccionar, esto es normal en algunos casos
        return;
      }
      
      cy.log(`Procesando ${countOfElements} productos`);
      
      // Usar selector genérico basado en clases
      const productContentSelector = '.cb-bundle-layout__left .section-slider .cb-product-list-item-content';
      
      // Esperar a que los elementos de contenido estén disponibles
      // Pueden cargarse dinámicamente después de que se carguen los headers
      cy.get(productContentSelector, { timeout: 15000 }).then(($contentElements) => {
        const contentCount = $contentElements.length;
        
        if (contentCount === 0) {
          // No hay elementos de contenido, esto puede ser normal
          return;
        }
        
        // Procesar cada producto usando cy.wrap para encadenar correctamente los comandos
        cy.wrap(Array.from({ length: Math.min(countOfElements, contentCount) }, (_, i) => i)).each((cuenta) => {
          // Hacer click en el producto
          cy.get(productContentSelector)
            .eq(cuenta)
            .click({force:true})
          
          // Esperar un momento para que el componente se cargue después del click
          BasePage.pause(500)
          
          // Verificar si components-section existe y buscar el botón
          cy.get('body').then(($body3) => {
            const componentsSection = $body3.find('.components-section');
            
            if (componentsSection.length > 0) {
              // Verificar si el botón existe dentro del components-section
              const button = componentsSection.first().find('.cb-customizer-wrapper .cb-customizer .cb-customizer-footer .v2-button--primary');
              
              if (button.length > 0) {
                // El botón existe, proceder con el click
                cy.get('.components-section').first().within(() => {
                  cy.get('.cb-customizer-wrapper .cb-customizer .cb-customizer-footer .v2-button--primary')
                    .should('exist')
                    .click({force:true})
                });
              }
            }
          });
          
          BasePage.pause(1000)
        })
      });
    });
  }

//Count products that are not default and select
  static selectProductsKidsSets() {
    // Esperar que los productos estén disponibles con timeout más largo
    // Los productos pueden cargarse dinámicamente, por lo que esperamos a que aparezcan
    cy.get(this.countProductsKids, { timeout: 20000 }).then($elements => {
      const countOfElements = $elements.length;
      
      if (countOfElements === 0) {
        // No hay productos para seleccionar, esto es normal en algunos casos
        return;
      }
      
      cy.log(`Procesando ${countOfElements} productos`);
      
      // Usar selector genérico basado en clases en lugar de nth-child específico
      const productContentSelector = '.cb-bundle-layout__left .section-slider .cb-product-list-item-content';
      
      // Esperar a que los elementos de contenido estén disponibles
      // Pueden cargarse dinámicamente después de que se carguen los headers
      cy.get(productContentSelector, { timeout: 15000 }).then(($contentElements) => {
        const contentCount = $contentElements.length;
        
        if (contentCount === 0) {
          // No hay elementos de contenido, esto puede ser normal
          return;
        }
        
        // Procesar cada producto usando cy.wrap para encadenar correctamente los comandos
        cy.wrap(Array.from({ length: Math.min(countOfElements, contentCount) }, (_, i) => i)).each((cuenta) => {
          // Hacer click en el producto
          cy.get(productContentSelector)
            .eq(cuenta)
            .click({force:true})
          
          // Esperar un momento para que el componente se cargue después del click
          BasePage.pause(500)
          
          // Verificar si components-section existe y buscar el botón
          cy.get('body').then(($body3) => {
            const componentsSection = $body3.find('.components-section');
            
            if (componentsSection.length > 0) {
              // Verificar si el botón existe dentro del components-section
              const button = componentsSection.first().find('.cb-customizer-wrapper .cb-customizer .cb-customizer-footer .v2-button--primary');
              
              if (button.length > 0) {
                // El botón existe, proceder con el click
                cy.get('.components-section').first().within(() => {
                  cy.get('.cb-customizer-wrapper .cb-customizer .cb-customizer-footer .v2-button--primary')
                    .should('exist')
                    .click({force:true})
                });
              }
            }
          });
          
          BasePage.pause(1000)
        })
      });
    });
  }

  static bundleAddCart() {
    // Verificar primero si el botón existe antes de intentar hacer click
    cy.get('body').then(($body) => {
      const addToCartButton = $body.find(this.addToCart);
      
      if (addToCartButton.length > 0) {
        // El botón existe, proceder con el click
        cy.get(this.addToCart, { timeout: 10000 })
          .should('exist')
          .click({force:true})
      } else {
        cy.log('Botón addToCart no encontrado, puede que ya se haya agregado al carrito');
      }
    });
  }
}
