# Automated Test Suite Description - Delta Children E-Commerce Platform

## Overview

This project contains a comprehensive automated testing framework for the Delta Children e-commerce website (https://www.deltachildren.com/). The test suite is built using Cypress, a modern end-to-end testing framework, and follows the Page Object Model (POM) pattern for maintainability and reusability.

The automated tests cover five main areas:
1. **Accessibility Testing** - Ensuring WCAG compliance and accessibility standards
2. **Visual Regression Testing** - Visual comparison and cross-environment testing
3. **Cribs Collection Testing** - Product variant selection and interaction testing
4. **Kids Sets Collection Testing** - Bundle creation and product selection workflows
5. **Nursery Sets Collection Testing** - Bundle creation and product selection workflows

---

## Test Suites

### 1. Accessibility Suite (`accessibilityTest.cy.js`)

**Purpose**: Validates that the website meets accessibility standards (WCAG 2 AA) and ensures the site is usable by people with disabilities.

**Test Coverage**:

- **Homepage Accessibility Check**
  - Verifies accessibility compliance on the main landing page
  - Checks for proper ARIA labels, color contrast, and semantic HTML structure
  - Captures screenshots before and after accessibility checks

- **Collection Pages Accessibility**
  - Tests accessibility on critical collection pages:
    - Kids Sets Collection (`/collections/kids-sets`)
    - Nursery Sets Collection (`/collections/nursery-sets`)
    - Cribs Collection (`/collections/cribs`)
  - Validates page structure and accessibility features for each collection

- **Product Detail Page (PDP) Accessibility**
  - Tests accessibility on product detail pages
  - Dynamically finds and tests the first available product from collections
  - Validates product page accessibility features

- **Responsive Viewport Testing**
  - Tests accessibility across different device viewports:
    - Mobile (iPhone): 375x667 pixels
    - Tablet (iPad): 768x1024 pixels
    - Desktop: 1366x768 pixels
  - Ensures accessibility compliance on all screen sizes

**Key Features**:
- Uses `wick-a11y` plugin for automated accessibility testing
- Documents violations without failing tests (non-blocking)
- Generates detailed violation reports with impact levels (Critical, Serious, Moderate, Minor)
- Saves accessibility violation reports as JSON files
- Captures screenshots for visual documentation
- Excludes false positives (hidden elements, decorative elements)

**Violation Reporting**:
- Groups violations by impact level
- Provides detailed information including:
  - Rule ID
  - Description
  - Affected nodes count
  - Help URLs for remediation
- Saves comprehensive reports to `Cypress/accessibility/` directory

---

### 2. Visual Regression Testing Suite (`regressionVisualTesting.cy.js`)

**Purpose**: Performs visual regression testing to detect visual changes and differences between environments, ensuring UI consistency across desktop and mobile viewports.

**Test Coverage**:

- **Full Page Visual Comparison**
  - Tests visual consistency for critical pages:
    - Homepage (`/`)
    - Cribs Collection (`/collections/cribs`)
  - Compares full page screenshots across different viewports:
    - Desktop: 1920x1080 pixels
    - Mobile: 375x667 pixels
  - Uses image snapshot comparison with configurable threshold (20% by default)

- **Element-Specific Visual Comparison**
  - Compares specific UI elements (headers) across viewports
  - Desktop header comparison
  - Mobile header comparison
  - Handles dynamic content and loading states

- **Cross-Environment Comparison**
  - Compares visual appearance between different environments (e.g., production vs staging)
  - Two-mode operation:
    - **Create Base Mode**: Creates reference snapshots from base environment
    - **Compare Mode**: Compares target environment against base snapshots
  - Supports comparing any two environments via configuration

**Key Features**:
- Uses `cypress-image-diff` plugin for automated visual comparison
- Automatic snapshot creation on first run
- Configurable difference threshold (percentage-based)
- Full page and element-specific comparisons
- Cross-environment visual validation
- Handles loading states and dynamic content
- Automatic cookie banner acceptance
- Error page detection and handling

**Configuration**:
- **Environment Variables**:
  - `BASE_ENV_URL`: Base environment URL (default: production)
  - `COMPARE_ENV_URL`: Environment to compare against base
  - `ENABLE_ENV_COMPARISON`: Enable/disable cross-environment comparison (enabled by default)
  - `ENV_COMPARISON_MODE`: Operation mode (`create-base` or `compare`)

**Visual Comparison Workflow**:
1. **Standard Regression Testing**: Compares current state against saved snapshots
2. **Cross-Environment Testing**:
   - Step 1: Create base snapshots from reference environment (`ENV_COMPARISON_MODE=create-base`)
   - Step 2: Compare target environment against base snapshots (`ENV_COMPARISON_MODE=compare`)

**Snapshot Management**:
- Snapshots are stored in `Cypress/snapshots/` directory
- Automatic snapshot creation on first test run
- Diff images generated when differences exceed threshold
- Failed comparisons saved with `-FAIL.png` suffix

**Execution Examples**:
```bash
# Standard visual regression testing
npm run cypress:run -- --spec "Cypress/e2e/regressionVisualTesting.cy.js"

# Create base snapshots from production
ENV_COMPARISON_MODE=create-base ENABLE_ENV_COMPARISON=true npm run cypress:run -- --spec "Cypress/e2e/regressionVisualTesting.cy.js"

# Compare staging against production snapshots
ENV_COMPARISON_MODE=compare ENABLE_ENV_COMPARISON=true COMPARE_ENV_URL=https://staging.deltachildren.com/ npm run cypress:run -- --spec "Cypress/e2e/regressionVisualTesting.cy.js"
```

---

### 3. Cribs Collection Suite (`Cribs.cy.js`)

**Purpose**: Tests product variant selection functionality for crib products, ensuring users can properly interact with product variants both on collection pages and product detail pages.

**Test Coverage**:

- **Variant Selection on Product Detail Page (PDP)**
  - Randomly selects up to 4 crib products from the collection page
  - Navigates to each product's detail page
  - Selects the second available variant on the PDP
  - Verifies variant selection functionality
  - Returns to collection page and repeats for multiple products
  - Ensures product grid reloads correctly between iterations

- **Variant Selection on Collection Grid**
  - Tests variant selection directly from the collection grid (without navigating to PDP)
  - Randomly selects up to 4 products with multiple swatches
  - Finds and selects the second swatch/variant in the grid view
  - Verifies product container visibility (handles CSS visibility: hidden)
  - Tests swatch selection functionality without page navigation

**Key Features**:
- Random product selection for broader test coverage
- Handles dynamic product loading and grid updates
- Robust error handling for DOM detachment issues
- Visibility checks to ensure elements are truly visible
- Automatic cookie banner acceptance
- Collection grid wait mechanisms

**Technical Implementation**:
- Uses custom Cypress commands: `selectSecondVariantOnPDP()`, `findAndSelectSecondSwatch()`, `isElementReallyVisible()`
- Implements retry logic and timeout handling
- Prevents automatic scrolling to maintain test stability

---

### 4. Kids Sets Collection Suite (`Kidssets.cy.js`)

**Purpose**: Tests the complete bundle creation workflow for Kids Sets, validating the end-to-end process of creating custom bedroom sets.

**Test Coverage**:

- **Bundle Creation Workflow**
  - Tests multiple kids set configurations from fixture data (`KidsSets.json`)
  - Each test iteration validates a specific category and subcategory combination
  - Navigates from the Kids Sets landing page (`/pages/kids-bedroom-sets`)
  - Randomly selects a "Create your set" button to start bundle creation
  - Handles dynamic button detection (by class or text content)

- **Product Selection Process**
  - Waits for product selection interface to load
  - Selects products from the bundle builder interface
  - Handles dynamic product loading and selection
  - Adds selected products to cart as a bundle
  - Manages navigation between product selection and cart pages

- **Cart Verification**
  - Verifies products are successfully added to cart
  - Uses multiple fallback selectors to detect cart indicators
  - Handles different cart UI states and page transitions

**Key Features**:
- Data-driven testing using JSON fixtures
- Flexible button detection (handles UI variations)
- Robust navigation handling (waits for page transitions)
- Multiple cart verification strategies
- Automatic cleanup after each test

**Test Data**:
- Uses `KidsSets.json` fixture file containing category and subcategory combinations
- Each combination generates a separate test case for comprehensive coverage

---

### 5. Nursery Sets Collection Suite (`Nurserysets.cy.js`)

**Purpose**: Tests the complete bundle creation workflow for Nursery Sets, validating the end-to-end process of creating custom nursery furniture bundles.

**Test Coverage**:

- **Bundle Creation Workflow**
  - Tests multiple nursery set configurations from fixture data (`NurserySets.json`)
  - Each test iteration validates a specific category and subcategory combination
  - Navigates from the Nursery Sets landing page (`/pages/bundles`)
  - Randomly selects a "Create your set" button to start bundle creation
  - Handles dynamic button detection (by class or text content)

- **Product Selection Process**
  - Waits for product selection interface to load
  - Selects products from the bundle builder interface
  - Handles dynamic product loading and selection
  - Adds selected products to cart as a bundle
  - Manages navigation between product selection and cart pages

- **Add-Ons Handling**
  - Detects and handles add-on product screens
  - Selects add-ons when presented
  - Proceeds to cart after add-on selection

- **Cart Verification**
  - Verifies products are successfully added to cart
  - Uses multiple fallback selectors to detect cart indicators
  - Handles different cart UI states and page transitions

**Key Features**:
- Data-driven testing using JSON fixtures
- Flexible button detection (handles UI variations)
- Robust navigation handling (waits for page transitions)
- Add-on product handling
- Multiple cart verification strategies
- Automatic cleanup after each test

**Test Data**:
- Uses `NurserySets.json` fixture file containing category and subcategory combinations
- Each combination generates a separate test case for comprehensive coverage

---

## Technical Architecture

### Framework & Tools
- **Testing Framework**: Cypress 15.5.0
- **Node.js**: 20.15.0
- **NPM**: 10.7.0
- **Accessibility Plugin**: wick-a11y
- **Visual Regression Plugin**: cypress-image-diff
- **Reporting**: Mochawesome (HTML and JSON reports)

### Design Patterns
- **Page Object Model (POM)**: Reusable page objects for common elements and actions
- **Custom Commands**: Reusable Cypress commands for common operations
- **Data-Driven Testing**: JSON fixtures for test data management
- **Error Handling**: Non-blocking error handling for accessibility violations

### CI/CD Integration
- **GitHub Actions**: Automated test execution on schedule and push events
- **Slack Integration**: Automated test result notifications
- **Artifact Upload**: Test reports, screenshots, and accessibility reports

### Reporting & Notifications
- **HTML Reports**: Comprehensive test execution reports with Mochawesome
- **Slack Notifications**: Detailed test summaries sent to Slack channels
- **Accessibility Reports**: JSON files with detailed violation information
- **Screenshots**: Visual documentation of test execution and violations

---

## Test Execution

### Local Execution
```bash
# Install dependencies
npm install

# Open Cypress Test Runner
npm run cypress:open
# or
npx cypress open

# Run all tests
npm run cypress:run

# Run specific test suite
npm run cypress:run -- --spec "Cypress/e2e/regressionVisualTesting.cy.js"

# Visual regression testing with environment comparison
ENV_COMPARISON_MODE=create-base ENABLE_ENV_COMPARISON=true npm run cypress:run -- --spec "Cypress/e2e/regressionVisualTesting.cy.js"
ENV_COMPARISON_MODE=compare ENABLE_ENV_COMPARISON=true npm run cypress:run -- --spec "Cypress/e2e/regressionVisualTesting.cy.js"
```

### CI/CD Execution
Tests run automatically via GitHub Actions:
- **Scheduled**: Daily at 00:30 UTC
- **On Push**: Triggered on pushes to main/master/Automation-Delta branches
- **Manual**: Can be triggered manually via workflow_dispatch

### Test Results
- Test results are published as artifacts in GitHub Actions
- Slack notifications include test summaries and links to detailed reports
- Accessibility violations are documented in JSON files and Slack messages

---

## Key Testing Scenarios Covered

1. **Accessibility Compliance**: Ensures website meets WCAG 2 AA standards
2. **Visual Regression**: Detects visual changes and UI inconsistencies
3. **Cross-Environment Validation**: Compares visual appearance between environments
4. **Product Variant Selection**: Tests variant selection on PDP and collection pages
5. **Bundle Creation**: Validates complete bundle creation workflows
6. **Cross-Browser Compatibility**: Tests on Chrome browser
7. **Responsive Design**: Validates functionality across different viewport sizes
8. **Dynamic Content Handling**: Tests pages with dynamically loaded content
9. **Error Handling**: Validates graceful handling of missing elements and errors
10. **Cart Functionality**: Verifies product addition to shopping cart

---

## Maintenance & Best Practices

- **Page Object Model**: Centralizes element selectors and actions for easy maintenance
- **Custom Commands**: Reusable commands reduce code duplication
- **Fixture Data**: External JSON files for easy test data updates
- **Error Handling**: Non-blocking tests ensure maximum coverage
- **Logging**: Comprehensive logging for debugging and test traceability
- **Screenshots**: Visual documentation for failed tests and accessibility violations

---

## Future Enhancements

- Additional test coverage for checkout process
- Payment gateway testing
- User account management testing
- Search functionality testing
- Filter and sort functionality testing
- Expanded visual regression coverage for more pages
- Automated visual diff reporting and notifications
- Mobile app testing (if applicable)

