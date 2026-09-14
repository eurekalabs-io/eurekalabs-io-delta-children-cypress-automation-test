import BasePage from '../BasePage';
import CartPage from './CartPage';

const checkoutUser = require('../../fixtures/Checkout.json');

export default class CheckoutPage extends BasePage {
  static checkoutUrlPattern = /\/checkouts?(\/|\?|$)/i;

  static interceptCheckoutUpdates() {
    Cypress.env('checkoutPending', 0);
    // Do not intercept POST /checkouts/*. Cypress wrapping those GraphQL
    // calls commonly produces Shopify's "There was a problem with our checkout".
  }

  /**
   * After email / address / discount, Shopify GraphQL is in flight.
   * Wait until those POSTs finish and the UI is no longer busy.
   */
  static waitForCheckoutIdle() {
    BasePage.pause(800);

    cy.get('body', { timeout: 45000 }).should(($body) => {
      expect($body.find('[aria-busy="true"]').length, 'checkout still recalculating').to.eq(0);
      const text = $body.text().toLowerCase();
      expect(text.includes('calculating'), 'checkout still calculating rates').to.eq(false);
    });

    cy.wrap(null, { timeout: 45000 }).should(() => {
      expect(Cypress.env('checkoutPending') || 0, 'checkout POST still in flight').to.eq(0);
    });
  }

  static waitForCheckoutPage() {
    cy.location('pathname', { timeout: 60000 }).should('match', this.checkoutUrlPattern);
    cy.get('#checkout-main, main, form', { timeout: 45000 }).should('exist');
    this.dismissBlockingOverlays();
    this.continueAsGuestIfNeeded();
  }

  static dismissBlockingOverlays() {
    cy.get('body').then(($body) => {
      const $close = $body.find(
        'button[aria-label="Close"], button[aria-label="close"], button[aria-label="Dismiss"]'
      );
      if ($close.length > 0) {
        cy.wrap($close.first()).click({ force: true });
        BasePage.pause(500);
      }
    });
  }

  static continueAsGuestIfNeeded() {
    cy.get('body').then(($body) => {
      const $guest = $body.find('button, a').filter((i, el) => {
        const text = Cypress.$(el).text().toLowerCase();
        return (
          text.includes('continue as guest') ||
          text.includes('guest checkout') ||
          text.includes('continue without')
        );
      });

      if ($guest.length > 0) {
        cy.wrap($guest.first()).click({ force: true });
        cy.log('Continued as guest at checkout');
        BasePage.pause(1000);
      }
    });
  }

