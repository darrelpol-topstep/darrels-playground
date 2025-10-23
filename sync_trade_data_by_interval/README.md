# Sync Trade Data by Interval

A TypeScript Node.js application that calls a sync API endpoint in 2-hour intervals for processing trade data.

## Features

- **2-hour interval processing**: Automatically splits date ranges into 2-hour intervals
- **CST/CDT timezone support**: Handles America/Chicago timezone properly
- **Retry mechanism**: 3 retries with exponential backoff for failed requests
- **Comprehensive error handling**: Detailed error reporting and logging
- **Execution summary**: Shows successful and failed intervals with detailed statistics

## Requirements

- Node.js 16+ 
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sync_trade_data_by_interval
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration:
```env
BEARER_TOKEN=your_actual_bearer_token_here
START_DATE=2024-01-01 00:00:00
END_DATE=2024-01-01 23:59:59
```

## Environment Variables

| Variable | Description | Format | Example |
|----------|-------------|--------|---------|
| `BEARER_TOKEN` | API authorization token | String | `abc123xyz` |
| `START_DATE` | Start datetime in CST | `YYYY-MM-DD HH:mm:ss` | `2024-01-01 00:00:00` |
| `END_DATE` | End datetime in CST | `YYYY-MM-DD HH:mm:ss` | `2024-01-01 23:59:59` |

## Usage

### Development Mode
```bash
npm run dev
```

### Build and Run
```bash
npm run build
npm start
```

### Watch Mode (auto-restart on changes)
```bash
npm run watch
```

## API Details

- **Endpoint**: `https://trm-api.topstep.com/admin/accounts/syncTimeIntervalTopstepX`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body**: 
  ```json
  {
    "startTime": "YYYY-MM-DD HH:mm:ss",
    "endTime": "YYYY-MM-DD HH:mm:ss"
  }
  ```

## Project Structure

```
src/
├── types.ts          # TypeScript type definitions
├── dateUtils.ts      # Date manipulation and timezone utilities
├── apiClient.ts      # HTTP client with retry logic
└── index.ts          # Main execution logic
```

## Error Handling

The application includes comprehensive error handling:

- **Network errors**: Automatic retry with exponential backoff
- **HTTP errors**: Detailed error reporting with status codes
- **Date validation**: Validates date formats and ranges
- **Environment validation**: Ensures all required variables are present

## Retry Logic

- **Max retries**: 3 attempts per failed request
- **Retry strategy**: Exponential backoff (1s, 2s, 4s)
- **Retryable errors**: Network timeouts, 5xx server errors, 429 rate limiting
- **Non-retryable errors**: 4xx client errors (except 408, 429)

## Output

The application provides detailed output including:

1. **Real-time progress**: Shows current interval being processed
2. **Success/failure indicators**: ✅ for success, ❌ for errors
3. **Execution summary**: 
   - Total intervals processed
   - Success/failure counts
   - Complete list of successful time ranges
   - Failed intervals with error details
   - Success rate percentage

### Sample Output

```
🔧 Validating environment configuration...
📅 Parsing dates and generating intervals...
📋 Generated 12 two-hour intervals
🕐 Date range: 2024-01-01 00:00:00 to 2024-01-01 23:59:59 (CST)

🚀 Starting API calls...

[1/12] Processing interval:
Calling API for interval: 2024-01-01 00:00:00 - 2024-01-01 02:00:00
✅ Success for interval: 2024-01-01 00:00:00 - 2024-01-01 02:00:00

...

📊 EXECUTION SUMMARY
==========================================
Total intervals processed: 12
Successful calls: 11
Failed calls: 1

✅ SUCCESSFUL TIME RANGES:
------------------------------------------
1. 2024-01-01 00:00:00 - 2024-01-01 02:00:00
2. 2024-01-01 02:00:00 - 2024-01-01 04:00:00
...

❌ FAILED TIME RANGES:
------------------------------------------
1. 2024-01-01 20:00:00 - 2024-01-01 22:00:00
   Error: HTTP 500: Internal Server Error

📈 Success Rate: 91.7%
```

## Contributing

1. Follow TypeScript best practices
2. Add proper type definitions for new features
3. Include error handling for all external API calls
4. Update README for new configuration options

## License

ISC