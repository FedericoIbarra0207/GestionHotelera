import express from "express";
import { actualizar, checkIn, checkOut, crear, disponibilidad, eliminar, eliminarDefinitiva, listar, obtener } from "./reservas.controller.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// Flujo operativo de reservas usado por ReservasView.vue y OperativoView.vue.
// Todas estas acciones requieren token y rol ADMIN o RECEPCIONISTA.
router.get("/disponibilidad", roleMiddleware("ADMIN", "RECEPCIONISTA"), disponibilidad);
router.patch("/:id/check-in", roleMiddleware("ADMIN", "RECEPCIONISTA"), checkIn);
router.patch("/:id/check-out", roleMiddleware("ADMIN", "RECEPCIONISTA"), checkOut);
router.post("/", roleMiddleware("ADMIN", "RECEPCIONISTA"), crear);
router.get("/", roleMiddleware("ADMIN", "RECEPCIONISTA"), listar);
router.get("/:id", roleMiddleware("ADMIN", "RECEPCIONISTA"), obtener);
router.put("/:id", roleMiddleware("ADMIN", "RECEPCIONISTA"), actualizar);
router.delete("/:id/definitiva", roleMiddleware("ADMIN"), eliminarDefinitiva);
router.delete("/:id", roleMiddleware("ADMIN", "RECEPCIONISTA"), eliminar);

export default router;
