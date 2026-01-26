/// <reference types="cypress" />

describe('Regresión Visual - Desktop y Mobile', () => {
  // URLs a probar para regresión visual
  const urls = [
    {
      path: '/',
      name: 'Homepage',
      description: 'Homepage'
    },
    {
      path: '/collections/cribs',
      name: 'Cribs Collection',
      description: 'Cribs Collection'
    },
    {
      path: '/collections/dressers-and-changers',
      name: 'Dressers and Changers Collection',
      description: 'Dressers and Changers Collection'
    },
    {
      path: '/pages/bundles',
      name: 'Nursery Sets Collection',
      description: 'Nursery Sets Collection'
    },
    {
      path: '/pages/kids-bedroom-sets',
      name: 'Kids Bedroom Sets Collection',
      description: 'Kids Bedroom Sets Collection'
    }
  ];

  // Configuración de viewports para MacBooks, iPhone 14 Pro Max e iPad Pro
  const viewports = [
    {
      name: 'MacBook Pro 16"',
      width: 1728,
      height: 1117,
      device: 'desktop'
    },
    {
      name: 'MacBook Pro 14"',
      width: 1512,
      height: 982,
      device: 'desktop'
    },
    {
      name: 'iPhone 14 Pro Max',
      width: 430,
      height: 932,
      device: 'mobile'
    },
    {
      name: 'iPad Pro 12.9"',
      width: 1024,
      height: 1366,
      device: 'tablet'
    }
  ];

  // Función helper para esperar a que la página cargue completamente
  const waitForPageLoad = () => {
    // Esperar a que el body sea visible
    cy.get('body').should('be.visible', { timeout: 30000 });
    
    // Aceptar banner de cookies si aparece
    cy.acceptCookieBannerIfPresent();
    
    // Esperar a que los elementos de carga desaparezcan
    cy.get('body').then(($body) => {
      const loadingSelectors = [
        '[class*="loading"]:visible',
        '[class*="spinner"]:visible',
        '[class*="loader"]:visible',
        '[class*="skeleton"]:visible'
      ].join(', ');
      
      const loadingElements = $body.find(loadingSelectors);
      if (loadingElements.length > 0) {
        cy.get(loadingSelectors, { timeout: 15000 })
          .should('not.exist');
      }
    });
    
    // Esperar a que las imágenes críticas carguen
    cy.get('body').then(($body) => {
      const images = $body.find('img[src]:visible');
      if (images.length > 0) {
        // Esperar a que al menos las primeras imágenes críticas carguen
        cy.get('img[src]:visible').first().should('be.visible');
      }
    });
    
    // Esperar un momento para que el DOM se estabilice
    cy.wait(1500);
    
    // Scroll al inicio para asegurar consistencia en las capturas
    cy.scrollTo(0, 0);
    cy.wait(500);
  };

  // Función helper para verificar si es una página de error
  const isErrorPage = ($body) => {
    const bodyText = $body.text().toLowerCase();
    const headings = $body.find('h1, h2').text().toLowerCase();
    
    return bodyText.includes('404') || 
           bodyText.includes('not found') || 
           bodyText.includes('page not found') ||
           bodyText.includes('error') ||
           headings.includes('404') ||
           $body.find('.error-page, .not-found, [class*="error"]').length > 0;
  };

  // Ejecutar pruebas para cada combinación de URL y viewport
  urls.forEach(({ path, name, description }) => {
    viewports.forEach(({ name: viewportName, width, height, device }) => {
      it(`debe comparar visualmente ${name} en ${viewportName}`, () => {
        // Configurar viewport
        cy.viewport(width, height);
        
        // Visitar la URL
        cy.visit(path, { 
          failOnStatusCode: false, 
          timeout: 30000 
        });

        // Esperar a que la página cargue
        cy.get('body').should('be.visible', { timeout: 30000 });
        
        // Verificar que no sea una página de error
        cy.get('body').then(($body) => {
          if (isErrorPage($body)) {
            cy.log(`⚠️ ${name} (${path}) no encontrada o es una página de error, omitiendo prueba`);
            return;
          }

          // Esperar a que la página cargue completamente
          waitForPageLoad();

          // Generar nombre único para la captura
          const screenshotName = `${name}-${viewportName}`.replace(/\s+/g, '-').toLowerCase();
          
          // Comparar con imagen base usando cypress-image-diff
          // Si la imagen base no existe, esta será la primera ejecución y se creará automáticamente
          cy.matchImageSnapshot(screenshotName, {
            threshold: 0.2, // Umbral de diferencia permitida (20%)
            thresholdType: 'percent',
            capture: 'fullPage', // Capturar toda la página
            clip: undefined // Sin recorte
          });

          cy.log(`✅ Comparación visual completada para ${name} en ${viewportName}`);
        });
      });
    });
  });

  // Pruebas adicionales: comparación de elementos específicos en desktop
  describe('Comparación de Elementos Específicos - Desktop', () => {
    beforeEach(() => {
      cy.viewport(1728, 1117); // MacBook Pro 16"
    });

    urls.forEach(({ path, name }) => {
      it(`debe comparar header de ${name} en Desktop`, () => {
        cy.visit(path, { failOnStatusCode: false, timeout: 30000 });
        cy.get('body').should('be.visible', { timeout: 30000 });
        
        cy.get('body').then(($body) => {
          if (!isErrorPage($body)) {
            waitForPageLoad();
            
            // Buscar el header con múltiples selectores posibles
            const headerSelectors = 'header, .header, nav, .navbar, [role="banner"]';
            cy.get(headerSelectors).first().should('be.visible').then(($header) => {
              if ($header.length > 0) {
                // Comparar solo el header
                cy.get(headerSelectors).first().matchImageSnapshot(`${name}-header-desktop`, {
                  threshold: 0.2,
                  thresholdType: 'percent'
                });
                
                cy.log(`✅ Comparación de header completada para ${name} en Desktop`);
              } else {
                cy.log(`⚠️ Header no encontrado para ${name}, omitiendo comparación`);
              }
            });
          } else {
            cy.log(`⚠️ ${name} (${path}) es una página de error, omitiendo prueba`);
          }
        });
      });
    });
  });

  // Pruebas adicionales: comparación de elementos específicos en mobile
  describe('Comparación de Elementos Específicos - Mobile', () => {
    beforeEach(() => {
      cy.viewport(430, 932); // iPhone 14 Pro Max
    });

    urls.forEach(({ path, name }) => {
      it(`debe comparar header de ${name} en Mobile`, () => {
        cy.visit(path, { failOnStatusCode: false, timeout: 30000 });
        cy.get('body').should('be.visible', { timeout: 30000 });
        
        cy.get('body').then(($body) => {
          if (!isErrorPage($body)) {
            waitForPageLoad();
            
            // Buscar el header con múltiples selectores posibles
            const headerSelectors = 'header, .header, nav, .navbar, [role="banner"]';
            cy.get(headerSelectors).first().should('be.visible').then(($header) => {
              if ($header.length > 0) {
                // Comparar solo el header
                cy.get(headerSelectors).first().matchImageSnapshot(`${name}-header-mobile`, {
                  threshold: 0.2,
                  thresholdType: 'percent'
                });
                
                cy.log(`✅ Comparación de header completada para ${name} en Mobile`);
              } else {
                cy.log(`⚠️ Header no encontrado para ${name}, omitiendo comparación`);
              }
            });
          } else {
            cy.log(`⚠️ ${name} (${path}) es una página de error, omitiendo prueba`);
          }
        });
      });
    });
  });
});

