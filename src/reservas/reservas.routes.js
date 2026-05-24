import express from "express";
import { actualizar, checkIn, checkOut, crear, disponibilidad, eliminar, listar, obtener } from "./reservas.controller.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/disponibilidad", roleMiddleware("ADMIN", "RECEPCIONISTA"), disponibilidad);
router.patch("/:id/check-in", roleMiddleware("ADMIN", "RECEPCIONISTA"), checkIn);
router.patch("/:id/check-out", roleMiddleware("ADMIN", "RECEPCIONISTA"), checkOut);
router.post("/", roleMiddleware("ADMIN", "RECEPCIONISTA"), crear);
router.get("/", roleMiddleware("ADMIN", "RECEPCIONISTA"), listar);
router.get("/:id", roleMiddleware("ADMIN", "RECEPCIONISTA"), obtener);
router.put("/:id", roleMiddleware("ADMIN", "RECEPCIONISTA"), actualizar);
router.delete("/:id", roleMiddleware("ADMIN", "RECEPCIONISTA"), eliminar);

export default router;
