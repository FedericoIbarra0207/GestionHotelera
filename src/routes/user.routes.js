import { Router } from 'express';
import { listUsers } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = Router();

// Listar usuarios (solo ADMIN)
router.get('/', authMiddleware, roleMiddleware('ADMIN'), listUsers);

export default router;
