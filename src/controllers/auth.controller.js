
import * as authService from '../services/auth.service.js';

/**
 * Controlador para el endpoint POST /api/auth/login
 */
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validación básica (Requisito 400 Peticiones con errores)
        if (!email || !password) {
            return res.status(400).json({ message: "Email y contraseña son obligatorios." });
        }

        const result = await authService.login(email, password);

        // Requisito 401 Usuario no autenticado
        if (!result) {
            return res.status(401).json({ message: "Credenciales inválidas." });
        }
        
        // Requisito: Imprimir mensaje en consola
        console.log(`[AUTH_CONTROLLER] Usuario ${result.user.email} con rol ${result.user.rol} inició sesión.`);
        
        // Éxito: Devolvemos el token y los datos del usuario
        res.status(200).json(result);

    } catch (error) {
        // Requisito 500 Fallos del servidor
        console.error("Error en el controlador de login:", error);
        next(error); // Pasa el error al manejador de errores global
    }
};

/** POST /api/auth/forgot-password: registra una solicitud interna para ADMIN. */
export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "El email es obligatorio." });
        }

        await authService.requestPasswordReset(email);
        return res.status(200).json({
            message: "Si el email está registrado, el administrador recibirá la solicitud y podrá asignar una clave temporal.",
        });
    } catch (error) {
        next(error);
    }
};

/** POST /api/auth/change-password: valida la clave actual o temporal y guarda una nueva clave. */
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, password } = req.body;
        if (!currentPassword || !password) {
            return res.status(400).json({ message: "La contrasena actual y la nueva son obligatorias." });
        }

        await authService.changePassword(req.user.id, currentPassword, password);
        return res.status(200).json({ message: "Contrasena actualizada. Ya puedes iniciar sesion." });
    } catch (error) {
        next(error);
    }
};
