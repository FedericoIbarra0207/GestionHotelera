import * as ReservasModel from "./reservas.model.js";
import * as HabitacionesModel from "../habitaciones/habitaciones.model.js";
import * as HuespedesModel from "../huespedes/huespedes.model.js";
import { validarHuesped } from "../huespedes/huespedes.service.js";
import * as DisponibilidadesService from "../disponibilidades/disponibilidades.service.js";
import { sendReservationEmail } from "../services/email.service.js";
import { getOperationalReservations } from '../services/operacion-reservas.service.js';

const ESTADOS_ACTIVOS = ["pending", "confirmed", "checked_in"];
const ESTADOS_VALIDOS = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"];

// Codigo legible para recepcion y suficientemente unico para uso operativo.
const crearCodigoReserva = () => {
  return `DVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

const validarFechas = (inicio, fin) => {
  const f1 = new Date(inicio);
  const f2 = new Date(fin);

  if (isNaN(f1) || isNaN(f2)) {
    const error = new Error("Fechas invalidas.");
    error.status = 400;
    throw error;
  }

  if (f1 >= f2) {
    const error = new Error("La fecha de inicio debe ser menor a la fecha de fin.");
    error.status = 400;
    throw error;
  }
};

const seSolapa = (reserva, inicio, fin) => {
  // Reservas canceladas o finalizadas no bloquean disponibilidad futura.
  if (!ESTADOS_ACTIVOS.includes(reserva.estado || "confirmed")) return false;

  const f1 = new Date(inicio);
  const f2 = new Date(fin);
  const ri = new Date(reserva.fechaInicio);
  const rf = new Date(reserva.fechaFin);

  return f1 < rf && f2 > ri;
};

const verificarSolapamiento = (reservas, inicio, fin, reservaIgnoradaId = null) => {
  const reservaSolapada = reservas.find((reserva) => {
    return reserva.id !== reservaIgnoradaId && seSolapa(reserva, inicio, fin);
  });

  if (reservaSolapada) {
    const error = new Error("La habitacion ya tiene una reserva activa en ese rango.");
    error.status = 409;
    throw error;
  }
};

const fechasEntre = (fechaInicio, fechaFin) => {
  const fechas = [];
  const cur = new Date(fechaInicio);
  const end = new Date(fechaFin);

  // La fecha de salida no se marca como ocupada porque esa noche ya queda libre.
  while (cur < end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    fechas.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }

  return fechas;
};

const marcarDisponibilidad = async (habitacionId, fechaInicio, fechaFin, disponible) => {
  // La disponibilidad se actualiza por dia para facilitar consultas calendario.
  for (const fecha of fechasEntre(fechaInicio, fechaFin)) {
    try {
      await DisponibilidadesService.actualizar(habitacionId, fecha, disponible);
    } catch (error) {
      console.error("No se pudo actualizar disponibilidad", { habitacionId, fecha, error });
    }
  }
};

const liberarDisponibilidadSinPisarReservas = async (reserva) => {
  const reservasHabitacion = await ReservasModel.getByHabitacion(reserva.habitacionId);

  // Al cancelar o mover una reserva, solo libera fechas que no esten ocupadas por otra.
  for (const fecha of fechasEntre(reserva.fechaInicio, reserva.fechaFin)) {
    const ocupadaPorOtraReserva = reservasHabitacion.some((otraReserva) => {
      if (otraReserva.id === reserva.id || !ESTADOS_ACTIVOS.includes(otraReserva.estado || "confirmed")) return false;
      return new Date(otraReserva.fechaInicio) <= new Date(fecha) && new Date(otraReserva.fechaFin) > new Date(fecha);
    });

    if (!ocupadaPorOtraReserva) {
      try {
        await DisponibilidadesService.actualizar(reserva.habitacionId, fecha, true);
      } catch (error) {
        console.error("No se pudo liberar disponibilidad", { habitacionId: reserva.habitacionId, fecha, error });
      }
    }
  }
};

const resolverHuesped = async (data) => {
  // La reserva puede apuntar a un huesped existente o crear uno nuevo con los datos enviados.
  if (data.huespedId) {
    const huesped = await HuespedesModel.getById(data.huespedId);
    if (!huesped) {
      const error = new Error("El huesped indicado no existe.");
      error.status = 404;
      throw error;
    }
    return huesped;
  }

  if (!data.huesped) {
    const error = new Error("La reserva debe incluir los datos del huesped.");
    error.status = 400;
    throw error;
  }

  const huespedData = validarHuesped(data.huesped);
  return HuespedesModel.create(huespedData);
};

export const buscarDisponibilidad = async (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) {
    const error = new Error("Debe indicar fechaInicio y fechaFin.");
    error.status = 400;
    throw error;
  }

  validarFechas(fechaInicio, fechaFin);

  const [habitaciones, reservas] = await Promise.all([
    HabitacionesModel.getAll(),
    ReservasModel.getAll(),
  ]);

  // Calcula disponibilidad en memoria cruzando habitaciones contra reservas activas.
  const habitacionesConEstado = habitaciones.map((habitacion) => {
    const reservasSolapadas = reservas.filter((reserva) => {
      return reserva.habitacionId === habitacion.id && seSolapa(reserva, fechaInicio, fechaFin);
    });

    const proximaReserva = reservas
      .filter((reserva) => reserva.habitacionId === habitacion.id && ESTADOS_ACTIVOS.includes(reserva.estado || "confirmed"))
      .filter((reserva) => new Date(reserva.fechaInicio) >= new Date())
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))[0];

    return {
      ...habitacion,
      disponibleEnRango: reservasSolapadas.length === 0 && habitacion.estado !== "MANTENIMIENTO",
      reservasSolapadas,
      proximaReserva: proximaReserva || null,
    };
  });

  return {
    fechaInicio,
    fechaFin,
    habitacionesDisponibles: habitacionesConEstado.filter((habitacion) => habitacion.disponibleEnRango),
    habitacionesOcupadas: habitacionesConEstado.filter((habitacion) => !habitacion.disponibleEnRango),
    habitaciones: habitacionesConEstado,
  };
};

export const crearReserva = async (data, usuarioToken) => {
  const { habitacionId, fechaInicio, fechaFin } = data;

  if (!habitacionId || !fechaInicio || !fechaFin) {
    const err = new Error("Habitacion, fecha de inicio y fecha de fin son obligatorias.");
    err.status = 400;
    throw err;
  }

  validarFechas(fechaInicio, fechaFin);

  const habitacion = await HabitacionesModel.getById(habitacionId);
  if (!habitacion) {
    const error = new Error("La habitacion no existe.");
    error.status = 404;
    throw error;
  }

  if (habitacion.estado === "MANTENIMIENTO") {
    const error = new Error("La habitacion se encuentra en mantenimiento.");
    error.status = 409;
    throw error;
  }

  const reservas = await ReservasModel.getByHabitacion(habitacionId);
  verificarSolapamiento(reservas, fechaInicio, fechaFin);

  const huesped = await resolverHuesped(data);
  const estado = data.estado && ESTADOS_VALIDOS.includes(data.estado) ? data.estado : "confirmed";

  // Se guardan snapshots para mantener datos historicos aunque cambien huesped/habitacion.
  const created = await ReservasModel.create({
    codigo: crearCodigoReserva(),
    huespedId: huesped.id,
    huespedSnapshot: {
      nombre: huesped.nombre,
      apellido: huesped.apellido,
      documento: huesped.documento,
      telefono: huesped.telefono,
      email: huesped.email,
    },
    habitacionId,
    habitacionSnapshot: {
      numero: habitacion.numero,
      tipo: habitacion.tipo,
      precio: habitacion.precio,
    },
    fechaInicio,
    fechaFin,
    estado,
    creadoPor: usuarioToken?.id || null,
    observaciones: String(data.observaciones || "").trim(),
  });

  await marcarDisponibilidad(habitacionId, fechaInicio, fechaFin, false);

  // El email no bloquea la reserva: si falla, queda registrado en logs.
  sendReservationEmail("created", created).catch((error) => {
    console.error("No se pudo enviar email de confirmacion:", error.message);
  });

  return created;
};

export const listarReservas = async () => {
  // La vista operativa comparte este cálculo con pagos y consumos, evitando
  // archivar reservas que todavía tengan saldo o cargos sin cerrar.
  return await getOperationalReservations();
};

export const obtenerReserva = async (id) => {
  const reserva = await ReservasModel.getById(id);
  if (!reserva) {
    const error = new Error("Reserva no encontrada.");
    error.status = 404;
    throw error;
  }
  return reserva;
};

export const actualizarReserva = async (id, data) => {
  const reserva = await obtenerReserva(id);

  if (reserva.estado === "cancelled") {
    const error = new Error("No se puede modificar una reserva cancelada.");
    error.status = 409;
    throw error;
  }

  const fechaInicio = data.fechaInicio || reserva.fechaInicio;
  const fechaFin = data.fechaFin || reserva.fechaFin;
  const habitacionId = data.habitacionId || reserva.habitacionId;
  const estado = data.estado || reserva.estado;

  if (!ESTADOS_VALIDOS.includes(estado)) {
    const error = new Error("Estado de reserva invalido.");
    error.status = 400;
    throw error;
  }

  validarFechas(fechaInicio, fechaFin);

  if (estado === "checked_in" && new Date(fechaInicio) > new Date()) {
    const error = new Error("No se puede hacer check-in antes de la fecha de entrada.");
    error.status = 409;
    throw error;
  }

  if (estado === "checked_out" && reserva.estado !== "checked_in") {
    const error = new Error("Solo se puede hacer check-out de una reserva con check-in realizado.");
    error.status = 409;
    throw error;
  }

  const reservasHabitacion = await ReservasModel.getByHabitacion(habitacionId);
  verificarSolapamiento(reservasHabitacion, fechaInicio, fechaFin, id);

  // Si cambia habitacion o rango, recalcula disponibilidad del rango anterior y nuevo.
  if (habitacionId !== reserva.habitacionId || fechaInicio !== reserva.fechaInicio || fechaFin !== reserva.fechaFin) {
    await liberarDisponibilidadSinPisarReservas(reserva);
    await marcarDisponibilidad(habitacionId, fechaInicio, fechaFin, false);
  }

  const updated = await ReservasModel.update(id, {
    ...data,
    habitacionId,
    fechaInicio,
    fechaFin,
    estado,
  });

  sendReservationEmail("updated", { ...reserva, ...updated }).catch((error) => {
    console.error("No se pudo enviar email de modificacion:", error.message);
  });

  return updated;
};

export const eliminarReserva = async (id) => {
  const reserva = await obtenerReserva(id);

  if (reserva.estado === "cancelled") {
    return { message: "La reserva ya se encontraba cancelada." };
  }

  await liberarDisponibilidadSinPisarReservas(reserva);

  // Cancelar es baja logica: conserva historial y libera disponibilidad.
  const cancelled = await ReservasModel.update(id, { estado: "cancelled", cancelledAt: new Date() });

  sendReservationEmail("cancelled", { ...reserva, ...cancelled }).catch((error) => {
    console.error("No se pudo enviar email de cancelacion:", error.message);
  });

  return { message: "Reserva cancelada y fechas liberadas correctamente" };
};

export const eliminarReservaDefinitiva = async (id) => {
  const reserva = await obtenerReserva(id);

  if (reserva.estado !== "cancelled") {
    const error = new Error("Solo se pueden eliminar definitivamente reservas canceladas.");
    error.status = 409;
    throw error;
  }

  await ReservasModel.remove(id);
  return { message: "Reserva eliminada definitivamente." };
};
