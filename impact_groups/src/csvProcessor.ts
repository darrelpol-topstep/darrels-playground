import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import { CsvRow, ProcessedAccount } from './types';

export class CsvProcessor {
  async readCsvFile(csvFilename: string): Promise<ProcessedAccount[]> {
    const csvPath = path.resolve(csvFilename);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    console.log(`Reading CSV file: ${csvPath}`);
    
    const accounts: ProcessedAccount[] = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csvParser())
        .on('data', (row: CsvRow) => {
          // Extract only the required columns and validate
          const accountIdStr = row.ACCOUNT_ID_INT?.trim();
          const impactGroupSlug = row.IMPACT_GROUP_SLUG?.trim();
          
          if (!accountIdStr || !impactGroupSlug) {
            console.warn(`Skipping row with missing data - Account ID: ${accountIdStr}, Slug: ${impactGroupSlug}`);
            return;
          }
          
          const accountId = parseInt(accountIdStr, 10);
          if (isNaN(accountId)) {
            console.warn(`Skipping row with invalid account ID: ${accountIdStr}`);
            return;
          }
          
          accounts.push({
            accountId,
            impactGroupSlug
          });
        })
        .on('end', () => {
          console.log(`Successfully read ${accounts.length} valid accounts from CSV`);
          resolve(accounts);
        })
        .on('error', (error: any) => {
          console.error(`Error reading CSV file: ${error.message}`);
          reject(error);
        });
    });
  }
}