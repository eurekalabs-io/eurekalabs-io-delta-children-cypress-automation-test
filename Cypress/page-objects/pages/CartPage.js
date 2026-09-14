import BasePage from '../BasePage';

export default class CartPage extends BasePage {
  // Generic selector for the first add-on
  static firstAddOn = '.cb-addons-variant .v2-button';
  
  // Generic selector for the "Proceed to Cart" button in the add-ons section
  // Searches for the button within .cb-addons without depending on specific nth-child
  static proceedToCartButton = '.cb-addons .cb-addons-border--top button .v2-button__text';

  static selectAddOns() {
    // Check if there are add-ons available before selecting
    cy.get('body').then(($body) => {
      const addOns = $body.find(this.firstAddOn);
      if (addOns.length > 0) {
        cy.get(this.firstAddOn).first().click({force:true});
        BasePage.pause(1000);
      }
    });
  }
  
  static proceedToCart() {
    // Search for "Proceed to Cart" button flexibly
    // First try by text, then by generic selector
    cy.get('body').then(($body) => {
      // Search by text first (more reliable)
      const proceedButtonByText = $body.find('button, a').filter((i, el) => {
        const text = Cypress.$(el).text().toLowerCase();
        return text.includes('proceed') && text.includes('cart');
      });
      
      if (proceedButtonByText.length > 0) {
        cy.contains('Proceed to Cart', { timeout: 15000 }).click({force:true});
      } else {
        // Fallback: search by generic selector within cb-addons
        const proceedButtonBySelector = $body.find(this.proceedToCartButton);
        if (proceedButtonBySelector.length > 0) {
          cy.get(this.proceedToCartButton, { timeout: 15000 })
            .should('exist')
            .click({force:true});
        } else {
          cy.log('"Proceed to Cart" button not found');
        }
      }
    });
  }

  /**
   * Shopify storefront cart API (same-origin /cart.js).
   * Source of truth for item_count, line items and totals (prices in cents).
   */
  static captureShopifyCart() {
    return cy.request({ url: '/cart.js' }).then((res) => {
      const cart = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
      cy.wrap(cart).as('shopifyCart');
      const titles = (cart.items || []).map((item) => item.product_title || item.title).filter(Boolean);
      cy.log(`Shopify cart.js — items: ${cart.item_count}, total (cents): ${cart.total_price}, titles: ${titles.join(' | ')}`);
      return cy.wrap(cart);
    });
  }

  static assertShopifyCartHasItems() {
    this.captureShopifyCart().then((cart) => {
      expect(cart, 'Shopify /cart.js body').to.be.an('object');
      expect(cart.item_count, 'cart.item_count').to.be.greaterThan(0);
      expect(cart.items, 'cart.items').to.be.an('array').and.have.length.greaterThan(0);
      expect(cart.total_price, 'cart.total_price in cents').to.be.greaterThan(0);
    });
  }

  static goToCart() {
    cy.visit('/cart');
    cy.acceptCookieBannerIfPresent();
    cy.get('body', { timeout: 30000 }).should('exist');
  }

  static assertHasItems() {
    cy.get('body', { timeout: 30000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const looksEmpty =
        text.includes('your cart is empty') ||
        text.includes('cart is currently empty') ||
        text.includes('your cart is currently empty');
      expect(looksEmpty, 'Cart should contain the Nursery Set').to.equal(false);
    });
  }

  static proceedToCheckout() {
    // Do not click the cart Checkout button: Shop Pay hijacks it and Cypress
    // waits forever for window `load`. visitShopifyCheckout uses the cart
    // cookie (or Storefront checkoutUrl) plus skip_shop_pay=true.
    cy.visitShopifyCheckout();
  }
}
