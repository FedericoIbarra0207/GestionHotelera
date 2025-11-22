/**
 * CONTROLADOR DE RESERVAS
 * ------------------------
 * Maneja requests/response hacia el cliente.
 */

import * as ReservasService from "./reservas.service.js";

export const crear = async (req, res, next) => {
  try {
    const data = await ReservasService.crearReserva(req.body, req.user);
    return res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const listar = async (req, res, next) => {
  try {
    const data = await ReservasService.listarReservas();
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const obtener = async (req, res, next) => {
  try {
    const data = await ReservasService.obtenerReserva(req.params.id);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const actualizar = async (req, res, next) => {
  try {
    const data = await ReservasService.actualizarReserva(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const eliminar = async (req, res, next) => {
  try {
    const data = await ReservasService.eliminarReserva(req.params.id);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
