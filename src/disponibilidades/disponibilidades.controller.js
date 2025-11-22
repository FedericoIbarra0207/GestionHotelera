import * as service from "./disponibilidades.service.js";

/**
 * POST /api/disponibilidades
 * ADMIN y RECEPCIONISTA
 */
export const upsertDisponibilidad = async (req, res, next) => {
  try {
    const { habitacionId, fecha, disponible } = req.body;

    if (!habitacionId || !fecha || typeof disponible !== "boolean") {
      return res.status(400).json({
        message: "Datos incompletos. Se requiere habitacionId, fecha y disponible."
      });
    }

    const result = await service.actualizar(habitacionId, fecha, disponible);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/disponibilidades/:habitacionId
 * TODOS LOS ROLES
 */
export const getDisponibilidad = async (req, res, next) => {
  try {
    const { habitacionId } = req.params;
    const result = await service.obtenerPorHabitacion(habitacionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
