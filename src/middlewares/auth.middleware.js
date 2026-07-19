import jwt from "jsonwebtoken";

// Valida el JWT enviado como "Authorization: Bearer <token>".
// Si es correcto, deja el usuario decodificado en req.user para roles y auditoria.
export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no provisto o invalido" });
  }

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    console.error("[AUTH_MIDDLEWARE] Token invalido o expirado:", error.message);
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
};
