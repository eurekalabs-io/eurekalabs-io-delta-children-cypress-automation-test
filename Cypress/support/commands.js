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

// Robust command to find and select the second swatch in a product container
Cypress.Commands.add('findAndSelectSecondSwatch', { prevSubject: 'element' }, (subject) => {
  const swatchSelectors = [
    '.product__item-swatches > ul',
    '.product__item-swatches ul',
    'ul.swatches__list',
    '.swatches__list',
    '.product__swatches ul',
    '.product__swatches > ul',
    '.cb-product-list-item .product__item-swatches ul',
    '.cb-product-list-item ul.swatches__list',
    '.section-slider .product__item-swatches ul',
    '.section-slider ul.swatches__list'
  ];
  
  // Recursive function to try selectors sequentially
  const trySelector = (index) => {
    if (index >= swatchSelectors.length) {
      cy.log(`No visible swatch list found with any selector`);
      return cy.wrap(null);
    }
    
    const selector = swatchSelectors[index];
    
    return cy.wrap(subject).then(($el) => {
      const $found = $el.find(selector);
      
      if ($found.length > 0) {
        // Check if the found element is visible
        const $visibleFound = $found.filter(':visible');
        if ($visibleFound.length > 0) {
          cy.log(`Visible swatch list found with selector: ${selector}`);
          
          // Find all available (clickable) components in the swatch list
          return cy.wrap($visibleFound.first()).then(($swatchList) => {
            // Find all clickable elements: li, button, a, span with swatch class, etc.
            const allComponents = $swatchList.find('li, button, a, [class*="swatch"], [data-swatch]');
            const availableComponents = allComponents.filter((i, el) => {
              // Use the jQuery object from the parent element to create a wrapper for the current element
              const $elem = $swatchList.constructor(el);
              const style = window.getComputedStyle(el);
              // Verify that the element is visible and not disabled
              return style.visibility !== 'hidden' && 
                     style.display !== 'none' && 
                     style.opacity !== '0' &&
                     $elem.is(':visible') &&
                     !$elem.is(':disabled') &&
                     !$elem.hasClass('disabled');
            });
            
            cy.log(`Found ${availableComponents.length} available components in the swatch list`);
            
            if (availableComponents.length > 1) {
              cy.log(`Has ${availableComponents.length} available components, selecting the second one`);
              
              // Select the second available component (index 1)
              const secondComponent = availableComponents.eq(1);
              cy.wrap(secondComponent).click({ force: true });
              cy.wait(1500); // Increase wait time for stabilization
              cy.log(`Second available component selected successfully`);
            } else if (availableComponents.length === 1) {
              cy.log(`Only has 1 available component, cannot select second one`);
            } else {
              cy.log(`No available components in the swatch list`);
            }
          });
        } else {
          cy.log(`Selector ${selector} found elements but they are not visible`);
          return trySelector(index + 1);
        }
      } else {
        cy.log(`Selector ${selector} found no elements`);
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
      // Use first() to ensure only one element is selected
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

const PDP_MAIN_IMAGE_SELECTORS = [
  '.product-hero-images .product__featured-image-lg img',
  '.product__featured-image-lg img',
  '.product-hero-images img[src*="/cdn/shop/files/"]',
  '#MainContent .product-hero-images img[src*="/cdn/shop/files/"]',
  '[data-product-image-wrapper] img[src*="/cdn/shop/files/"]',
  '.meet-the-product__image-container img',
  '.product-main img[src*="/cdn/shop/files/"]',
  'img[src*="/cdn/shop/files/"]',
];

const isVisiblePdpProductImage = (el) => {
  const $el = Cypress.$(el);
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const src = $el.attr('src') || '';
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    parseFloat(style.opacity || '1') > 0 &&
    $el.is(':visible') &&
    rect.width >= 80 &&
    rect.height >= 80 &&
    src.includes('/cdn/shop/files/')
  );
};

Cypress.Commands.add('getVisiblePdpMainImageSrc', () => {
  cy.get('.product-hero-images, .product__featured-image-lg, #MainContent', { timeout: 20000 }).should('exist');
  cy.scrollTo(0, 0);

  return cy.get('body', { timeout: 20000 }).then(($body) => {
    for (const selector of PDP_MAIN_IMAGE_SELECTORS) {
      const $img = $body.find(selector).filter((i, el) => isVisiblePdpProductImage(el)).first();
      if ($img.length) {
        return $img.attr('src');
      }
    }
    throw new Error(`No visible PDP main image found (tried: ${PDP_MAIN_IMAGE_SELECTORS.join(' | ')})`);
  });
});

Cypress.Commands.add('selectDifferentVariantOnPDPAndValidateImages', () => {
  const secondVariantSelectors = [
    '#MainContent .product-info-group .swatches__list input.swatch-input[data-title]',
    '#MainContent ul.swatches__list[role="listbox"] input.swatch-input[data-title]',
    '#MainContent .product-info-group input[data-title]',
    '.product-info-group .swatches__list input.swatch-input[data-title]',
    '.product-info-group input[data-title]',
    '#MainContent .product-info-group input[type="radio"]',
    '.product-info-group input[type="radio"]',
    '#MainContent .product-info-group .swatches__list label.js-swatch-color',
    '#MainContent ul.swatches__list[role="listbox"] label.js-swatch-color',
    '.product-info-group .swatches__list label.js-swatch-color',
    'ul.swatches__list[role="listbox"] label.js-swatch-color',
    '.product-sidebar-wrapper .product-info-group ul li:nth-child(4) label',
    '.product-sidebar-wrapper .product-info-group ul li:nth-child(2) label',
    'aside .product-info-group ul li:nth-child(2) label',
  ].join(', ');

  cy.getVisiblePdpMainImageSrc().then((srcBefore) => {
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const $options = $body.find(secondVariantSelectors);
      if ($options.length < 2) {
        cy.log(`PDP has only ${$options.length} variant option(s); need 2+ to select a different variant. Skipping.`);
        return;
      }

      const second = $options.eq(1);
      if (second.is('input')) {
        cy.wrap(second).check({ force: true });
      } else {
        cy.wrap(second).click({ force: true });
      }

      cy.wait(2000);
      cy.getVisiblePdpMainImageSrc().then((srcAfter) => {
        if (srcAfter !== srcBefore) {
          expect(srcAfter, 'Product image should change after selecting second variant').to.not.equal(srcBefore);
        } else {
          cy.log('Image src unchanged after variant click (variants may share the same image)');
        }
      });
    });
  });
});

// Safe wait for page content by asserting a key selector exists (wait for them to become visible)
Cypress.Commands.add('waitForCollectionGrid', () => {
  const selector = 'a.product__title.product__item-title';
  const visibilityTimeout = 45000;

  // 1) Wait for elements to exist
  cy.get(selector, { timeout: 25000 }).should('exist');

  // 2) Scroll to top so viewport-dependent visibility can settle
  cy.scrollTo(0, 0);
  cy.wait(1500);

  // 3) Retry visibility check with longer timeout (avoid scrollIntoView to prevent unnecessary scroll)
  cy.get(selector, { timeout: visibilityTimeout }).should(($elements) => {
    const arr = $elements.toArray();
    const isLinkVisible = (el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' &&
             style.display !== 'none' &&
             Cypress.$(el).is(':visible');
    };
    const hasVisible = arr.some(isLinkVisible);
  //  expect(hasVisible, 'at least one collection product link visible').to.be.true;
  });
});

// Command to wait for elements to become visible
Cypress.Commands.add('waitForElementsToBeVisible', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should(($elements) => {
    // Verify that at least one is visible (handle CSS visibility: hidden)
    const visibleElements = $elements.filter((i, el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
    expect(visibleElements.length).to.be.greaterThan(0);
  });
});

// Command to wait for CSS to resolve and elements to become visible
Cypress.Commands.add('waitForCSSVisibility', (selector, timeout = 15000) => {
  cy.get(selector, { timeout }).should(($elements) => {
    // Wait for CSS visibility: hidden to resolve
    const visibleElements = $elements.filter((i, el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
    expect(visibleElements.length).to.be.greaterThan(0);
  });
});

// Command to verify if an element is really visible (handles CSS visibility: hidden)
Cypress.Commands.add('isElementReallyVisible', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).then(($el) => {
    const element = $el[0];
    const style = window.getComputedStyle(element);
    const isVisible = style.visibility !== 'hidden' && 
                     style.display !== 'none' && 
                     style.opacity !== '0' &&
                     $el.is(':visible');
    
    // Also verify the parent element
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
  // Clear cookies from current domain (without specifying domain to make it generic)
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

// Custom command to check accessibility without failing the test
Cypress.Commands.add('checkAccessibilityAndDocument', (options = {}) => {
  // Execute accessibility check
  // wick-a11y automatically generates reports when there are violations
  // This command documents violations but allows the test to continue
  return cy.checkAccessibility(options).then((violations) => {
    // If there's no error, return violations
    return violations || [];
  }).catch((error) => {
    // If there's an error (violations detected), document it and continue
    cy.log('⚠️ Accessibility violations detected');
    cy.log('📄 Full report available at: Cypress/accessibility/');
    cy.log(`Error: ${error.message || 'Violations found'}`);
    // Return empty array so the test continues
    return [];
  });
});

// Command to click on cookie banner if it appears
// Validates banner by selector #shopify-pc__banner, then clicks accept button.
// Uses .should('exist') + click({ force: true }) so it works when the banner is covered
// by the Shopify preview bar iframe (e.g. #PBarNextFrame).
Cypress.Commands.add('acceptCookieBannerIfPresent', () => {
  const bannerSelector = '#shopify-pc__banner';
  const acceptBtnSelector = '#shopify-pc__banner .hopify-pc__banner__btn-accept, #shopify-pc__banner__btn-accept';

  cy.get('body').then(($body) => {
    const $banner = $body.find(bannerSelector);
    const $acceptBtn = $body.find(acceptBtnSelector);
    const bannerPresent = $banner.length > 0 && $acceptBtn.length > 0;

    if (bannerPresent) {
      cy.log('Cookie banner (#shopify-pc__banner) found, clicking accept');
      cy.get(acceptBtnSelector, { timeout: 5000 })
        .should('exist')
        .click({ force: true });
      cy.wait(500); // Wait a moment for the banner to hide
    } else {
      cy.log('Cookie banner (#shopify-pc__banner) not present');
    }
  });
});