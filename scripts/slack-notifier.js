#!/usr/bin/env node

/**
 * Slack Notifier for Cypress Test Results
 * Sends formatted test results to Slack channel via webhook
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Get environment variables
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'Delta-Children';
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID || '';
const GITHUB_SHA = process.env.GITHUB_SHA || '';
const GITHUB_REF = process.env.GITHUB_REF || 'main';
const GITHUB_ACTOR = process.env.GITHUB_ACTOR || 'Delta Children';
const GITHUB_WORKFLOW = process.env.GITHUB_WORKFLOW || 'Cypress Tests';

// Colors for Slack messages
const colors = {
  success: '#36a64f',
  failure: '#ff0000',
  warning: '#ffaa00',
  info: '#36a64f'
};

/**
 * Find all mochawesome JSON report files
 */
function findReportFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  function searchDir(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            searchDir(fullPath);
          } else if (item.endsWith('.json') && (item.includes('mochawesome') || item.includes('report'))) {
            files.push(fullPath);
          }
        } catch (e) {
          // Skip files we can't access
        }
      });
    } catch (e) {
      // Skip directories we can't access
    }
  }
  
  searchDir(dir);
  return files;
}

/**
 * Parse Cypress results from mochawesome JSON report
 */
function parseCypressResults() {
  // Try multiple possible locations
  const possibleDirs = [
    path.join(__dirname, '..', 'Cypress', 'reports'),
    path.join(__dirname, '..', 'Cypress', 'results'),
    path.join(__dirname, '..', 'cypress', 'reports'),
    path.join(__dirname, '..', 'cypress', 'results')
  ];
  
  let results = null;
  let reportFiles = [];
  
  // Search for report files in all possible directories
  for (const dir of possibleDirs) {
    const files = findReportFiles(dir);
    if (files.length > 0) {
      reportFiles = files;
      break;
    }
  }
  
  // Try to parse the first report file found
  if (reportFiles.length > 0) {
    // Sort by modification time (newest first)
    reportFiles.sort((a, b) => {
      try {
        return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs;
      } catch {
        return 0;
      }
    });
    
    for (const filePath of reportFiles) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(fileContent);
        
        // Check if it's a valid mochawesome report
        if (parsed.stats || (parsed.results && Array.isArray(parsed.results))) {
          results = parsed;
          console.log(`✅ Found report file: ${filePath}`);
          break;
        }
      } catch (error) {
        console.error(`Error parsing report file ${filePath}:`, error.message);
      }
    }
  }

  return results;
}

/**
 * Get test summary from Cypress results
 * Also tries to parse from GitHub Actions step summary if available
 */
function getTestSummary(results) {
  // Try to parse from mochawesome format
  if (results && results.stats) {
    return {
      total: results.stats.tests || 0,
      passed: results.stats.passes || 0,
      failed: results.stats.failures || 0,
      pending: results.stats.pending || 0,
      duration: results.stats.duration || 0
    };
  }

  // Try to parse from Cypress JSON format (if using JSON reporter)
  if (results && Array.isArray(results)) {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let duration = 0;

    results.forEach(suite => {
      if (suite.tests) {
        suite.tests.forEach(test => {
          total++;
          if (test.state === 'passed') passed++;
          if (test.state === 'failed') failed++;
          if (test.duration) duration += test.duration;
        });
      }
    });

    return { total, passed, failed, pending: 0, duration };
  }

  // Fallback: return default values
  // The script will still send a notification with basic info
  return {
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    duration: 0
  };
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
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
}

/**
 * Get test suites summary
 * Handles nested suites structure in mochawesome reports
 * Also handles cases where tests are directly in the file without describe() blocks
 */
