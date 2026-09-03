import { ZOHO_APPS } from '../config/zohoApps.js';
import { rbacService } from '../services/rbacService.js';
import { zohoService } from '../services/zohoService.js';
import { auditService } from '../services/auditService.js';

export const zohoController = {
  /**
   * GET /api/zoho/apps
   * Return only the Zoho applications the authenticated user has permission to access.
   */
  async getAuthorizedApps(req, res, next) {
    try {
      const userId = req.user.id;
      const isAdmin = await rbacService.hasRole(userId, 'Admin');
      const userPermissions = await rbacService.getUserPermissions(userId);

      // Filter apps strictly according to user permissions (or all if Admin)
      const authorizedApps = Object.values(ZOHO_APPS).filter((app) => {
        return isAdmin || userPermissions.includes(app.permission);
      });

      // Audit log the retrieval of authorized apps
      await auditService.createAuditLog({
        userId,
        action: 'FETCH_AUTHORIZED_APPS',
        resource: 'ZOHO_CATALOG',
        details: { count: authorizedApps.length, apps: authorizedApps.map((a) => a.name) },
        ipAddress: req.ip || req.connection?.remoteAddress
      });

      return res.status(200).json({
        success: true,
        apps: authorizedApps
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/zoho/launch/:appKey
   * Record audit log when an employee opens/launches an authorized Zoho application.
   */
  async recordAppLaunch(req, res, next) {
    try {
      const { appKey } = req.params;
      const app = ZOHO_APPS[appKey.toUpperCase()];

      if (!app) {
        return res.status(404).json({ success: false, error: 'Zoho application not found in catalog.' });
      }

      // Verify authorization
      const hasAccess = await rbacService.hasPermission(req.user.id, app.permission);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Unauthorized to launch this application.' });
      }

      await auditService.createAuditLog({
        userId: req.user.id,
        action: 'ZOHO_APP_ACCESSED',
        resource: app.name,
        details: { targetUrl: app.url },
        ipAddress: req.ip || req.connection?.remoteAddress
      });

      return res.status(200).json({
        success: true,
        message: `Audit recorded for launch of ${app.name}`,
        url: app.url
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/zoho/status
   * Reports Zoho OAuth configuration health without exposing secrets.
   */
  async getStatus(req, res, next) {
    try {
      const status = zohoService.getStatus();
      return res.status(200).json({
        success: true,
        status
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generic handler to proxy requests to Zoho APIs
   */
  async handleProxy(serviceName, defaultSubPath, req, res, next) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    try {
      // If Zoho credentials are not configured, return clear error message
      if (!zohoService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: `Zoho integration is not configured. Please add ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN to backend/.env to connect to live ${serviceName}.`,
          configured: false,
          service: serviceName,
          hint: 'Refer to README.md section "Zoho One Integration Setup" for instructions.'
        });
      }

      // Construct target URL using subpath if provided
      const subPath = req.params[0] ? `/${req.params[0]}` : defaultSubPath;

      await auditService.createAuditLog({
        userId: req.user.id,
        action: 'ZOHO_API_REQUEST',
        resource: serviceName,
        details: { subPath, method: req.method },
        ipAddress
      });

      const response = await zohoService.request({
        url: subPath,
        method: req.method,
        params: req.query,
        data: req.body
      });

      return res.status(200).json({
        success: true,
        source: 'zoho_live_api',
        data: response
      });
    } catch (err) {
      if (err.code === 'ZOHO_NOT_CONFIGURED') {
        return res.status(503).json({
          success: false,
          error: err.message,
          configured: false
        });
      }

      if (err.code === 'ZOHO_OAUTH_FAILED' || err.code === 'ZOHO_TOKEN_EXCHANGE_ERROR') {
        return res.status(502).json({
          success: false,
          error: err.message,
          code: err.code,
          details: err.details || null
        });
      }

      next(err);
    }
  },

  // Zoho People API Proxy
  async proxyPeople(req, res, next) {
    return zohoController.handleProxy('Zoho People', '/people/api/forms', req, res, next);
  },

  // Zoho CRM API Proxy
  async proxyCrm(req, res, next) {
    return zohoController.handleProxy('Zoho CRM', '/crm/v2/org', req, res, next);
  },

  // Zoho Desk API Proxy
  async proxyDesk(req, res, next) {
    return zohoController.handleProxy('Zoho Desk', '/desk/api/v1/organizations', req, res, next);
  },

  // Zoho Books API Proxy
  async proxyBooks(req, res, next) {
    return zohoController.handleProxy('Zoho Books', '/books/v3/organizations', req, res, next);
  }
};
