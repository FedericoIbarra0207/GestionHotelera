import * as consumosModel from "./consumos.model.js";
import * as reservasModel from "../reservas/reservas.model.js";

// Catálogo estable para facturación y reclamos: evita descripciones ambiguas.
const CATEGORIAS_VALIDAS = ['GASTRONOMIA', 'LAVANDERIA', 'ESTACIONAMIENTO', 'SPA', 'OTROS'];
const ESTADOS_VALIDOS = ['PENDIENTE_FACTURACION', 'EN_CUENTA', 'FACTURADO', 'CERRADO'];

// Registra cargos adicionales asociados a una reserva activa.
export const crearConsumo = async (data) => {
  const reservaId = String(data.reservaId || "").trim();
  const descripcion = String(data.descripcion || "").trim();
  const monto = Number(data.monto);
  const categoria = String(data.categoria || 'OTROS').trim().toUpperCase();

  if (!reservaId || !descripcion || !monto || monto <= 0) {
    const error = new Error("Reserva, descripcion y monto positivo son obligatorios.");
    error.status = 400;
    throw error;
  }

  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    const error = new Error(`Categoria invalida. Valores permitidos: ${CATEGORIAS_VALIDAS.join(', ')}.`);
    error.status = 400;
    throw error;
  }

  const reserva = await reservasModel.getReservaById(reservaId);
  if (!reserva) {
    const error = new Error("La reserva indicada no existe.");
    error.status = 404;
    throw error;
  }

  // No se permiten consumos sobre reservas que ya no pueden generar cargos operativos.
  if (reserva.estado === "cancelled" || reserva.estado === "checked_out") {
    const error = new Error("No se pueden registrar consumos sobre reservas canceladas o finalizadas.");
    error.status = 409;
    throw error;
  }

  return await consumosModel.createConsumo({
    reservaId,
    categoria,
    descripcion,
    monto,
    estado: "PENDIENTE_FACTURACION",
    // Snapshot historico para que la tabla siga mostrando contexto aunque cambie la reserva.
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
/** Valida categorías también al corregir un consumo ya registrado. */
export const actualizarConsumo = async (id, data) => {
  const consumoActual = await consumosModel.getConsumoById(id);
  if (!consumoActual) {
    const error = new Error('Consumo no encontrado.');
    error.status = 404;
    throw error;
  }
  // Un cargo confirmado en cuenta es parte de la cuenta corriente y no se altera.
  if (['EN_CUENTA', 'FACTURADO', 'CERRADO'].includes(consumoActual.estado)) {
    const error = new Error('No se puede editar un consumo incluido en cuenta o cerrado.');
    error.status = 409;
    throw error;
  }
  const categoria = String(data.categoria || 'OTROS').trim().toUpperCase();
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    const error = new Error('Categoria de consumo invalida.');
    error.status = 400;
    throw error;
  }
  const estado = String(data.estado || consumoActual.estado || 'PENDIENTE_FACTURACION').trim().toUpperCase();
  if (!ESTADOS_VALIDOS.includes(estado)) {
    const error = new Error('Estado de consumo invalido.');
    error.status = 400;
    throw error;
  }
  return consumosModel.updateConsumo(id, { ...data, categoria, estado });
};

/**
 * Incluye el cargo en la cuenta corriente, sin crear un pago. Recepción puede
 * hacerlo porque valida los consumos que luego se cobrarán al huésped.
 */
export const incluirEnCuenta = async (id, userId) => {
  const consumo = await consumosModel.getConsumoById(id);
  if (!consumo) {
    const error = new Error('Consumo no encontrado.');
    error.status = 404;
    throw error;
  }
  // FACTURADO y CERRADO se conservan como estados históricos ya cobrables.
  if (['EN_CUENTA', 'FACTURADO', 'CERRADO'].includes(consumo.estado)) return consumo;
  return consumosModel.updateConsumo(id, {
    estado: 'EN_CUENTA',
    incluidoEnCuentaAt: new Date(),
    incluidoEnCuentaPor: userId,
  });
};

/** Compatibilidad con la ruta anterior: no registra dinero, sólo incluye el cargo en cuenta. */
export const facturarConsumo = incluirEnCuenta;

/**
 * Cierra un consumo sin eliminarlo. El movimiento pasa a historial y conserva
 * su reserva, categoría, importe, fecha y trazabilidad para reclamos futuros.
 */
export const cerrarConsumo = async (id) => {
  const consumo = await consumosModel.getConsumoById(id);
  if (!consumo) {
    const error = new Error('Consumo no encontrado.');
    error.status = 404;
    throw error;
  }
  if (['FACTURADO', 'CERRADO'].includes(consumo.estado)) return consumo;
  return consumosModel.updateConsumo(id, { estado: 'CERRADO', closedAt: new Date() });
};
export const eliminarConsumo = (id) => consumosModel.deleteConsumo(id);