function getTestSuitesSummary(results) {
  if (!results || !results.results || !Array.isArray(results.results)) {
    console.log('⚠️ No results found or results.results is not an array');
    return [];
  }

  const suites = [];
  
  // Function to recursively extract tests from suites
  const extractTestsFromSuite = (suite, parentTitle = '', parentFile = '') => {
    const suiteTitle = suite.fullTitle || suite.title || '';
    const fullTitle = parentTitle ? `${parentTitle} > ${suiteTitle}` : suiteTitle;
    
    // Get file path (prefer current suite's file, fallback to parent's file)
    const filePath = suite.file || parentFile || '';
    const fileName = filePath ? path.basename(filePath) : '';
    
    // Get tests from this suite
    const suiteTests = suite.tests || [];
    
    // Get nested suites (suites can contain other suites)
    const nestedSuites = suite.suites || [];
    
    // If this suite has tests, add it
    if (suiteTests.length > 0) {
      const passed = suiteTests.filter(t => t.state === 'passed').length;
      const failed = suiteTests.filter(t => t.state === 'failed').length;
      const pending = suiteTests.filter(t => t.state === 'pending').length;
      
      // Use file name as suite title if no title exists (for tests without describe blocks)
      const displayTitle = fullTitle || fileName || 'Unknown Suite';
      
      suites.push({
        title: displayTitle,
        file: fileName,
        filePath: filePath,
        total: suiteTests.length,
        passed,
        failed,
        pending,
        duration: suite.duration || 0,
        tests: suiteTests
      });
    }
    
    // Process nested suites recursively
    nestedSuites.forEach(nestedSuite => {
      extractTestsFromSuite(nestedSuite, fullTitle, filePath);
    });
  };
  
  // Process all top-level suites
  results.results.forEach(suite => {
    extractTestsFromSuite(suite);
  });
  
  // Also check if there are tests directly in results.results without suite wrapper
  // This can happen when tests don't have a describe() block
  results.results.forEach((result, idx) => {
    // If this result has tests but no title (or empty title), it might be a file-level suite
    const hasTests = result.tests && Array.isArray(result.tests) && result.tests.length > 0;
    const hasNoTitle = !result.title && !result.fullTitle;
    const filePath = result.file || '';
    const fileName = filePath ? path.basename(filePath) : '';
    
    if (hasTests && (hasNoTitle || !result.suites || result.suites.length === 0)) {
      // Check if we already added this suite
      const alreadyAdded = suites.some(s => 
        s.file === fileName && s.tests.length === result.tests.length &&
        s.tests.every((t, i) => t.title === result.tests[i].title)
      );
      
      if (!alreadyAdded) {
        const passed = result.tests.filter(t => t.state === 'passed').length;
        const failed = result.tests.filter(t => t.state === 'failed').length;
        const pending = result.tests.filter(t => t.state === 'pending').length;
        
        // Use file name as suite title for tests without describe blocks
        const suiteTitle = result.fullTitle || result.title || fileName || `Test File ${idx + 1}`;
        
        suites.push({
          title: suiteTitle,
          file: fileName,
          filePath: filePath,
          total: result.tests.length,
          passed,
          failed,
          pending,
          duration: result.duration || 0,
          tests: result.tests
        });
        
        console.log(`📋 Added file-level suite: "${suiteTitle}" from ${fileName} with ${result.tests.length} tests`);
      }
    }
  });
  
  console.log(`📊 Extracted ${suites.length} suite(s) with tests`);
  if (suites.length === 0) {
    console.warn('⚠️ No suites with tests found! Checking structure...');
    results.results.forEach((suite, idx) => {
      console.log(`   Result ${idx + 1}:`);
      console.log(`     Title: ${suite.title || suite.fullTitle || 'N/A'}`);
      console.log(`     File: ${suite.file || 'N/A'}`);
      console.log(`     Tests: ${suite.tests ? suite.tests.length : 0}`);
      console.log(`     Suites: ${suite.suites ? suite.suites.length : 0}`);
      if (suite.tests && suite.tests.length > 0) {
        console.log(`     First test: ${suite.tests[0].title || suite.tests[0].fullTitle || 'N/A'}`);
      }
    });
  } else {
    suites.forEach((suite, idx) => {
      console.log(`   Suite ${idx + 1}: "${suite.title}" - ${suite.total} tests (file: ${suite.file || 'N/A'})`);
    });
  }
  
  return suites;
}

/**
 * Extract accessibility violations from test logs, code, and messages
 */
