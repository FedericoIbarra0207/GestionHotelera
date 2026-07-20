import { db } from '../config/firebase.config.js'

// Colección de auditoría: nunca guarda contraseñas ni tokens.
const collection = db.collection('SOLICITUDES_RECUPERACION_CLAVE')

/** Persiste una solicitud de recuperación iniciada por un usuario interno. */
export const create = async (data) => {
  const reference = await collection.add({ ...data, requestedAt: new Date() })
  return { id: reference.id, ...data }
}

/** Lista solicitudes pendientes para que un administrador valide la identidad. */
export const getPending = async () => {
  const snapshot = await collection.where('status', '==', 'PENDIENTE').get()
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.requestedAt?.toMillis?.() || 0) - (a.requestedAt?.toMillis?.() || 0))
}

/** Marca una solicitud como resuelta sin registrar la clave temporal. */
export const resolve = async (requestId, adminId) => {
  await collection.doc(requestId).update({
    status: 'RESUELTA',
    resolvedAt: new Date(),
    resolvedBy: adminId,
  })
}
