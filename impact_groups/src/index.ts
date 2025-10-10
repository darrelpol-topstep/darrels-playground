import * as dotenv from 'dotenv';
import { CsvProcessor } from './csvProcessor';
import { BatchProcessor } from './batchProcessor';
import { ApiClient } from './apiClient';
import { ReportGenerator } from './reportGenerator';
import { Config, ProcessedAccount, ProcessingStats, FailedAccount } from './types';

// Load environment variables
dotenv.config();

class ImpactGroupsProcessor {
  private csvProcessor: CsvProcessor;
  private batchProcessor: BatchProcessor;
  private apiClient: ApiClient;
  private reportGenerator: ReportGenerator;
  private config: Config;
  private stats: ProcessingStats;

  constructor() {
    this.config = this.loadConfig();
    this.csvProcessor = new CsvProcessor();
    this.batchProcessor = new BatchProcessor();
    this.apiClient = new ApiClient(this.config);
    this.reportGenerator = new ReportGenerator();
    this.stats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      failedAccounts: [],
      startTime: new Date()
    };
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): Config {
    const authToken = process.env.AUTH_TOKEN;
    const batchSize = parseInt(process.env.BATCH_SIZE || '100', 10);
    const csvFilename = process.env.CSV_FILENAME || 'test_impact_groups.csv';
    const maxAccounts = parseInt(process.env.MAX_ACCOUNTS || '1000', 10);
    const apiMaxAccounts = process.env.API_MAX_ACCOUNTS ? parseInt(process.env.API_MAX_ACCOUNTS, 10) : undefined;
    const apiBatchSize = process.env.API_BATCH_SIZE ? parseInt(process.env.API_BATCH_SIZE, 10) : undefined;
    const apiUrl = process.env.API_URL || 'https://staging-trm-api.topstep.com/admin/impact-groups/accounts/enqueue-account-assignments';

    if (!authToken) {
      throw new Error('AUTH_TOKEN is required. Please set it in your .env file.');
    }

    if (isNaN(batchSize) || batchSize <= 0) {
      throw new Error('BATCH_SIZE must be a positive number.');
    }

    if (isNaN(maxAccounts) || maxAccounts <= 0) {
      throw new Error('MAX_ACCOUNTS must be a positive number.');
    }

    if (apiMaxAccounts !== undefined && (isNaN(apiMaxAccounts) || apiMaxAccounts <= 0)) {
      throw new Error('API_MAX_ACCOUNTS must be a positive number if provided.');
    }

    if (apiBatchSize !== undefined && (isNaN(apiBatchSize) || apiBatchSize <= 0)) {
      throw new Error('API_BATCH_SIZE must be a positive number if provided.');
    }

    console.log(`Configuration loaded:`);
    console.log(`- CSV Filename: ${csvFilename}`);
    console.log(`- Batch Size: ${batchSize}`);
    console.log(`- Max Accounts: ${maxAccounts}`);
    if (apiMaxAccounts !== undefined) {
      console.log(`- API Max Accounts Override: ${apiMaxAccounts}`);
    }
    if (apiBatchSize !== undefined) {
      console.log(`- API Batch Size Override: ${apiBatchSize}`);
    }
    console.log(`- API URL: ${apiUrl}`);
    console.log(`- Auth Token: ${authToken.substring(0, 10)}...`);

    return {
      authToken,
      batchSize,
      csvFilename,
      apiUrl,
      maxAccounts,
      apiMaxAccounts,
      apiBatchSize
    };
  }

  /**
   * Process a single batch and track results
   */
  private async processBatch(
    batch: ProcessedAccount[], 
    batchIndex: number, 
    totalBatches: number
  ): Promise<void> {
    console.log(`\n📦 Processing batch ${batchIndex + 1} of ${totalBatches} (${batch.length} accounts)`);
    
    try {
      // Create API payload with optional API override parameters
      const payload = this.batchProcessor.processBatch(batch, this.config.apiMaxAccounts, this.config.apiBatchSize);
      
      console.log(`   Grouped into ${payload.payload.length} impact groups`);
      
      // Log API override parameters if used
      if (payload.maxAccounts || payload.batchSize) {
        const overrides: string[] = [];
        if (payload.maxAccounts) overrides.push(`maxAccounts: ${payload.maxAccounts}`);
        if (payload.batchSize) overrides.push(`batchSize: ${payload.batchSize}`);
        console.log(`   🔧 API overrides: ${overrides.join(', ')}`);
      }
      
      // Log the groups being processed with detailed account counts
      for (const group of payload.payload) {
        console.log(`   - ${group.groupSlug}: ${group.accountIds.length} accounts`);
        if (group.accountIds.length > 200) {
          console.log(`     ⚠️  WARNING: Group has ${group.accountIds.length} accounts, which exceeds 200!`);
        }
      }
      
      // Log the complete API payload for debugging
      console.log(`   🔍 Complete API Payload:`);
      console.log(JSON.stringify(payload, null, 2));
      
      // Make API request
      const response = await this.apiClient.makeApiRequestWithRetry(payload);
      
      if (response.success) {
        console.log(`   ✅ Batch ${batchIndex + 1} completed successfully`);
        this.stats.successful += batch.length;
      } else {
        console.log(`   ❌ Batch ${batchIndex + 1} failed: ${response.error}`);
        this.stats.failed += batch.length;
        
        // Add all accounts in this batch to failed accounts
        for (const account of batch) {
          this.stats.failedAccounts.push({
            accountId: account.accountId,
            impactGroupSlug: account.impactGroupSlug,
            error: response.error || 'Unknown error'
          });
        }
      }
      
    } catch (error: any) {
      console.log(`   ❌ Batch ${batchIndex + 1} failed with exception: ${error.message}`);
      this.stats.failed += batch.length;
      
      // Add all accounts in this batch to failed accounts
      for (const account of batch) {
        this.stats.failedAccounts.push({
          accountId: account.accountId,
          impactGroupSlug: account.impactGroupSlug,
          error: error.message || 'Unknown error'
        });
      }
    }
    
    this.stats.totalProcessed += batch.length;
    
    // Show current progress
    const successRate = this.stats.totalProcessed > 0 ? 
      ((this.stats.successful / this.stats.totalProcessed) * 100).toFixed(1) : '0';
    
    console.log(`   📊 Progress: ${this.stats.totalProcessed} processed, ${this.stats.successful} successful (${successRate}%)`);
  }

  /**
   * Main processing method
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Starting Impact Groups Processor\n');
      
      // Step 1: Read CSV file
      console.log('📄 Reading CSV file...');
      let accounts = await this.csvProcessor.readCsvFile(this.config.csvFilename);
      
      if (accounts.length === 0) {
        console.log('❌ No valid accounts found in CSV file.');
        return;
      }
      
      // Step 1.5: Limit accounts to maximum if specified
      if (accounts.length > this.config.maxAccounts) {
        console.log(`⚠️  Found ${accounts.length} accounts, but limiting to ${this.config.maxAccounts} accounts as configured.`);
        accounts = accounts.slice(0, this.config.maxAccounts);
      }
      
      console.log(`📊 Processing ${accounts.length} accounts total`);
      
      // Step 2: Create batches
      console.log(`\n📦 Creating batches (size: ${this.config.batchSize})...`);
      const batches = this.batchProcessor.createBatches(accounts, this.config.batchSize);
      
      // Step 3: Process batches
      console.log(`\n⚙️  Processing ${batches.length} batches...`);
      
      for (let i = 0; i < batches.length; i++) {
        await this.processBatch(batches[i], i, batches.length);
        
        // Add a small delay between batches to be nice to the API
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Step 4: Calculate execution time
      this.stats.endTime = new Date();
      this.stats.executionTimeMs = this.stats.endTime.getTime() - this.stats.startTime.getTime();
      
      // Step 5: Generate reports
      console.log(`\n📊 Generating reports...`);
      await this.reportGenerator.saveReports(this.stats);
      
      // Step 6: Print final summary
      this.reportGenerator.printSummary(this.stats);
      
    } catch (error: any) {
      console.error(`\n💥 Fatal error: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the processor
async function main() {
  const processor = new ImpactGroupsProcessor();
  await processor.run();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}