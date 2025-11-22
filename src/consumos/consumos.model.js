// src/consumos/consumos.model.js
import { db } from "../config/firebase.config.js";

const COLLECTION_NAME = "CONSUMOS_EXTRAS";
const consumosCollection = db.collection(COLLECTION_NAME);

/**
 * Crear consumo extra
 */
export const createConsumo = async (data) => {
    const docRef = await consumosCollection.add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    const snap = await docRef.get();
    return { id: docRef.id, ...snap.data() };
};

/**
 * Listar todos los consumos extras
 */
export const getAllConsumos = async () => {
    const snapshot = await consumosCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Obtener uno por ID
 */
export const getConsumoById = async (id) => {
    const doc = await consumosCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
};

/**
 * Actualizar consumo
 */
export const updateConsumo = async (id, data) => {
    const ref = consumosCollection.doc(id);
    await ref.update({ ...data, updatedAt: new Date() });
    const updated = await ref.get();
    return { id, ...updated.data() };
};

/**
 * Eliminar consumo
 */
export const deleteConsumo = async (id) => {
    await consumosCollection.doc(id).delete();
};
