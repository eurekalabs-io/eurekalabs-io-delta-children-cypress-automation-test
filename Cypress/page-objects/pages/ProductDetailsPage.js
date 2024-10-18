import BasePage from '../BasePage';

export default class ProductDetailsPage extends BasePage {
  static addToCart = '.cb-bundle-layout__left > .cb-cart > .cb-tooltip-wrapper > #bundle-add-to-cart'
  static addVariant = '.components-section > :nth-child(1) > .cb-customizer-wrapper > .cb-customizer > .cb-customizer-footer > .v2-button--primary'
  static countVariant = 'div.cb-bundle-layout__left > div.section-slider > div > div:nth-child(1) >'
  static countVariantKids = 'div.cb-bundle-layout__left > div.section-slider > div > div:nth-child(1) > div > div.cb-product-list-item-header.cb-product-list-item-header--customized > div'
  

  
  static selectVariants() {
    let countOfElements = 0;
    cy.get(this.countVariant).then($elements => {
      countOfElements = $elements.length;
      for (let cuenta = 1; cuenta <= countOfElements; cuenta++) {
        cy.get(`.components-section > :nth-child(1) > :nth-child(${cuenta}) > .cb-product-list-item-content`).click({force:true})
        cy.get(this.addVariant).click()
        BasePage.pause(1000)
      }
    });
  }

  static selectVariantsKidsSets() {
    let countOfElements = 0;
    cy.get(this.countVariantKids).then($elements => {
      countOfElements = $elements.length;
      for (let cuenta = 1; cuenta <= countOfElements; cuenta++) {
        cy.get(`.components-section > :nth-child(1) > :nth-child(${cuenta}) > .cb-product-list-item-content`).click({force:true})
        cy.get(this.addVariant).click()
        BasePage.pause(1000)
      }
    });
  }

  static bundleAddCart() {
    cy.get(this.addToCart).click()
  }
}
