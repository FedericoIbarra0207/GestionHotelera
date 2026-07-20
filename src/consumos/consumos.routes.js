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

// Recepción puede corregir cargos operativos mientras sigan pendientes.
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "RECEPCIONISTA"),
    consumosController.actualizar
);

// Recepción confirma el cargo; el cobro real se registra después en /pagos.
router.patch(
    "/:id/incluir-en-cuenta",
    authMiddleware,
    roleMiddleware("ADMIN", "RECEPCIONISTA"),
    consumosController.incluirEnCuenta
);

// Ruta antigua preservada para no romper integraciones; mantiene la misma semántica.
router.patch(
    "/:id/facturar",
    authMiddleware,
    roleMiddleware("ADMIN", "RECEPCIONISTA"),
    consumosController.facturar
);

// Sólo ADMIN puede cerrar cargos y consolidar el historial facturable.
router.patch(
    "/:id/cerrar",
    authMiddleware,
    roleMiddleware("ADMIN"),
    consumosController.cerrar
);

// Eliminar consumo (solo admin)
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    consumosController.eliminar
);

export default router;
