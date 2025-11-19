import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

import {
  upsertDisponibilidad,
  getDisponibilidad
} from "./disponibilidades.controller.js";

const router = Router();

/**
 * VER disponibilidades
 * ADMIN - RECEPCIONISTA - CLIENTE
 */
router.get(
  "/:habitacionId",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPCIONISTA", "CLIENTE"),
  getDisponibilidad
);

/**
 * CREAR / ACTUALIZAR disponibilidad
 * ADMIN - RECEPCIONISTA
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPCIONISTA"),
  upsertDisponibilidad
);

export default router;
