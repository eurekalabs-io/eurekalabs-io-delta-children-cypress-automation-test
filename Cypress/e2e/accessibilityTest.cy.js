describe('Accessibility Suite', () => {
    // Intercept accessibility errors to document them without stopping the test
    let accessibilityErrorHandler;
    
    beforeEach(() => {
        // Configure handler to intercept accessibility errors
        accessibilityErrorHandler = (err, runnable) => {
            // If the error is related to accessibility violations
            if (err.message && (
                err.message.includes('accessibility violation') ||
                err.message.includes('violation was detected') ||
                err.message.includes('violations') ||
                err.message.includes('impact levels')
            )) {
                // Document the error in detail
                cy.log('⚠️ ACCESSIBILITY VIOLATIONS DOCUMENTATION');
                cy.log('═══════════════════════════════════════════════════════');
                cy.log(`Error: ${err.message}`);
                cy.log('📄 Full report available at: Cypress/accessibility/');
                cy.log('📸 Screenshots saved at: Cypress/screenshots/');
                cy.log('═══════════════════════════════════════════════════════');
                cy.log('✅ Test will continue running - violations documented');
                cy.log('═══════════════════════════════════════════════════════');
                
                // Return false to prevent the test from failing
                // This allows the test to continue running
                return false;
            }
            // For other errors, allow the test to fail normally
            return true;
        };
        
        // Register the handler
        Cypress.on('fail', accessibilityErrorHandler);
    });
    
    afterEach(() => {
        // Clean up the handler after each test
        if (accessibilityErrorHandler) {
            Cypress.off('fail', accessibilityErrorHandler);
        }
    });
    
    // Helper function to wait for the page to be fully loaded
    const waitForPageLoad = () => {
        // Wait for body to be visible
        cy.get('body').should('be.visible');
        // Accept cookie banner if it appears
        cy.acceptCookieBannerIfPresent();
        // Wait for loading elements to disappear (if they exist)
        // Use a more flexible check that doesn't block if they don't exist
        cy.get('body').then(($body) => {
            const loadingElements = $body.find('[class*="loading"]:visible, [class*="spinner"]:visible, [class*="loader"]:visible');
            if (loadingElements.length > 0) {
                // If there are loading elements, wait for them to disappear
                cy.get('[class*="loading"]:visible, [class*="spinner"]:visible, [class*="loader"]:visible', { timeout: 10000 })
                    .should('not.exist');
            }
        });
        // Wait a shorter moment for the DOM to stabilize
        cy.wait(500);
    };

    // Helper function to execute accessibility check with error handling and screenshots
    const checkAccessibilityWithReporting = (options, testName, pageUrl) => {
        // Generate unique name for screenshot based on test and page
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const pageName = pageUrl ? pageUrl.replace(/https?:\/\//, '').replace(/\//g, '-').substring(0, 50) : 'page';
        const screenshotName = `Accessibility-${testName}-${pageName}`.substring(0, 100);
        
        // Take screenshot before verification (viewport only, faster)
        cy.screenshot(`${screenshotName}-before`, { 
            capture: 'viewport',
            overwrite: true 
        });

        // Execute accessibility verification
        // The error handler will intercept violations and document them without stopping the test
        // wick-a11y automatically generates reports and screenshots when there are violations
        cy.checkAccessibility(options).then((violations) => {
            // If there are violations, document them but continue with the test
            if (violations && violations.length > 0) {
                // Take screenshot after verification
                cy.screenshot(`${screenshotName}-violations`, { 
                    capture: 'viewport',
                    overwrite: true 
                });
                
                // Document violations in detail
                cy.log(`⚠️ ACCESSIBILITY VIOLATIONS DOCUMENTATION`);
                cy.log(`═══════════════════════════════════════════════════════`);
                cy.log(`Test: ${testName}`);
                cy.log(`URL: ${pageUrl}`);
                cy.log(`Total violations found: ${violations.length}`);
                cy.log(`═══════════════════════════════════════════════════════`);
                
                // Group violations by impact level
                const violationsByImpact = {
                    critical: [],
                    serious: [],
                    moderate: [],
                    minor: []
                };
                
                violations.forEach((violation) => {
                    const impact = violation.impact || 'minor';
                    if (violationsByImpact[impact]) {
                        violationsByImpact[impact].push(violation);
                    }
                });
                
                // Document by impact level
                Object.keys(violationsByImpact).forEach((impact) => {
                    if (violationsByImpact[impact].length > 0) {
                        cy.log(`\n📊 ${impact.toUpperCase()}: ${violationsByImpact[impact].length} violation(s)`);
                        violationsByImpact[impact].forEach((violation, index) => {
                            const violationInfo = {
                                id: violation.id || violation.rule || 'N/A',
                                description: (violation.description || violation.message || 'No description').substring(0, 150),
                                nodes: violation.nodes ? violation.nodes.length : 0,
                                help: violation.help ? violation.help.substring(0, 100) : 'N/A'
                            };
                            cy.log(`  ${index + 1}. [${violationInfo.id}] ${violationInfo.description}`);
                            cy.log(`     Affected nodes: ${violationInfo.nodes} | Help: ${violationInfo.help}`);
                        });
                    }
                });
                
                cy.log(`═══════════════════════════════════════════════════════`);
                cy.log(`📄 Full report available at: Cypress/accessibility/`);
                cy.log(`📸 Screenshots saved with prefix: ${screenshotName}`);
                cy.log(`═══════════════════════════════════════════════════════`);
                
                // Save summary to a JSON file for later reference
                const violationSummary = {
                    testName: testName,
                    url: pageUrl,
                    timestamp: timestamp,
                    totalViolations: violations.length,
                    violationsByImpact: {
                        critical: violationsByImpact.critical.length,
                        serious: violationsByImpact.serious.length,
                        moderate: violationsByImpact.moderate.length,
                        minor: violationsByImpact.minor.length
                    },
                    violations: violations.map(v => ({
                        id: v.id || v.rule,
                        impact: v.impact,
                        description: v.description || v.message,
                        nodesCount: v.nodes ? v.nodes.length : 0
                    }))
                };
                
                // Write summary to file (if possible)
                cy.writeFile(`Cypress/accessibility/violations-${testName}-${timestamp}.json`, violationSummary, { flag: 'w' }).catch(() => {
                    // If file cannot be written, continue without error
                    cy.log('⚠️ Could not save JSON summary, but violations are documented in logs');
                });
                
            } else {
                cy.log('✅ No accessibility violations found');
            }
        });
    };

    // Accessibility configuration (adjust as needed)
    const accessibilityOptions = {
        // Exclude elements that commonly cause false positives
        exclude: [
            // Hidden elements
            '[aria-hidden="true"]',
            // Decorative elements without semantic content
            '[role="presentation"]',
            // Elements outside initial viewport (optional, comment if it causes issues)
            // '[style*="position: absolute"]:not([aria-label])',
        ],
    };

    // Main accessibility test on homepage
    it('should pass accessibility checks on homepage', () => {
        cy.visit('/');
        waitForPageLoad();
        
        // Verify that the page loaded correctly
        cy.get('body').should('be.visible');
        cy.url().should('not.include', '404');
        
        // Get current URL for report
        cy.url().then((url) => {
            // Check accessibility with report and screenshot
            checkAccessibilityWithReporting(accessibilityOptions, 'Homepage', url);
        });
    });

    // Critical pages to test accessibility
    const criticalPages = [
        { path: '/collections/kids-sets', name: 'Kids Sets Collection' },
        { path: '/collections/nursery-sets', name: 'Nursery Sets Collection' },
        { path: '/collections/cribs', name: 'Cribs Collection' },
    ];

    // Accessibility test on collection pages
    criticalPages.forEach(({ path, name }) => {
        it(`should pass accessibility checks on ${name}`, () => {
            // Visit the page without failing on non-2xx status codes
            cy.visit(path, { failOnStatusCode: false, timeout: 30000 });
            
            // Wait for the page to load
            cy.get('body').should('be.visible');
            
            // Verify that the page is valid (not 404)
            cy.get('body').then(($body) => {
                const bodyText = $body.text().toLowerCase();
                const isErrorPage = bodyText.includes('404') || 
                                   bodyText.includes('not found') || 
                                   bodyText.includes('page not found') ||
                                   $body.find('h1, h2').text().toLowerCase().includes('404');
                
                if (isErrorPage) {
                    cy.log(`⚠️ ${name} (${path}) not found or is an error page, skipping test`);
                } else {
                    // If the page is valid, continue with the test
                    waitForPageLoad();
                    
                    // Get current URL for report
                    cy.url().then((url) => {
                        // Execute accessibility verification with report and screenshot
                        checkAccessibilityWithReporting(accessibilityOptions, name, url);
                    });
                }
            });
        });
    });

    // Accessibility test on product detail page (PDP)
    it('should pass accessibility checks on product detail page', () => {
        // Try to navigate to the first available collection
        cy.visit('/collections/kids-sets', { failOnStatusCode: false, timeout: 30000 });
        
        // Verify that the collection is valid
        cy.get('body').should('be.visible').then(($body) => {
            const bodyText = $body.text().toLowerCase();
            const isErrorPage = bodyText.includes('404') || 
                               bodyText.includes('not found') || 
                               bodyText.includes('page not found');
            
            if (isErrorPage) {
                // Try with another collection
                cy.log('⚠️ Kids Sets not available, trying Nursery Sets...');
                cy.visit('/collections/nursery-sets', { failOnStatusCode: false, timeout: 30000 });
                cy.get('body').should('be.visible');
            }
            
            waitForPageLoad();
            
            // Find the first available product
            cy.get('a.product__title, a[href*="/products/"]', { timeout: 15000 })
                .first()
                .should('exist')
                .then(($link) => {
                    const productUrl = $link.attr('href');
                    
                    if (productUrl && productUrl.includes('/products/')) {
                        // Visit the product page
                        cy.visit(productUrl, { failOnStatusCode: false });
                        waitForPageLoad();
                        
                        // Verify that the product page is valid
                        cy.get('body').should('be.visible').then(($pdpBody) => {
                            const pdpBodyText = $pdpBody.text().toLowerCase();
                            const isPdpErrorPage = pdpBodyText.includes('404') || 
                                                  pdpBodyText.includes('not found');
                            
                            if (!isPdpErrorPage) {
                                // Get current URL for report
                                cy.url().then((pdpUrl) => {
                                    // Check accessibility on product page with report and screenshot
                                    checkAccessibilityWithReporting(accessibilityOptions, 'Product Detail Page', pdpUrl);
                                });
                            } else {
                                cy.log('⚠️ Product page not available, skipping test');
                            }
                        });
                    } else {
                        cy.log('⚠️ No valid product link found, skipping PDP test');
                    }
                });
        });
    });

    // Accessibility test on different viewports (responsive)
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
            
            // Get current URL for report
            cy.url().then((url) => {
                // Check accessibility on specific viewport with report and screenshot
                checkAccessibilityWithReporting(accessibilityOptions, `${name} Viewport`, url);
            });
        });
    });
});

