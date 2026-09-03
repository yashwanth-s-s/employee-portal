import { Router } from 'express';
import { zohoController } from '../controllers/zohoController.js';
import { authenticateToken, requirePermission, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All Zoho routes require valid authentication
router.use(authenticateToken);

// 1. Authorized Application Catalog - dynamically filtered by role/permissions
router.get('/apps', zohoController.getAuthorizedApps);

// 2. Application launch tracking
router.post('/launch/:appKey', zohoController.recordAppLaunch);

// 3. Integration Health & Configuration Status
router.get('/status', requireRole('Admin'), zohoController.getStatus);

// 4. Zoho People Proxy Routes (Protected by VIEW_ZOHO_PEOPLE)
router.get('/people', requirePermission('VIEW_ZOHO_PEOPLE'), zohoController.proxyPeople);
router.all('/people/*', requirePermission('VIEW_ZOHO_PEOPLE'), zohoController.proxyPeople);

// 5. Zoho CRM Proxy Routes (Protected by VIEW_ZOHO_CRM)
router.get('/crm', requirePermission('VIEW_ZOHO_CRM'), zohoController.proxyCrm);
router.all('/crm/*', requirePermission('VIEW_ZOHO_CRM'), zohoController.proxyCrm);

// 6. Zoho Desk Proxy Routes (Protected by VIEW_ZOHO_DESK)
router.get('/desk', requirePermission('VIEW_ZOHO_DESK'), zohoController.proxyDesk);
router.all('/desk/*', requirePermission('VIEW_ZOHO_DESK'), zohoController.proxyDesk);

// 7. Zoho Books Proxy Routes (Protected by VIEW_ZOHO_BOOKS)
router.get('/books', requirePermission('VIEW_ZOHO_BOOKS'), zohoController.proxyBooks);
router.all('/books/*', requirePermission('VIEW_ZOHO_BOOKS'), zohoController.proxyBooks);

export default router;
