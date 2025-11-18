// Middlewares para manejo de errores
export function notFoundMiddleware(req, res, next) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}

export function errorHandlerMiddleware(err, req, res, next) {
  // Loguear error para depuración
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err?.status || 500).json({ message: err?.message || 'Error interno del servidor' });
}
