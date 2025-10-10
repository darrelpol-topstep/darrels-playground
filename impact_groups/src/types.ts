export interface CsvRow {
  ACCOUNT_ID_INT: string;
  IMPACT_GROUP_SLUG: string;
  [key: string]: string; // Allow other columns that we'll ignore
}

export interface ProcessedAccount {
  accountId: number;
  impactGroupSlug: string;
}

export interface GroupedAccounts {
  groupSlug: string;
  accountIds: number[];
}

export interface ApiPayload {
  payload: GroupedAccounts[];
  maxAccounts?: number;
  batchSize?: number;
}

export interface FailedAccount {
  accountId: number;
  impactGroupSlug: string;
  error: string;
}

export interface ProcessingStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  failedAccounts: FailedAccount[];
  startTime: Date;
  endTime?: Date;
  executionTimeMs?: number;
}

export interface Config {
  authToken: string;
  batchSize: number;
  csvFilename: string;
  apiUrl: string;
  maxAccounts: number;
  apiMaxAccounts?: number;
  apiBatchSize?: number;
}

export interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
}