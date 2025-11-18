
// Importamos la instancia de Firestore que configuramos previamente
import db from '../config/firebase.config.js';
import { collection, doc, getDoc, getDocs, addDoc, query, where, updateDoc, deleteDoc } from 'firebase/firestore'; // Importamos funciones necesarias para CRUD

// Nombre de la colección en Firestore para USUARIOS
const COLLECTION_NAME = 'USUARIOS';
const userCollection = db.collection(COLLECTION_NAME);

/**
 * Busca todos los usuarios registrados en la colección.
 * @returns {Array} Lista de usuarios con sus IDs.
 */
export const getAllUsers = async () => {
    try {
        // Obtenemos todos los documentos de la colección
        const snapshot = await userCollection.get();
        // Mapeamos los documentos para incluir el ID de Firestore y los datos del documento
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return users;
    } catch (error) {
        console.error("Error al obtener todos los usuarios:", error);
        // Lanzamos un error para que la capa de Servicio/Controlador lo maneje
        throw new Error("Fallo al acceder a la lista de usuarios.");
    }
};

/**
 * Busca un usuario por su ID de documento.
 * @param {string} userId - ID del documento de usuario.
 * @returns {object|null} El objeto usuario o null si no existe.
 */
export const getUserById = async (userId) => {
    try {
        const userDoc = await userCollection.doc(userId).get();
        if (!userDoc.exists) {
            return null; // El usuario no existe
        }
        return {
            id: userDoc.id,
            ...userDoc.data()
        };
    } catch (error) {
        console.error("Error al obtener el usuario por ID:", error);
        throw new Error("Fallo al buscar el usuario.");
    }
};

/**
 * Busca un usuario específico por su dirección de email (clave para el login).
 * @param {string} email - Correo electrónico del usuario.
 * @returns {object|null} El objeto usuario o null si no existe.
 */
export const getUserByEmail = async (email) => {
    try {
        // Creamos una consulta para encontrar el documento donde el campo 'email' coincide
        const userQuery = await userCollection.where('email', '==', email).limit(1).get();

        if (userQuery.empty) {
            return null;
        }

        // Devolvemos el primer (y único) resultado
        const userDoc = userQuery.docs[0];
        return {
            id: userDoc.id,
            ...userDoc.data()
        };
    } catch (error) {
        console.error("Error al obtener el usuario por email:", error);
        throw new Error("Fallo al buscar el usuario por email.");
    }
};

/**
 * Crea un nuevo usuario en la base de datos.
 * @param {object} userData - Objeto con los datos del usuario (incluyendo la contraseña hasheada).
 * @returns {object} El objeto del usuario creado con su ID.
 */
export const createUser = async (userData) => {
    try {
        // Utilizamos add() para dejar que Firestore genere el ID automáticamente
        const userRef = await userCollection.add({
            ...userData,
            createdAt: new Date() // Sello de tiempo de creación
        });
        
        // Retornamos el objeto creado
        return {
            id: userRef.id,
            ...userData
        };
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        throw new Error("Fallo al crear el registro de usuario.");
    }
};

/**
 * Actualiza los datos de un usuario existente.
 * @param {string} userId - ID del usuario a actualizar.
 * @param {object} updateData - Datos a modificar.
 */
export const updateUser = async (userId, updateData) => {
    try {
        const userRef = userCollection.doc(userId);
        await userRef.update(updateData);
        console.log(`[MODEL] Usuario ${userId} actualizado.`);
    } catch (error) {
        console.error("Error al actualizar el usuario:", error);
        throw new Error("Fallo al actualizar el usuario.");
    }
};

/**
 * Elimina un usuario de la base de datos.
 * @param {string} userId - ID del usuario a eliminar.
 */
export const deleteUser = async (userId) => {
    try {
        const userRef = userCollection.doc(userId);
        await userRef.delete();
        console.log(`[MODEL] Usuario ${userId} eliminado.`);
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        throw new Error("Fallo al eliminar el usuario.");
    }
};