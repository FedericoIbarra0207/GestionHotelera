
import * as userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; 

/**
 * Servicio para registrar un nuevo usuario.
 * @param {object} userData - Datos del usuario (email, password, nombre, rol).
 * @returns {object} El nuevo usuario creado (sin la contraseña).
 */
export const registerUser = async (userData) => {
    try {
        // 1. Verificar si el email ya existe
        const existingUser = await userModel.getUserByEmail(userData.email);
        if (existingUser) {
            const error = new Error("El email ya se encuentra registrado.");
            error.statusCode = 400; 
            throw error; 
        }
// 2. Hashear la contraseña
const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS); // <-- ESTA LÍNEA ES CRÍTICA
        
const userToCreate = {
    email: userData.email,
    password: hashedPassword, // <-- Asegúrate que se guarda el hash
    nombre: userData.nombre,
    rol: userData.rol || 'CLIENTE', 
};

// 3. Crear el usuario
const newUser = await userModel.createUser(userToCreate);
// ...
        
        const { password, ...publicData } = newUser;
        return publicData;

    } catch (error) {
        // --- INICIO DE LA MODIFICACIÓN (DEBUG) ---

        // Si el error ya tiene un statusCode (como el 400), lo relanzamos
        if (error.statusCode) throw error;

        // ¡IMPORTANTE! Mostramos el error ORIGINAL de Firestore en la consola
        console.error("--- ERROR DETALLADO (user.service.js) ---");
        console.error(error);
        console.error("------------------------------------------");

        // Mantenemos el mensaje genérico para el cliente (Postman)
        throw new Error("Error en la lógica de registro de usuario.");
        
        // --- FIN DE LA MODIFICACIÓN ---
    }
};


/**
 * Obtiene todos los usuarios y remueve sus contraseñas.
 * @returns {Array} Lista de usuarios públicos.
 */
export const getAllPublicUsers = async () => {
    const users = await userModel.getAllUsers();
    return users.map(user => {
        const { password, ...publicUser } = user;
        return publicUser;
    });
};

/**
 * Elimina un usuario por su ID.
 * @param {string} userId - ID del usuario a eliminar.
 */
export const deleteUser = async (userId) => {
    await userModel.deleteUser(userId);
};

/**
 * Busca un usuario por email (necesario para el login).
 * @param {string} email
 * @returns {object|null}
 */
export const getUserByEmail = async (email) => {
    return await userModel.getUserByEmail(email);
};