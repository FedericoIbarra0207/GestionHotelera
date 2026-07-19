/**
 * CONTROLADOR DE RESERVAS
 * ------------------------
 * Maneja requests/response hacia el cliente.
 */

import * as ReservasService from "./reservas.service.js";

// Crea una reserva nueva con los datos enviados desde ReservasView.vue.
export const crear = async (req, res, next) => {
  try {
    const data = await ReservasService.crearReserva(req.body, req.user);
    return res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

// Lista reservas para tablas, dashboard operativo y selector de pagos.
export const listar = async (req, res, next) => {
  try {
    const data = await ReservasService.listarReservas();
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// Busca habitaciones disponibles entre fechaInicio y fechaFin.
export const disponibilidad = async (req, res, next) => {
  try {
    const data = await ReservasService.buscarDisponibilidad(req.query.fechaInicio, req.query.fechaFin);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// Obtiene una reserva puntual por id.
export const obtener = async (req, res, next) => {
  try {
    const data = await ReservasService.obtenerReserva(req.params.id);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// Actualiza datos generales de una reserva.
export const actualizar = async (req, res, next) => {
  try {
    const data = await ReservasService.actualizarReserva(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// Marca una reserva como checked_in desde el dashboard operativo.
export const checkIn = async (req, res, next) => {
  try {
    const data = await ReservasService.actualizarReserva(req.params.id, { estado: "checked_in" });
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// Marca una reserva como checked_out desde el dashboard operativo.
export const checkOut = async (req, res, next) => {
  try {
    const data = await ReservasService.actualizarReserva(req.params.id, { estado: "checked_out" });
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// Cancela/elimina una reserva y libera disponibilidad segun la logica del service.
export const eliminar = async (req, res, next) => {
  try {
    const data = await ReservasService.eliminarReserva(req.params.id);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// Elimina definitivamente una reserva cancelada. Accion administrativa.
export const eliminarDefinitiva = async (req, res, next) => {
  try {
    const data = await ReservasService.eliminarReservaDefinitiva(req.params.id);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
