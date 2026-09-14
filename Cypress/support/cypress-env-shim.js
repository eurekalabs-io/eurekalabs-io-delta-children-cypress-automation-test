// Cypress 16 keeps Cypress.env() as a throwing stub. Plugins such as cypress-image-diff
// still call Cypress.env('updateSnapshots'). Always route those calls to Cypress.expose().
function envCompat(key, value) {
  if (typeof Cypress.expose !== 'function') {
    return undefined;
  }

  if (arguments.length >= 2) {
    return Cypress.expose(key, value);
  }

  if (key && typeof key === 'object' && !Array.isArray(key)) {
    Object.entries(key).forEach(([k, v]) => Cypress.expose(k, v));
    return key;
  }

  if (key === undefined) {
    return Cypress.expose();
  }

  return Cypress.expose(key);
}

try {
  Cypress.env = envCompat;
} catch (e) {
  Object.defineProperty(Cypress, 'env', {
    configurable: true,
    writable: true,
    value: envCompat,
  });
}
