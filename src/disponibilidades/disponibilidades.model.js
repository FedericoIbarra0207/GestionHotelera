import { db } from "../config/firebase.config.js";

const COLLECTION_NAME = "DISPONIBILIDADES";
const collection = db.collection(COLLECTION_NAME);

/**
 * Guarda disponibilidad:
 * - habitacionId
 * - fecha (YYYY-MM-DD)
 * - disponible (true/false)
 */
export const save = async ({ habitacionId, fecha, disponible }) => {
  const docId = `${habitacionId}_${fecha}`;
  const ref = collection.doc(docId);

  await ref.set(
    {
      habitacionId,
      fecha,
      disponible,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  const snap = await ref.get();
  return { id: ref.id, ...snap.data() };
};

/**
 * Obtiene todas las fechas de una habitación
 */
export const getByHabitacion = async (habitacionId) => {
  const snapshot = await collection
    .where("habitacionId", "==", habitacionId)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
