describe('Accessibility Suite', () => {
    // Función helper para esperar a que la página esté completamente cargada
    const waitForPageLoad = () => {
        // Esperar a que el body esté visible
        cy.get('body').should('be.visible');
        // Esperar a que no haya indicadores de carga activos
        cy.get('[class*="loading"], [class*="spinner"], [class*="loader"]', { timeout: 10000 })
            .should('not.exist')
            .or('not.be.visible');
        // Esperar un momento para que se estabilice el DOM y las animaciones
        cy.wait(1500);
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
        
        // Verificar accesibilidad con configuración personalizada
        cy.checkAccessibility(accessibilityOptions);
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
            cy.visit(path);
            waitForPageLoad();
            
            // Verificar que la página cargó correctamente
            cy.get('body').should('be.visible');
            
            // Ejecutar verificación de accesibilidad
            cy.checkAccessibility(accessibilityOptions);
        });
    });

    // Test de accesibilidad en página de producto (PDP)
    it('should pass accessibility checks on product detail page', () => {
        // Navegar a una colección primero
        cy.visit('/collections/kids-sets');
        waitForPageLoad();
        
        // Buscar el primer producto disponible
        cy.get('a.product__title, a[href*="/products/"]', { timeout: 15000 })
            .first()
            .should('be.visible')
            .then(($link) => {
                const productUrl = $link.attr('href');
                
                if (productUrl && productUrl.includes('/products/')) {
                    // Visitar la página del producto
                    cy.visit(productUrl);
                    waitForPageLoad();
                    
                    // Verificar elementos clave de la página de producto
                    cy.get('body').should('be.visible');
                    
                    // Verificar accesibilidad en la página de producto
                    cy.checkAccessibility(accessibilityOptions);
                } else {
                    cy.log('⚠️ No se encontró enlace de producto válido, saltando test de PDP');
                }
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
            
            // Verificar accesibilidad en el viewport específico
            cy.checkAccessibility(accessibilityOptions);
        });
    });
});

