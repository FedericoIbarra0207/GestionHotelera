// src/pagos/pagos.model.js
import { db } from "../config/firebase.config.js";

const COLLECTION_NAME = "PAGOS";
const pagosCollection = db.collection(COLLECTION_NAME);

/**
 * Crear un pago
 */
export const createPago = async (pagoData) => {
    const docRef = await pagosCollection.add({
        ...pagoData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    const created = await docRef.get();
    return { id: docRef.id, ...created.data() };
};

/**
 * Obtener todos los pagos
 */
export const getAllPagos = async () => {
    const snapshot = await pagosCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Obtener un pago por ID
 */
export const getPagoById = async (id) => {
    const doc = await pagosCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
};

/**
 * Actualizar un pago
 */
export const updatePago = async (id, data) => {
    const ref = pagosCollection.doc(id);
    await ref.update({ ...data, updatedAt: new Date() });
    const updated = await ref.get();
    return { id, ...updated.data() };
};

/**
 * Eliminar un pago
 */
export const deletePago = async (id) => {
    await pagosCollection.doc(id).delete();
};
