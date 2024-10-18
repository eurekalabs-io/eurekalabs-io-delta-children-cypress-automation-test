import BasePage from '../BasePage';

export default class ProductDetailsPage extends BasePage {
  static addToCart = '.cb-bundle-layout__left > .cb-cart > .cb-tooltip-wrapper > #bundle-add-to-cart'
  static addProducts = '.components-section > :nth-child(1) > .cb-customizer-wrapper > .cb-customizer > .cb-customizer-footer > .v2-button--primary'
  
  //Product list that are not default of bundle for Nursery an Kids Sets 
  static countProducts = 'div.cb-bundle-layout__left > div.section-slider > div > div:nth-child(1) >'
  static countProductsKids = 'div.cb-bundle-layout__left > div.section-slider > div > div:nth-child(1) > div > div.cb-product-list-item-header.cb-product-list-item-header--customized > div'
  

  
//Count products that are not default and select
  static selectProducts() {
    let countOfElements = 0;
    cy.get(this.countProducts).then($elements => {
      countOfElements = $elements.length;
      for (let cuenta = 1; cuenta <= countOfElements; cuenta++) {
        cy.get(`.components-section > :nth-child(1) > :nth-child(${cuenta}) > .cb-product-list-item-content`).click({force:true})
        cy.get(this.addVariant).click()
        BasePage.pause(1000)
      }
    });
  }

//Count products that are not default and select
  static selectProductsKidsSets() {
    let countOfElements = 0;
    cy.get(this.countProductsKids).then($elements => {
      countOfElements = $elements.length;
      for (let cuenta = 1; cuenta <= countOfElements; cuenta++) {
        cy.get(`.components-section > :nth-child(1) > :nth-child(${cuenta}) > .cb-product-list-item-content`).click({force:true})
        cy.get(this.addProducts).click()
        BasePage.pause(1000)
      }
    });
  }

  static bundleAddCart() {
    cy.get(this.addToCart).click()
  }
}
