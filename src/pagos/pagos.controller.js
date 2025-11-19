// src/pagos/pagos.controller.js
import * as pagosService from "./pagos.service.js";

export const crear = async (req, res, next) => {
    try {
        const pago = await pagosService.crearPago(req.body);
        res.status(201).json(pago);
    } catch (err) {
        next(err);
    }
};

export const listar = async (req, res, next) => {
    try {
        const pagos = await pagosService.obtenerPagos();
        res.json(pagos);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    try {
        const pago = await pagosService.obtenerPagoPorId(req.params.id);
        if (!pago) return res.status(404).json({ message: "Pago no encontrado" });
        res.json(pago);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const pago = await pagosService.actualizarPago(req.params.id, req.body);
        res.json(pago);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        await pagosService.eliminarPago(req.params.id);
        res.json({ message: "Pago eliminado correctamente" });
    } catch (err) {
        next(err);
    }
};
