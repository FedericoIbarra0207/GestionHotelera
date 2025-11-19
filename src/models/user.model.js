// user.model.js — FIREBASE ADMIN SDK CORRECTO

import db from "../config/firebase.config.js"; // Este es el Admin SDK (bien)
const COLLECTION_NAME = "USUARIOS";
const userCollection = db.collection(COLLECTION_NAME);

/**
 * Obtener todos los usuarios
 */
export const getAllUsers = async () => {
    try {
        const snapshot = await userCollection.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error al obtener todos los usuarios:", error);
        throw new Error("Fallo al acceder a la lista de usuarios.");
    }
};

/**
 * Obtener usuario por ID
 */
export const getUserById = async (id) => {
    try {
        const docRef = userCollection.doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) return null;

        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error("Error al obtener el usuario por ID:", error);
        throw new Error("Fallo al buscar el usuario.");
    }
};

/**
 * Obtener usuario por Email (Login)
 */
export const getUserByEmail = async (email) => {
    try {
        const snapshot = await userCollection.where("email", "==", email).limit(1).get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error("Error al obtener usuario por email:", error);
        throw new Error("Fallo al buscar el usuario por email.");
    }
};

/**
 * Crear usuario
 */
export const createUser = async (userData) => {
    try {
        const docRef = await userCollection.add({
            ...userData,
            createdAt: new Date(),
        });

        return { id: docRef.id, ...userData };
    } catch (error) {
        console.error("Error al crear usuario:", error);
        throw new Error("Fallo al crear el registro de usuario.");
    }
};

/**
 * Actualizar usuario
 */
export const updateUser = async (id, updateData) => {
    try {
        await userCollection.doc(id).update(updateData);
        console.log(`[MODEL] Usuario ${id} actualizado.`);
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        throw new Error("Fallo al actualizar el usuario.");
    }
};

/**
 * Eliminar usuario
 */
export const deleteUser = async (id) => {
    try {
        await userCollection.doc(id).delete();
        console.log(`[MODEL] Usuario ${id} eliminado.`);
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        throw new Error("Fallo al eliminar el usuario.");
    }
};
