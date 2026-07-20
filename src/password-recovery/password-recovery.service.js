import * as recoveryModel from './password-recovery.model.js'

/**
 * Registra una solicitud pendiente. La verificación de identidad se realiza
 * fuera del sistema por un ADMIN antes de entregar una clave temporal.
 */
export const requestRecovery = async ({ userId, email }) => {
  return recoveryModel.create({ userId, email, status: 'PENDIENTE' })
}

/** Devuelve la cola de solicitudes exclusivamente al panel administrativo. */
export const getPendingRequests = async () => recoveryModel.getPending()

/** Cierra la solicitud al asignarse una contraseña temporal al usuario. */
export const resolveRequest = async (requestId, adminId) => {
  if (requestId) await recoveryModel.resolve(requestId, adminId)
}
