import BasePage from '../BasePage';

export default class NavBar extends BasePage {
  // Primary selectors with fallbacks for better reliability
  static menuSelectors = [
    // Clickable (prioridad)
    '#shopify-section-header > section > div.site-header.site-header--bottom.pl0.d-none.d-nav-block > div > nav > ul > li:nth-child(1) > a',
    // Fallbacks resilientes
    '[data-testid="menu-toggle"]',
    '.site-header__wrapper--top > :nth-child(1)',
    '.menu-toggle',
    '.hamburger-menu',
    'button[aria-label*="menu"]'
  ];
  //#shopify-section-header > section > div.site-header.site-header--bottom.pl0.d-none.d-nav-block > div > nav > ul > li:nth-child(1) > a
  static menuCategorySelectors = [
    // Desktop primary nav items
    '#shopify-section-header > section > div.site-header.site-header--bottom.pl0.d-none.d-nav-block > div > nav > ul > li.site-header__nav-item.site-header__nav-item--bottom > a',
    '.site-header--bottom nav > ul > li > a',
    // Mobile fallbacks
    ':nth-child(2) > .navigation-mobile__nav-list >',
    '.navigation-mobile__nav-list >',
    // Generic/data-testids
    '[data-testid*="menu-category"]',
    '.main-nav > .nav-item',
    '.navigation__item'
  ];
  
  static menuSubCategorySelectors = [
    // Desktop mega menu items
    'li.site-header__nav-item--bottom.dropdown.show .navigation-mega-subitem-wrapper a',
    '.site-header--bottom .navigation-mega-subitem-wrapper a',
    '.mega-menu .submenu-item a',
    // Mobile fallbacks
    '.navigation-mobile__scroll-wrapper > .navigation-mega-subitem-wrapper >',
    '.navigation-mega-subitem-wrapper >',
    // Generic/data-testids
    '[data-testid*="submenu"]',
    '.submenu > .submenu-item'
  ];

  static clickMenu() {
    // Try multiple selectors for menu button
    cy.get('body').then(($body) => {
      const foundSelector = this.menuSelectors.find(selector => 
        $body.find(selector).length > 0
      );
      
      if (foundSelector) {
        cy.get(foundSelector, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });
      } else {
        // Fallback to original selector with better error handling
        cy.get(this.menuSelectors[0], { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });
      }
    });
    
    // Wait for menu to open (include desktop open-menu <ul>)
    cy.get('#shopify-section-header > section > div.site-header.site-header--bottom.pl0.d-none.d-nav-block > div > nav > ul > li.site-header__nav-item.site-header__nav-item--bottom.dropdown.show > ul, .navigation-mobile, .main-nav, [data-testid*="menu"]', { timeout: 5000 })
      .should('be.visible');
  }

  static clickMenuCategory(cat) {
    // Try multiple selectors for category items
    cy.get('body').then(($body) => {
      const foundSelector = this.menuCategorySelectors.find(selector => 
        $body.find(selector).length > 0
      );
      
      const selectorToUse = foundSelector || this.menuCategorySelectors[0];
      
      cy.get(selectorToUse, { timeout: 10000 })
        .contains(cat, { matchCase: false })
        .should('be.visible')
        .click({ force: true });
    });
    
    // Wait for submenu to load
    cy.get('.navigation-mega-subitem-wrapper, .submenu, [data-testid*="submenu"]', { timeout: 5000 })
      .should('exist');
  }

  static clickMenuSubCategory(subCat) {
    // Try multiple selectors for subcategory items
    cy.get('body').then(($body) => {
      const foundSelector = this.menuSubCategorySelectors.find(selector => 
        $body.find(selector).length > 0
      );
      
      const selectorToUse = foundSelector || this.menuSubCategorySelectors[0];
      
      cy.get(selectorToUse, { timeout: 10000 })
        .contains(subCat, { matchCase: false })
        .should('be.visible')
        .click({ force: true });
    });
    
    // Wait for page navigation
    cy.url({ timeout: 10000 }).should('not.contain', 'deltachildren.com/');
  }
}
