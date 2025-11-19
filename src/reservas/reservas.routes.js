/**
 * RUTAS DE RESERVAS
 * -------------------
 * Reglas:
 *  - ADMIN y RECEPCIONISTA pueden crear reservas
 *  - ADMIN puede eliminar/modificar
 *  - Cualquier usuario puede ver sus reservas
 */

import express from "express";
import { crear, listar, obtener, actualizar, eliminar } from "./reservas.controller.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// Crear reserva (ADMIN o RECEPCIONISTA)
router.post("/", roleMiddleware("ADMIN", "RECEPCIONISTA"), crear);

// Listar todas (ADMIN)
router.get("/", roleMiddleware("ADMIN"), listar);

// Obtener una reserva (ADMIN o el dueño)
router.get("/:id", obtener);

// Actualizar reserva (ADMIN)
router.put("/:id", roleMiddleware("ADMIN"), actualizar);

// Eliminar reserva (ADMIN)
router.delete("/:id", roleMiddleware("ADMIN"), eliminar);

export default router;
