import * as userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

        if (!user) {
            console.log(`[AUTH_SERVICE] Intento de login fallido: Usuario no encontrado (${email})`);
            return null;
        }

        // Logs de depuración
        console.log("DEBUG >> USER OBTENIDO:", user);
        console.log("DEBUG >> PASSWORD EN DB:", user.password);
        console.log("DEBUG >> PASSWORD QUE LLEGA:", password);

        // 2. Comparar la contraseña ingresada con la hasheada
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`[AUTH_SERVICE] Intento de login fallido: Contraseña incorrecta (${email})`);
            return null;
        }

        // ⚠️ IMPORTANTE: leer el secreto AHORA, no arriba del archivo
        const JWT_SECRET = process.env.JWT_SECRET;
        console.log("DEBUG >> JWT_SECRET en runtime:", JWT_SECRET);
        console.log(
            '[AUTH_SERVICE] JWT_SECRET presente:',
            typeof JWT_SECRET === 'string' && JWT_SECRET.length > 0
        );

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET no está definido en process.env");
        }

        // 3. Payload del token
        const payload = {
            id: user.id,
            email: user.email,
            rol: user.rol,
        };

        // 4. Generar el token
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        // 5. Limpiar contraseña antes de devolver
        const publicUser = { ...user };
        delete publicUser.password;

        return {
            token,
            user: publicUser,
        };

    } catch (error) {
        console.error("Error en el servicio de login:", error);
        throw new Error("Error en la lógica de autenticación.");
    }
};
