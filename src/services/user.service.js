import bcrypt from "bcryptjs";
import * as userModel from "../models/user.model.js";
import * as recoveryService from '../password-recovery/password-recovery.service.js';

const SALT_ROUNDS = 10;
const ROLES_VALIDOS = ["ADMIN", "RECEPCIONISTA"];

// Nunca devolvemos password al frontend, ni siquiera hasheada.
const toPublicUser = (user) => {
  const { password, ...publicUser } = user;
  return publicUser;
};

// Centraliza normalizacion y validaciones para altas de usuarios internos.
const normalizarUsuario = (userData) => {
  const nombre = String(userData.nombre || "").trim();
  const email = String(userData.email || "").trim().toLowerCase();
  const password = String(userData.password || "");
  const rol = String(userData.rol || "RECEPCIONISTA").trim().toUpperCase();

  if (!nombre || !email || !password) {
    const error = new Error("Nombre, email y contrasena son obligatorios.");
    error.status = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error("El email no tiene un formato valido.");
    error.status = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error("La contrasena debe tener al menos 8 caracteres.");
    error.status = 400;
    throw error;
  }

  if (!ROLES_VALIDOS.includes(rol)) {
    const error = new Error("Rol invalido. Solo se permiten ADMIN o RECEPCIONISTA.");
    error.status = 400;
    throw error;
  }

  return { nombre, email, password, rol };
};

export const registerUser = async (userData) => {
  const user = normalizarUsuario(userData);
  const existingUser = await userModel.getUserByEmail(user.email);

  if (existingUser) {
    const error = new Error("El email ya se encuentra registrado.");
    error.status = 409;
    throw error;
  }

  // La contrasena se guarda hasheada; el texto plano solo vive durante esta operacion.
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  const newUser = await userModel.createUser({
    email: user.email,
    password: hashedPassword,
    nombre: user.nombre,
    rol: user.rol,
    activo: true,
  });

  return toPublicUser(newUser);
};

export const getAllPublicUsers = async () => {
  const users = await userModel.getAllUsers();
  return users.map(toPublicUser);
};

export const updateUser = async (userId, data) => {
  const existingUser = await userModel.getUserById(userId);
  if (!existingUser) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }

  const updateData = {};

  // Solo se escriben los campos enviados para permitir ediciones parciales.
  if (data.nombre !== undefined) updateData.nombre = String(data.nombre || "").trim();
  if (data.rol !== undefined) {
    const rol = String(data.rol || "").trim().toUpperCase();
    if (!ROLES_VALIDOS.includes(rol)) {
      const error = new Error("Rol invalido.");
      error.status = 400;
      throw error;
    }
    updateData.rol = rol;
  }
  if (data.activo !== undefined) updateData.activo = Boolean(data.activo);
  if (data.password) {
    if (String(data.password).length < 8) {
      const error = new Error("La contrasena debe tener al menos 8 caracteres.");
      error.status = 400;
      throw error;
    }
    updateData.password = await bcrypt.hash(String(data.password), SALT_ROUNDS);
  }

  await userModel.updateUser(userId, updateData);
  const updatedUser = await userModel.getUserById(userId);
  return toPublicUser(updatedUser);
};

/**
 * Un ADMIN asigna una clave temporal tras validar la identidad del empleado.
 * La clave nunca se guarda en la solicitud: sólo se persiste su hash bcrypt.
 */
export const assignTemporaryPassword = async (userId, password, adminId, requestId) => {
  if (String(password || '').length < 8) {
    const error = new Error('La contrasena temporal debe tener al menos 8 caracteres.');
    error.status = 400;
    throw error;
  }
  const user = await userModel.getUserById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  await userModel.updateUser(userId, {
    password: await bcrypt.hash(String(password), SALT_ROUNDS),
    mustChangePassword: true,
    temporaryPasswordAssignedAt: new Date(),
  });
  await recoveryService.resolveRequest(requestId, adminId);
};

/** Devuelve solicitudes de recuperación pendientes, sin datos sensibles. */
export const getPendingPasswordRecoveryRequests = async () => recoveryService.getPendingRequests();

export const deleteUser = async (userId) => {
  const existingUser = await userModel.getUserById(userId);
  if (!existingUser) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }

  await userModel.deleteUser(userId);
};

export const getUserByEmail = async (email) => {
  return await userModel.getUserByEmail(email);
};
