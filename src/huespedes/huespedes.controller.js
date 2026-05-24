import * as HuespedesService from "./huespedes.service.js";

export const crear = async (req, res, next) => {
  try {
    const data = await HuespedesService.crearHuesped(req.body);
    return res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const listar = async (req, res, next) => {
  try {
    const data = await HuespedesService.listarHuespedes();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const obtener = async (req, res, next) => {
  try {
    const data = await HuespedesService.obtenerHuesped(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const actualizar = async (req, res, next) => {
  try {
    const data = await HuespedesService.actualizarHuesped(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
