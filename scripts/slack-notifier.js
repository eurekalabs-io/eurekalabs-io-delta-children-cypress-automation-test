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
const GITHUB_ACTOR = process.env.GITHUB_ACTOR || 'Unknown';
const GITHUB_WORKFLOW = process.env.GITHUB_WORKFLOW || 'Cypress Tests';

// Colors for Slack messages
const colors = {
  success: '#36a64f',
  failure: '#ff0000',
  warning: '#ffaa00',
  info: '#36a64f'
};

/**
 * Parse Cypress results from mochawesome JSON report
 */
function parseCypressResults() {
  const resultsPath = path.join(__dirname, '..', 'Cypress', 'results', 'mochawesome.json');
  
  // Try to find results file
  let results = null;
  if (fs.existsSync(resultsPath)) {
    try {
      results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    } catch (error) {
      console.error('Error parsing results file:', error.message);
    }
  }

  // Fallback: try to parse from Cypress output directory
  if (!results) {
    const cypressResultsPath = path.join(__dirname, '..', 'cypress', 'results');
    if (fs.existsSync(cypressResultsPath)) {
      const files = fs.readdirSync(cypressResultsPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      if (jsonFiles.length > 0) {
        try {
          results = JSON.parse(fs.readFileSync(path.join(cypressResultsPath, jsonFiles[0]), 'utf8'));
        } catch (error) {
          console.error('Error parsing Cypress results:', error.message);
        }
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
 * Create Slack message payload
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

  // Get failed tests details
  const failedTests = results && results.results ? 
    results.results
      .flatMap(suite => suite.tests || [])
      .filter(test => test.state === 'failed')
      .slice(0, 5) // Limit to 5 failed tests
    : [];

  const fields = [
    {
      title: 'Status',
      value: `${emoji} ${status}`,
      short: true
    }
  ];

  // Only add test details if we have results
  if (hasResults) {
    fields.push(
      {
        title: 'Total Tests',
        value: summary.total.toString(),
        short: true
      },
      {
        title: 'Passed',
        value: `✅ ${summary.passed}`,
        short: true
      },
      {
        title: 'Failed',
        value: `❌ ${summary.failed}`,
        short: true
      },
      {
        title: 'Duration',
        value: formatDuration(summary.duration),
        short: true
      }
    );
  }

  fields.push({
    title: 'Branch',
    value: branch,
    short: true
  });

  // Add failed tests details if any
  const failedTestsText = failedTests.length > 0
    ? failedTests.map((test, index) => {
        const suiteTitle = test.parent?.title || 'Unknown Suite';
        const testTitle = test.title || 'Unknown Test';
        return `${index + 1}. *${suiteTitle}*: ${testTitle}`;
      }).join('\n')
    : 'None';

  if (summary.failed > 0) {
    fields.push({
      title: 'Failed Tests',
      value: failedTestsText + (summary.failed > 5 ? `\n_...and ${summary.failed - 5} more_` : ''),
      short: false
    });
  }

  const message = {
    username: 'Cypress Test Bot',
    icon_emoji: ':robot_face:',
    attachments: [
      {
        color: color,
        title: `${GITHUB_WORKFLOW} - Test Results`,
        title_link: runUrl,
        fields: fields,
        footer: `Triggered by ${GITHUB_ACTOR}`,
        footer_icon: 'https://github.githubassets.com/favicons/favicon.png',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };

  // Add commit info if available
  if (GITHUB_SHA) {
    message.attachments[0].fields.push({
      title: 'Commit',
      value: `<${commitUrl}|${GITHUB_SHA.substring(0, 7)}>`,
      short: true
    });
  }

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

