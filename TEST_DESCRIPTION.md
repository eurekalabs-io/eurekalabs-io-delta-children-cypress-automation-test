# Automated Test Suite Description - Delta Children E-Commerce Platform

## Overview

This project contains a comprehensive automated testing framework for the Delta Children e-commerce website (https://www.deltachildren.com/). The test suite is built using Cypress, a modern end-to-end testing framework, and follows the Page Object Model (POM) pattern for maintainability and reusability.

The automated tests cover four main areas:
1. **Accessibility Testing** - Ensuring WCAG compliance and accessibility standards
2. **Cribs Collection Testing** - Product variant selection and interaction testing
3. **Kids Sets Collection Testing** - Bundle creation and product selection workflows
4. **Nursery Sets Collection Testing** - Bundle creation and product selection workflows

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

### 2. Cribs Collection Suite (`Cribs.cy.js`)

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

### 3. Kids Sets Collection Suite (`Kidssets.cy.js`)

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

### 4. Nursery Sets Collection Suite (`Nurserysets.cy.js`)

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
- **Testing Framework**: Cypress 13.8.1
- **Node.js**: 20.12.2
- **NPM**: 9.0.0
- **Accessibility Plugin**: wick-a11y
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
npm run cy:open
# or
npx cypress open
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
2. **Product Variant Selection**: Tests variant selection on PDP and collection pages
3. **Bundle Creation**: Validates complete bundle creation workflows
4. **Cross-Browser Compatibility**: Tests on Chrome browser
5. **Responsive Design**: Validates functionality across different viewport sizes
6. **Dynamic Content Handling**: Tests pages with dynamically loaded content
7. **Error Handling**: Validates graceful handling of missing elements and errors
8. **Cart Functionality**: Verifies product addition to shopping cart

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
- Mobile app testing (if applicable)

