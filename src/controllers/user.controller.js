import * as userService from "../services/user.service.js";

// Crea un usuario interno. La logica de validacion y Firebase vive en user.service.js.
export const registerNewUser = async (req, res, next) => {
  try {
    const newUser = await userService.registerUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

// Devuelve usuarios sin exponer datos sensibles como password.
export const listUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllPublicUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// Actualiza datos de un usuario existente por id.
export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Elimina usuario interno por id.
export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ message: "Usuario eliminado correctamente." });
  } catch (error) {
    next(error);
  }
};
