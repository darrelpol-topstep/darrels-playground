"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const apiClient_1 = require("./apiClient");
const dateUtils_1 = require("./dateUtils");
dotenv_1.default.config();
async function main() {
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
        (0, dateUtils_1.validateDateRange)(startDateString, endDateString);
        console.log('📅 Parsing dates and generating intervals...');
        const startDate = (0, dateUtils_1.parseDateTime)(startDateString);
        const endDate = (0, dateUtils_1.parseDateTime)(endDateString);
        const intervals = (0, dateUtils_1.generateTwoHourIntervals)(startDate, endDate);
        console.log(`📋 Generated ${intervals.length} two-hour intervals`);
        console.log(`🕐 Date range: ${startDateString} to ${endDateString} (CST)`);
        console.log('');
        const apiClient = new apiClient_1.SyncApiClient(bearerToken);
        const results = [];
        console.log('🚀 Starting API calls...');
        console.log('');
        for (let i = 0; i < intervals.length; i++) {
            const interval = intervals[i];
            console.log(`[${i + 1}/${intervals.length}] Processing interval:`);
            const result = await apiClient.syncInterval(interval);
            results.push(result);
            console.log('');
            if (i < intervals.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        console.log('✅ All intervals processed');
        console.log('');
        printExecutionSummary(results);
    }
    catch (error) {
        console.error('💥 Fatal error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
function printExecutionSummary(results) {
    const summary = {
        totalIntervals: results.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        successfulIntervals: results.filter(r => r.success).map(r => r.interval),
        failedIntervals: results.filter(r => !r.success).map(r => ({
            interval: r.interval,
            error: r.error || 'Unknown error'
        }))
    };
    console.log('📊 EXECUTION SUMMARY');
    console.log('==========================================');
    console.log(`Total intervals processed: ${summary.totalIntervals}`);
    console.log(`Successful calls: ${summary.successCount}`);
    console.log(`Failed calls: ${summary.failureCount}`);
    console.log('');
    if (summary.successfulIntervals.length > 0) {
        console.log('✅ SUCCESSFUL TIME RANGES:');
        console.log('------------------------------------------');
        summary.successfulIntervals.forEach((interval, index) => {
            console.log(`${index + 1}. ${interval.startFormatted} - ${interval.endFormatted}`);
        });
        console.log('');
    }
    if (summary.failedIntervals.length > 0) {
        console.log('❌ FAILED TIME RANGES:');
        console.log('------------------------------------------');
        summary.failedIntervals.forEach((failed, index) => {
            console.log(`${index + 1}. ${failed.interval.startFormatted} - ${failed.interval.endFormatted}`);
            console.log(`   Error: ${failed.error}`);
            console.log('');
        });
    }
    const successRate = ((summary.successCount / summary.totalIntervals) * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);
    if (summary.failureCount > 0) {
        console.log('');
        console.log('⚠️  Some intervals failed. Check the error details above.');
    }
    else {
        console.log('');
        console.log('🎉 All intervals processed successfully!');
    }
}
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map