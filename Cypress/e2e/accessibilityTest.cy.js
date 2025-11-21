describe('Accessibility Suite', () => {
    // Función helper para esperar a que la página esté completamente cargada
    const waitForPageLoad = () => {
        // Esperar a que el body esté visible
        cy.get('body').should('be.visible');
        // Verificar que no haya indicadores de carga visibles
        // Si no existen, la verificación pasa automáticamente
        cy.get('[class*="loading"]:visible, [class*="spinner"]:visible, [class*="loader"]:visible', { timeout: 10000 })
            .should('not.exist');
        // Esperar un momento para que se estabilice el DOM y las animaciones
        cy.wait(1500);
    };

    // Función helper para ejecutar verificación de accesibilidad con manejo de errores y screenshots
    const checkAccessibilityWithReporting = (options, testName, pageUrl) => {
        // Generar nombre único para el screenshot basado en el test y la página
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const pageName = pageUrl ? pageUrl.replace(/https?:\/\//, '').replace(/\//g, '-') : 'page';
        const screenshotName = `Accessibility-${testName}-${pageName}-${timestamp}`;
        
        // Tomar screenshot antes de la verificación para tener contexto
        cy.screenshot(`${screenshotName}-before`, { 
            capture: 'fullPage',
            overwrite: true 
        });

        // Ejecutar verificación de accesibilidad con manejo de errores
        cy.checkAccessibility(options).then((violations) => {
            if (violations && violations.length > 0) {
                // Si hay violaciones, tomar screenshot después de la verificación
                cy.screenshot(`${screenshotName}-violations`, { 
                    capture: 'fullPage',
                    overwrite: true 
                });
                
                // Log detallado de las violaciones
                cy.log(`⚠️ Se encontraron ${violations.length} violación(es) de accesibilidad`);
                violations.forEach((violation, index) => {
                    cy.log(`Violación ${index + 1}: ${violation.id || violation.rule} - Impacto: ${violation.impact || 'N/A'} - ${violation.description || violation.message || 'Sin descripción'}`);
                });
                
                // Lanzar error para que el test falle y se genere el reporte completo
                throw new Error(`Se encontraron ${violations.length} violación(es) de accesibilidad. Ver reporte en Cypress/accessibility/`);
            } else {
                cy.log('✅ No se encontraron violaciones de accesibilidad');
            }
        }).catch((error) => {
            // Si hay un error o violaciones, tomar screenshot final para debugging
            cy.screenshot(`${screenshotName}-error`, { 
                capture: 'fullPage',
                overwrite: true 
            });
            
            // Log del error
            cy.log(`❌ Error o violaciones encontradas: ${error.message}`);
            
            // Re-lanzar el error para que el test falle y se genere el reporte
            throw error;
        });
    };

    // Configuración de accesibilidad (ajustar según necesidades)
    const accessibilityOptions = {
        // Excluir elementos que comúnmente causan falsos positivos
        exclude: [
            // Elementos ocultos
            '[aria-hidden="true"]',
            // Elementos decorativos sin contenido semántico
            '[role="presentation"]',
            // Elementos fuera del viewport inicial (opcional, comentar si causa problemas)
            // '[style*="position: absolute"]:not([aria-label])',
        ],
    };

    // Test principal de accesibilidad en homepage
    it('should pass accessibility checks on homepage', () => {
        cy.visit('/');
        waitForPageLoad();
        
        // Verificar que la página cargó correctamente
        cy.get('body').should('be.visible');
        cy.url().should('not.include', '404');
        
        // Obtener URL actual para el reporte
        cy.url().then((url) => {
            // Verificar accesibilidad con reporte y screenshot
            checkAccessibilityWithReporting(accessibilityOptions, 'Homepage', url);
        });
    });

    // Páginas críticas para probar accesibilidad
    const criticalPages = [
        { path: '/collections/kids-sets', name: 'Kids Sets Collection' },
        { path: '/collections/nursery-sets', name: 'Nursery Sets Collection' },
        { path: '/collections/cribs', name: 'Cribs Collection' },
    ];

    // Test de accesibilidad en páginas de colección
    criticalPages.forEach(({ path, name }) => {
        it(`should pass accessibility checks on ${name}`, () => {
            // Visitar la página sin fallar en códigos de estado no 2xx
            cy.visit(path, { failOnStatusCode: false, timeout: 30000 });
            
            // Esperar a que la página cargue
            cy.get('body').should('be.visible');
            
            // Verificar que la página es válida (no es 404)
            cy.get('body').then(($body) => {
                const bodyText = $body.text().toLowerCase();
                const isErrorPage = bodyText.includes('404') || 
                                   bodyText.includes('not found') || 
                                   bodyText.includes('page not found') ||
                                   $body.find('h1, h2').text().toLowerCase().includes('404');
                
                if (isErrorPage) {
                    cy.log(`⚠️ ${name} (${path}) no encontrada o es una página de error, saltando test`);
                } else {
                    // Si la página es válida, continuar con el test
                    waitForPageLoad();
                    
                    // Obtener URL actual para el reporte
                    cy.url().then((url) => {
                        // Ejecutar verificación de accesibilidad con reporte y screenshot
                        checkAccessibilityWithReporting(accessibilityOptions, name, url);
                    });
                }
            });
        });
    });

    // Test de accesibilidad en página de producto (PDP)
    it('should pass accessibility checks on product detail page', () => {
        // Intentar navegar a la primera colección disponible
        cy.visit('/collections/kids-sets', { failOnStatusCode: false, timeout: 30000 });
        
        // Verificar que la colección es válida
        cy.get('body').should('be.visible').then(($body) => {
            const bodyText = $body.text().toLowerCase();
            const isErrorPage = bodyText.includes('404') || 
                               bodyText.includes('not found') || 
                               bodyText.includes('page not found');
            
            if (isErrorPage) {
                // Intentar con otra colección
                cy.log('⚠️ Kids Sets no disponible, intentando Nursery Sets...');
                cy.visit('/collections/nursery-sets', { failOnStatusCode: false, timeout: 30000 });
                cy.get('body').should('be.visible');
            }
            
            waitForPageLoad();
            
            // Buscar el primer producto disponible
            cy.get('a.product__title, a[href*="/products/"]', { timeout: 15000 })
                .first()
                .should('exist')
                .then(($link) => {
                    const productUrl = $link.attr('href');
                    
                    if (productUrl && productUrl.includes('/products/')) {
                        // Visitar la página del producto
                        cy.visit(productUrl, { failOnStatusCode: false });
                        waitForPageLoad();
                        
                        // Verificar que la página de producto es válida
                        cy.get('body').should('be.visible').then(($pdpBody) => {
                            const pdpBodyText = $pdpBody.text().toLowerCase();
                            const isPdpErrorPage = pdpBodyText.includes('404') || 
                                                  pdpBodyText.includes('not found');
                            
                            if (!isPdpErrorPage) {
                                // Obtener URL actual para el reporte
                                cy.url().then((pdpUrl) => {
                                    // Verificar accesibilidad en la página de producto con reporte y screenshot
                                    checkAccessibilityWithReporting(accessibilityOptions, 'Product Detail Page', pdpUrl);
                                });
                            } else {
                                cy.log('⚠️ Página de producto no disponible, saltando test');
                            }
                        });
                    } else {
                        cy.log('⚠️ No se encontró enlace de producto válido, saltando test de PDP');
                    }
                });
        });
    });

    // Test de accesibilidad en diferentes viewports (responsive)
    const viewports = [
        { width: 375, height: 667, name: 'Mobile (iPhone)' },
        { width: 768, height: 1024, name: 'Tablet (iPad)' },
        { width: 1366, height: 768, name: 'Desktop' },
    ];

    viewports.forEach(({ width, height, name }) => {
        it(`should pass accessibility checks on ${name} viewport`, () => {
            cy.viewport(width, height);
            cy.visit('/');
            waitForPageLoad();
            
            // Obtener URL actual para el reporte
            cy.url().then((url) => {
                // Verificar accesibilidad en el viewport específico con reporte y screenshot
                checkAccessibilityWithReporting(accessibilityOptions, `${name} Viewport`, url);
            });
        });
    });
});

