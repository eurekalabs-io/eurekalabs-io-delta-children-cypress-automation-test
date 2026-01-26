/// <reference types="cypress" />

describe('Visual Regression - Desktop and Mobile', () => {
  // URLs to test for visual regression
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

  // Viewport configuration for MacBooks, iPhone 14 Pro Max and iPad Pro
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

  // Helper function to wait for page to load completely
  const waitForPageLoad = () => {
    // Wait for body to be visible
    cy.get('body').should('be.visible', { timeout: 30000 });
    
    // Accept cookie banner if present
    cy.acceptCookieBannerIfPresent();
    
    // Wait for loading elements to disappear
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
    
    // Wait for critical images to load
    cy.get('body').then(($body) => {
      const images = $body.find('img[src]:visible');
      if (images.length > 0) {
        // Wait for at least the first critical images to load
        cy.get('img[src]:visible').first().should('be.visible');
      }
    });
    
    // Wait a moment for the DOM to stabilize
    cy.wait(1500);
    
    // Scroll to top to ensure consistency in captures
    cy.scrollTo(0, 0);
    cy.wait(500);
  };

  // Helper function to check if it's an error page
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

  // Run tests for each combination of URL and viewport
  urls.forEach(({ path, name, description }) => {
    viewports.forEach(({ name: viewportName, width, height, device }) => {
      it(`should visually compare ${name} on ${viewportName}`, () => {
        // Set viewport
        cy.viewport(width, height);
        
        // Visit the URL
        cy.visit(path, { 
          failOnStatusCode: false, 
          timeout: 30000 
        });

        // Wait for page to load
        cy.get('body').should('be.visible', { timeout: 30000 });
        
        // Verify it's not an error page
        cy.get('body').then(($body) => {
          if (isErrorPage($body)) {
            cy.log(`⚠️ ${name} (${path}) not found or is an error page, skipping test`);
            return;
          }

          // Wait for page to load completely
          waitForPageLoad();

          // Generate unique name for capture
          const screenshotName = `${name}-${viewportName}`.replace(/\s+/g, '-').toLowerCase();
          
          // Compare with base image using cypress-image-diff
          // If base image doesn't exist, this will be the first run and it will be created automatically
          cy.matchImageSnapshot(screenshotName, {
            threshold: 0.2, // Allowed difference threshold (20%)
            thresholdType: 'percent',
            capture: 'fullPage', // Capture entire page
            clip: undefined // No clipping
          });

          cy.log(`✅ Visual comparison completed for ${name} on ${viewportName}`);
        });
      });
    });
  });

  // Additional tests: specific element comparison on desktop
  describe('Specific Element Comparison - Desktop', () => {
    beforeEach(() => {
      cy.viewport(1728, 1117); // MacBook Pro 16"
    });

    urls.forEach(({ path, name }) => {
      it(`should compare header of ${name} on Desktop`, () => {
        cy.visit(path, { failOnStatusCode: false, timeout: 30000 });
        cy.get('body').should('be.visible', { timeout: 30000 });
        
        cy.get('body').then(($body) => {
          if (!isErrorPage($body)) {
            waitForPageLoad();
            
            // Search for header with multiple possible selectors
            const headerSelectors = 'header, .header, nav, .navbar, [role="banner"]';
            cy.get(headerSelectors).first().should('be.visible').then(($header) => {
              if ($header.length > 0) {
                // Compare only the header
                cy.get(headerSelectors).first().matchImageSnapshot(`${name}-header-desktop`, {
                  threshold: 0.2,
                  thresholdType: 'percent'
                });
                
                cy.log(`✅ Header comparison completed for ${name} on Desktop`);
              } else {
                cy.log(`⚠️ Header not found for ${name}, skipping comparison`);
              }
            });
          } else {
            cy.log(`⚠️ ${name} (${path}) is an error page, skipping test`);
          }
        });
      });
    });
  });

  // Additional tests: specific element comparison on mobile
  describe('Specific Element Comparison - Mobile', () => {
    beforeEach(() => {
      cy.viewport(430, 932); // iPhone 14 Pro Max
    });

    urls.forEach(({ path, name }) => {
      it(`should compare header of ${name} on Mobile`, () => {
        cy.visit(path, { failOnStatusCode: false, timeout: 30000 });
        cy.get('body').should('be.visible', { timeout: 30000 });
        
        cy.get('body').then(($body) => {
          if (!isErrorPage($body)) {
            waitForPageLoad();
            
            // Search for header with multiple possible selectors
            const headerSelectors = 'header, .header, nav, .navbar, [role="banner"]';
            cy.get(headerSelectors).first().should('be.visible').then(($header) => {
              if ($header.length > 0) {
                // Compare only the header
                cy.get(headerSelectors).first().matchImageSnapshot(`${name}-header-mobile`, {
                  threshold: 0.2,
                  thresholdType: 'percent'
                });
                
                cy.log(`✅ Header comparison completed for ${name} on Mobile`);
              } else {
                cy.log(`⚠️ Header not found for ${name}, skipping comparison`);
              }
            });
          } else {
            cy.log(`⚠️ ${name} (${path}) is an error page, skipping test`);
          }
        });
      });
    });
  });
});

