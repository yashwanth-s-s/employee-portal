import prisma from '../database/prisma.js';

/**
 * Reusable Role-Based Access Control (RBAC) Service
 * Encapsulates all role and permission verification queries.
 * Never trust role/permission strings sent by the client.
 */
export const rbacService = {
  /**
   * Fetch all roles assigned to a given user.
   * @param {number} userId 
   * @returns {Promise<Array<{ id: number, name: string, description: string }>>}
   */
  async getUserRoles(userId) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId: Number(userId) },
      include: {
        role: true
      }
    });
    return userRoles.map((ur) => ur.role);
  },

  /**
   * Fetch all unique permission names granted to a user through their assigned roles.
   * @param {number} userId 
   * @returns {Promise<string[]>} List of permission names (e.g. ['VIEW_ZOHO_PEOPLE', 'MANAGE_USERS'])
   */
  async getUserPermissions(userId) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId: Number(userId) },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const permissionSet = new Set();
    for (const ur of userRoles) {
      if (ur.role && ur.role.rolePermissions) {
        for (const rp of ur.role.rolePermissions) {
          if (rp.permission && rp.permission.name) {
            permissionSet.add(rp.permission.name);
          }
        }
      }
    }

    return Array.from(permissionSet);
  },

  /**
   * Check whether a user possesses a specific permission.
   * Admins automatically have all permissions.
   * @param {number} userId 
   * @param {string} permissionName 
   * @returns {Promise<boolean>}
   */
  async hasPermission(userId, permissionName) {
    // If user has Admin role, grant access
    const isAdmin = await this.hasRole(userId, 'Admin');
    if (isAdmin) return true;

    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionName);
  },

  /**
   * Check whether a user is assigned a specific role name.
   * @param {number} userId 
   * @param {string} roleName 
   * @returns {Promise<boolean>}
   */
  async hasRole(userId, roleName) {
    const roles = await this.getUserRoles(userId);
    return roles.some((r) => r.name.toLowerCase() === roleName.toLowerCase());
  }
};
