import * as userModel from '../models/user.model.js'; // Usamos el modelo para buscar al usuario
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Servicio para el login de usuarios.
 * @param {string} email - Email del usuario.
 * @param {string} password - Contraseña en texto plano.
 * @returns {object|null} Objeto con el token y datos del usuario, o null si falla.
 */
export const login = async (email, password) => {
    try {
        // 1. Buscar al usuario por email
        const user = await userModel.getUserByEmail(email);

        // 2. Verificar si el usuario existe
        if (!user) {
            console.log(`[AUTH_SERVICE] Intento de login fallido: Usuario no encontrado (${email})`);
            return null; // Usuario no encontrado
        }
// 3. Comparar la contraseña ingresada con la hasheada en la DB
console.log("DEBUG >> USER OBTENIDO:", user);
console.log("DEBUG >> PASSWORD EN DB:", user.password);
console.log("DEBUG >> PASSWORD QUE LLEGA:", password);

const isMatch = await bcrypt.compare(password, user.password);


        if (!isMatch) {
            console.log(`[AUTH_SERVICE] Intento de login fallido: Contraseña incorrecta (${email})`);
            return null; // Contraseña incorrecta
        }

        // 4. Verificación TEMPORAL del valor real de JWT_SECRET
        console.log("DEBUG >> VALOR DE JWT_SECRET:", JWT_SECRET);

        // 5. Preparar el payload del token
        const payload = {
            id: user.id,
            email: user.email,
            rol: user.rol // Incluimos el ROL en el token (¡Importante para Fase 4!)
        };

        // Mostrar si la clave parece válida (sin mostrarla completa)
        console.log('[AUTH_SERVICE] JWT_SECRET presente:', typeof JWT_SECRET === 'string' && JWT_SECRET.length > 0);

        let token;
        try {
            token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // El token expira en 1 hora
        } catch (jwtErr) {
            console.error('[AUTH_SERVICE] Error al generar JWT:', jwtErr);
            throw jwtErr;
        }

        // 6. Quitar la contraseña antes de devolver
        const publicUser = { ...user };
        delete publicUser.password;

        return {
            token,
            user: publicUser
        };

    } catch (error) {
        console.error("Error en el servicio de login:", error);
        throw new Error("Error en la lógica de autenticación.");
    }
};
