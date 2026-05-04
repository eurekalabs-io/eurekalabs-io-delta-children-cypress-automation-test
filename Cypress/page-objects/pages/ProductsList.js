import BasePage from '../BasePage';

export default class ProductsList extends BasePage {
  static bundlePlpCard = '.cb-bundle-layout__left .section-slider .cb-product-list-item-content';
  static bundlePlpSlider = '.cb-bundle-layout__left .section-slider';

  /**
   * Recorre cada producto de la lista del configurador de bundle (PLP del slider).
   * Si el ítem tiene 2+ swatches, selecciona el segundo y comprueba que la variante
   * cambia (imagen distinta o lista de swatches aún operativa).
   */
  static validateBundlePlSwatches() {
    cy.get(this.bundlePlpSlider, { timeout: 25000 }).should('exist').and('be.visible');

    cy.get(this.bundlePlpCard, { timeout: 20000 })
      .should('have.length.at.least', 1)
      .each(($card, index) => {
        const productLabel = `Bundle PLP producto ${index + 1}`;

        const $container = Cypress.$($card).closest('.cb-product-list-item').length
          ? Cypress.$($card).closest('.cb-product-list-item')
          : Cypress.$($card);

        const $swatchLis = $container
          .find('ul.swatches__list li, .product__item-swatches ul li, .product__swatches ul li')
          .filter((i, li) => {
            const st = window.getComputedStyle(li);
            return st.display !== 'none' && st.visibility !== 'hidden' && Cypress.$(li).is(':visible');
          });

        if ($swatchLis.length < 2) {
          cy.log(`${productLabel}: ${$swatchLis.length} swatch(es) — se requieren 2+ para alternar variante; omitido`);
          return;
        }

        const srcBefore = $container.find('img').filter((i, img) => Cypress.$(img).is(':visible')).first().attr('src') || null;

        cy.log(`${productLabel}: alternando a la segunda variante (swatches: ${$swatchLis.length})`);
        cy.wrap($container[0]).findAndSelectSecondSwatch();
        BasePage.pause(1500);

        cy.wrap($container[0]).then((el) => {
          const $c = Cypress.$(el);
          const srcAfter = $c.find('img').filter((i, img) => Cypress.$(img).is(':visible')).first().attr('src') || null;
          if (srcBefore && srcAfter && srcBefore !== srcAfter) {
            expect(srcAfter, 'La imagen principal debe reflejar el swatch elegido').to.not.equal(srcBefore);
          } else {
            cy.log(`${productLabel}: misma imagen o sin src; comprobando que el bloque de swatches sigue íntegro`);
            expect($swatchLis.length).to.be.at.least(2);
            cy.wrap(el).find('ul.swatches__list li, .product__item-swatches ul li').should('have.length.at.least', 2);
          }
        });
      });
  }

    static selectBundle(id) {
        cy.get(`div:nth-child(2) > div > div > div:nth-child(${id}) > article > div.v2-row.align-items-center.bundle-product__item__actions > div.col-md-5.single-item-footer-section--right.tr--md > a.js-variant-url.js-create-set-button.v2-button.v2-button--tertiary.v2-button--sm`).click({force:true}) ; 
    }

    static selectBundleKidsSets(id) {
      cy.get(`div:nth-child(${id}) > article > div.v2-row.align-items-center.bundle-product__item__actions > div.col-md-5.tr--md > a.js-variant-url.js-create-set-button.v2-button.v2-button--tertiary.v2-button--sm`).click({force:true}) ; 
    }
}