function extractAccessibilityViolations(test) {
  const violations = [];
  
  if (!test) {
    return violations;
  }
  
  // Function to extract violations from text
  const extractFromText = (text) => {
    if (!text || typeof text !== 'string') return null;
    
    // Look for accessibility results patterns (multiple formats)
    const patterns = [
      /ACCESSIBILITY RESULTS FOR TEST[^\n]*\n([\s\S]*?)(?=\n\n|\n\*|$)/i,
      /CRITICAL VIOLATIONS:\s*(\d+)[\s\S]*?SERIOUS VIOLATIONS:\s*(\d+)/i,
      /(?:CRITICAL|SERIOUS|MODERATE|MINOR)\s+VIOLATIONS?:\s*(\d+)/gi
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Extract violation counts
        const criticalMatch = text.match(/CRITICAL VIOLATIONS:\s*(\d+)/i);
        const seriousMatch = text.match(/SERIOUS VIOLATIONS:\s*(\d+)/i);
        const moderateMatch = text.match(/MODERATE VIOLATIONS:\s*(\d+)/i);
        const minorMatch = text.match(/MINOR VIOLATIONS:\s*(\d+)/i);
        
        const critical = criticalMatch ? parseInt(criticalMatch[1]) : 0;
        const serious = seriousMatch ? parseInt(seriousMatch[1]) : 0;
        const moderate = moderateMatch ? parseInt(moderateMatch[1]) : 0;
        const minor = minorMatch ? parseInt(minorMatch[1]) : 0;
        
        if (critical > 0 || serious > 0 || moderate > 0 || minor > 0) {
          return { critical, serious, moderate, minor };
        }
      }
    }
    
    return null;
  };
  
  // Check test code blocks
  if (test.code && Array.isArray(test.code)) {
    test.code.forEach(codeBlock => {
      if (codeBlock) {
        const text = typeof codeBlock === 'string' ? codeBlock : JSON.stringify(codeBlock);
        const violationData = extractFromText(text);
        if (violationData) {
          violations.push({
            testName: test.title || 'Unknown Test',
            ...violationData
          });
        }
      }
    });
  }
  
  // Check error messages
  if (test.err) {
    const errorText = test.err.message || test.err.estack || JSON.stringify(test.err);
    const violationData = extractFromText(errorText);
    if (violationData) {
      const exists = violations.some(v => v.testName === (test.title || 'Unknown Test'));
      if (!exists) {
        violations.push({
          testName: test.title || 'Unknown Test',
          ...violationData
        });
      }
    }
  }
  
  // Check test context (for Cypress logs)
  if (test.context && Array.isArray(test.context)) {
    test.context.forEach(ctx => {
      if (ctx && ctx.value) {
        const text = typeof ctx.value === 'string' ? ctx.value : JSON.stringify(ctx.value);
        const violationData = extractFromText(text);
        if (violationData) {
          const exists = violations.some(v => v.testName === (test.title || 'Unknown Test'));
          if (!exists) {
            violations.push({
              testName: test.title || 'Unknown Test',
              ...violationData
            });
          }
        }
      }
    });
  }
  
  return violations;
}

/**
 * Get list of test files executed
 */
function getTestFiles(suites) {
  const files = new Set();
  
  suites.forEach(suite => {
    if (suite.file) {
      files.add(suite.file);
    }
  });
  
  return Array.from(files).map(file => path.basename(file));
}

/**
 * Format test details for Slack
 * Shows all tests and subtests with their status
 */
