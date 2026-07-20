import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userModel from "../models/user.model.js";
import * as recoveryService from '../password-recovery/password-recovery.service.js';

/** Obtiene la clave de firma común a las sesiones y enlaces de recuperación. */
const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET no esta definido en las variables de entorno.");
  }
  return jwtSecret;
};


// Autentica credenciales contra usuarios internos y devuelve un JWT de sesion.
export const login = async (email, password) => {
  const user = await userModel.getUserByEmail(String(email || "").trim().toLowerCase());

  if (!user) {
    console.warn(`[AUTH_SERVICE] Login fallido para email no registrado: ${email}`);
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.warn(`[AUTH_SERVICE] Login fallido por credenciales invalidas: ${email}`);
    return null;
  }

  const jwtSecret = getJwtSecret();

  const payload = {
    id: user.id,
    email: user.email,
    rol: user.rol,
  };

  // El token guarda solo datos publicos necesarios para permisos del backend.
  const token = jwt.sign(payload, jwtSecret, { expiresIn: "8h" });
  const publicUser = { ...user };
  delete publicUser.password;

  return {
    token,
    user: publicUser,
  };
};

/**
 * Registra una solicitud de recuperación para una cuenta existente.
 *
 * La ausencia de usuario no genera error para evitar enumerar correos. El token
 * La resolución requiere validación de identidad por parte de un ADMIN.
 * @param {string} email Correo informado por el usuario.
 * @returns {Promise<void>}
 */
export const requestPasswordReset = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await userModel.getUserByEmail(normalizedEmail);

  // El controlador siempre devuelve el mismo mensaje para no revelar que
  // direcciones de correo existen en el sistema.
  if (!user) return;

  await recoveryService.requestRecovery({ userId: user.id, email: user.email });
};

/**
 * Cambia la contraseña de una sesión autenticada después de validar la clave actual.
 * @param {string} userId Usuario autenticado por JWT.
 * @param {string} currentPassword Contraseña actual o temporal.
 * @param {string} newPassword Nueva contraseña en texto plano, sólo durante esta operación.
 * @returns {Promise<void>}
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const password = String(newPassword || "");
  if (password.length < 8) {
    const error = new Error("La contrasena debe tener al menos 8 caracteres.");
    error.status = 400;
    throw error;
  }

  const user = await userModel.getUserById(userId);
  if (!user) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }

  const validCurrentPassword = await bcrypt.compare(String(currentPassword || ''), user.password);
  if (!validCurrentPassword) {
    const error = new Error("La contrasena actual es incorrecta.");
    error.status = 400;
    throw error;
  }

  await userModel.updateUser(user.id, {
    password: await bcrypt.hash(password, 10),
    mustChangePassword: false,
    passwordChangedAt: new Date(),
  });
};