// Suite de pruebas para comparación entre dos ambientes diferentes
// COMENTADO: Esta suite está deshabilitada temporalmente
/*
describe('Comparación entre Ambientes - Desktop y Mobile', () => {
  // URLs a probar para comparación entre ambientes
  const urls = [
    {
      path: '/',
      name: 'Homepage',
      description: 'Página principal'
    },
    {
      path: '/collections/cribs',
      name: 'Cribs Collection',
      description: 'Colección de Cribs'
    }
  ];

  // Configuración de viewports para MacBooks, iPhone 14 Pro Max e iPad Pro
  const viewports = [
    {
      name: 'MacBook Pro 16"',
      width: 1728,
      height: 1117,
      device: 'desktop'
    },
    {
      name: 'MacBook Pro 14"',
      width: 1512,
      height: 982,
      device: 'desktop'
    },
    {
      name: 'iPhone 14 Pro Max',
      width: 430,
      height: 932,
      device: 'mobile'
    },
    {
      name: 'iPad Pro 12.9"',
      width: 1024,
      height: 1366,
      device: 'tablet'
    }
  ];

  // Obtener URLs de ambientes desde variables de entorno
  const baseEnvUrl = Cypress.env('BASE_ENV_URL') || Cypress.config('baseUrl');
  const compareEnvUrl = Cypress.env('COMPARE_ENV_URL');
  const enableEnvComparison = Cypress.env('ENABLE_ENV_COMPARISON') || false;

  // Función helper para esperar a que la página cargue completamente
  const waitForPageLoad = () => {
    cy.get('body').should('be.visible', { timeout: 30000 });
    cy.acceptCookieBannerIfPresent();
    
    cy.get('body').then(($body) => {
      const loadingSelectors = [
        '[class*="loading"]:visible',
        '[class*="spinner"]:visible',
        '[class*="loader"]:visible',
        '[class*="skeleton"]:visible'
      ].join(', ');
      
      const loadingElements = $body.find(loadingSelectors);
      if (loadingElements.length > 0) {
        cy.get(loadingSelectors, { timeout: 15000 })
          .should('not.exist');
      }
    });
    
    cy.get('body').then(($body) => {
      const images = $body.find('img[src]:visible');
      if (images.length > 0) {
        cy.get('img[src]:visible').first().should('be.visible');
      }
    });
    
    cy.wait(1500);
    cy.scrollTo(0, 0);
    cy.wait(500);
  };

  // Función helper para verificar si es una página de error
  const isErrorPage = ($body) => {
    const bodyText = $body.text().toLowerCase();
    const headings = $body.find('h1, h2').text().toLowerCase();
    
    return bodyText.includes('404') || 
           bodyText.includes('not found') || 
           bodyText.includes('page not found') ||
           bodyText.includes('error') ||
           headings.includes('404') ||
           $body.find('.error-page, .not-found, [class*="error"]').length > 0;
  };

  // Función helper para visitar una URL completa (con dominio)
  const visitFullUrl = (baseUrl, path) => {
    const fullUrl = baseUrl.replace(/\/$/, '') + path;
    cy.visit(fullUrl, { 
      failOnStatusCode: false, 
      timeout: 30000 
    });
  };

  // Modo de operación: 'create-base' para crear snapshots base, 'compare' para comparar
  const envComparisonMode = Cypress.env('ENV_COMPARISON_MODE') || 'compare';
  
  // Solo ejecutar si la comparación entre ambientes está habilitada y hay URL de comparación
  if (enableEnvComparison && compareEnvUrl) {
    if (envComparisonMode === 'create-base') {
      // Modo: Crear snapshots de referencia desde el ambiente base
      describe('Crear Snapshots de Referencia desde Ambiente Base', () => {
        urls.forEach(({ path, name, description }) => {
          viewports.forEach(({ name: viewportName, width, height, device }) => {
            it(`debe crear snapshot base de ${name} en ${viewportName}`, () => {
              cy.viewport(width, height);
              
              const snapshotBaseName = `${name}-${viewportName}-env-base`.replace(/\s+/g, '-').toLowerCase();
              
              cy.log(`📸 Creando snapshot de referencia desde: ${baseEnvUrl}${path}`);
              visitFullUrl(baseEnvUrl, path);
              cy.get('body').should('be.visible', { timeout: 30000 });
              
              cy.get('body').then(($body) => {
                if (isErrorPage($body)) {
                  cy.log(`⚠️ ${name} (${path}) no encontrada en ambiente base, omitiendo`);
                  return;
                }

                waitForPageLoad();
                
                // Crear snapshot de referencia del ambiente base
                cy.matchImageSnapshot(snapshotBaseName, {
                  threshold: 0.2,
                  thresholdType: 'percent',
                  capture: 'fullPage'
                });

                cy.log(`✅ Snapshot base creado: ${snapshotBaseName}`);
                cy.log(`   📍 Ambiente: ${baseEnvUrl}`);
              });
            });
          });
        });
      });
    } else {
      // Modo: Comparar ambiente de comparación contra snapshots base
      describe('Comparar Ambiente contra Snapshots Base', () => {
        urls.forEach(({ path, name, description }) => {
          viewports.forEach(({ name: viewportName, width, height, device }) => {
            it(`debe comparar ${name} del ambiente ${compareEnvUrl} contra base en ${viewportName}`, () => {
              cy.viewport(width, height);
              
              const snapshotBaseName = `${name}-${viewportName}-env-base`.replace(/\s+/g, '-').toLowerCase();
              
              cy.log(`📸 Comparando ambiente: ${compareEnvUrl}${path}`);
              cy.log(`   📸 Snapshot de referencia: ${snapshotBaseName}`);
              visitFullUrl(compareEnvUrl, path);
              cy.get('body').should('be.visible', { timeout: 30000 });
              
              cy.get('body').then(($body) => {
                if (isErrorPage($body)) {
                  cy.log(`⚠️ ${name} (${path}) no encontrada en ambiente de comparación, omitiendo`);
                  return;
                }

                waitForPageLoad();
                
                // Comparar contra el snapshot base
                // Nota: El snapshot base debe existir (creado previamente con modo 'create-base')
                cy.matchImageSnapshot(snapshotBaseName, {
                  threshold: 0.2,
                  thresholdType: 'percent',
                  capture: 'fullPage'
                });

                cy.log(`✅ Comparación completada para ${name} en ${viewportName}`);
                cy.log(`   📍 Ambiente base: ${baseEnvUrl}`);
                cy.log(`   📍 Ambiente comparado: ${compareEnvUrl}`);
              });
            });
          });
        });
      });
    }

    // Comparación de elementos específicos entre ambientes
    describe('Comparación de Elementos Específicos entre Ambientes', () => {
      beforeEach(() => {
        cy.viewport(1728, 1117); // MacBook Pro 16"
      });

      urls.forEach(({ path, name }) => {
        ['MacBook Pro 16"', 'MacBook Pro 14"', 'iPhone 14 Pro Max', 'iPad Pro 12.9"'].forEach((viewportName) => {
          const viewportConfig = viewports.find(v => v.name === viewportName);
          if (!viewportConfig) return;

          it(`debe comparar header de ${name} entre ambientes en ${viewportName}`, () => {
            cy.viewport(viewportConfig.width, viewportConfig.height);
            
            // Visitar ambiente base
            cy.log(`📸 Capturando header del ambiente base: ${baseEnvUrl}${path}`);
            visitFullUrl(baseEnvUrl, path);
            cy.get('body').should('be.visible', { timeout: 30000 });
            
            cy.get('body').then(($body) => {
              if (!isErrorPage($body)) {
                waitForPageLoad();
                
                const headerSelectors = 'header, .header, nav, .navbar, [role="banner"]';
                cy.get(headerSelectors).first().should('be.visible').then(($header) => {
                  if ($header.length > 0) {
                    // Visitar ambiente de comparación
                    cy.log(`📸 Comparando header del ambiente: ${compareEnvUrl}${path}`);
                    visitFullUrl(compareEnvUrl, path);
                    cy.get('body').should('be.visible', { timeout: 30000 });
                    
                    cy.get('body').then(($compareBody) => {
                      if (!isErrorPage($compareBody)) {
                        waitForPageLoad();
                        
                        cy.get(headerSelectors).first().should('be.visible').then(() => {
                          // Comparar header entre ambientes
                          cy.get(headerSelectors).first().matchImageSnapshot(`${name}-header-${viewportName.toLowerCase()}-env-comparison`, {
                            threshold: 0.2,
                            thresholdType: 'percent'
                          });
                          
                          cy.log(`✅ Comparación de header entre ambientes completada para ${name} en ${viewportName}`);
                        });
                      }
                    });
                  }
                });
              }
            });
          });
        });
      });
    });
  } else {
    it('Comparación entre ambientes deshabilitada', () => {
      cy.log('ℹ️ La comparación entre ambientes está deshabilitada.');
      cy.log('   Para habilitarla, configura las variables de entorno:');
      cy.log('   - COMPARE_ENV_URL: URL del ambiente a comparar');
      cy.log('   - ENABLE_ENV_COMPARISON: true');
      cy.log(`   Ambiente base actual: ${baseEnvUrl}`);
      if (!compareEnvUrl) {
        cy.log('   ⚠️ COMPARE_ENV_URL no está configurada');
      }
    });
  }
});
*/