function formatTestDetails(suites) {
  if (!suites || suites.length === 0) {
    return 'No test details available.';
  }

  const MAX_LENGTH = 6000; // Increased limit for more details
  let details = '';
  let totalTestsShown = 0;
  let totalTestsSkipped = 0;
  
  // Add test files executed section
  const testFiles = getTestFiles(suites);
  if (testFiles.length > 0) {
    details += '*📁 Test Files Executed:*\n';
    testFiles.forEach(file => {
      details += `  • ${file}\n`;
    });
    details += '\n';
  }
  
  suites.forEach((suite, index) => {
    // Skip suites with no tests
    if (!suite.tests || suite.tests.length === 0) {
      console.log(`⚠️ Skipping suite "${suite.title}" - no tests found`);
      return;
    }
    
    const statusEmoji = suite.failed > 0 ? '❌' : suite.passed > 0 ? '✅' : '⏸️';
    const suiteHeader = `\n*${statusEmoji} ${suite.title}*\n`;
    const suiteSummary = `Tests: ${suite.total} | ✅ ${suite.passed} | ❌ ${suite.failed} | ⏸️ ${suite.pending} | ⏱️ ${formatDuration(suite.duration)}\n`;
    
    // Check if adding suite header would exceed limit
    if (details.length + suiteHeader.length + suiteSummary.length > MAX_LENGTH) {
      totalTestsSkipped += suite.total;
      return;
    }
    
    details += suiteHeader + suiteSummary;
    
    // Show all tests with their status
    if (suite.tests && suite.tests.length > 0) {
      suite.tests.forEach(test => {
        const testStatusEmoji = test.state === 'passed' ? '✅' : test.state === 'failed' ? '❌' : '⏸️';
        const testTitle = test.title || test.fullTitle || 'Unnamed Test';
        const testDuration = test.duration ? ` (${formatDuration(test.duration)})` : '';
        const testLine = `${testStatusEmoji} *${testTitle}*${testDuration}\n`;
        
        // Check if adding this test would exceed limit
        if (details.length + testLine.length > MAX_LENGTH) {
          totalTestsSkipped++;
          return;
        }
        
        details += testLine;
        totalTestsShown++;
        
        // Extract and show accessibility violations if present
        const accessibilityViolations = extractAccessibilityViolations(test);
        if (accessibilityViolations.length > 0) {
          accessibilityViolations.forEach(violation => {
            const violationLine = `  📊 *Accessibility Results:*\n`;
            const criticalLine = `    🔴 CRITICAL: ${violation.critical}\n`;
            const seriousLine = `    🟠 SERIOUS: ${violation.serious}\n`;
            const moderateLine = `    🟡 MODERATE: ${violation.moderate}\n`;
            const minorLine = `    🟢 MINOR: ${violation.minor}\n`;
            
            const violationText = violationLine + criticalLine + seriousLine + moderateLine + minorLine;
            
            if (details.length + violationText.length <= MAX_LENGTH) {
              details += violationText;
            }
          });
        }
        
        // Show error message for failed tests
        if (test.state === 'failed' && test.err) {
          const errorMsg = test.err.message || test.err.estack || 'Unknown error';
          const shortError = errorMsg.length > 150 ? errorMsg.substring(0, 150) + '...' : errorMsg;
          const errorLine = `  └─ Error: ${shortError}\n`;
          
          if (details.length + errorLine.length <= MAX_LENGTH) {
            details += errorLine;
          }
        }
        
        // Show subtests if they exist (check for nested test structure)
        if (test.tests && Array.isArray(test.tests) && test.tests.length > 0) {
          test.tests.forEach(subtest => {
            const subtestStatusEmoji = subtest.state === 'passed' ? '✅' : subtest.state === 'failed' ? '❌' : '⏸️';
            const subtestTitle = subtest.title || subtest.fullTitle || 'Unnamed Subtest';
            const subtestDuration = subtest.duration ? ` (${formatDuration(subtest.duration)})` : '';
            const subtestLine = `  ${subtestStatusEmoji} *${subtestTitle}*${subtestDuration}\n`;
            
            // Check if adding this subtest would exceed limit
            if (details.length + subtestLine.length > MAX_LENGTH) {
              totalTestsSkipped++;
              return;
            }
            
            details += subtestLine;
            totalTestsShown++;
            
            // Show error message for failed subtests
            if (subtest.state === 'failed' && subtest.err) {
              const subtestErrorMsg = subtest.err.message || subtest.err.estack || 'Unknown error';
              const shortSubtestError = subtestErrorMsg.length > 150 ? subtestErrorMsg.substring(0, 150) + '...' : subtestErrorMsg;
              const subtestErrorLine = `    └─ Error: ${shortSubtestError}\n`;
              
              if (details.length + subtestErrorLine.length <= MAX_LENGTH) {
                details += subtestErrorLine;
              }
            }
          });
        }
        
        // Also check for hooks (beforeEach, afterEach, etc.) which might be considered subtests
        if (test.hooks && Array.isArray(test.hooks) && test.hooks.length > 0) {
          test.hooks.forEach(hook => {
            if (hook.title && hook.title !== '') {
              const hookStatusEmoji = hook.state === 'passed' ? '✅' : hook.state === 'failed' ? '❌' : '⏸️';
              const hookTitle = hook.title;
              const hookLine = `  ${hookStatusEmoji} *${hookTitle}*\n`;
              
              if (details.length + hookLine.length <= MAX_LENGTH) {
                details += hookLine;
                totalTestsShown++;
              } else {
                totalTestsSkipped++;
              }
            }
          });
        }
      });
    }
  });
  
  // Add note if some tests were skipped due to length limit
  if (totalTestsSkipped > 0) {
    details += `\n_...y ${totalTestsSkipped} test(s) adicional(es) (ver reporte completo para detalles)_\n`;
  }
  
  return details;
}

