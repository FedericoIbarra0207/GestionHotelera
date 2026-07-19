import * as HabitacionesService from "./habitaciones.service.js";

// Controladores finos: reciben HTTP, delegan reglas al service y devuelven JSON.
export const crear = async (req, res, next) => {
  try {
    const data = await HabitacionesService.crearHabitacion(req.body);
    return res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const listar = async (req, res, next) => {
  try {
    const data = await HabitacionesService.listarHabitaciones();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const obtener = async (req, res, next) => {
  try {
    const data = await HabitacionesService.obtenerHabitacion(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const actualizar = async (req, res, next) => {
  try {
    const data = await HabitacionesService.actualizarHabitacion(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const eliminar = async (req, res, next) => {
  try {
    const data = await HabitacionesService.eliminarHabitacion(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
