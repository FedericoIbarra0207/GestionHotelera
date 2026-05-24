import * as HuespedesModel from "./huespedes.model.js";

const normalizarTexto = (value) => String(value || "").trim();

const validarEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validarHuesped = (data) => {
  const nombre = normalizarTexto(data.nombre);
  const apellido = normalizarTexto(data.apellido);
  const documento = normalizarTexto(data.documento || data.dni || data.pasaporte);
  const telefono = normalizarTexto(data.telefono);
  const email = normalizarTexto(data.email).toLowerCase();

  if (!nombre || !apellido || !documento || !telefono || !email) {
    const error = new Error("Nombre, apellido, documento, telefono y email del huesped son obligatorios.");
    error.status = 400;
    throw error;
  }

  if (!validarEmail(email)) {
    const error = new Error("El email del huesped no tiene un formato valido.");
    error.status = 400;
    throw error;
  }

  return {
    nombre,
    apellido,
    documento,
    telefono,
    email,
    nacionalidad: normalizarTexto(data.nacionalidad),
    observaciones: normalizarTexto(data.observaciones),
  };
};

export const crearHuesped = async (data) => {
  const huesped = validarHuesped(data);
  return HuespedesModel.create(huesped);
};

export const listarHuespedes = async () => {
  return HuespedesModel.getAll();
};

export const obtenerHuesped = async (id) => {
  const huesped = await HuespedesModel.getById(id);
  if (!huesped) {
    const error = new Error("Huesped no encontrado.");
    error.status = 404;
    throw error;
  }
  return huesped;
};

export const actualizarHuesped = async (id, data) => {
  await obtenerHuesped(id);
  const huesped = validarHuesped(data);
  return HuespedesModel.update(id, huesped);
};
