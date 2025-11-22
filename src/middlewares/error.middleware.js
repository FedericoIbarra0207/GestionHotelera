// Manejo de rutas no encontradas (404)
export function notFoundMiddleware(req, res, next) {
  return res.status(404).json({
    status: 404,
    message: "Ruta no encontrada",
    path: req.originalUrl
  });
}

// Middleware global de manejo de errores
export function errorHandlerMiddleware(err, req, res, next) {
  console.error("🔥 [ERROR] -", err);

  const status = err.status || err.statusCode || 500;

  // Evita mostrar errores internos detallados en producción
  const message = 
    status === 500 
      ? "Error interno del servidor" 
      : err.message;

  return res.status(status).json({
    status,
    message,
    // Extra opcional para debugging
    // stack: err.stack, 
  });
}
