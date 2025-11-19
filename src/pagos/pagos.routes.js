// src/pagos/pagos.routes.js
import { Router } from "express";
import * as pagosController from "./pagos.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

// Solo ADMIN o RECEPCIONISTA pueden manejar pagos

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "RECEPCIONISTA"),
    pagosController.crear
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "RECEPCIONISTA"),
    pagosController.listar
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "RECEPCIONISTA"),
    pagosController.obtenerPorId
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    pagosController.actualizar
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    pagosController.eliminar
);

export default router;
