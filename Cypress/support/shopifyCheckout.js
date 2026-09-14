/**
 * Shopify checkout helpers.
 *
 * Shop Pay accelerated checkout intercepts the cart "Checkout" button and
 * Cypress click-navigation hangs on Shopify's window `load` event. We open
 * checkout via visit() with skip_shop_pay=true (guest checkout).
 *
 * Cypress wrapping POST /checkouts GraphQL (cy.intercept + req.continue)
 * previously crashed Checkout Extensibility. Do not intercept those routes.
 */

const HUMAN_CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.140 Safari/537.36';

/** Hide navigator.webdriver before checkout JS evaluates (bot scoring). */
function maskAutomationSignals(win) {
  try {
    Object.defineProperty(win.navigator, 'webdriver', {
      configurable: true,
      get: () => undefined,
    });
  } catch (e) {
    /* ignore if the browser already locked this property */
  }
}

function parseCartBody(body) {
  return typeof body === 'string' ? JSON.parse(body) : body;
}

function withSkipShopPay(url) {
  // Shop Pay is not disabled in Admin; this query param is the supported
  // workaround to land on native guest checkout instead of shop.app.
  if (!url) {
    return '/checkout?skip_shop_pay=true';
  }
  if (/skip_shop_pay=/i.test(url)) {
    return url;
  }
  return url.includes('?') ? `${url}&skip_shop_pay=true` : `${url}?skip_shop_pay=true`;
}

function visitCheckoutUrl(url) {
  cy.visit(withSkipShopPay(url), {
    failOnStatusCode: false,
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': HUMAN_CHROME_UA,
    },
    onBeforeLoad: maskAutomationSignals,
  });
  cy.acceptCookieBannerIfPresent();
}

function createStorefrontCheckoutUrl(cart, token, apiVersion, domain) {
  const lines = (cart.items || []).map((item) => ({
    merchandiseId: `gid://shopify/ProductVariant/${item.variant_id}`,
    quantity: item.quantity,
  }));

  return cy
    .request({
      method: 'POST',
      url: `https://${domain}/api/${apiVersion}/graphql.json`,
      failOnStatusCode: false,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
        'User-Agent': HUMAN_CHROME_UA,
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: {
        query: `
          mutation CartCreate($input: CartInput!) {
            cartCreate(input: $input) {
              cart { id checkoutUrl }
              userErrors { field message }
            }
          }
        `,
        variables: {
          input: {
            lines,
            buyerIdentity: { countryCode: 'US' },
          },
        },
      },
    })
    .then((res) => {
      const payload = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
      const checkoutUrl = payload && payload.data && payload.data.cartCreate && payload.data.cartCreate.cart
        ? payload.data.cartCreate.cart.checkoutUrl
        : '';
      const userErrors =
        payload && payload.data && payload.data.cartCreate && payload.data.cartCreate.userErrors
          ? payload.data.cartCreate.userErrors
          : [];

      if (res.status !== 200 || !checkoutUrl) {
        cy.log(
          `Storefront cartCreate unavailable (status ${res.status}, errors: ${JSON.stringify(
            userErrors
          )}). Falling back to cookie cart /checkout.`
        );
        return cy.wrap('');
      }

      cy.log(`Storefront checkoutUrl: ${checkoutUrl}`);
      return cy.wrap(checkoutUrl);
    });
}

/**
 * Opens Shopify checkout from the current Ajax cart.
 * If SHOPIFY_STOREFRONT_ACCESS_TOKEN is set, creates a Storefront cart and
 * visits cart.checkoutUrl. Otherwise visits /checkout with the browser cart cookie.
 */
Cypress.Commands.add('visitShopifyCheckout', () => {
  const token = Cypress.env('SHOPIFY_STOREFRONT_ACCESS_TOKEN') || '';
  const apiVersion = Cypress.env('SHOPIFY_STOREFRONT_API_VERSION') || '2024-10';
  const domain = Cypress.env('SHOPIFY_STOREFRONT_DOMAIN') || 'www.deltachildren.com';

  cy.request({
    url: '/cart.js',
    headers: { 'User-Agent': HUMAN_CHROME_UA },
  }).then((res) => {
    const cart = parseCartBody(res.body);
    expect(cart.item_count, 'cart.item_count before checkout').to.be.greaterThan(0);

    if (!token) {
      cy.log('No SHOPIFY_STOREFRONT_ACCESS_TOKEN — opening /checkout from the Ajax cart cookie');
      visitCheckoutUrl('/checkout');
      return;
    }

    createStorefrontCheckoutUrl(cart, token, apiVersion, domain).then((checkoutUrl) => {
      visitCheckoutUrl(checkoutUrl || '/checkout');
    });
  });
});
