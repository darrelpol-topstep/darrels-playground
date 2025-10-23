export interface SyncApiRequest {
    startTime: string;
    endTime: string;
}
export interface SyncApiResponse {
    success?: boolean;
    message?: string;
    data?: any;
}
export interface TimeInterval {
    start: Date;
    end: Date;
    startFormatted: string;
    endFormatted: string;
}
export interface ProcessingResult {
    interval: TimeInterval;
    success: boolean;
    error?: string;
    response?: SyncApiResponse;
}
export interface ExecutionSummary {
    totalIntervals: number;
    successCount: number;
    failureCount: number;
    successfulIntervals: TimeInterval[];
    failedIntervals: Array<{
        interval: TimeInterval;
        error: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map