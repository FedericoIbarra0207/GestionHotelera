// src/pagos/pagos.controller.js
import * as pagosService from "./pagos.service.js";

// Registra un pago nuevo asociado a una reserva.
export const crear = async (req, res, next) => {
    try {
        const pago = await pagosService.crearPago(req.body);
        res.status(201).json(pago);
    } catch (err) {
        next(err);
    }
};

// Lista todos los pagos para la tabla y el total confirmado.
export const listar = async (req, res, next) => {
    try {
        const pagos = await pagosService.obtenerPagos();
        res.json(pagos);
    } catch (err) {
        next(err);
    }
};

// Obtiene un pago puntual por id.
export const obtenerPorId = async (req, res, next) => {
    try {
        const pago = await pagosService.obtenerPagoPorId(req.params.id);
        if (!pago) return res.status(404).json({ message: "Pago no encontrado" });
        res.json(pago);
    } catch (err) {
        next(err);
    }
};

// Actualiza un pago existente. Ruta pensada para ADMIN.
export const actualizar = async (req, res, next) => {
    try {
        const pago = await pagosService.actualizarPago(req.params.id, req.body);
        res.json(pago);
    } catch (err) {
        next(err);
    }
};

// Elimina un pago existente. Ruta pensada para ADMIN.
export const eliminar = async (req, res, next) => {
    try {
        await pagosService.eliminarPago(req.params.id);
        res.json({ message: "Pago eliminado correctamente" });
    } catch (err) {
        next(err);
    }
};
