# Shopify checkout automation — technical notes

This document explains the changes required to complete Cypress end-to-end checkout on **https://www.deltachildren.com/** (Shopify Checkout Extensibility / one-page checkout). It covers Shopify fraud and bot protections, what **cannot** be turned off in Admin, and how the test suite was reconfigured so Nursery Set checkout can finish through the thank-you page.

Related code:

| Area | Path |
| --- | --- |
| Spec | `Cypress/e2e/NurserySetCheckout.cy.js` |
| Checkout POM | `Cypress/page-objects/pages/CheckoutPage.js` |
| Cart POM | `Cypress/page-objects/pages/CartPage.js` |
| Checkout visit helper | `Cypress/support/shopifyCheckout.js` |
| Cypress config | `cypress.config.js` |
| Support / cookies | `Cypress/support/e2e.js` |
| Address fixture | `Cypress/fixtures/Checkout.json` |

Run this spec in **Chrome** (not Electron) and **restart Cypress** after config changes (`modifyObstructiveCode`, launch flags, `userAgent`).

---

## 1. Shopify protections that blocked the original test

Shopify does not expose an Admin setting such as “allow Cypress” or “disable bot protection for QA” on production. The following controls are expected and cannot be fully disabled for `deltachildren.com`.

### 1.1 Shop Pay accelerated checkout

The cart **Checkout** button is intercepted by Shop Pay (`shop.app`). Cypress click-navigation then waits for `window.load`, which Shopify often never fires. That is **not** the same as hiding Complete order.

There is no merchant toggle to keep Shop Pay as a payment method *and* stop it from owning the cart button. The supported workaround is the query parameter `skip_shop_pay=true`.

### 1.2 Checkout Extensibility / GraphQL session

Modern checkout is a React app (`checkout-web`). Shipping rates, payment iframes, and **Complete order** are not in the DOM until the checkout session GraphQL succeeds.

Typical failure:

- Banner: *There was a problem with our checkout*
- **Request ID** (e.g. `a39088fe38d23580`)
- Shipping placeholder: *Enter your shipping address to view available shipping methods*
- `#checkout-pay-button` **never exists** (that id belongs to classic `checkout.liquid`)

Shopify Support / Checkout UI extension owners can look up the Request ID. Cypress cannot force-enable a pay button that was never rendered.

### 1.3 Bot / fraud scoring

Checkout scores:

- `navigator.webdriver`
- Chromium `--enable-automation`
- Non-browser or HeadlessChrome user agents
- Instant form fills (delay 0)
- `cy.intercept` wrapping `POST /checkouts/` (GraphQL)

Official Shopify guidance for E2E is: product + cart in the browser; full checkout on a **development store**, or Storefront API / draft orders. Production automation is tolerated only when the session looks like a normal Chrome guest checkout.

`window.Cypress` still exists. That cannot be removed without breaking Cypress. If a checkout extension keys off it, the banner can return.

### 1.4 Cypress proxy rewrite (`modifyObstructiveCode`)

By default Cypress rewrites “obstructive” / framebusting JavaScript. Checkout Extensibility is sensitive to that rewrite and often dies with the generic session banner **on first paint**, before email or address are filled.

This is a Cypress-side issue, not a Shopify Admin setting.

---

## 2. What we reconfigured (and why)

### 2.1 `modifyObstructiveCode: false` (`cypress.config.js`)

**Problem:** Session banner as soon as `/checkout` loaded; form empty; no shipping.

**Change:** Disable Cypress JS rewrite for the whole project.

This was the highest-impact config change. Checkout-web scripts must reach the browser unmodified.

### 2.2 Chromium launch flags (`setupNodeEvents` → `before:browser:launch`)

**Problem:** Automation-controlled Chromium is scored as a bot.

**Change:**

- Remove `--enable-automation`
- Add `--disable-blink-features=AutomationControlled`
- Chrome only: `excludeSwitches: ['enable-automation']`, `useAutomationExtension: false`

Electron cannot drop the automation signal the same way. Use:

```bash
npx cypress open --browser chrome
```

### 2.3 Realistic `userAgent`

**Problem:** Default Cypress/Electron UA is a fraud signal.

**Change:** Global Chrome 131 macOS user-agent on all requests.

### 2.4 Do not intercept `POST /checkouts/`

**Problem:** `cy.intercept` + `req.continue()` around checkout GraphQL produced the same session banner.

**Change:** `CheckoutPage.interceptCheckoutUpdates()` is a no-op. Idle wait uses `[aria-busy]` / “calculating” in the UI, not a forced `cy.wait('@alias')`.

### 2.5 Guest checkout URL instead of clicking Checkout

**Problem:** Shop Pay + `load` hang.

**Change:** `cy.visitShopifyCheckout()`:

