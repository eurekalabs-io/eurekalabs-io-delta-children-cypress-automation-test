import BasePage from '../BasePage';

const toMoney = (value) => {
  const match = String(value).replace(/,/g, '').match(/(\d+\.\d{2})/);
  if (!match) {
    throw new Error(`Could not read a price from "${value}"`);
  }
  return `$${match[1]}`;
};

/**
 * Cypress 16 `be.visible` uses Element.checkVisibility(). That returns false
 * when an ancestor is not rendered (display:none, closed <details>, the
 * hidden mini-cart) even if this node's own CSS is display:block /
 * visibility:visible / opacity:1. The cart prints each price twice; keep the
 * copy that actually has a box on the cart page.
 */
const isRenderedCartPrice = (el) => {
  if (!el || !el.isConnected) return false;
  if (el.closest('.mini-cart, .js-mini-cart, [hidden]')) return false;
  const details = el.closest('details');
  if (details && !details.open) return false;

  const view = el.ownerDocument.defaultView;
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      style.opacity === '0'
    ) {
      return false;
    }
  }

  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

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
  
  /**
   * Total shown beside Proceed to Cart on the add-ons step:
   * .cb-addons .cb-addons-border--top span.cb-addons-price
   * When that step is not on screen, the same total is .cb-cart .cb-cart-price.
   */
  static captureBundleTotalBeforeProceed() {
    const addOnTotal = '.cb-addons .cb-addons-border--top span.cb-addons-price';
    const builderTotal = '.cb-cart .cb-cart-price';

    return cy.get('body', { timeout: 20000 }).should(($body) => {
      const hasTotal = $body.find(addOnTotal).length > 0 || $body.find(builderTotal).length > 0;
      expect(hasTotal, 'bundle total before Proceed to Cart').to.equal(true);
    }).then(($body) => {
      const addOnPrice = $body.find(addOnTotal);
      const node = addOnPrice.length ? addOnPrice[0] : $body.find(builderTotal)[0];
      const price = toMoney(node.textContent);
      expect(Number(price.slice(1)), 'bundle total before Proceed to Cart').to.be.greaterThan(0);
      Cypress.log({ name: 'Bundle total', message: price });
      return price;
    });
  }

  /**
   * Captain Shipping Protection is checked by default on the cart and adds
   * its fee to the subtotal. The bundle total does not include that fee.
   */
  static uncheckCaptainProtection() {
    cy.get('#captain-checkbox-label', { includeShadowDom: true, timeout: 20000 })
      .should('exist')
      .then(($label) => {
        const forId = $label.attr('for');
        const inputSelector = forId && /^[A-Za-z][\w:-]*$/.test(forId) ? `#${forId}` : null;
        const $input = inputSelector
          ? Cypress.$(inputSelector)
          : $label.find('input[type="checkbox"]');
        const checked = $input.length
          ? $input.is(':checked')
          : $label.attr('aria-checked') !== 'false';

        if (!checked) {
          cy.log('Captain protection is already off');
          return;
        }

        cy.log('Captain protection is on by default. Turning it off so the cart total matches the bundle.');
        cy.get('#captain-checkbox-label', { includeShadowDom: true }).click({ force: true });

        if (inputSelector) {
          cy.get(inputSelector, { includeShadowDom: true, timeout: 10000 }).should('not.be.checked');
        }
      });
  }

  static saveReviewScreenshot(step) {
    const slug = Cypress.env('selectedProductSlug') || 'product';
    const safe = String(slug).replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').slice(0, 80);
    cy.screenshot(`${step}--${safe}`, { capture: 'fullPage', overwrite: true });
  }

  /** Cart page Subtotal must match the total captured before Proceed to Cart. */
  static assertCartSubtotal(expectedPrice) {
    const expected = toMoney(expectedPrice);
    const product = Cypress.env('selectedProductName');
    const label = product ? `cart page bundle total for ${product}` : 'cart page bundle total';
    cy.get('.cart-form__header .cart__subtotal-sum', { timeout: 20000 }).should(($sums) => {
      const rendered = $sums.toArray().filter(isRenderedCartPrice);
      expect(rendered, 'rendered cart subtotal').to.have.length.greaterThan(0);
      expect(toMoney(rendered[0].textContent), label).to.eq(expected);
    });
  }

  /**
   * Reads the add-ons total, then clicks Proceed to Cart and checks that
   * the cart page shows the same amount. Captain protection is turned off
   * first because it is checked by default and is not part of the bundle total.
   */
  static proceedToCartComparingBundlePrice() {
    this.captureBundleTotalBeforeProceed().as('bundleTotalBeforeCart');
    this.saveReviewScreenshot('bundle-total');
    this.proceedToCart();
    cy.url({ timeout: 45000 }).should('include', '/cart');
    this.uncheckCaptainProtection();
    cy.get('@bundleTotalBeforeCart').then((expected) => {
      this.assertCartSubtotal(expected);
      this.saveReviewScreenshot('cart-subtotal');
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
    this.uncheckCaptainProtection();
  }

  /**
   * The price shown on the cart line for this variant must match the PDP price.
   * Scoped to the cart page so the mini-cart copy of the same line is ignored.
   * Several .cart__item-price nodes can match; only the one the page renders
   * is compared.
   */
  static assertVariantPrice(variantId, expectedPrice) {
    const expected = toMoney(expectedPrice);
    cy.get(`.js-cart-page .js-line-item[data-variant-id="${variantId}"] .cart__item-price`, {
      timeout: 20000,
    }).should(($prices) => {
      const rendered = $prices.toArray().filter(isRenderedCartPrice);
      expect(rendered, `rendered cart price for variant ${variantId}`).to.have.length.greaterThan(0);
      expect(toMoney(rendered[0].textContent), `cart price for variant ${variantId}`).to.eq(expected);
    });
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
