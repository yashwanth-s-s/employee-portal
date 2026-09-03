import prisma from '../database/prisma.js';

/**
 * Centralized Audit Logging Service
 * Records system events, authentication, role changes, and access violations.
 */
export const auditService = {
  /**
   * Write an entry into the AuditLog table.
   * @param {Object} params
   * @param {number|null} [params.userId]
   * @param {string} params.action - e.g. 'LOGIN_SUCCESS', 'UNAUTHORIZED_ACCESS_ATTEMPT'
   * @param {string} params.resource - e.g. 'AUTH', 'ZOHO_PEOPLE', 'USERS_MANAGEMENT'
   * @param {string|Object} [params.details] - Description or JSON payload
   * @param {string} [params.ipAddress] - Client IP address
   */
  async createAuditLog({ userId = null, action, resource, details = null, ipAddress = null }) {
    try {
      const detailsStr = typeof details === 'object' && details !== null
        ? JSON.stringify(details)
        : (details ? String(details) : null);

      return await prisma.auditLog.create({
        data: {
          userId: userId ? Number(userId) : null,
          action,
          resource,
          details: detailsStr,
          ipAddress: ipAddress || 'Unknown'
        }
      });
    } catch (err) {
      console.error('Failed to create audit log entry:', err.message);
      // We do not throw from audit logger to prevent failing the primary user operation,
      // but we log clearly to server stderr.
      return null;
    }
  },

  /**
   * Retrieve audit logs with pagination and optional filters.
   * @param {Object} options
   * @param {number} [options.limit=50]
   * @param {number} [options.offset=0]
   * @param {string} [options.action]
   * @param {string} [options.resource]
   * @param {number} [options.userId]
   */
  async getAuditLogs({ limit = 50, offset = 0, action, resource, userId } = {}) {
    const where = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (userId) where.userId = Number(userId);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs, total, limit: Number(limit), offset: Number(offset) };
  }
};