1. `GET /cart.js` (cart must have items)
2. If `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set: Storefront `cartCreate` and visit `checkoutUrl`
3. Else: `cy.visit('/checkout?skip_shop_pay=true')` with `onBeforeLoad` masking `navigator.webdriver`

Shop Pay stays enabled for real customers; tests skip the accelerated flow only.

### 2.6 Valid, geocodable US address (`Checkout.json`)

**Problem:** Puerto Rico street + city DORADO + California + ZIP `92551` (Perris) did not geocode. Shopify never quoted shipping, so Complete order never mounted. Changing only the state dropdown did nothing.

**Change:** Consistent fixture:

- 455 Market Street, San Francisco, CA 94105
- US phone `(415) 555-0100`, `phoneCountry: US`

`selectShippingZone` reads `state` / `stateCode` from the fixture and **skips** `cy.select` if the option is missing (avoids a 30s timeout that aborted ZIP/phone/pay).

Address autocomplete: if Shopify shows a suggestion, the test clicks it so the session gets a geocoded place.

### 2.7 React-compatible field input

**Problem:** `.type()` without native setter + `input`/`change` left React state empty; GraphQL still saw a blank address.

**Change:** `notifyShopifyInput` uses the native value setter and dispatches events. Typing delay is **55ms**.

### 2.8 Cookie lifecycle

**Problem A:** Global `afterEach` `clearCookies` ran while checkout was still queued → empty cart.

**Problem B:** Never clearing cookies reused a **broken checkout token** (`/checkouts/cn/...`).

**Change:**

- `NurserySetCheckout` skips global cookie cleanup in `e2e.js`
- Spec `beforeEach` clears cookies **before** building the bundle, then accepts the privacy banner
- After add-to-cart, cookies are kept until the next `beforeEach`

Accepting `#shopify-pc__banner` does **not** repair GraphQL. It only avoids the banner covering the page. The useful part is dropping a stale checkout token **before** a new cart exists.

### 2.9 Cypress command queue (single `cy.url().then`)

**Problem:** Commands after `.then()` ran first: checkout or cookie clear before add-to-cart.

**Change:** Add to cart, `/cart.js` assert, and `endingCheckoutProcess` all stay **inside** the same `.then()`.

### 2.10 Pay button: text, not `#checkout-pay-button`

**Problem:** Tests waited 30–45s for an id that Checkout Extensibility does not render.

**Change:** `isPayButton` matches **Complete order / Pay now / Place order** by text. Generic `Submit` is ignored (it caused false `pay-button-disabled` traces).

The pay control is created only after shipping rates exist. It cannot be force-enabled with `force: true` if it is not in the DOM.

### 2.11 Do not abort on the session banner before filling the form

**Problem:** `assertNoCheckoutSessionError()` on first paint stopped the test; email/address were never filled.

**Change:** Fill `Checkout.json` first, then wait for rates, then Complete order. The banner may still appear; rates often load after a valid address.

### 2.12 Shipping-rate assertion

**Problem:** Asserting on the heading “Shipping method” always passed, even with the placeholder *Enter your shipping address…*.

**Change:** Fail while that placeholder is present; pass on radios / Standard / Express / economy / free shipping **copy**.

### 2.13 Thank-you assertions (`assertOrderConfirmed`)

After a $0 discounted order the UI shows Confirmation #, Thank you, address, `$0.00`, Track order.

**Removed / relaxed:**

- `/shipping\s+free/` — Shopify concatenates `shippingfree`; `body.text()` also includes checkout-web skeleton CSS, so the regex timed out on megabytes of CSS.
- `.should('be.visible')` on Track order — first match is often a `display: grid` order-summary control that fails `Element.checkVisibility()` (Cypress 14+). Use `.exist`.

**Kept:** visible confirmation copy, email, street, city, ZIP, CA, `$0.00`, Track order exists, confirmation number logged (not hardcoded).

### 2.14 Diagnostics (`checkoutTrace`)

`cy.task('checkoutTrace')` writes `Cypress/reports/checkout-trace-*.json` plus a screenshot: URL, `skip_shop_pay`, iframes, `webdriver`, banner Request ID, buttons (id/text/disabled/visible).

Use this when Complete order is missing instead of guessing selectors.

---

## 3. What we did **not** do (and must not)

| Approach | Why not |
| --- | --- |
| Force `#checkout-pay-button` or strip `disabled` | Node is not in the DOM; a fake click does not complete a Shopify order |
| Disable Shop Pay in Admin | Would change production checkout for customers |
| Disable bot protection on production | Not a supported merchant setting |
| `cy.intercept` all checkout GraphQL “to wait for it” | Crashes the session |
| Clear cookies in the middle of checkout | Deletes the cart; no rates, no pay button |

A **development store** + Bogus Gateway remains the Shopify-recommended place for full payment E2E. This suite uses a **100% discount** test email so production total is **$0.00**.

---

## 4. Runtime requirements

1. Restart Cypress after changing `cypress.config.js`.
2. Browser: **Chrome**.
3. Optional: `SHOPIFY_STOREFRONT_ACCESS_TOKEN` for Storefront `cartCreate`; otherwise Ajax `/cart.js` + `/checkout?skip_shop_pay=true`.
4. Fixture address must stay a real, matching US street / city / state / ZIP.
5. Traces: `Cypress/reports/checkout-trace-*.json`.

---

## 5. End-to-end flow (current)

1. `beforeEach`: clear cookies → `/pages/bundles` → accept privacy banner → open a Create Set PDP.
2. Select bundle components → add to cart → add-ons → `/cart`.
3. Assert `/cart.js` `item_count > 0`.
4. `visitShopifyCheckout()` with `skip_shop_pay=true`.
5. Fill contact + shipping from `Checkout.json` (React events + 55ms delay).
6. Wait until shipping rates are real (not the address placeholder).
7. Click Complete order / Pay now by **text**.
8. Assert thank-you: confirmation, address, `$0.00`, Track order exists.

If step 4 still shows the session banner **and** rates never appear after a valid address, pass the **Request ID** to Shopify Support / the team that owns Checkout UI extensions. That is outside Cypress.
