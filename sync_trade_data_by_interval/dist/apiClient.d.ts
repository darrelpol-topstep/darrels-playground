import { TimeInterval, ProcessingResult } from './types';
export declare class SyncApiClient {
    private bearerToken;
    constructor(bearerToken: string);
    private delay;
    private calculateRetryDelay;
    syncInterval(interval: TimeInterval, retryCount?: number): Promise<ProcessingResult>;
    private shouldRetry;
    private getErrorMessage;
}
//# sourceMappingURL=apiClient.d.ts.map