import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userModel from "../models/user.model.js";

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

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET no esta definido en las variables de entorno.");
  }

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
