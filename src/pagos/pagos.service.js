import * as pagosModel from "./pagos.model.js";
import * as reservasModel from "../reservas/reservas.model.js";

const METODOS_VALIDOS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"];

// Registra pagos contra reservas existentes y no canceladas.
export const crearPago = async (data) => {
  const reservaId = String(data.reservaId || "").trim();
  const monto = Number(data.monto);
  const metodo = String(data.metodo || "").trim().toUpperCase();

  if (!reservaId || !monto || monto <= 0 || !metodo) {
    const error = new Error("Reserva, monto positivo y metodo de pago son obligatorios.");
    error.status = 400;
    throw error;
  }

  if (!METODOS_VALIDOS.includes(metodo)) {
    const error = new Error("Metodo de pago invalido.");
    error.status = 400;
    throw error;
  }

  const reserva = await reservasModel.getReservaById(reservaId);
  if (!reserva) {
    const error = new Error("La reserva no existe.");
    error.status = 404;
    throw error;
  }

  // Una reserva cancelada ya no deberia aceptar movimientos de caja.
  if (reserva.estado === "cancelled") {
    const error = new Error("No se pueden registrar pagos sobre reservas canceladas.");
    error.status = 409;
    throw error;
  }

  return await pagosModel.createPago({
    reservaId,
    monto,
    metodo,
    estado: "CONFIRMADO",
    // Snapshot para conservar el contexto del pago aunque la reserva cambie despues.
    reservaSnapshot: {
      codigo: reserva.codigo,
      huesped: reserva.huespedSnapshot,
      habitacion: reserva.habitacionSnapshot,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
    },
  });
};

export const obtenerPagos = () => pagosModel.getAllPagos();
export const obtenerPagoPorId = (id) => pagosModel.getPagoById(id);
export const actualizarPago = (id, data) => pagosModel.updatePago(id, data);
export const eliminarPago = (id) => pagosModel.deletePago(id);
