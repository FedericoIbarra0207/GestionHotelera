import express from "express";
import { crear, listar, obtener, actualizar } from "./huespedes.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN", "RECEPCIONISTA"));

router.post("/", crear);
router.get("/", listar);
router.get("/:id", obtener);
router.put("/:id", actualizar);

export default router;
