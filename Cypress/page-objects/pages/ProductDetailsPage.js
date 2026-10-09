import BasePage from '../BasePage';

const toMoney = (value) => {
  const match = String(value).replace(/,/g, '').match(/(\d+\.\d{2})/);
  if (!match) {
    throw new Error(`Could not read a price from "${value}"`);
  }
  return `$${match[1]}`;
};

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

  static assertBundleBuilderReady() {
    cy.url({ timeout: 30000 }).should('include', '/products/');
    cy.get('.cb-bundle-layout__left', { timeout: 20000 }).should('exist');
    cy.get('.components-section', { timeout: 30000 }).should('exist').and('be.visible');
    cy.log('Bundle builder is ready (layout + components section)');
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

  /** Next in-stock color on a standard crib PDP, then confirm the hero image updates. */
  static selectDifferentVariantAndValidateImages() {
    cy.selectDifferentVariantOnPDPAndValidateImages();
  }

  /**
   * Clicks Add To Cart on the main crib form.
   * The storefront posts the crib first, then a second /cart/add.js with the
   * selected ADD MORE items and warranty. Pass expectUpsells when those were
   * chosen before this click so the test does not leave the PDP early.
   */
  static addStandardProductToCart({ expectUpsells = false } = {}) {
    cy.intercept('POST', '**/cart/add.js').as('standardAddToCart');
    cy.get('form.main-product-form.regular button[data-submit-button]', { timeout: 20000 })
      .first()
      .then(($button) => {
        const soldOut = $button.is(':disabled') || /sold out/i.test($button.text());
        if (!soldOut) return;
        cy.log('Current color is sold out. Selecting an in-stock variant before Add To Cart.');
        cy.selectDifferentVariantOnPDPAndValidateImages();
      });
    cy.get('form.main-product-form.regular button[data-submit-button]', { timeout: 20000 })
      .first()
      .should(($button) => {
        const soldOut = $button.is(':disabled') || /sold out/i.test($button.text());
        expect(soldOut, 'Add To Cart variant is in stock').to.eq(false);
      })
      .scrollIntoView()
      .click({ force: true });
    cy.wait('@standardAddToCart', { timeout: 30000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
    if (expectUpsells) {
      cy.wait('@standardAddToCart', { timeout: 30000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
      cy.log('Add To Cart posted the crib and then the selected add-on / warranty');
      return;
    }
    cy.log('Add To Cart submitted from the main product form');
  }

  /**
   * ADD MORE & SAVE! must be in the DOM and visible before any add-on can be chosen.
   */
  static assertAddMoreAndSaveAvailable() {
    cy.get('form.main-product-form.regular h3.add-more-title', { timeout: 20000 })
      .should('exist')
      .and('be.visible')
      .and('contain', 'ADD MORE & SAVE!');
    cy.get('form.main-product-form.regular .product-add-more', { timeout: 20000 })
      .should('exist')
      .and('be.visible');
    cy.log('ADD MORE & SAVE! is available and visible');
  }

  /** Visible ADD MORE price and variant id for the Standard Mattress option. */
  static captureStandardMattressOffer() {
    return cy
      .get('form.main-product-form.regular input[data-variant-title="Standard Mattress"]', { timeout: 20000 })
      .then(($input) => {
        const variantId = $input.attr('data-variant-id');
        const visible = $input.closest('.product-add-more-option').find('.add-more-pricing .price').text();
        const price = toMoney(visible || $input.attr('data-variant-price'));
        expect(variantId, 'Standard Mattress variant id').to.be.a('string').and.not.be.empty;
        Cypress.log({ name: 'Mattress price', message: `${price} (${variantId})` });
        return { variantId, price };
      });
  }

  /** Visible Accident Protection price and the warranty variant id. */
  static captureWarrantyOffer() {
    return cy.get('extended-warranty.product-extended-warranty', { timeout: 20000 }).then(($warranty) => {
      const variantId = $warranty.attr('variant-id');
      const price = toMoney($warranty.find('.product-extended-warranty-price').text());
      expect(variantId, 'warranty variant id').to.be.a('string').and.not.be.empty;
      Cypress.log({ name: 'Warranty price', message: `${price} (${variantId})` });
      return { variantId, price };
    });
  }

  /**
   * Opens the first add-on group and selects Standard Mattress.
   * The group stays collapsed until its summary is opened, so the option
   * is asserted visible before either click.
   */
  static selectStandardMattressAddOn() {
    const group = 'form.main-product-form.regular .product-add-more details.product-add-more-group';

    // Set `open` here, without queueing another cy command. A click inside
    // this callback is appended after the visibility checks below, so those
    // checks used to run while the <details> was still closed.
    // checkVisibility() then fails even though the option's own CSS is visible.
    cy.get(group, { timeout: 20000 })
      .first()
      .scrollIntoView()
      .then(($details) => {
        $details.prop('open', true);
      });

    cy.get(group)
      .first()
      .should('have.prop', 'open', true)
      .find('div.option-even > label')
      .scrollIntoView()
      .should('exist')
      .and('be.visible')
      .click({ force: true });

    cy.get(group)
      .first()
      .find('div.option-even')
      .click({ force: true });

    cy.get('form.main-product-form.regular input[data-variant-title="Standard Mattress"]')
      .should('be.checked');
    cy.log('Standard Mattress add-on selected');
  }

  /**
   * Protect Purchase → state DE → Confirm Selection.
   * The state list stays hidden until Protect Purchase is clicked.
   */
  static confirmExtendedWarranty(stateCode = 'DE') {
    cy.get('span.item-protected', { timeout: 15000 })
      .should('exist')
      .and('be.visible')
      .click({ force: true });

    cy.get('select[id^="extended-warranty-state-select"]', { timeout: 15000 })
      .should('exist')
      .scrollIntoView({ block: 'center' })
      .select(stateCode, { force: true });

    cy.get('button.js-extended-warranty-confirm')
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });

    // The component sets data-added on <extended-warranty>, not on the
    // Protect Purchase button. Waiting on the button never finishes, so
    // Add To Cart was never reached.
    cy.get('extended-warranty.product-extended-warranty', { timeout: 15000 })
      .should('have.attr', 'data-added', 'true');
    cy.log(`Extended warranty confirmed for state ${stateCode}`);
  }
}
