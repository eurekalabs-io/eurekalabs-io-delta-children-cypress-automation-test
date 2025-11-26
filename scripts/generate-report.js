#!/usr/bin/env node

/**
 * Generate consolidated HTML test report from mochawesome JSON files
 * Merges multiple test result files into a single HTML report
 */

const fs = require('fs');
const path = require('path');
const { merge } = require('mochawesome-merge');
const { generate } = require('mochawesome-report-generator');

const REPORTS_DIR = path.join(__dirname, '..', 'Cypress', 'reports');
const OUTPUT_DIR = path.join(__dirname, '..', 'Cypress', 'reports', 'merged');

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Find all JSON report files
 */
function findReportFiles() {
  if (!fs.existsSync(REPORTS_DIR)) {
    console.log('⚠️  Reports directory not found');
    return [];
  }

  const files = [];
  
  function searchDir(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchDir(fullPath);
      } else if (item.endsWith('.json') && item.includes('mochawesome')) {
        files.push(fullPath);
      }
    });
  }
  
  searchDir(REPORTS_DIR);
  return files;
}

/**
 * Generate consolidated report
 */
async function generateReport() {
  console.log('📊 Generating consolidated test report...');
  
  // Ensure output directory exists
  ensureDir(OUTPUT_DIR);
  
  // Find all JSON report files
  const reportFiles = findReportFiles();
  
  if (reportFiles.length === 0) {
    console.log('⚠️  No report files found. Make sure tests have been executed.');
    return;
  }
  
  console.log(`📁 Found ${reportFiles.length} report file(s)`);
  
  try {
    // Merge all JSON reports
    console.log('🔄 Merging report files...');
    const mergedResults = await merge({
      files: reportFiles,
      reportDir: REPORTS_DIR
    });
    
    // Save merged JSON for slack-notifier.js to use
    const mergedJsonPath = path.join(OUTPUT_DIR, 'mochawesome-merged.json');
    fs.writeFileSync(mergedJsonPath, JSON.stringify(mergedResults, null, 2), 'utf8');
    console.log(`💾 Saved merged JSON: ${mergedJsonPath}`);
    
    // Generate HTML report
    console.log('📄 Generating HTML report...');
    const htmlReport = await generate(mergedResults, {
      reportDir: OUTPUT_DIR,
      reportFilename: 'test-report.html',
      overwrite: true,
      inline: true,
      charts: true,
      code: false,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Report generated successfully!');
    console.log(`📄 Report location: ${htmlReport[0]}`);
    
    // Generate summary markdown for GitHub Actions
    generateMarkdownSummary(mergedResults);
    
    return htmlReport[0];
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
    throw error;
  }
}

/**
 * Generate markdown summary for GitHub Actions
 */
function generateMarkdownSummary(results) {
  if (!results || !results.stats) {
    return;
  }
  
  const stats = results.stats;
  const total = stats.tests || 0;
  const passed = stats.passes || 0;
  const failed = stats.failures || 0;
  const pending = stats.pending || 0;
  const duration = stats.duration || 0;
  
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const status = failed === 0 ? '✅ PASSED' : '❌ FAILED';
  
  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  const markdown = `# Test Execution Summary

## ${status}

| Metric | Value |
|--------|-------|
| **Total Tests** | ${total} |
| **Passed** | ✅ ${passed} |
| **Failed** | ❌ ${failed} |
| **Pending** | ⏸️ ${pending} |
| **Pass Rate** | ${passRate}% |
| **Duration** | ${formatDuration(duration)} |

## Test Results

${generateTestDetails(results)}

---
*Report generated at ${new Date().toLocaleString()}*
`;

  // Write to GitHub Actions summary if available
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    fs.writeFileSync(summaryPath, markdown, 'utf8');
    console.log('📝 GitHub Actions summary updated');
  }
  
  // Also write to file
  const summaryFile = path.join(OUTPUT_DIR, 'test-summary.md');
  fs.writeFileSync(summaryFile, markdown, 'utf8');
  console.log(`📝 Summary saved to: ${summaryFile}`);
}

/**
 * Generate test details section
 */
function generateTestDetails(results) {
  if (!results.results || !Array.isArray(results.results)) {
    return 'No test details available.';
  }
  
  let details = '';
  
  results.results.forEach((suite, suiteIndex) => {
    if (!suite.tests || suite.tests.length === 0) {
      return;
    }
    
    const suiteTitle = suite.fullTitle || suite.title || `Suite ${suiteIndex + 1}`;
    details += `\n### ${suiteTitle}\n\n`;
    
    suite.tests.forEach((test, testIndex) => {
      const status = test.state === 'passed' ? '✅' : test.state === 'failed' ? '❌' : '⏸️';
      const title = test.title || `Test ${testIndex + 1}`;
      const duration = test.duration ? `(${test.duration}ms)` : '';
      
      details += `- ${status} **${title}** ${duration}\n`;
      
      // Add error details if failed
      if (test.state === 'failed' && test.err) {
        const errorMsg = test.err.message || 'Unknown error';
        details += `  - Error: \`${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''}\`\n`;
      }
    });
    
    details += '\n';
  });
  
  return details || 'No test details available.';
}

// Run if executed directly
if (require.main === module) {
  generateReport()
    .then(() => {
      console.log('✨ Report generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Report generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generateReport, generateMarkdownSummary };

