# Test Reports Guide

This guide explains how to access and view test execution reports.

## Overview

After each test run, comprehensive HTML reports are automatically generated and made available as GitHub Actions artifacts. These reports provide a visual, easy-to-read summary of all test executions without needing to access workflow logs.

## Accessing Reports

### Method 1: GitHub Actions Artifacts (Recommended)

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Click on the workflow run you want to view
4. Scroll down to the **Artifacts** section at the bottom of the page
5. Download **test-report-html** artifact
6. Extract the ZIP file
7. Open `test-report.html` in your web browser

### Method 2: GitHub Actions Summary

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Click on the workflow run
4. Scroll to the top of the run page
5. View the **Summary** section which shows:
   - Test execution status
   - Total tests, passed, failed counts
   - Pass rate percentage
   - Test duration
   - Detailed test results

### Method 3: Local Execution

If running tests locally, reports are generated in:
```
Cypress/reports/merged/test-report.html
```

Simply open this file in your web browser.

## Report Contents

The HTML report includes:

- **Executive Summary**
  - Total tests executed
  - Pass/Fail/Pending counts
  - Overall pass rate
  - Total execution time

- **Test Suites**
  - Individual test suite results
  - Test case details
  - Execution time per test
  - Error messages for failed tests

- **Charts and Visualizations**
  - Pass/Fail distribution charts
  - Test duration charts
  - Suite comparison charts

- **Detailed Test Information**
  - Test descriptions
  - Error stack traces (for failures)
  - Screenshots (if available)
  - Execution timestamps

## Report Features

### Interactive Elements

- **Expandable Sections**: Click on test suites to expand/collapse details
- **Filtering**: Filter tests by status (Pass/Fail/Pending)
- **Search**: Search for specific test names or error messages
- **Sorting**: Sort tests by name, duration, or status

### Visual Indicators

- ✅ Green checkmark for passed tests
- ❌ Red X for failed tests
- ⏸️ Yellow pause icon for pending/skipped tests

## Report Retention

- **GitHub Actions**: Reports are retained for 30 days
- **Local Reports**: Stored in `Cypress/reports/` directory (not committed to git)

## Troubleshooting

### Report Not Generated

If the report is not available:

1. Check if tests completed successfully
2. Verify that `mochawesome` reporter is installed:
   ```bash
   npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
   ```
3. Check GitHub Actions logs for errors in the "Generate HTML test report" step

### Report is Empty

If the report shows no tests:

1. Verify tests were actually executed
2. Check that test files match the pattern in `cypress.config.js`
3. Review test execution logs for errors

### Cannot Download Artifact

If you cannot download the artifact:

1. Ensure you have access to the repository
2. Check that the workflow run completed (even if tests failed)
3. Verify the artifact was uploaded (check workflow logs)

## Best Practices

1. **Review Reports Regularly**: Check reports after each test run to catch issues early
2. **Share Reports**: Download and share HTML reports with team members for discussion
3. **Archive Important Reports**: Download and save reports for important releases or milestones
4. **Compare Reports**: Compare reports across different runs to identify trends

## Integration with Slack

Test execution summaries are automatically sent to Slack (if configured). The Slack notification includes:
- Quick status overview
- Link to download the full HTML report
- Link to GitHub Actions run

See [Slack Integration Guide](./SLACK_INTEGRATION.md) for setup instructions.

## Report Configuration

Report generation is configured in `cypress.config.js`:

```javascript
reporter: 'mochawesome',
reporterOptions: {
  reportDir: 'Cypress/reports',
  overwrite: false,
  html: true,
  json: true,
  timestamp: 'mmddyyyy_HHMMss',
  reportFilename: '[name]-report',
  charts: true,
  code: false,
  inline: true
}
```

To customize reports, modify these options in `cypress.config.js`.

## Support

For issues or questions:
1. Check GitHub Actions workflow logs
2. Review the report generation script: `scripts/generate-report.js`
3. Verify all dependencies are installed correctly

