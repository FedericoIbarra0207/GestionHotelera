import * as model from "./disponibilidades.model.js";
import * as habitacionesModel from "../habitaciones/habitaciones.model.js";

export const actualizar = async (habitacionId, fecha, disponible) => {
  // Verificar que la habitación existe
  const habitacion = await habitacionesModel.getById(habitacionId);

  if (!habitacion) {
    throw new Error("La habitación no existe.");
  }

  return await model.save({ habitacionId, fecha, disponible });
};

export const obtenerPorHabitacion = async (habitacionId) => {
  return await model.getByHabitacion(habitacionId);
};
