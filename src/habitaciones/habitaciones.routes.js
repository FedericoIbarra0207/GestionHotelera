import express from "express";
import { crear, listar, obtener, actualizar, eliminar } from "./habitaciones.controller.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// ------------------------------------
// RUTAS CRUD HABITACIONES


// Crear (solo ADMIN)
router.post("/", roleMiddleware("ADMIN"), crear);

// Listar todas (cualquier usuario autenticado)
router.get("/", listar);

// Obtener una por ID
router.get("/:id", obtener);

// Actualizar (solo ADMIN)
router.put("/:id", roleMiddleware("ADMIN"), actualizar);

// Eliminar (solo ADMIN)
router.delete("/:id", roleMiddleware("ADMIN"), eliminar);

export default router;
