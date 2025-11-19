/**
 * SERVICIO DE RESERVAS
 * ---------------------
 * Acá va toda la lógica:
 *  - Validación de fechas
 *  - Evitar solapamientos
 *  - Verificación de habitación
 *  - Roles y permisos
 */

import * as ReservasModel from "./reservas.model.js";
import * as HabitacionesModel from "../habitaciones/habitaciones.model.js";

// Validación de fechas
const validarFechas = (inicio, fin) => {
  const f1 = new Date(inicio);
  const f2 = new Date(fin);

  if (isNaN(f1) || isNaN(f2)) {
    throw new Error("Fechas inválidas.");
  }
  if (f1 >= f2) {
    throw new Error("La fecha de inicio debe ser menor a la fecha de fin.");
  }
};

// Evitar reservas solapadas
const verificarSolapamiento = (reservas, inicio, fin) => {
  const f1 = new Date(inicio);
  const f2 = new Date(fin);

  for (const r of reservas) {
    const ri = new Date(r.fechaInicio);
    const rf = new Date(r.fechaFin);

    const seSolapa = f1 < rf && f2 > ri;
    if (seSolapa) {
      throw new Error("La habitación ya está reservada en ese rango.");
    }
  }
};

export const crearReserva = async (data, usuarioToken) => {
  const { habitacionId, fechaInicio, fechaFin, usuarioId } = data;

  // Validación básica
  if (!habitacionId || !fechaInicio || !fechaFin || !usuarioId) {
    const err = new Error("Faltan datos obligatorios.");
    err.status = 400;
    throw err;
  }

  validarFechas(fechaInicio, fechaFin);

  // Verificar que la habitación exista
  const habitacion = await HabitacionesModel.getById(habitacionId);
  if (!habitacion) {
    throw new Error("La habitación no existe.");
  }

  // Evitar solapamientos
  const reservas = await ReservasModel.getByHabitacion(habitacionId);
  verificarSolapamiento(reservas, fechaInicio, fechaFin);

  // Crear la reserva
  return await ReservasModel.create({
    usuarioId,
    habitacionId,
    fechaInicio,
    fechaFin,
    estado: "RESERVADA",
  });
};

export const listarReservas = async () => {
  return await ReservasModel.getAll();
};

export const obtenerReserva = async (id) => {
  const reserva = await ReservasModel.getById(id);
  if (!reserva) {
    throw new Error("Reserva no encontrada.");
  }
  return reserva;
};

export const actualizarReserva = async (id, data) => {
  return await ReservasModel.update(id, data);
};

export const eliminarReserva = async (id) => {
  const existe = await ReservasModel.getById(id);
  if (!existe) throw new Error("Reserva no encontrada.");

  await ReservasModel.remove(id);
  return { message: "Reserva eliminada correctamente" };
};
