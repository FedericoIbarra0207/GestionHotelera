import { Router } from "express";
import { loginUser, requestPasswordReset, changePassword } from "../controllers/auth.controller.js";
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post("/login", loginUser);
// La solicitud es pública; el cambio requiere una sesión válida y la clave actual.
router.post("/forgot-password", requestPasswordReset);
router.post("/change-password", authMiddleware, changePassword);

export default router;
