import { ProcessedAccount, GroupedAccounts, ApiPayload } from './types';

export class BatchProcessor {
  /**
   * Split accounts into batches of specified size
   */
  createBatches(accounts: ProcessedAccount[], batchSize: number): ProcessedAccount[][] {
    const batches: ProcessedAccount[][] = [];
    
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    console.log(`Created ${batches.length} batches from ${accounts.length} accounts`);
    return batches;
  }

  /**
   * Group accounts within a batch by their impact group slug
   */
  groupAccountsBySlug(batch: ProcessedAccount[]): GroupedAccounts[] {
    const groupMap = new Map<string, number[]>();
    
    // Group accounts by slug
    for (const account of batch) {
      const existingAccounts = groupMap.get(account.impactGroupSlug) || [];
      existingAccounts.push(account.accountId);
      groupMap.set(account.impactGroupSlug, existingAccounts);
    }
    
    // Convert map to array format required by API
    const grouped: GroupedAccounts[] = [];
    for (const [slug, accountIds] of groupMap.entries()) {
      grouped.push({
        groupSlug: slug,
        accountIds: accountIds
      });
    }
    
    return grouped;
  }

  /**
   * Create API payload from grouped accounts with optional API override parameters
   */
  createApiPayload(groupedAccounts: GroupedAccounts[], apiMaxAccounts?: number, apiBatchSize?: number): ApiPayload {
    const payload: ApiPayload = {
      payload: groupedAccounts
    };
    
    if (apiMaxAccounts !== undefined) {
      payload.maxAccounts = apiMaxAccounts;
    }
    
    if (apiBatchSize !== undefined) {
      payload.batchSize = apiBatchSize;
    }
    
    return payload;
  }

  /**
   * Process a batch: group accounts and create API payload
   */
  processBatch(batch: ProcessedAccount[], apiMaxAccounts?: number, apiBatchSize?: number): ApiPayload {
    const grouped = this.groupAccountsBySlug(batch);
    return this.createApiPayload(grouped, apiMaxAccounts, apiBatchSize);
  }
}