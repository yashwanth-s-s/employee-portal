import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All admin endpoints require authentication and Admin role
router.use(authenticateToken);
router.use(requireRole('Admin'));

// User Management Routes
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Role Management Routes
router.get('/roles', adminController.getRoles);
router.post('/roles', adminController.createRole);
router.put('/roles/:id', adminController.updateRole);
router.delete('/roles/:id', adminController.deleteRole);

// Permissions Catalog Route
router.get('/permissions', adminController.getPermissions);

// Audit Logs Route
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
