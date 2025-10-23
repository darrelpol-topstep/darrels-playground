import axios, { AxiosResponse, AxiosError } from 'axios';
import { SyncApiRequest, SyncApiResponse, TimeInterval, ProcessingResult } from './types';

const API_ENDPOINT = 'https://trm-api.topstep.com/admin/accounts/syncTimeIntervalTopstepX';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export class SyncApiClient {
  private bearerToken: string;

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(attempt: number): number {
    return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  }

  async syncInterval(interval: TimeInterval, retryCount = 0): Promise<ProcessingResult> {
    const requestData: SyncApiRequest = {
      startTime: interval.startFormatted,
      endTime: interval.endFormatted
    };

    try {
      console.log(`Calling API for interval: ${interval.startFormatted} - ${interval.endFormatted}`);
      console.log(`📤 Request payload: ${JSON.stringify(requestData, null, 2)}`);
      
      const response: AxiosResponse<SyncApiResponse> = await axios.post(
        API_ENDPOINT,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log(`✅ Success for interval: ${interval.startFormatted} - ${interval.endFormatted}`);
      
      return {
        interval,
        success: true,
        response: response.data,
        requestPayload: requestData
      };

    } catch (error) {
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
        error: errorMessage,
        requestPayload: requestData
      };
    }
  }

  private shouldRetry(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
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

  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        return `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}${axiosError.response.data ? ` - ${JSON.stringify(axiosError.response.data)}` : ''}`;
      } else if (axiosError.request) {
        return `Network error: ${axiosError.message}`;
      }
    }
    
    return error?.message || 'Unknown error';
  }
}