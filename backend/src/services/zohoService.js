import axios from 'axios';
import { config } from '../config/index.js';

/**
 * Zoho OAuth & API Service
 * Manages service account OAuth token acquisition and server-side API proxy requests.
 * Employees never possess or input Zoho credentials.
 */
class ZohoService {
  constructor() {
    this.cachedAccessToken = null;
    this.tokenExpiresAt = null; // Timestamp (ms)
    this.cachedForClientId = null;
    this.cachedForAccountsUrl = null;
  }

  /**
   * Check if the necessary Zoho credentials are configured in environment variables.
   * @returns {boolean}
   */
  isConfigured() {
    const { clientId, clientSecret, refreshToken } = config.zoho;
    return Boolean(
      clientId && clientId.trim() !== '' &&
      clientSecret && clientSecret.trim() !== '' &&
      refreshToken && refreshToken.trim() !== ''
    );
  }

  /**
   * Return non-sensitive configuration diagnostics for Admin UI or health check.
   */
  getStatus() {
    const isConfig = this.isConfigured();
    const missing = [];
    if (!config.zoho.clientId) missing.push('ZOHO_CLIENT_ID');
    if (!config.zoho.clientSecret) missing.push('ZOHO_CLIENT_SECRET');
    if (!config.zoho.refreshToken) missing.push('ZOHO_REFRESH_TOKEN');

    return {
      configured: isConfig,
      accountsUrl: config.zoho.accountsUrl,
      apiBaseUrl: config.zoho.apiBaseUrl,
      hasTokenCached: Boolean(this.cachedAccessToken && Date.now() < this.tokenExpiresAt),
      missingCredentials: missing,
      documentationGuide: 'See README.md section "Zoho One Integration Setup" for instructions on creating a Self Client and obtaining refresh tokens.'
    };
  }

  /**
   * Obtain a valid OAuth Access Token from Zoho.
   * Caches token in-memory and reuses it until 60 seconds prior to expiration.
   * @returns {Promise<string>}
   */
  async getAccessToken() {
    if (!this.isConfigured()) {
      const error = new Error(
        'Zoho OAuth credentials are not configured in backend/.env. Please configure ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN.'
      );
      error.code = 'ZOHO_NOT_CONFIGURED';
      error.status = 503;
      throw error;
    }

    // Invalidate cached token if clientId or accountsUrl changed in .env
    if (this.cachedForClientId !== config.zoho.clientId || this.cachedForAccountsUrl !== config.zoho.accountsUrl) {
      this.cachedAccessToken = null;
      this.tokenExpiresAt = null;
    }

    // Return cached token if valid with at least 60s safety buffer
    if (this.cachedAccessToken && this.tokenExpiresAt && (Date.now() + 60000) < this.tokenExpiresAt) {
      return this.cachedAccessToken;
    }

    try {
      const { accountsUrl, clientId, clientSecret, refreshToken } = config.zoho;
      const tokenEndpoint = `${accountsUrl.replace(/\/$/, '')}/oauth/v2/token`;

      const response = await axios.post(tokenEndpoint, null, {
        params: {
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token'
        },
        timeout: 10000
      });

      if (response.data.error) {
        const error = new Error(`Zoho OAuth Error: ${response.data.error}`);
        error.code = 'ZOHO_OAUTH_FAILED';
        error.status = 401;
        error.details = response.data;
        throw error;
      }

      const accessToken = response.data.access_token;
      const expiresInSec = response.data.expires_in || 3600;

      // Cache token and config markers
      this.cachedAccessToken = accessToken;
      this.tokenExpiresAt = Date.now() + (expiresInSec * 1000);
      this.cachedForClientId = clientId;
      this.cachedForAccountsUrl = accountsUrl;

      return accessToken;
    } catch (err) {
      if (err.code === 'ZOHO_NOT_CONFIGURED' || err.code === 'ZOHO_OAUTH_FAILED') {
        throw err;
      }
      const message = err.response?.data?.error || err.message;
      const error = new Error(`Failed to refresh Zoho access token: ${message}`);
      error.status = err.response?.status || 502;
      error.code = 'ZOHO_TOKEN_EXCHANGE_ERROR';
      throw error;
    }
  }

  /**
   * Proxy an authorized HTTP request to the designated Zoho API.
   * @param {Object} options
   * @param {string} options.url - Full URL or path relative to apiBaseUrl
   * @param {string} [options.method='GET']
   * @param {Object} [options.data]
   * @param {Object} [options.params]
   * @param {Object} [options.headers]
   */
  async request({ url, method = 'GET', data = null, params = {}, headers = {} }) {
    const accessToken = await this.getAccessToken();

    const fullUrl = url.startsWith('http')
      ? url
      : `${config.zoho.apiBaseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;

    try {
      const response = await axios({
        url: fullUrl,
        method,
        data,
        params,
        headers: {
          ...headers,
          Authorization: `Zoho-oauthtoken ${accessToken}`
        },
        timeout: 15000
      });

      return response.data;
    } catch (err) {
      const status = err.response?.status || 502;
      const responseData = err.response?.data;
      const error = new Error(responseData?.message || err.message || 'Zoho API request failed');
      error.status = status;
      error.code = 'ZOHO_API_REQUEST_FAILED';
      error.responseData = responseData;
      throw error;
    }
  }
}

export const zohoService = new ZohoService();
