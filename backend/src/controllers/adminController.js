import bcrypt from 'bcryptjs';
import prisma from '../database/prisma.js';
import { auditService } from '../services/auditService.js';

export const adminController = {
  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  /**
   * GET /api/admin/users
   * List all users with assigned roles.
   */
  async getUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: {
              role: {
                select: { id: true, name: true, description: true }
              }
            }
          }
        },
        orderBy: { id: 'asc' }
      });

      const formatted = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        roles: u.userRoles.map((ur) => ur.role)
      }));

      return res.status(200).json({ success: true, users: formatted });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/users
   * Create new user with hashed password and assigned role.
   */
  async createUser(req, res, next) {
    try {
      const { name, email, password, roleId, isActive = true } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and password are required fields.'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address format.'
        });
      }

      // Check for existing email
      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'A user with this email address already exists.'
        });
      }

      // Hash password with bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          isActive: Boolean(isActive)
        }
      });

      // Assign role if provided
      let assignedRole = null;
      if (roleId) {
        const role = await prisma.role.findUnique({ where: { id: Number(roleId) } });
        if (role) {
          await prisma.userRole.create({
            data: {
              userId: newUser.id,
              roleId: role.id
            }
          });
          assignedRole = role.name;
        }
      }

      await auditService.createAuditLog({
        userId: req.user.id,
        action: 'USER_CREATED',
        resource: 'USERS_MANAGEMENT',
        details: { createdUserId: newUser.id, email: newUser.email, role: assignedRole },
        ipAddress
      });

      return res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isActive: newUser.isActive,
          role: assignedRole
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/users/:id
   * Update existing user's details, active state, password, and role.
   */
  async updateUser(req, res, next) {
    try {
      const userId = Number(req.params.id);
      const { name, email, password, isActive, roleId } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      // Prevent deactivating own account
      if (req.user.id === userId && isActive === false) {
        return res.status(400).json({
          success: false,
          error: 'You cannot deactivate your own administrative account.'
        });
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (typeof isActive === 'boolean') updateData.isActive = isActive;

      if (email && email.toLowerCase().trim() !== user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() }
        });
        if (existing && existing.id !== userId) {
          return res.status(409).json({ success: false, error: 'Email is already in use by another user.' });
        }
        updateData.email = email.toLowerCase().trim();
      }

      if (password && password.trim().length > 0) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      // Update role assignment if roleId is specified
      if (roleId !== undefined) {
        await prisma.userRole.deleteMany({ where: { userId } });
        if (roleId) {
          await prisma.userRole.create({
            data: {
              userId,
              roleId: Number(roleId)
            }
          });
        }
      }

      await auditService.createAuditLog({
        userId: req.user.id,
        action: 'USER_UPDATED',
        resource: 'USERS_MANAGEMENT',
        details: { updatedUserId: userId, changes: Object.keys(updateData) },
        ipAddress
      });

      return res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          isActive: updatedUser.isActive
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/users/:id
   * Deactivates or removes a user.
   */
  async deleteUser(req, res, next) {
    try {
      const userId = Number(req.params.id);
      const ipAddress = req.ip || req.connection?.remoteAddress;

      if (req.user.id === userId) {
        return res.status(400).json({
          success: false,
          error: 'You cannot delete your own administrative account.'
        });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      // Delete user (cascade removes UserRole; AuditLog setNull)
      await prisma.user.delete({ where: { id: userId } });

      await auditService.createAuditLog({
        userId: req.user.id,
        action: 'USER_DELETED',
        resource: 'USERS_MANAGEMENT',
        details: { deletedUserId: userId, email: user.email },
        ipAddress
      });

      return res.status(200).json({
        success: true,
        message: `User ${user.email} has been permanently deleted.`
      });
    } catch (err) {
      next(err);
    }
  },

  // ==========================================
  // ROLE MANAGEMENT
  // ==========================================

  /**
   * GET /api/admin/roles
   * List all roles with associated permissions.
   */
  async getRoles(req, res, next) {
    try {
      const roles = await prisma.role.findMany({
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: { userRoles: true }
          }
        },
        orderBy: { id: 'asc' }
      });

      const formatted = roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        userCount: r._count.userRoles,
        permissions: r.rolePermissions.map((rp) => rp.permission)
      }));

      return res.status(200).json({ success: true, roles: formatted });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/roles
   * Create a new role with optional initial permissions.
   */
  async createRole(req, res, next) {
    try {
      const { name, description, permissionIds = [] } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress;

      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, error: 'Role name is required.' });
      }

      const existing = await prisma.role.findUnique({
        where: { name: name.trim() }
      });

      if (existing) {
        return res.status(409).json({ success: false, error: 'A role with this name already exists.' });
      }

      const newRole = await prisma.role.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null
        }
      });

      // Associate permissions
      if (Array.isArray(permissionIds) && permissionIds.length > 0) {
        const createData = permissionIds.map((pId) => ({
          roleId: newRole.id,
          permissionId: Number(pId)
        }));
        await prisma.rolePermission.createMany({ data: createData, skipDuplicates: true });
      }

      await auditService.createAuditLog({
        userId: req.user.id,
        action: 'ROLE_CREATED',
        resource: 'ROLES_MANAGEMENT',
        details: { roleId: newRole.id, name: newRole.name },
        ipAddress
      });

      return res.status(201).json({
        success: true,
        message: 'Role created successfully.',
        role: newRole
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/roles/:id
   * Update role metadata and sync permission assignments.
   */
  async updateRole(req, res, next) {
    try {
      const roleId = Number(req.params.id);
      const { name, description, permissionIds } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress;

      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return res.status(404).json({ success: false, error: 'Role not found.' });
      }

      // Update name and description if not protected
      const updatedRole = await prisma.role.update({
        where: { id: roleId },
        data: {
          name: name ? name.trim() : role.name,
          description: description !== undefined ? description : role.description
        }
      });

      // Update permissions if supplied
      if (Array.isArray(permissionIds)) {
        await prisma.rolePermission.deleteMany({ where: { roleId } });
        if (permissionIds.length > 0) {
          const createData = permissionIds.map((pId) => ({
            roleId,
            permissionId: Number(pId)
          }));
          await prisma.rolePermission.createMany({ data: createData, skipDuplicates: true });
        }
      }

      await auditService.createAuditLog({
        userId: req.user.id,
        action: 'ROLE_UPDATED',
        resource: 'ROLES_MANAGEMENT',
        details: { roleId, updatedName: updatedRole.name },
        ipAddress
      });

      return res.status(200).json({
        success: true,
        message: 'Role updated successfully.',
        role: updatedRole
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/roles/:id
   * Delete a custom role (built-in Admin, HR, Sales, Support, Finance cannot be deleted).
   */
  async deleteRole(req, res, next) {
    try {
      const roleId = Number(req.params.id);
      const ipAddress = req.ip || req.connection?.remoteAddress;

      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return res.status(404).json({ success: false, error: 'Role not found.' });
      }

      const protectedRoles = ['Admin', 'HR', 'Sales', 'Support', 'Finance'];
      if (protectedRoles.includes(role.name)) {
        return res.status(400).json({
          success: false,
          error: `Built-in role "${role.name}" cannot be deleted to ensure system stability.`
        });
      }

      await prisma.role.delete({ where: { id: roleId } });

      await auditService.createAuditLog({
        userId: req.user.id,
        action: 'ROLE_DELETED',
        resource: 'ROLES_MANAGEMENT',
        details: { roleId, name: role.name },
        ipAddress
      });

      return res.status(200).json({
        success: true,
        message: `Role "${role.name}" was deleted.`
      });
    } catch (err) {
      next(err);
    }
  },

  // ==========================================
  // PERMISSIONS
  // ==========================================

  /**
   * GET /api/admin/permissions
   * List all available permissions in the system.
   */
  async getPermissions(req, res, next) {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: { name: 'asc' }
      });
      return res.status(200).json({ success: true, permissions });
    } catch (err) {
      next(err);
    }
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================

  /**
   * GET /api/admin/audit-logs
   * Retrieve paginated audit log trail.
   */
  async getAuditLogs(req, res, next) {
    try {
      const { limit = 50, offset = 0, action, resource, userId } = req.query;
      const result = await auditService.getAuditLogs({
        limit: Math.min(Number(limit) || 50, 100),
        offset: Number(offset) || 0,
        action: action ? String(action) : undefined,
        resource: resource ? String(resource) : undefined,
        userId: userId ? Number(userId) : undefined
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }
};
