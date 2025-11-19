// src/consumos/consumos.routes.js
import { Router } from "express";
import * as consumosController from "./consumos.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

// ADMIN o RECEPCIONISTA pueden crear consumos
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "RECEPCIONISTA"),
    consumosController.crear
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "RECEPCIONISTA"),
    consumosController.listar
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "RECEPCIONISTA"),
    consumosController.obtenerPorId
);

// Actualizar consumo (solo admin)
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    consumosController.actualizar
);

// Eliminar consumo (solo admin)
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    consumosController.eliminar
);

export default router;
