# Impact Groups Account Assignment Processor

A TypeScript Node.js application that processes CSV files containing account assignments to impact groups and submits them to an API in batches.

## Features

- 📄 **CSV Processing**: Reads and validates CSV files with account and impact group data
- 📦 **Batch Processing**: Processes accounts in configurable batch sizes for optimal API performance
- 🔄 **Token Expiration Handling**: Automatically handles auth token expiration with user prompt to continue
- 📊 **Comprehensive Reporting**: Generates detailed reports of successful and failed processing
- 🔍 **Error Tracking**: Tracks and reports all failed accounts with detailed error messages
- ⚡ **Progress Indicators**: Shows real-time progress during processing
- 🛡️ **Error Handling**: Graceful error handling with proper logging

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your configuration:
   ```bash
   # Required: Your API bearer token
   AUTH_TOKEN=your_actual_bearer_token_here
   
   # Optional: Number of CSV rows to process in each batch (default: 100)
   BATCH_SIZE=100
   
   # Optional: Name of the CSV file to process (default: test_impact_groups.csv)
   CSV_FILENAME=test_impact_groups.csv
   
   # Optional: Maximum number of accounts to process from CSV (default: 1000)
   MAX_ACCOUNTS=1000
   
   # Optional: API endpoint URL
   API_URL=https://staging-trm-api.topstep.com/admin/impact-groups/accounts/enqueue-account-assignments
   ```

## CSV File Format

Your CSV file must contain these two columns (other columns will be ignored):

- `ACCOUNT_ID_INT`: The account ID (must be a valid integer)
- `IMPACT_GROUP_SLUG`: The impact group slug (string)

Example CSV:
```csv
ACCOUNT_ID_INT,IMPACT_GROUP_SLUG,OTHER_COLUMN,ANOTHER_COLUMN
123,group-alpha,ignored,ignored
456,group-beta,ignored,ignored
789,group-alpha,ignored,ignored
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
# Build the project
npm run build

# Run the built version
npm start
```

## How It Works

1. **Configuration Loading**: Loads settings from `.env` file
2. **CSV Reading**: Reads and validates the specified CSV file
3. **Account Limiting**: Limits processing to the maximum number of accounts specified (default: 1000)
4. **Batch Creation**: Splits accounts into batches of the specified size
5. **Grouping**: Within each batch, groups accounts by their impact group slug
6. **API Processing**: Sends each batch to the API with proper authentication
7. **Error Handling**: If token expires, prompts user to update `.env` and continues
8. **Reporting**: Generates detailed reports of the processing results

## API Payload Format

The application sends data to the API in this format:

```json
{
  "payload": [
    {
      "groupSlug": "group-alpha",
      "accountIds": [123, 789]
    },
    {
      "groupSlug": "group-beta", 
      "accountIds": [456]
    }
  ]
}
```

## Error Handling

### Token Expiration
If your auth token expires during processing:
1. The application will pause and display a message
2. Update the `AUTH_TOKEN` in your `.env` file
3. Press Enter to continue processing from where it left off

### Failed Requests
- All failed accounts are tracked with detailed error messages
- Failed accounts are saved to a CSV file for easy reprocessing
- Detailed error reports are generated for analysis

## Generated Reports

After processing completes, the application generates:

1. **Detailed Text Report** (`report_[timestamp].txt`):
   - Summary statistics
   - Complete list of failed accounts grouped by error type
   - Success rate analysis

2. **Failed Accounts CSV** (`failed_accounts_[timestamp].csv`):
   - Contains only the accounts that failed processing
   - Same format as input CSV for easy reprocessing
   - Can be used as input for another processing run

## Example Output

```
🚀 Starting Impact Groups Processor

📄 Reading CSV file...
Reading CSV file: /path/to/test_impact_groups.csv
Successfully read 1500 valid accounts from CSV

⚠️  Found 1500 accounts, but limiting to 1000 accounts as configured.
📊 Processing 1000 accounts total

📦 Creating batches (size: 100)...
Created 10 batches from 1000 accounts

⚙️  Processing 10 batches...

📦 Processing batch 1 of 10 (100 accounts)
   Grouped into 3 impact groups
   - group-alpha: 45 accounts
   - group-beta: 35 accounts
   - group-gamma: 20 accounts
   ✅ Batch 1 completed successfully
   📊 Progress: 100 processed, 100 successful (100.0%)

[... continues for all batches ...]

📊 Generating reports...

📊 Reports generated:
- Detailed report: /path/to/report_2024-01-15T10-30-45-123Z.txt
- Failed accounts CSV: /path/to/failed_accounts_2024-01-15T10-30-45-123Z.csv

==================================================
PROCESSING COMPLETE
==================================================
Total accounts processed: 1000
✅ Successful: 985
❌ Failed: 15
📈 Success rate: 98.50%

⚠️  15 accounts failed processing. Check the generated reports for details.
```

## Troubleshooting

### Common Issues

1. **"AUTH_TOKEN is required" error**:
   - Make sure you have created a `.env` file
   - Ensure `AUTH_TOKEN` is set in the `.env` file

2. **"CSV file not found" error**:
   - Check that the CSV file exists in the project directory
   - Verify the `CSV_FILENAME` in your `.env` file is correct

3. **"No valid accounts found" error**:
   - Check that your CSV has the required columns: `ACCOUNT_ID_INT` and `IMPACT_GROUP_SLUG`
   - Ensure account IDs are valid integers
   - Verify that rows contain data (not empty)

4. **API connection errors**:
   - Check your internet connection
   - Verify the `API_URL` is correct
   - Ensure your `AUTH_TOKEN` is valid and not expired

### Getting Help

If you encounter issues:
1. Check the console output for detailed error messages
2. Review the generated error reports
3. Verify your `.env` configuration
4. Ensure your CSV file format is correct

## File Structure

```
impact-groups-processor/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── types.ts              # TypeScript type definitions
│   ├── csvProcessor.ts       # CSV reading and parsing logic
│   ├── batchProcessor.ts     # Batch creation and grouping logic
│   ├── apiClient.ts          # API client with token handling
│   └── reportGenerator.ts    # Report generation logic
├── dist/                     # Compiled JavaScript files (generated)
├── .env.example             # Example environment configuration
├── .env                     # Your environment configuration (create this)
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```