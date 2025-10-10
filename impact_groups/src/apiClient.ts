import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { ApiPayload, ApiResponse, Config } from './types';

export class ApiClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Make a POST request to the API with the given payload
   */
  async makeApiRequest(payload: ApiPayload): Promise<ApiResponse> {
    try {
      console.log(`🌐 Making API request to: ${this.config.apiUrl}`);
      console.log(`📤 Request payload:`, JSON.stringify(payload, null, 2));
      
      const response: AxiosResponse = await axios.post(
        this.config.apiUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.authToken}`
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return {
        success: true,
        message: response.data?.message || 'Request successful'
      };

    } catch (error: any) {
      // Check if it's a 401 (unauthorized) error
      if (error.response?.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }

      // Handle other API errors
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Unknown API error';

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Handle token expiration by prompting user to update .env and reload config
   */
  async handleTokenExpiration(): Promise<Config> {
    console.log('\n⚠️  Auth token has expired. Please update the AUTH_TOKEN in your .env file and press Enter to continue...');
    
    // Wait for user to press Enter
    await this.waitForEnter();
    
    // Reload environment variables
    dotenv.config({ override: true });
    
    const newAuthToken = process.env.AUTH_TOKEN;
    if (!newAuthToken) {
      throw new Error('AUTH_TOKEN not found in .env file. Please ensure it is set.');
    }
    
    // Update config with new token
    this.config.authToken = newAuthToken;
    
    console.log('✅ Token updated successfully. Continuing processing...\n');
    
    return this.config;
  }

  /**
   * Wait for user to press Enter
   */
  private async waitForEnter(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
  }

  /**
   * Make API request with token expiration handling
   */
  async makeApiRequestWithRetry(payload: ApiPayload): Promise<ApiResponse> {
    try {
      return await this.makeApiRequest(payload);
    } catch (error: any) {
      if (error.message === 'TOKEN_EXPIRED') {
        // Handle token expiration
        await this.handleTokenExpiration();
        
        // Retry the request with the new token
        return await this.makeApiRequest(payload);
      }
      
      // Re-throw other errors
      throw error;
    }
  }
}