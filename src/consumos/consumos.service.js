import * as consumosModel from "./consumos.model.js";
import * as reservasModel from "../reservas/reservas.model.js";

export const crearConsumo = async (data) => {
  const reservaId = String(data.reservaId || "").trim();
  const descripcion = String(data.descripcion || "").trim();
  const monto = Number(data.monto);

  if (!reservaId || !descripcion || !monto || monto <= 0) {
    const error = new Error("Reserva, descripcion y monto positivo son obligatorios.");
    error.status = 400;
    throw error;
  }

  const reserva = await reservasModel.getReservaById(reservaId);
  if (!reserva) {
    const error = new Error("La reserva indicada no existe.");
    error.status = 404;
    throw error;
  }

  if (reserva.estado === "cancelled" || reserva.estado === "checked_out") {
    const error = new Error("No se pueden registrar consumos sobre reservas canceladas o finalizadas.");
    error.status = 409;
    throw error;
  }

  return await consumosModel.createConsumo({
    reservaId,
    descripcion,
    monto,
    estado: "PENDIENTE_FACTURACION",
    reservaSnapshot: {
      codigo: reserva.codigo,
      huesped: reserva.huespedSnapshot,
      habitacion: reserva.habitacionSnapshot,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
    },
  });
};

export const obtenerConsumos = () => consumosModel.getAllConsumos();
export const obtenerConsumoPorId = (id) => consumosModel.getConsumoById(id);
export const actualizarConsumo = (id, data) => consumosModel.updateConsumo(id, data);
export const eliminarConsumo = (id) => consumosModel.deleteConsumo(id);
