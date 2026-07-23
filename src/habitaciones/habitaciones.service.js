import * as HabitacionesModel from "./habitaciones.model.js";

// "OCUPADA" no es un estado manual: se calcula a partir de una reserva activa
// y su check-in. Desde el formulario solo se puede habilitar o poner fuera de
// servicio una habitación.
const ESTADOS_VALIDOS = ["DISPONIBLE", "MANTENIMIENTO"];

// Normaliza datos que pueden venir del formulario como texto y valida reglas minimas.
const normalizarHabitacion = (data) => {
  const numero = String(data.numero || "").trim();
  const tipo = String(data.tipo || "").trim();
  const precio = Number(data.precio);
  const capacidad = Number(data.capacidad || 1);
  const estado = String(data.estado || "DISPONIBLE").trim().toUpperCase();

  if (!numero || !tipo || !precio || precio <= 0) {
    const error = new Error("Numero, tipo y precio por noche son obligatorios.");
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(capacidad) || capacidad <= 0) {
    const error = new Error("La capacidad debe ser un numero entero mayor a cero.");
    error.status = 400;
    throw error;
  }

  if (!ESTADOS_VALIDOS.includes(estado)) {
    const error = new Error("Estado de habitacion invalido.");
    error.status = 400;
    throw error;
  }

  return {
    numero,
    tipo,
    precio,
    capacidad,
    estado,
    piso: String(data.piso || "").trim(),
    descripcion: String(data.descripcion || "").trim(),
    // El frontend envia amenities como texto separado por comas; tambien se acepta array.
    amenities: Array.isArray(data.amenities)
      ? data.amenities.map((item) => String(item).trim()).filter(Boolean)
      : String(data.amenities || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    fotos: Array.isArray(data.fotos) ? data.fotos : [],
  };
};

export const crearHabitacion = async (data) => {
  return await HabitacionesModel.create(normalizarHabitacion(data));
};

export const listarHabitaciones = async () => {
  return await HabitacionesModel.getAll();
};

export const obtenerHabitacion = async (id) => {
  const habitacion = await HabitacionesModel.getById(id);
  if (!habitacion) {
    const error = new Error("Habitacion no encontrada");
    error.status = 404;
    throw error;
  }
  return habitacion;
};

export const actualizarHabitacion = async (id, data) => {
  const existe = await HabitacionesModel.getById(id);
  if (!existe) {
    const error = new Error("Habitacion no encontrada");
    error.status = 404;
    throw error;
  }

  // Se mezcla con lo existente para permitir actualizaciones parciales sin perder campos.
  return await HabitacionesModel.update(id, normalizarHabitacion({ ...existe, ...data }));
};

export const eliminarHabitacion = async (id) => {
  const existe = await HabitacionesModel.getById(id);
  if (!existe) {
    const error = new Error("Habitacion no encontrada");
    error.status = 404;
    throw error;
  }

  await HabitacionesModel.remove(id);
  return { message: "Habitacion eliminada correctamente" };
};
