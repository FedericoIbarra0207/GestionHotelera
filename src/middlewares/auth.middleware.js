import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token no provisto o inválido" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Esto lo usaremos en todas las rutas
        req.user = decoded;

        next();
    } catch (error) {
        console.error("[AUTH_MIDDLEWARE] Error al validar token:", error);
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
};
