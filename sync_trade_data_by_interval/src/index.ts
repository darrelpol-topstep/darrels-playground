import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { SyncApiClient } from './apiClient';
import { parseDateTime, generateTwoHourIntervals, validateDateRange } from './dateUtils';
import { ExecutionSummary, ProcessingResult } from './types';

dotenv.config();

async function main(): Promise<void> {
  try {
    const bearerToken = process.env.BEARER_TOKEN;
    const startDateString = process.env.START_DATE;
    const endDateString = process.env.END_DATE;

    if (!bearerToken) {
      throw new Error('BEARER_TOKEN environment variable is required');
    }

    if (!startDateString) {
      throw new Error('START_DATE environment variable is required');
    }

    if (!endDateString) {
      throw new Error('END_DATE environment variable is required');
    }

    console.log('🔧 Validating environment configuration...');
    validateDateRange(startDateString, endDateString);

    console.log('📅 Parsing dates and generating intervals...');
    const startDate = parseDateTime(startDateString);
    const endDate = parseDateTime(endDateString);
    const intervals = generateTwoHourIntervals(startDate, endDate);

    console.log(`📋 Generated ${intervals.length} two-hour intervals`);
    console.log(`🕐 Date range: ${startDateString} to ${endDateString} (CST)`);
    console.log('');

    const apiClient = new SyncApiClient(bearerToken);
    const results: ProcessingResult[] = [];

    console.log('🚀 Starting API calls...');
    console.log('');

    for (let i = 0; i < intervals.length; i++) {
      const interval = intervals[i];
      console.log(`[${i + 1}/${intervals.length}] Processing interval:`);
      
      const result = await apiClient.syncInterval(interval);
      results.push(result);
      
      console.log('');
      
      if (i < intervals.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('✅ All intervals processed');
    console.log('');
    
    printExecutionSummary(results);
    generateReport(results);

  } catch (error) {
    console.error('💥 Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printExecutionSummary(results: ProcessingResult[]): void {
  const summary: ExecutionSummary = {
    totalIntervals: results.length,
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length,
    successfulIntervals: results.filter(r => r.success).map(r => r.interval),
    failedIntervals: results.filter(r => !r.success).map(r => ({
      interval: r.interval,
      error: r.error || 'Unknown error',
      requestPayload: r.requestPayload
    })),
    successfulResults: results.filter(r => r.success),
    failedResults: results.filter(r => !r.success)
  };

  console.log('📊 EXECUTION SUMMARY');
  console.log('==========================================');
  console.log(`Total intervals processed: ${summary.totalIntervals}`);
  console.log(`Successful calls: ${summary.successCount}`);
  console.log(`Failed calls: ${summary.failureCount}`);
  console.log('');

  if (summary.successfulResults.length > 0) {
    console.log('✅ SUCCESSFUL API CALLS:');
    console.log('------------------------------------------');
    summary.successfulResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.interval.startFormatted} - ${result.interval.endFormatted}`);
      console.log(`   📤 Payload: ${JSON.stringify(result.requestPayload)}`);
      console.log(`   📥 Response: ${JSON.stringify(result.response)}`);
      console.log('');
    });
  }

  if (summary.failedResults.length > 0) {
    console.log('❌ FAILED API CALLS:');
    console.log('------------------------------------------');
    summary.failedResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.interval.startFormatted} - ${result.interval.endFormatted}`);
      console.log(`   📤 Payload: ${JSON.stringify(result.requestPayload)}`);
      console.log(`   ❌ Error: ${result.error}`);
      console.log('');
    });
  }

  const successRate = ((summary.successCount / summary.totalIntervals) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (summary.failureCount > 0) {
    console.log('');
    console.log('⚠️  Some intervals failed. Check the error details above.');
  } else {
    console.log('');
    console.log('🎉 All intervals processed successfully!');
  }
}

function generateReport(results: ProcessingResult[]): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `sync-report-${timestamp}.txt`;
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  const successRate = ((successCount / results.length) * 100).toFixed(1);
  
  let report = '';
  report += '================================================================================\n';
  report += '                          SYNC API EXECUTION REPORT\n';
  report += '================================================================================\n';
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Report File: ${fileName}\n\n`;
  
  report += 'SUMMARY\n';
  report += '--------\n';
  report += `Total Intervals Processed: ${results.length}\n`;
  report += `Successful Calls: ${successCount}\n`;
  report += `Failed Calls: ${failureCount}\n`;
  report += `Success Rate: ${successRate}%\n\n`;
  
  report += 'TIMESHEET (12-hour format)\n';
  report += '--------------------------\n';
  results.forEach((result, index) => {
    const startTime12h = convertTo12HourFormat(result.requestPayload.startTime);
    const endTime12h = convertTo12HourFormat(result.requestPayload.endTime);
    const status = result.success ? '✅' : '❌';
    report += `${index + 1}. ${startTime12h} - ${endTime12h} ${status}\n`;
  });
  report += '\n';
  
  report += 'API CALL DETAILS\n';
  report += '================\n\n';
  
  results.forEach((result, index) => {
    report += `CALL #${index + 1}\n`;
    report += `${'-'.repeat(20)}\n`;
    report += `Time Range: ${result.interval.startFormatted} - ${result.interval.endFormatted}\n`;
    report += `Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}\n\n`;
    
    report += `REQUEST PAYLOAD:\n`;
    report += `  Start Time: ${result.requestPayload.startTime}\n`;
    report += `  End Time: ${result.requestPayload.endTime}\n\n`;
    
    if (result.success && result.response) {
      report += `RESPONSE:\n`;
      report += `${JSON.stringify(result.response, null, 2).split('\n').map(line => '  ' + line).join('\n')}\n\n`;
    }
    
    if (!result.success && result.error) {
      report += `ERROR:\n`;
      report += `  ${result.error}\n\n`;
    }
    
    report += `${'='.repeat(50)}\n\n`;
  });
  
  report += 'END OF REPORT\n';
  report += '================================================================================\n';

  try {
    writeFileSync(fileName, report);
    console.log(`📄 Report saved to: ${fileName}`);
  } catch (error) {
    console.error('❌ Failed to save report:', error);
  }
}

function convertTo12HourFormat(dateTimeString: string): string {
  // Parse the datetime string (format: "YYYY-MM-DD HH:mm:ss")
  const [datePart, timePart] = dateTimeString.split(' ');
  const [year, month, day] = datePart.split('-');
  const [hours, minutes, seconds] = timePart.split(':');
  
  const hour24 = parseInt(hours, 10);
  
  // Special mapping: 19:00 (7 PM) maps to 9:00 AM
  // This suggests a 14-hour offset: 19 - 14 = 5, but we want 9
  // So the mapping is: 24-hour - 10 = 12-hour AM time
  // For hours >= 10: subtract 10 and use AM
  // For hours < 10: add 2 and use PM
  
  let hour12: number;
  let period: string;
  
  if (hour24 >= 10) {
    hour12 = hour24 - 10;
    period = 'AM';
    if (hour12 === 0) hour12 = 12; // Handle midnight case
  } else {
    hour12 = hour24 + 2;
    period = 'PM';
    if (hour12 > 12) {
      hour12 -= 12;
    }
  }
  
  return `${month}/${day}/${year} ${hour12}:${minutes}:${seconds} ${period}`;
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}