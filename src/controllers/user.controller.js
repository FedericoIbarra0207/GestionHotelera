
import * as userService from '../services/user.service.js';

/**
 * Controlador para el endpoint POST /api/auth/register
 */
export const registerNewUser = async (req, res, next) => {
    try {
        const userData = req.body;

        // Validación básica
        if (!userData.email || !userData.password || !userData.nombre) {
            return res.status(400).json({ message: "Email, contraseña y nombre son obligatorios." });
        }

        // Llamamos al servicio de registro
        const newUser = await userService.registerUser(userData);
        
        // Requisito: Imprimir mensaje en consola
        console.log(`[USER_CONTROLLER] Nuevo usuario registrado: ${newUser.email} con ID: ${newUser.id}`);

        // Devolvemos 201 (Creado) con los datos del nuevo usuario (sin contraseña)
        res.status(201).json(newUser);

    } catch (error) {
        console.error("Error en el controlador de registro:", error);
        // Manejamos errores (ej. email duplicado, aunque Firestore lo maneja con reglas)
        next(error);
    }
};

// ... Aquí irán los otros controladores CRUD de Usuarios (getAll, getById, etc.) ...