"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const API_ENDPOINT = 'https://trm-api.topstep.com/admin/accounts/syncTimeIntervalTopstepX';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
class SyncApiClient {
    constructor(bearerToken) {
        this.bearerToken = bearerToken;
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    calculateRetryDelay(attempt) {
        return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
    }
    async syncInterval(interval, retryCount = 0) {
        const requestData = {
            startTime: interval.startFormatted,
            endTime: interval.endFormatted
        };
        try {
            console.log(`Calling API for interval: ${interval.startFormatted} - ${interval.endFormatted}`);
            const response = await axios_1.default.post(API_ENDPOINT, requestData, {
                headers: {
                    'Authorization': `Bearer ${this.bearerToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            console.log(`✅ Success for interval: ${interval.startFormatted} - ${interval.endFormatted}`);
            return {
                interval,
                success: true,
                response: response.data
            };
        }
        catch (error) {
            const errorMessage = this.getErrorMessage(error);
            console.log(`❌ Error for interval ${interval.startFormatted} - ${interval.endFormatted}: ${errorMessage}`);
            if (retryCount < MAX_RETRIES && this.shouldRetry(error)) {
                const delayMs = this.calculateRetryDelay(retryCount);
                console.log(`🔄 Retrying in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                await this.delay(delayMs);
                return this.syncInterval(interval, retryCount + 1);
            }
            return {
                interval,
                success: false,
                error: errorMessage
            };
        }
    }
    shouldRetry(error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ENOTFOUND') {
                return true;
            }
            if (axiosError.response?.status) {
                const status = axiosError.response.status;
                return status >= 500 || status === 429 || status === 408;
            }
            return true;
        }
        return false;
    }
    getErrorMessage(error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (axiosError.response) {
                return `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}${axiosError.response.data ? ` - ${JSON.stringify(axiosError.response.data)}` : ''}`;
            }
            else if (axiosError.request) {
                return `Network error: ${axiosError.message}`;
            }
        }
        return error?.message || 'Unknown error';
    }
}
exports.SyncApiClient = SyncApiClient;
//# sourceMappingURL=apiClient.js.map