// Test suite for comparison between two different environments
// COMMENTED: This suite is temporarily disabled
/*
describe('Environment Comparison - Desktop and Mobile', () => {
  // URLs to test for environment comparison
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
    }
  ];

  // Viewport configuration for MacBooks, iPhone 14 Pro Max and iPad Pro
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

  // Get environment URLs from environment variables
  const baseEnvUrl = Cypress.env('BASE_ENV_URL') || Cypress.config('baseUrl');
  const compareEnvUrl = Cypress.env('COMPARE_ENV_URL');
  const enableEnvComparison = Cypress.env('ENABLE_ENV_COMPARISON') || false;

  // Helper function to wait for page to load completely
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

  // Helper function to check if it's an error page
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

  // Helper function to visit a full URL (with domain)
  const visitFullUrl = (baseUrl, path) => {
    const fullUrl = baseUrl.replace(/\/$/, '') + path;
    cy.visit(fullUrl, { 
      failOnStatusCode: false, 
      timeout: 30000 
    });
  };

  // Operation mode: 'create-base' to create base snapshots, 'compare' to compare
  const envComparisonMode = Cypress.env('ENV_COMPARISON_MODE') || 'compare';
  
  // Only run if environment comparison is enabled and there's a comparison URL
  if (enableEnvComparison && compareEnvUrl) {
    if (envComparisonMode === 'create-base') {
      // Mode: Create reference snapshots from base environment
      describe('Create Reference Snapshots from Base Environment', () => {
        urls.forEach(({ path, name, description }) => {
          viewports.forEach(({ name: viewportName, width, height, device }) => {
            it(`should create base snapshot of ${name} on ${viewportName}`, () => {
              cy.viewport(width, height);
              
              const snapshotBaseName = `${name}-${viewportName}-env-base`.replace(/\s+/g, '-').toLowerCase();
              
              cy.log(`📸 Creating reference snapshot from: ${baseEnvUrl}${path}`);
              visitFullUrl(baseEnvUrl, path);
              cy.get('body').should('be.visible', { timeout: 30000 });
              
              cy.get('body').then(($body) => {
                if (isErrorPage($body)) {
                  cy.log(`⚠️ ${name} (${path}) not found in base environment, skipping`);
                  return;
                }

                waitForPageLoad();
                
                // Create reference snapshot from base environment
                cy.matchImageSnapshot(snapshotBaseName, {
                  threshold: 0.2,
                  thresholdType: 'percent',
                  capture: 'fullPage'
                });

                cy.log(`✅ Base snapshot created: ${snapshotBaseName}`);
                cy.log(`   📍 Environment: ${baseEnvUrl}`);
              });
            });
          });
        });
      });
    } else {
      // Mode: Compare comparison environment against base snapshots
      describe('Compare Environment against Base Snapshots', () => {
        urls.forEach(({ path, name, description }) => {
          viewports.forEach(({ name: viewportName, width, height, device }) => {
            it(`should compare ${name} from environment ${compareEnvUrl} against base on ${viewportName}`, () => {
              cy.viewport(width, height);
              
              const snapshotBaseName = `${name}-${viewportName}-env-base`.replace(/\s+/g, '-').toLowerCase();
              
              cy.log(`📸 Comparing environment: ${compareEnvUrl}${path}`);
              cy.log(`   📸 Reference snapshot: ${snapshotBaseName}`);
              visitFullUrl(compareEnvUrl, path);
              cy.get('body').should('be.visible', { timeout: 30000 });
              
              cy.get('body').then(($body) => {
                if (isErrorPage($body)) {
                  cy.log(`⚠️ ${name} (${path}) not found in comparison environment, skipping`);
                  return;
                }

                waitForPageLoad();
                
                // Compare against base snapshot
                // Note: Base snapshot must exist (created previously with 'create-base' mode)
                cy.matchImageSnapshot(snapshotBaseName, {
                  threshold: 0.2,
                  thresholdType: 'percent',
                  capture: 'fullPage'
                });

                cy.log(`✅ Comparison completed for ${name} on ${viewportName}`);
                cy.log(`   📍 Base environment: ${baseEnvUrl}`);
                cy.log(`   📍 Compared environment: ${compareEnvUrl}`);
              });
            });
          });
        });
      });
    }

    // Specific element comparison between environments
    describe('Specific Element Comparison between Environments', () => {
      beforeEach(() => {
        cy.viewport(1728, 1117); // MacBook Pro 16"
      });

      urls.forEach(({ path, name }) => {
        ['MacBook Pro 16"', 'MacBook Pro 14"', 'iPhone 14 Pro Max', 'iPad Pro 12.9"'].forEach((viewportName) => {
          const viewportConfig = viewports.find(v => v.name === viewportName);
          if (!viewportConfig) return;

          it(`should compare header of ${name} between environments on ${viewportName}`, () => {
            cy.viewport(viewportConfig.width, viewportConfig.height);
            
            // Visit base environment
            cy.log(`📸 Capturing header from base environment: ${baseEnvUrl}${path}`);
            visitFullUrl(baseEnvUrl, path);
            cy.get('body').should('be.visible', { timeout: 30000 });
            
            cy.get('body').then(($body) => {
              if (!isErrorPage($body)) {
                waitForPageLoad();
                
                const headerSelectors = 'header, .header, nav, .navbar, [role="banner"]';
                cy.get(headerSelectors).first().should('be.visible').then(($header) => {
                  if ($header.length > 0) {
                    // Visit comparison environment
                    cy.log(`📸 Comparing header from environment: ${compareEnvUrl}${path}`);
                    visitFullUrl(compareEnvUrl, path);
                    cy.get('body').should('be.visible', { timeout: 30000 });
                    
                    cy.get('body').then(($compareBody) => {
                      if (!isErrorPage($compareBody)) {
                        waitForPageLoad();
                        
                        cy.get(headerSelectors).first().should('be.visible').then(() => {
                          // Compare header between environments
                          cy.get(headerSelectors).first().matchImageSnapshot(`${name}-header-${viewportName.toLowerCase()}-env-comparison`, {
                            threshold: 0.2,
                            thresholdType: 'percent'
                          });
                          
                          cy.log(`✅ Header comparison between environments completed for ${name} on ${viewportName}`);
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
    it('Environment comparison disabled', () => {
      cy.log('ℹ️ Environment comparison is disabled.');
      cy.log('   To enable it, configure the environment variables:');
      cy.log('   - COMPARE_ENV_URL: URL of the environment to compare');
      cy.log('   - ENABLE_ENV_COMPARISON: true');
      cy.log(`   Current base environment: ${baseEnvUrl}`);
      if (!compareEnvUrl) {
        cy.log('   ⚠️ COMPARE_ENV_URL is not configured');
      }
    });
  }
});
*/