/**
 * Create Slack message payload with detailed report
 */
function createSlackMessage(summary, results) {
  // If no results found, check GitHub Actions job status
  const hasResults = summary.total > 0;
  const isSuccess = hasResults ? summary.failed === 0 : true; // Assume success if no results
  const color = isSuccess ? colors.success : colors.failure;
  const emoji = isSuccess ? '✅' : '❌';
  const status = hasResults 
    ? (isSuccess ? 'PASSED' : 'FAILED')
    : 'COMPLETED (No detailed results available)';

  // Build repository URL
  const repoUrl = `https://github.com/${GITHUB_REPOSITORY}`;
  const runUrl = `${repoUrl}/actions/runs/${GITHUB_RUN_ID}`;
  const commitUrl = `${repoUrl}/commit/${GITHUB_SHA}`;
  const branch = GITHUB_REF.replace('refs/heads/', '');
  
  // Build artifact URL (users can download the HTML report from GitHub Actions)
  const artifactUrl = `${runUrl}#artifacts`;

  // Calculate pass rate
  const passRate = hasResults && summary.total > 0 
    ? ((summary.passed / summary.total) * 100).toFixed(1) 
    : '0';

  // Get test suites summary
  const suites = getTestSuitesSummary(results);
  const testDetails = formatTestDetails(suites);
  const testFiles = getTestFiles(suites);
  
  // Debug logging
  console.log(`📋 Found ${suites.length} test suite(s)`);
  suites.forEach((suite, idx) => {
    console.log(`   Suite ${idx + 1}: ${suite.title} - ${suite.total} tests (${suite.passed} passed, ${suite.failed} failed)`);
  });
  console.log(`📝 Test details length: ${testDetails.length} characters`);
  console.log(`📁 Test files executed: ${testFiles.join(', ')}`);

  // Create main attachment with summary
  const fields = [
    {
      title: 'Status',
      value: `${emoji} *${status}*`,
      short: true
    }
  ];
  
  // Add test files if available
  if (testFiles.length > 0) {
    const filesValue = testFiles.length <= 3 
      ? testFiles.join(', ') 
      : `${testFiles.slice(0, 3).join(', ')}... (+${testFiles.length - 3} more)`;
    fields.push({
      title: 'Test Files',
      value: `*${filesValue}*`,
      short: false
    });
  }

  // Only add test details if we have results
  if (hasResults) {
    fields.push(
      {
        title: 'Total Tests',
        value: `*${summary.total}*`,
        short: true
      },
      {
        title: 'Pass Rate',
        value: `*${passRate}%*`,
        short: true
      },
      {
        title: 'Passed',
        value: `✅ *${summary.passed}*`,
        short: true
      },
      {
        title: 'Failed',
        value: `❌ *${summary.failed}*`,
        short: true
      },
      {
        title: 'Duration',
        value: `⏱️ *${formatDuration(summary.duration)}*`,
        short: true
      },
      {
        title: 'Branch',
        value: `🌿 *${branch}*`,
        short: true
      }
    );
  }

  // Add commit info if available
  if (GITHUB_SHA) {
    fields.push({
      title: 'Commit',
      value: `<${commitUrl}|${GITHUB_SHA.substring(0, 7)}>`,
      short: true
    });
  }

  // Create main attachment
  const attachments = [
    {
      color: color,
      title: `📊 ${GITHUB_WORKFLOW} - Test Execution Report`,
      title_link: runUrl,
      fields: fields,
      footer: `Triggered by ${GITHUB_ACTOR}`,
      footer_icon: 'https://github.githubassets.com/favicons/favicon.png',
      ts: Math.floor(Date.now() / 1000)
    }
  ];

  // Add detailed test results as a second attachment if we have results
  if (hasResults && suites.length > 0 && testDetails && testDetails.trim().length > 0) {
    // Truncate if too long (Slack text field limit is 8000 chars, but we'll use 7000 to be safe)
    const maxTextLength = 7000;
    let finalTestDetails = testDetails;
    if (testDetails.length > maxTextLength) {
      finalTestDetails = testDetails.substring(0, maxTextLength) + '\n\n_... (mensaje truncado debido a longitud)_';
    }
    
    attachments.push({
      color: color,
      title: '📋 Detailed Test Results',
      text: finalTestDetails,
      mrkdwn_in: ['text']
    });
  }

  // Add links attachment
  attachments.push({
      color: colors.info,
      title: '🔗 Quick Links',
      fields: [
        {
          title: '📊 View Full HTML Report',
          value: `<${artifactUrl}|Download Complete Report>`,
          short: false
        },
        {
          title: '🔍 View Workflow Run',
          value: `<${runUrl}|Open in GitHub Actions>`,
          short: false
        }
      ]
    });

  const message = {
    username: 'Cypress Test Bot',
    icon_emoji: ':robot_face:',
    attachments: attachments
  };

  return message;
}

