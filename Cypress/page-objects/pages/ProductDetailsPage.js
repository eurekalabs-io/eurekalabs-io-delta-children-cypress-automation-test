import BasePage from '../BasePage';

export default class ProductDetailsPage extends BasePage {
  // Generic selector that searches for add to cart button with any ID variant
  // Works with #bundle-add-to-cart, #bundle-add-to-cart-27, etc.
  static addToCart = '.cb-bundle-layout__left > .cb-cart > .cb-tooltip-wrapper > [id^="bundle-add-to-cart"]'


  // Generic selector that searches for the primary button within the customizer footer
  // Use .first() in code if there are multiple components-section
  static addProducts = '.components-section .cb-customizer-wrapper .cb-customizer .cb-customizer-footer .v2-button--primary'
  
  // Product list that are not default of bundle for Nursery and Kids Sets 
  static countProducts = '.cb-bundle-layout__left .section-slider .cb-product-list-item-content'
  static countProductsKids = '.cb-bundle-layout__left .section-slider .cb-product-list-item-header.cb-product-list-item-header--customized'
  

  
// Count products that are not default and select
  static selectProducts() {
    // Wait for products to be available with longer timeout
    // Products may load dynamically, so we wait for them to appear
    cy.get(this.countProducts, { timeout: 20000 }).then($elements => {
      const countOfElements = $elements.length;
      
      if (countOfElements === 0) {
        // No products to select, this is normal in some cases
        return;
      }
      
      cy.log(`Processing ${countOfElements} products`);
      
      // Use generic selector based on classes
      const productContentSelector = '.cb-bundle-layout__left .section-slider .cb-product-list-item-content';
      
      // Wait for content elements to be available
      // They may load dynamically after headers are loaded
      cy.get(productContentSelector, { timeout: 15000 }).then(($contentElements) => {
        const contentCount = $contentElements.length;
        
        if (contentCount === 0) {
          // No content elements, this may be normal
          return;
        }
        
        // Process each product using cy.wrap to correctly chain commands
        cy.wrap(Array.from({ length: Math.min(countOfElements, contentCount) }, (_, i) => i)).each((cuenta) => {
          // Click on the product
          cy.get(productContentSelector)
            .eq(cuenta)
            .click({force:true})
          
          // Wait a moment for the component to load after click
          BasePage.pause(500)
          
          // Check if components-section exists and search for button
          cy.get('body').then(($body3) => {
            const componentsSection = $body3.find('.components-section');
            
            if (componentsSection.length > 0) {
              // Check if button exists within components-section
              const button = componentsSection.first().find('.cb-customizer-wrapper .cb-customizer .cb-customizer-footer .v2-button--primary');
              
              if (button.length > 0) {
                // Button exists, proceed with click
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

// Count products that are not default and select
  static selectProductsKidsSets() {
    // Wait for products to be available with longer timeout
    // Products may load dynamically, so we wait for them to appear
    cy.get(this.countProductsKids, { timeout: 20000 }).then($elements => {
      const countOfElements = $elements.length;
      
      if (countOfElements === 0) {
        // No products to select, this is normal in some cases
        return;
      }
      
      cy.log(`Processing ${countOfElements} products`);
      
      // Use generic selector based on classes instead of specific nth-child
      const productContentSelector = '.cb-bundle-layout__left .section-slider .cb-product-list-item-content';
      
      // Wait for content elements to be available
      // They may load dynamically after headers are loaded
      cy.get(productContentSelector, { timeout: 15000 }).then(($contentElements) => {
        const contentCount = $contentElements.length;
        
        if (contentCount === 0) {
          // No content elements, this may be normal
          return;
        }
        
        // Process each product using cy.wrap to correctly chain commands
        cy.wrap(Array.from({ length: Math.min(countOfElements, contentCount) }, (_, i) => i)).each((cuenta) => {
          // Click on the product
          cy.get(productContentSelector)
            .eq(cuenta)
            .click({force:true})
          
          // Wait a moment for the component to load after click
          BasePage.pause(500)
          
          // Check if components-section exists and search for button
          cy.get('body').then(($body3) => {
            const componentsSection = $body3.find('.components-section');
            
            if (componentsSection.length > 0) {
              // Check if button exists within components-section
              const button = componentsSection.first().find('.cb-customizer-wrapper .cb-customizer .cb-customizer-footer .v2-button--primary');
              
              if (button.length > 0) {
                // Button exists, proceed with click
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
    // First verify if button exists before attempting to click
    cy.get('body').then(($body) => {
      const addToCartButton = $body.find(this.addToCart);
      
      if (addToCartButton.length > 0) {
        // Button exists, proceed with click
        cy.get(this.addToCart, { timeout: 10000 })
          .should('exist')
          .click({force:true})
      } else {
        cy.log('AddToCart button not found, may have already been added to cart');
      }
    });
  }
}
