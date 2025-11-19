// src/consumos/consumos.controller.js
import * as consumosService from "./consumos.service.js";

export const crear = async (req, res, next) => {
    try {
        const consumo = await consumosService.crearConsumo(req.body);
        res.status(201).json(consumo);
    } catch (err) {
        next(err);
    }
};

export const listar = async (req, res, next) => {
    try {
        const consumos = await consumosService.obtenerConsumos();
        res.json(consumos);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    try {
        const consumo = await consumosService.obtenerConsumoPorId(req.params.id);
        if (!consumo) return res.status(404).json({ message: "Consumo no encontrado" });
        res.json(consumo);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const consumo = await consumosService.actualizarConsumo(req.params.id, req.body);
        res.json(consumo);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        await consumosService.eliminarConsumo(req.params.id);
        res.json({ message: "Consumo eliminado correctamente" });
    } catch (err) {
        next(err);
    }
};