/**
 * Send message to Slack via webhook
 */
function sendToSlack(message) {
  return new Promise((resolve, reject) => {
    if (!SLACK_WEBHOOK_URL) {
      console.warn('SLACK_WEBHOOK_URL not set. Skipping Slack notification.');
      resolve();
      return;
    }

    const payload = JSON.stringify(message);
    const url = new URL(SLACK_WEBHOOK_URL);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Successfully sent notification to Slack');
          resolve();
        } else {
          console.error(`❌ Failed to send notification. Status: ${res.statusCode}`);
          console.error('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error sending notification to Slack:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  console.log('📊 Parsing Cypress test results...');
  
  const results = parseCypressResults();
  
  if (!results) {
    console.error('❌ No results found! Check if report files exist.');
    return;
  }
  
  // Debug: Log structure of results
  console.log('📋 Results structure:');
  console.log(`   Has stats: ${!!results.stats}`);
  console.log(`   Has results array: ${!!(results.results && Array.isArray(results.results))}`);
  console.log(`   Results array length: ${results.results ? results.results.length : 0}`);
  
  if (results.results && results.results.length > 0) {
    console.log('📋 First result structure:');
    const firstResult = results.results[0];
    console.log(`   Has tests: ${!!(firstResult.tests && Array.isArray(firstResult.tests))}`);
    console.log(`   Tests count: ${firstResult.tests ? firstResult.tests.length : 0}`);
    console.log(`   Has suites: ${!!(firstResult.suites && Array.isArray(firstResult.suites))}`);
    console.log(`   Suites count: ${firstResult.suites ? firstResult.suites.length : 0}`);
    console.log(`   Title: ${firstResult.title || firstResult.fullTitle || 'N/A'}`);
    console.log(`   File: ${firstResult.file || 'N/A'}`);
  }
  
  const summary = getTestSummary(results);

  console.log('📈 Test Summary:');
  console.log(`   Total: ${summary.total}`);
  console.log(`   Passed: ${summary.passed}`);
  console.log(`   Failed: ${summary.failed}`);
  console.log(`   Duration: ${formatDuration(summary.duration)}`);

  if (SLACK_WEBHOOK_URL) {
    console.log('📤 Sending notification to Slack...');
    const message = createSlackMessage(summary, results);
    
    try {
      await sendToSlack(message);
    } catch (error) {
      console.error('Failed to send Slack notification:', error.message);
      process.exit(1);
    }
  } else {
    console.warn('⚠️  SLACK_WEBHOOK_URL not set. Skipping Slack notification.');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { main, createSlackMessage, getTestSummary, parseCypressResults };

