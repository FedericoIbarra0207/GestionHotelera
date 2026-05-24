import { Router } from "express";
import { deleteUser, listUsers, registerNewUser, updateUser } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

router.get("/", listUsers);
router.post("/", registerNewUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
