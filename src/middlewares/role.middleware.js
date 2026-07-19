export function roleMiddleware(...rolesPermitidos) {
  // Middleware parametrizable: cada ruta declara que roles acepta.
  // Requiere que authMiddleware haya cargado previamente req.user.
  return (req, res, next) => {
    try {
      const usuario = req.user;

      if (!usuario) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!rolesPermitidos.includes(usuario.rol)) {
        return res.status(403).json({
          message: "No tienes permisos para realizar esta accion",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