  /**
   * Shopify Checkout Extensibility is React-controlled. Native input.value
   * assignment is ignored unless the prototype setter runs and input/change
   * events bubble. Without this, GraphQL never sees the address and shipping
   * rates stay on "Enter your shipping address…".
   */
  static notifyShopifyInput($el, value) {
    const el = $el[0];
    const proto =
      el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(
      new InputEvent('input', { bubbles: true, composed: true, data: String(value), inputType: 'insertText' })
    );
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  static fillFirstVisible(selectors, value, { blurEsc = false } = {}) {
    if (value === undefined || value === null || String(value).trim() === '') {
      return;
    }

    const list = Array.isArray(selectors) ? selectors : [selectors];
    const joined = list.join(', ');
    const text = String(value);

    cy.get(joined, { timeout: 25000 })
      .filter(':visible')
      .first()
      .scrollIntoView()
      .click({ force: true })
      .clear({ force: true })
      // delay ~55ms mimics human typing; Shopify address autocomplete and
      // rate quotes often ignore instant .type() with delay: 0.
      .type(text, { force: true, delay: 55 })
      .then(($el) => {
        CheckoutPage.notifyShopifyInput($el, text);
        if (blurEsc) {
          $el[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        }
      })
      .trigger('input', { force: true })
      .trigger('change', { force: true })
      .blur({ force: true });
  }

  static fillContactAndShipping(data) {
    this.fillFirstVisible(
      ['#email', 'input[name="email"]', 'input[autocomplete="email"]', 'input[type="email"]'],
      data.email
    );
    BasePage.pause(800);
    this.dismissBlockingOverlays();

    this.fillFirstVisible(
      ['input[name="firstName"]', 'input[autocomplete="given-name"]', 'input[placeholder*="First name"]'],
      data.firstName
    );
    this.fillFirstVisible(
      ['input[name="lastName"]', 'input[autocomplete="family-name"]', 'input[placeholder*="Last name"]'],
      data.lastName
    );

    this.fillFirstVisible(
      ['input[name="postalCode"]', 'input[autocomplete="postal-code"]', 'input[placeholder*="ZIP"]', 'input[placeholder*="Postal"]'],
      data.zip
    );
    this.fillFirstVisible(
      ['input[name="city"]', 'input[autocomplete="address-level2"]', 'input[placeholder*="City"]'],
      data.city
    );

    this.fillFirstVisible(
      ['input[name="address1"]', 'input[autocomplete="address-line1"]', 'input[placeholder*="Address"]'],
      data.address1,
      { blurEsc: true }
    );

    if (data.apartment) {
      this.fillFirstVisible(
        ['input[name="address2"]', 'input[autocomplete="address-line2"]', 'input[placeholder*="Apartment"]', 'input[placeholder*="suite"]'],
        data.apartment
      );
    }

    if (data.phone) {
      this.fillFirstVisible(
        ['input[name="phone"]', 'input[autocomplete="tel"]', 'input[type="tel"]', 'input[placeholder*="Phone"]'],
        data.phone
      );
    }

    BasePage.pause(2000);
  }

  static continueIfPresent() {
    cy.get('body').then(($body) => {
      const $buttons = $body.find('button[type="submit"], button').filter((i, el) => {
        const text = Cypress.$(el).text().replace(/\s+/g, ' ').trim().toLowerCase();
        if (!text) return false;
        if (text.includes('pay now') || text.includes('complete order') || text.includes('place order')) {
          return false;
        }
        return (
          text.includes('continue to shipping') ||
          text.includes('continue to payment') ||
          text === 'continue' ||
          text.includes('continue')
        );
      });

      if ($buttons.length > 0) {
        cy.wrap($buttons.first()).click({ force: true });
        cy.log('Clicked checkout continue');
        BasePage.pause(2000);
      } else {
        cy.log('No Continue button (one-page checkout may auto-advance)');
      }
    });
  }

  static selectShippingMethod() {
    cy.get('body', { timeout: 30000 }).then(($body) => {
      const $radios = $body.find(
        'input[name="shipping_methods"], input[name="shippingMethod"], input[type="radio"][name*="shipping"]'
      );

      if ($radios.length > 0) {
        cy.wrap($radios.first()).check({ force: true });
        cy.log('Selected first shipping method');
        BasePage.pause(1500);
        return;
      }

      const $option = $body.find('[role="radio"], .shipping-method, [data-shipping-method]').filter(':visible');
      if ($option.length > 0) {
        cy.wrap($option.first()).click({ force: true });
        cy.log('Selected first visible shipping option');
        BasePage.pause(1500);
      } else {
        cy.log('Shipping method already selected or not yet visible');
      }
    });
  }

  static selectShippingZone(state, stateCode) {
    // Zone options are US states (California / CA), not municipalities.
    // Selecting a missing option (e.g. after City=DORADO) timed out and
    // never reached ZIP, phone, or Complete order.
    const wantedState = String(state || '').trim();
    const wantedCode = String(stateCode || '').trim();

    cy.get(
      'select[name="zone"], select[autocomplete="address-level1"], .VZudx > [name="zone"]',
      { timeout: 20000 }
    )
      .filter(':visible')
      .first()
      .then(($select) => {
        const options = [...($select[0].options || [])];
        const match = options.find((opt) => {
          const text = String(opt.text || '').trim();
          const value = String(opt.value || '').trim();
          return (
            (wantedCode && (value === wantedCode || value.toUpperCase() === wantedCode.toUpperCase())) ||
            (wantedState && (text === wantedState || value === wantedState)) ||
            (wantedCode && text.toUpperCase() === wantedCode.toUpperCase()) ||
            (wantedState && new RegExp(`^${wantedState}$`, 'i').test(text))
          );
        });

        if (match) {
          cy.wrap($select)
            .select(match.value, { force: true })
            .trigger('input', { force: true })
            .trigger('change', { force: true })
            .blur({ force: true });
          cy.log(`Selected zone: ${match.text || match.value}`);
          return;
        }

        cy.log(`Zone ${wantedState || wantedCode} is not in the state dropdown; continuing`);
      });
  }

  static pickAddressSuggestionIfPresent() {
    BasePage.pause(700);
    cy.get('body').then(($body) => {
      const $suggestion = $body
        .find('[id*="shipping-address1-option"], [role="listbox"] [role="option"], [role="option"]')
        .filter(':visible');

      if ($suggestion.length > 0) {
        const label = $suggestion.first().text().replace(/\s+/g, ' ').trim();
        cy.wrap($suggestion.first()).click({ force: true });
        cy.log(`Selected address suggestion: ${label}`);
      }
    });
  }

  static selectPhoneCountry(countryCode) {
    if (!countryCode) {
      return;
    }

    cy.get('body').then(($body) => {
      const $select = $body.find(
        'select[aria-label="Phone number country code"], select[autocomplete="tel-country-code"]'
      ).filter(':visible');

      if ($select.length === 0) {
        cy.log('Phone number country code not found');
        return;
      }

      const options = [...($select[0].options || [])];
      const match = options.find(
        (opt) => opt.value === countryCode || opt.text.includes(countryCode)
      );

      if (match) {
        cy.wrap($select.first()).select(match.value, { force: true }).trigger('change', { force: true }).blur({ force: true });
        cy.log(`Selected phone country code: ${match.value}`);
      } else {
        cy.log(`Phone country ${countryCode} not in dropdown; continuing`);
      }
    });
  }

  static clickCustomPropertiesIfPresent() {
    cy.get('body').then(($body) => {
      const $custom = $body.find(
        '[id^="CustomProperties"] input[type="checkbox"], [id^="CustomProperties"] [role="checkbox"], [id^="CustomProperties"] button, [id^="CustomProperties"] [tabindex]'
      ).filter(':visible');

      if ($custom.length > 0) {
        cy.wrap($custom.first()).click({ force: true });
        cy.log('Clicked checkout custom property');
      }
    });
  }

  /**
   * Current Checkout Extensibility does not use #checkout-pay-button.
   * Match Complete order / Pay now / Place order by label text. Do not
   * treat a generic "Submit" as the pay button (false disabled traces).
   */
  static isPayButton(el) {
    const label = `${Cypress.$(el).attr('aria-label') || ''} ${Cypress.$(el).attr('id') || ''} ${Cypress.$(el).text()}`
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    if (!label || label.includes('continue')) {
      return false;
    }
    return (
      label.includes('complete order') ||
      label.includes('pay now') ||
      label.includes('place order') ||
      label.includes('complete your order') ||
      label === 'pay' ||
      (/submit/.test(label) && label.includes('order'))
    );
  }

  static fieldValue($body, selectors) {
    const $f = $body.find(selectors).filter(':visible').first();
    return $f.length ? String($f.val() || '') : '(not found)';
  }

  static findCheckoutSessionError($body) {
    const text = $body.text().replace(/\s+/g, ' ');
    const hasBanner = /there was a problem with our checkout/i.test(text);
    const requestIdMatch = text.match(/Request ID:\s*([a-f0-9]+)/i);
    return {
      hasBanner,
      requestId: requestIdMatch ? requestIdMatch[1] : null,
      waitingForShippingAddress: /enter your shipping address to view available shipping methods/i.test(text),
    };
  }

  static recoverBrokenCheckoutSession() {
    cy.get('body').then(($body) => {
      const session = CheckoutPage.findCheckoutSessionError($body);
      if (!session.hasBanner) {
        return;
      }

      cy.log(
        `Checkout session error on load (Request ID: ${session.requestId || 'unknown'}). Clicking Shopify Refresh Page.`
      );

      const $refresh = $body.find('button, a').filter((i, el) => {
        const text = Cypress.$(el).text().replace(/\s+/g, ' ').trim();
        return /^refresh page$/i.test(text) || /refresh this page/i.test(text);
      });

      if ($refresh.length > 0) {
        cy.wrap($refresh.first()).click({ force: true });
      } else {
        cy.reload();
      }

      cy.location('pathname', { timeout: 60000 }).should('match', this.checkoutUrlPattern);
      cy.get('#checkout-main, main, form', { timeout: 45000 }).should('exist');
      BasePage.pause(1500);
    });
  }

  static assertNoCheckoutSessionError() {
    cy.get('body').then(($body) => {
      const session = CheckoutPage.findCheckoutSessionError($body);

      if (session.hasBanner) {
        CheckoutPage.traceCheckoutSubmitState('shopify-checkout-session-error');
      }

      cy.wrap(session, { log: false });
    }).then((session) => {
      if (!session || !session.hasBanner) {
        return;
      }

      throw new Error(
        `Shopify checkout session failed ("There was a problem with our checkout"${
          session.requestId ? `, Request ID: ${session.requestId}` : ''
        }). This is not Shop Pay hiding Complete order. Shipping rates and the pay button will not render until the session recovers. Pass the Request ID to Shopify Support / Checkout UI extensions.`
      );
    });
  }

  static traceCheckoutSubmitState(reason) {
    cy.url().then((url) => {
      cy.get('body').then(($body) => {
        const buttons = $body.find('button, [role="button"], [type="submit"]').toArray().map((el) => {
          const $el = Cypress.$(el);
          const style = el.ownerDocument.defaultView.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            id: el.id || '',
            name: $el.attr('name') || '',
            type: $el.attr('type') || '',
            className: String(el.className || '').slice(0, 80),
            ariaLabel: $el.attr('aria-label') || '',
            text: $el.text().replace(/\s+/g, ' ').trim().slice(0, 100),
            disabled: Boolean(el.disabled),
            ariaDisabled: $el.attr('aria-disabled') || '',
            ariaBusy: $el.attr('aria-busy') || '',
            jqueryVisible: $el.is(':visible'),
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            inViewport: rect.width > 0 && rect.height > 0,
          };
        });

        const bodyText = $body.text().replace(/\s+/g, ' ');
        const sessionError = CheckoutPage.findCheckoutSessionError($body);
        const iframeSrcs = $body
          .find('iframe')
          .toArray()
          .map((el) => el.getAttribute('src') || el.getAttribute('name') || '')
          .filter(Boolean)
          .slice(0, 8);

        const report = {
          reason,
          url,
          pendingCheckoutPosts: Cypress.env('checkoutPending') || 0,
          ariaBusyCount: $body.find('[aria-busy="true"]').length,
          hasCheckoutMain: $body.find('#checkout-main').length > 0,
          iframeCount: $body.find('iframe').length,
          iframeSrcs,
          shopPay: {
            skipParam: /skip_shop_pay=true/i.test(url),
            shopPayText: /shop pay/i.test(bodyText),
            shopAppIframe: iframeSrcs.some((src) => /shop\.app|pay\.shopify/i.test(src)),
          },
          sessionError,
          automation: {
            webdriver: Boolean(window.navigator && window.navigator.webdriver),
            cypress: Boolean(window.Cypress),
          },
          fields: {
            email: CheckoutPage.fieldValue($body, '#email, input[type="email"], input[autocomplete="email"]'),
            firstName: CheckoutPage.fieldValue($body, 'input[autocomplete="given-name"], input[name="firstName"]'),
            address: CheckoutPage.fieldValue($body, '#shipping-address1, input[autocomplete="address-line1"]'),
            city: CheckoutPage.fieldValue($body, 'input[autocomplete="address-level2"]'),
            zip: CheckoutPage.fieldValue($body, 'input[autocomplete="postal-code"]'),
          },
          bodyHints: {
            calculating: $body.text().toLowerCase().includes('calculating'),
            emptyCart: $body.text().toLowerCase().includes('your cart is empty'),
            completeOrderText: $body.text().toLowerCase().includes('complete order'),
            payNowText: $body.text().toLowerCase().includes('pay now'),
            discount: $body.text().toLowerCase().includes('discount'),
            free: $body.text().toLowerCase().includes('$0') || $body.text().toLowerCase().includes('free'),
            shippingPlaceholder: sessionError.waitingForShippingAddress,
          },
          errors: $body
            .find('[role="alert"], [id*="error"], [class*="Error"], [class*="error"]')
            .toArray()
            .map((el) => Cypress.$(el).text().replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .slice(0, 12),
          payButtonMatches: buttons.filter((b) =>
            /complete order|pay now|place order/i.test(`${b.text} ${b.ariaLabel} ${b.id}`)
          ),
          buttons,
        };

        cy.log(`[checkout-trace] ${reason} | url=${url} | buttons=${buttons.length} | pending=${report.pendingCheckoutPosts} | busy=${report.ariaBusyCount}`);
        cy.task('checkoutTrace', report);
        cy.screenshot(`checkout-trace-${reason}`, { capture: 'viewport' });
      });
    });
  }

  static clickCompleteOrder() {
    this.continueIfPresent();
    this.waitForCheckoutIdle();
    this.selectShippingMethod();
    this.waitForCheckoutIdle();
    this.traceCheckoutSubmitState('before-click-complete-order');

    cy.get('button, [role="button"], [type="submit"]', { timeout: 15000 }).then(($els) => {
      const $pay = $els.filter((i, el) => CheckoutPage.isPayButton(el));

      if ($pay.length > 0) {
        const el = $pay[0];
        const disabled = Boolean(el.disabled) || Cypress.$(el).attr('aria-disabled') === 'true';
        const visible = Cypress.$(el).is(':visible');
        cy.log(`[checkout-trace] pay button found disabled=${disabled} visible=${visible} text="${Cypress.$(el).text().replace(/\s+/g, ' ').trim()}"`);

        if (disabled || !visible) {
          CheckoutPage.traceCheckoutSubmitState(disabled ? 'pay-button-disabled' : 'pay-button-hidden');
        }

        cy.wrap($pay.first()).scrollIntoView().click({ force: true });
        cy.log('Clicked Complete order / Pay now by button text');
        return;
      }

      CheckoutPage.traceCheckoutSubmitState('pay-button-not-in-dom');
      throw new Error(
        'Complete order / Pay now button was not in the DOM. See Cypress/reports/checkout-trace-*.json and screenshot checkout-trace-pay-button-not-in-dom.'
      );
    });
  }

  /**
   * Recorder flow: cart → guest checkout form → Complete order → thank-you.
   *
   * Do not fail on Shopify's session error banner before the form is filled:
   * that banner can appear on first paint while rates still calculate after
   * a valid US address. Cypress intercept of POST /checkouts/ is disabled
   * (see interceptCheckoutUpdates).
   */
  static endingCheckoutProcess(data = checkoutUser) {
    const user = { ...checkoutUser, ...data };

    cy.viewport(1125, 818);
    this.interceptCheckoutUpdates();
    CartPage.goToCart();
    CartPage.proceedToCheckout();
    this.waitForCheckoutPage();
    this.traceCheckoutSubmitState('checkout-page-loaded');
    cy.log(`Checkout test user: ${user.email} — ${user.firstName} ${user.lastName}`);

    this.fillFirstVisible(
      ['#email', 'input[name="email"]', 'input[autocomplete="email"]', 'input[type="email"]'],
      user.email
    );
    this.dismissBlockingOverlays();

    this.fillFirstVisible(
      ['input[aria-label="First name"]', 'input[name="firstName"]', 'input[autocomplete="given-name"]', 'input[placeholder*="First name"]'],
      user.firstName
    );
    this.fillFirstVisible(
      ['input[aria-label="Last name"]', 'input[name="lastName"]', 'input[autocomplete="family-name"]', 'input[placeholder*="Last name"]'],
      user.lastName
    );
    this.fillFirstVisible(
      ['#shipping-address1', 'input[aria-label="Address"]', 'input[name="address1"]', 'input[autocomplete="address-line1"]', 'input[placeholder*="Address"]'],
      user.address1
    );
    this.pickAddressSuggestionIfPresent();
    this.fillFirstVisible(
      ['input[aria-label="City"]', 'input[name="city"]', 'input[autocomplete="address-level2"]', 'input[placeholder*="City"]'],
      user.city
    );
    BasePage.pause(500);
    this.selectShippingZone(user.state, user.stateCode);
    this.fillFirstVisible(
      ['input[aria-label="ZIP code"]', 'input[name="postalCode"]', 'input[autocomplete="postal-code"]', 'input[placeholder*="ZIP"]'],
      user.zip
    );
    this.fillFirstVisible(
      ['input[aria-label="Phone"]', 'input[name="phone"]', 'input[autocomplete="tel"]', 'input[type="tel"]', 'input[placeholder*="Phone"]'],
      user.phone
    );
    this.selectPhoneCountry(user.phoneCountry);
    this.clickCustomPropertiesIfPresent();
    this.waitForCheckoutIdle();
    this.traceCheckoutSubmitState('after-fill-contact-shipping');
    this.assertShippingRatesLoaded();
    this.clickCompleteOrder();
    this.assertOrderConfirmed(user);
  }

  /**
   * Thank-you page after a $0 / fully discounted Nursery Set order.
   *
   * Do not assert "Shipping FREE" via /shipping\s+free/: Shopify concatenates
   * copy (shippingfree) and body.text() includes checkout-web skeleton CSS.
   * Track order uses .exist: the first match is often a display:grid summary
   * toggle that fails Cypress checkVisibility() even when CSS looks visible.
   */
  static assertOrderConfirmed(user = checkoutUser) {
    const phoneDigits = String(user.phone || '').replace(/\D/g, '');

    cy.contains(/your order is confirmed/i, { timeout: 60000 }).should('be.visible');
    cy.contains(new RegExp(`thank you[\\s,]*${user.firstName}`, 'i'), { timeout: 15000 }).should('be.visible');
    cy.contains(/Confirmation\s*#\s*[A-Z0-9]+/i).should('be.visible');
    cy.contains(/confirmation email/i).should('be.visible');
    cy.contains(user.email).should('be.visible');
    cy.contains(user.lastName).should('be.visible');
    cy.contains(user.address1, { matchCase: false }).should('be.visible');
    cy.contains(user.city, { matchCase: false }).should('be.visible');
    cy.contains(user.zip).should('be.visible');
    cy.contains(user.country, { matchCase: false }).should('be.visible');
    cy.contains(/\bCA\b|California/).should('be.visible');
    if (phoneDigits.length >= 10) {
      cy.contains(phoneDigits).should('be.visible');
    }
    cy.contains(/\$\s*0(?:\.00)?/).should('exist');
    cy.contains(/track order/i, { timeout: 15000 }).should('exist');

    cy.location('pathname').then((path) => {
      cy.log(`Thank-you pathname: ${path}`);
    });

    cy.contains(/Confirmation\s*#\s*[A-Z0-9]+/i).then(($el) => {
      cy.log(`Order confirmation: ${$el.text().replace(/\s+/g, ' ').trim()} — ${user.email}`);
    });
  }

  /**
   * Completes the checkout form through the payment step.
   * Does not click Pay now / Place order on production to avoid a live order.
   */
  static completeThroughPayment(data) {
    this.waitForCheckoutPage();
    this.assertCheckoutLoaded();
    this.assertOrderSummaryHasItems();
    this.fillContactAndShipping(data);
    this.assertEmailFilled(data.email);
    this.continueIfPresent();
    this.selectShippingMethod();
    this.assertShippingRatesLoaded();
    this.continueIfPresent();
    this.assertPaymentStep();
  }

  static assertCheckoutLoaded() {
    cy.get('body', { timeout: 30000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      expect(text, 'Checkout should not show an empty cart').to.not.include('your cart is empty');
      const hasContact =
        $body.find('#email, input[name="email"], input[autocomplete="email"], input[type="email"]').length > 0 ||
        text.includes('contact') ||
        text.includes('email');
      expect(hasContact, 'Checkout contact / email section should be visible').to.equal(true);
    });
  }

  static assertOrderSummaryHasItems() {
    cy.get('@shopifyCart').then((cart) => {
      cy.get('body', { timeout: 30000 }).should(($body) => {
        const text = $body.text();
        expect(text.toLowerCase(), 'Checkout should not be empty').to.not.include('your cart is empty');
        expect(/\$\s*\d/.test(text), 'Checkout should show a dollar total').to.equal(true);

        const titles = (cart.items || [])
          .map((item) => (item.product_title || item.title || '').trim())
          .filter(Boolean);
        const matched = titles.some((title) => {
          const token = title.split(' - ')[0].slice(0, 18);
          return token.length >= 4 && text.toLowerCase().includes(token.toLowerCase());
        });
        expect(
          matched || $body.find('aside, [data-order-summary], .order-summary').length > 0,
          'Order summary should list cart items or a summary panel'
        ).to.equal(true);
      });
    });
  }

  static assertEmailFilled(email) {
    cy.get('#email, input[name="email"], input[autocomplete="email"], input[type="email"]', { timeout: 15000 })
      .filter(':visible')
      .first()
      .should('have.value', email);
  }

  static assertShippingRatesLoaded() {
    // The heading "Shipping method" is always on the page. Assert real rates
    // (or Standard / Express), not the placeholder copy that appears when
    // Shopify has not geocoded the address yet.
    cy.get('body', { timeout: 45000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const session = CheckoutPage.findCheckoutSessionError($body);
      expect(
        session.waitingForShippingAddress,
        'Shipping still shows "Enter your shipping address to view available shipping methods"'
      ).to.equal(false);

      const hasRates =
        $body.find(
          'input[name="shipping_methods"], input[name="shippingMethod"], input[type="radio"][name*="shipping"], [data-shipping-method]'
        ).length > 0 ||
        text.includes('standard') ||
        text.includes('express') ||
        text.includes('economy') ||
        text.includes('free shipping');
      expect(hasRates, 'Shipping rates should load after the address is filled').to.equal(true);
    });
  }

  static assertPaymentStep() {
    cy.get('body', { timeout: 30000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasPaymentUi =
        text.includes('payment') ||
        text.includes('credit card') ||
        text.includes('pay now') ||
        text.includes('complete order') ||
        $body.find('iframe[src*="shopify"], iframe[name*="card"], [data-card-fields]').length > 0 ||
        $body.find('button').filter((i, el) => {
          const label = Cypress.$(el).text().toLowerCase();
          return label.includes('pay now') || label.includes('complete order') || label.includes('place order');
        }).length > 0;

      expect(hasPaymentUi, 'Checkout should reach the payment step').to.equal(true);
    });

    cy.log('Checkout form completed through payment. Live order was not placed.');
  }
}
