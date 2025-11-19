/**
 * MODELO DE RESERVAS
 * -------------------
 * Se conecta directamente a Firestore.
 */

import { db } from "../config/firebase.config.js";

const collection = db.collection("RESERVAS");

// Crear reserva
export const create = async (data) => {
  const docRef = await collection.add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: docRef.id, ...data };
};

// Obtener todas las reservas
export const getAll = async () => {
  const snapshot = await collection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Obtener por ID
export const getById = async (id) => {
  const doc = await collection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

// Buscar reservas por habitación
export const getByHabitacion = async (habitacionId) => {
  const snapshot = await collection.where("habitacionId", "==", habitacionId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Buscar reservas por usuario
export const getByUsuario = async (usuarioId) => {
  const snapshot = await collection.where("usuarioId", "==", usuarioId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Actualizar
export const update = async (id, data) => {
  await collection.doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
  return { id, ...data };
};

// Eliminar
export const remove = async (id) => {
  await collection.doc(id).delete();
};

/* ===============================
   ALIAS PARA COMPATIBILIDAD
   (usados por consumos.service.js)
================================ */

export const getReservaById = getById;
export const crearReserva = create;
export const getAllReservas = getAll;
export const updateReserva = update;
export const deleteReserva = remove;
