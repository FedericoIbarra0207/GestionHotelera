import * as HabitacionesModel from "./habitaciones.model.js";

export const crearHabitacion = async (data) => {
  // Validación básica
  if (!data.numero || !data.tipo || !data.precio) {
    const error = new Error("Faltan datos obligatorios: numero, tipo, precio");
    error.status = 400;
    throw error;
  }

  return await HabitacionesModel.create(data);
};

export const listarHabitaciones = async () => {
  return await HabitacionesModel.getAll();
};

export const obtenerHabitacion = async (id) => {
  const habitacion = await HabitacionesModel.getById(id);
  if (!habitacion) {
    const error = new Error("Habitación no encontrada");
    error.status = 404;
    throw error;
  }
  return habitacion;
};

export const actualizarHabitacion = async (id, data) => {
  const existe = await HabitacionesModel.getById(id);
  if (!existe) {
    const error = new Error("Habitación no encontrada");
    error.status = 404;
    throw error;
  }

  return await HabitacionesModel.update(id, data);
};

export const eliminarHabitacion = async (id) => {
  const existe = await HabitacionesModel.getById(id);
  if (!existe) {
    const error = new Error("Habitación no encontrada");
    error.status = 404;
    throw error;
  }

  await HabitacionesModel.remove(id);
  return { message: "Habitación eliminada correctamente" };
};
