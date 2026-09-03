import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { rbacService } from '../services/rbacService.js';
import { auditService } from '../services/auditService.js';
import prisma from '../database/prisma.js';

/**
 * Middleware: Verify Bearer JWT and attach validated user object to req.user.
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token missing. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // Verify user exists and remains active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'User account has been deactivated. Contact an administrator.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Your session has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.'
    });
  }
}

/**
 * Middleware: Enforce role-based access control.
 * Admins are automatically granted access.
 * @param {string|string[]} allowedRoles
 */
export function requireRole(...allowedRoles) {
  const roles = allowedRoles.flat();

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    try {
      const userRoles = await rbacService.getUserRoles(req.user.id);
      const userRoleNames = userRoles.map((r) => r.name);

      const hasAdmin = userRoleNames.includes('Admin');
      const hasAllowedRole = hasAdmin || roles.some((role) => userRoleNames.includes(role));

      if (!hasAllowedRole) {
        // Log unauthorized attempt
        await auditService.createAuditLog({
          userId: req.user.id,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          resource: req.originalUrl,
          details: {
            reason: 'Missing required role',
            requiredRoles: roles,
            userRoles: userRoleNames
          },
          ipAddress: req.ip || req.connection?.remoteAddress
        });

        return res.status(403).json({
          success: false,
          error: `Forbidden: This resource requires one of the following roles: [${roles.join(', ')}].`
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware: Enforce permission-based access control.
 * Admins are automatically granted access.
 * @param {string|string[]} requiredPermissions
 */
export function requirePermission(...requiredPermissions) {
  const permissions = requiredPermissions.flat();

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    try {
      const isAdmin = await rbacService.hasRole(req.user.id, 'Admin');
      if (isAdmin) {
        return next();
      }

      const userPermissions = await rbacService.getUserPermissions(req.user.id);
      const hasAllPermissions = permissions.every((p) => userPermissions.includes(p));

      if (!hasAllPermissions) {
        // Log unauthorized attempt
        await auditService.createAuditLog({
          userId: req.user.id,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          resource: req.originalUrl,
          details: {
            reason: 'Missing required permission',
            requiredPermissions: permissions,
            userPermissions: userPermissions
          },
          ipAddress: req.ip || req.connection?.remoteAddress
        });

        return res.status(403).json({
          success: false,
          error: `Forbidden: You lack the required permission [${permissions.join(', ')}] to perform this action.`
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
