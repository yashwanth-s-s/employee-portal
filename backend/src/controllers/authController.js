import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma.js';
import { config } from '../config/index.js';
import { rbacService } from '../services/rbacService.js';
import { auditService } from '../services/auditService.js';

export const authController = {
  /**
   * POST /api/auth/login
   * Authenticate employee and issue signed JWT.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please provide both email and password.'
        });
      }

      // 1. Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user) {
        await auditService.createAuditLog({
          action: 'LOGIN_FAILED',
          resource: 'AUTH',
          details: { email, reason: 'User not found' },
          ipAddress
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      // 2. Verify account is active
      if (!user.isActive) {
        await auditService.createAuditLog({
          userId: user.id,
          action: 'LOGIN_FAILED',
          resource: 'AUTH',
          details: { email, reason: 'Account deactivated' },
          ipAddress
        });

        return res.status(403).json({
          success: false,
          error: 'This account has been deactivated. Please contact your system administrator.'
        });
      }

      // 3. Verify password hash
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        await auditService.createAuditLog({
          userId: user.id,
          action: 'LOGIN_FAILED',
          resource: 'AUTH',
          details: { email, reason: 'Incorrect password' },
          ipAddress
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      // 4. Fetch roles and permissions
      const roles = await rbacService.getUserRoles(user.id);
      const permissions = await rbacService.getUserPermissions(user.id);

      // 5. Generate signed JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      // 6. Record successful login audit log
      await auditService.createAuditLog({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'AUTH',
        details: { roles: roles.map((r) => r.name) },
        ipAddress
      });

      return res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: roles.map((r) => r.name),
          permissions
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   * Return currently authenticated user profile with refreshed roles and permissions.
   */
  async getMe(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      const roles = await rbacService.getUserRoles(user.id);
      const permissions = await rbacService.getUserPermissions(user.id);

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt,
          roles: roles.map((r) => r.name),
          permissions
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   * Optional server-side audit recording for user logout.
   */
  async logout(req, res, next) {
    try {
      if (req.user) {
        await auditService.createAuditLog({
          userId: req.user.id,
          action: 'LOGOUT',
          resource: 'AUTH',
          details: 'User logged out',
          ipAddress: req.ip || req.connection?.remoteAddress
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
};
