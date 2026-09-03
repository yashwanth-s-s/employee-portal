import dotenv from 'dotenv';
dotenv.config();

export const config = {
  get port() {
    return parseInt(process.env.PORT || '5000', 10);
  },
  get jwtSecret() {
    return process.env.JWT_SECRET || 'employee_portal_default_dev_secret_change_me';
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '1h';
  },
  get databaseUrl() {
    return process.env.DATABASE_URL || 'file:./dev.db';
  },
  
  // Zoho One OAuth Service Account: Dynamic getters ensure changes to backend/.env are immediately reflected
  zoho: {
    get clientId() {
      dotenv.config();
      return (process.env.ZOHO_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
    },
    get clientSecret() {
      dotenv.config();
      return (process.env.ZOHO_CLIENT_SECRET || '').trim().replace(/^["']|["']$/g, '');
    },
    get refreshToken() {
      dotenv.config();
      return (process.env.ZOHO_REFRESH_TOKEN || '').trim().replace(/^["']|["']$/g, '');
    },
    get accountsUrl() {
      dotenv.config();
      return (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com').trim().replace(/^["']|["']$/g, '');
    },
    get apiBaseUrl() {
      dotenv.config();
      return (process.env.ZOHO_API_BASE_URL || 'https://www.zohoapis.com').trim().replace(/^["']|["']$/g, '');
    }
  }
};
