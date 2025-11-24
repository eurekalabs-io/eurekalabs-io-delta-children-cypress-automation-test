# Slack Integration Guide

This guide explains how to set up Slack notifications for Cypress test results.

## Overview

The Slack integration sends formatted test results to a Slack channel after each test run in GitHub Actions. The notification includes:
- Test status (Passed/Failed)
- Total tests count
- Passed/Failed test counts
- Test duration
- Failed test details (if any)
- Links to GitHub Actions run and commit

## Setup Instructions

### Step 1: Create a Slack Webhook

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name your app (e.g., "Cypress Test Notifications") and select your workspace
4. Click **"Create App"**

### Step 2: Enable Incoming Webhooks

1. In your app settings, go to **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to **On**
3. Click **"Add New Webhook to Workspace"**
4. Select the channel where you want to receive notifications
5. Click **"Allow"**
6. Copy the **Webhook URL** (it looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 3: Add Webhook URL to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `SLACK_WEBHOOK_URL`
5. Value: Paste your Slack webhook URL
6. Click **"Add secret"**

### Step 4: Verify Integration

1. Push a commit or manually trigger the GitHub Actions workflow
2. After the tests complete, check your Slack channel for the notification

## Notification Format

The Slack notification includes:

- **Status**: ✅ PASSED or ❌ FAILED
- **Total Tests**: Number of tests executed
- **Passed**: Number of passed tests
- **Failed**: Number of failed tests
- **Duration**: Total test execution time
- **Branch**: Git branch where tests ran
- **Commit**: Link to the commit
- **Failed Tests**: List of failed tests (if any)
- **Link**: Direct link to GitHub Actions run

## Customization

### Modify Notification Content

Edit `scripts/slack-notifier.js` to customize:
- Message format
- Colors
- Fields displayed
- Number of failed tests shown

### Change Notification Channel

1. Go back to your Slack app settings
2. Navigate to **"Incoming Webhooks"**
3. Click **"Add New Webhook to Workspace"**
4. Select a different channel
5. Update the `SLACK_WEBHOOK_URL` secret in GitHub with the new webhook URL

### Conditional Notifications

The notification is sent with `if: always()` in the workflow, meaning it will send regardless of test results. To only send on failures, change:

```yaml
- name: Send Slack notification
  if: failure()  # Only send on failure
```

To only send on success:

```yaml
- name: Send Slack notification
  if: success()  # Only send on success
```

## Troubleshooting

### No notifications received

1. **Check GitHub Secrets**: Verify `SLACK_WEBHOOK_URL` is set correctly
2. **Check GitHub Actions logs**: Look for errors in the "Send Slack notification" step
3. **Verify webhook URL**: Test the webhook URL manually using curl:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
   --data '{"text":"Test message"}' \
   YOUR_WEBHOOK_URL
   ```

### Incorrect test results

The script tries to parse Cypress results from:
1. `Cypress/results/mochawesome.json` (if using mochawesome reporter)
2. `cypress/results/*.json` (Cypress default results)

If you're using a different reporter, you may need to modify `parseCypressResults()` in `scripts/slack-notifier.js`.

### Test results not found

If the script can't find test results, it will still send a notification but with default values (0 tests). Make sure:
- Cypress is configured to generate JSON reports
- The results directory exists and contains JSON files

## Optional: Install Mochawesome Reporter

For better test result parsing, you can install the mochawesome reporter:

```bash
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
```

Then update `cypress.config.js`:

```javascript
module.exports = defineConfig({
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'Cypress/results',
    overwrite: false,
    html: false,
    json: true
  },
  // ... rest of config
});
```

## Security Notes

- Never commit the webhook URL to your repository
- Always use GitHub Secrets for sensitive information
- Consider rotating webhook URLs periodically
- Limit access to the Slack channel receiving notifications

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review the script output in the workflow
3. Verify Slack app permissions
4. Ensure the webhook URL is valid and active

