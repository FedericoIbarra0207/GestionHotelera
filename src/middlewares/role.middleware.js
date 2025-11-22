// src/middlewares/role.middleware.js

/**
 * Middleware para verificar si el usuario tiene alguno de los roles permitidos.
 * @param  {...string} rolesPermitidos - Ej: ("ADMIN", "RECEPCIONISTA")
 */
export function roleMiddleware(...rolesPermitidos) {
    return (req, res, next) => {
        try {
            const usuario = req.user; // viene del authMiddleware

            if (!usuario) {
                return res.status(401).json({ message: "Usuario no autenticado" });
            }

            if (!rolesPermitidos.includes(usuario.rol)) {
                return res.status(403).json({
                    message: "No tienes permisos para realizar esta acción"
                });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
}
