import * as fs from 'fs';
import * as path from 'path';
import { ProcessingStats, FailedAccount } from './types';

export class ReportGenerator {
  /**
   * Format execution time from milliseconds to human readable format
   */
  private formatExecutionTime(executionTimeMs: number): string {
    if (executionTimeMs < 1000) {
      return `${executionTimeMs}ms`;
    }
    
    const seconds = Math.floor(executionTimeMs / 1000);
    const remainingMs = executionTimeMs % 1000;
    
    if (seconds < 60) {
      return remainingMs > 0 ? `${seconds}.${Math.floor(remainingMs / 100)}s` : `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  /**
   * Generate a detailed text report of processing results
   */
  generateTextReport(stats: ProcessingStats): string {
    const timestamp = new Date().toISOString();
    
    let report = `Impact Groups Processing Report\n`;
    report += `Generated: ${timestamp}\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    report += `SUMMARY:\n`;
    report += `- Total accounts processed: ${stats.totalProcessed}\n`;
    report += `- Successful: ${stats.successful}\n`;
    report += `- Failed: ${stats.failed}\n`;
    report += `- Success rate: ${stats.totalProcessed > 0 ? ((stats.successful / stats.totalProcessed) * 100).toFixed(2) : 0}%\n`;
    
    if (stats.executionTimeMs) {
      report += `- Execution time: ${this.formatExecutionTime(stats.executionTimeMs)}\n`;
    }
    
    report += `\n`;
    
    if (stats.failedAccounts.length > 0) {
      report += `FAILED ACCOUNTS:\n`;
      report += `${'='.repeat(20)}\n`;
      
      // Group failures by error type for better readability
      const errorGroups = new Map<string, FailedAccount[]>();
      for (const failed of stats.failedAccounts) {
        const existing = errorGroups.get(failed.error) || [];
        existing.push(failed);
        errorGroups.set(failed.error, existing);
      }
      
      for (const [error, accounts] of errorGroups.entries()) {
        report += `\nError: ${error}\n`;
        report += `Affected accounts (${accounts.length}):\n`;
        for (const account of accounts) {
          report += `  - Account ID: ${account.accountId}, Impact Group: ${account.impactGroupSlug}\n`;
        }
      }
    } else {
      report += `🎉 All accounts processed successfully!\n`;
    }
    
    return report;
  }

  /**
   * Generate CSV content for failed accounts (same format as input CSV)
   */
  generateFailedAccountsCsv(failedAccounts: FailedAccount[]): string {
    if (failedAccounts.length === 0) {
      return 'ACCOUNT_ID_INT,IMPACT_GROUP_SLUG\n'; // Header only
    }
    
    let csv = 'ACCOUNT_ID_INT,IMPACT_GROUP_SLUG\n';
    for (const account of failedAccounts) {
      csv += `${account.accountId},${account.impactGroupSlug}\n`;
    }
    
    return csv;
  }

  /**
   * Save both text report and failed accounts CSV
   */
  async saveReports(stats: ProcessingStats): Promise<{ reportPath: string; csvPath: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFilename = `report_${timestamp}.txt`;
    const csvFilename = `failed_accounts_${timestamp}.csv`;
    
    const reportPath = path.resolve(reportFilename);
    const csvPath = path.resolve(csvFilename);
    
    try {
      // Generate and save text report
      const textReport = this.generateTextReport(stats);
      await fs.promises.writeFile(reportPath, textReport, 'utf8');
      
      // Generate and save failed accounts CSV
      const csvContent = this.generateFailedAccountsCsv(stats.failedAccounts);
      await fs.promises.writeFile(csvPath, csvContent, 'utf8');
      
      console.log(`\n📊 Reports generated:`);
      console.log(`- Detailed report: ${reportPath}`);
      console.log(`- Failed accounts CSV: ${csvPath}`);
      
      return { reportPath, csvPath };
      
    } catch (error: any) {
      console.error(`Error saving reports: ${error.message}`);
      throw error;
    }
  }

  /**
   * Print summary to console
   */
  printSummary(stats: ProcessingStats): void {
    console.log(`\n${'='.repeat(50)}`);
    console.log('PROCESSING COMPLETE');
    console.log(`${'='.repeat(50)}`);
    console.log(`Total accounts processed: ${stats.totalProcessed}`);
    console.log(`✅ Successful: ${stats.successful}`);
    console.log(`❌ Failed: ${stats.failed}`);
    
    if (stats.totalProcessed > 0) {
      const successRate = ((stats.successful / stats.totalProcessed) * 100).toFixed(2);
      console.log(`📈 Success rate: ${successRate}%`);
    }
    
    if (stats.executionTimeMs) {
      console.log(`⏱️  Execution time: ${this.formatExecutionTime(stats.executionTimeMs)}`);
    }
    
    if (stats.failed > 0) {
      console.log(`\n⚠️  ${stats.failed} accounts failed processing. Check the generated reports for details.`);
    } else {
      console.log(`\n🎉 All accounts processed successfully!`);
    }
  }
}