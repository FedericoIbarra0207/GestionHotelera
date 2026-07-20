import { Router } from "express";
import { assignTemporaryPassword, deleteUser, listPendingPasswordRecoveryRequests, listUsers, registerNewUser, updateUser } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

// Todas las rutas de usuarios son privadas y exclusivas para ADMIN.
router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

// Endpoints consumidos desde UsuariosView.vue.
router.get("/", listUsers);
router.get('/password-recovery-requests', listPendingPasswordRecoveryRequests);
router.post("/", registerNewUser);
router.patch('/:id/temporary-password', assignTemporaryPassword);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
