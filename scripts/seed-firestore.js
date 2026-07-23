/**
 * Inicializa una base Firestore de demostracion para el Proyecto Integrador.
 *
 * Seguridad y alcance:
 * - El script requiere `--apply`; sin ese argumento solo informa como usarlo.
 * - Crea exclusivamente documentos con prefijo `demo-` y nunca elimina datos.
 * - Omite documentos que ya existen, por lo que no sobrescribe una base real.
 * - Las contrasenas se reciben por variables de entorno y se guardan con bcrypt.
 * - Usa las mismas credenciales de Firebase que la aplicacion; estas no se versionan.
 *
 * Uso en PowerShell (desarrollo):
 *   $env:SEED_ADMIN_PASSWORD='UnaClaveSegura';
 *   $env:SEED_RECEPTIONIST_PASSWORD='OtraClaveSegura';
 *   npm run db:seed -- --apply
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const seedPath = path.resolve(__dirname, '../database/seed-data.example.json')
const APPLY_FLAG = '--apply'
const DEMO_PREFIX = 'demo-'
let db

const fail = (message) => {
  console.error(`[SEED] ${message}`)
  process.exitCode = 1
}

const ensureDemoId = (id) => {
  if (!String(id).startsWith(DEMO_PREFIX)) {
    throw new Error(`El identificador "${id}" no usa el prefijo seguro "${DEMO_PREFIX}".`)
  }
}

const setIfMissing = async (collection, id, data) => {
  ensureDemoId(id)
  const reference = db.collection(collection).doc(id)
  const snapshot = await reference.get()

  if (snapshot.exists) {
    console.log(`[SEED] Omitido ${collection}/${id}: ya existe.`)
    return false
  }

  await reference.set({ ...data, seededAt: new Date(), createdAt: new Date(), updatedAt: new Date() })
  console.log(`[SEED] Creado ${collection}/${id}.`)
  return true
}

const buildReservationSnapshot = (reservation, guest, room) => ({
  codigo: reservation.codigo,
  huesped: {
    nombre: guest.nombre,
    apellido: guest.apellido,
    documento: guest.documento,
    telefono: guest.telefono,
    email: guest.email,
  },
  habitacion: {
    numero: room.numero,
    tipo: room.tipo,
    precio: room.precio,
  },
  fechaInicio: reservation.fechaInicio,
  fechaFin: reservation.fechaFin,
})

/** Genera las noches ocupadas; la fecha de salida permanece disponible. */
const datesBetween = (start, end) => {
  const dates = []
  const current = new Date(`${start}T00:00:00`)
  const finish = new Date(`${end}T00:00:00`)
  while (current < finish) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

const run = async () => {
  if (!process.argv.includes(APPLY_FLAG)) {
    console.log('[SEED] No se realizaron cambios. Ejecute "npm run db:seed -- --apply" para crear datos ficticios.')
    return
  }

  // La configuracion de Firebase se carga solamente cuando se confirma la
  // escritura. De esta forma el modo informativo no exige secretos locales.
  ;({ db } = await import('../src/config/firebase.config.js'))

  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  const receptionistPassword = process.env.SEED_RECEPTIONIST_PASSWORD
  if (!adminPassword || !receptionistPassword) {
    fail('Defina SEED_ADMIN_PASSWORD y SEED_RECEPTIONIST_PASSWORD antes de ejecutar el seed.')
    return
  }
  if (adminPassword.length < 8 || receptionistPassword.length < 8) {
    fail('Las claves de demostracion deben tener al menos 8 caracteres.')
    return
  }

  const seed = JSON.parse(await fs.readFile(seedPath, 'utf8'))
  const roomsById = new Map(seed.habitaciones.map((room) => [room.id, room]))
  const guestsById = new Map(seed.huespedes.map((guest) => [guest.id, guest]))
  const reservationsById = new Map(seed.reservas.map((reservation) => [reservation.id, reservation]))

  await setIfMissing('USUARIOS', 'demo-admin', {
    nombre: 'Administrador de demostracion',
    email: 'admin.demo@example.com',
    password: await bcrypt.hash(adminPassword, 10),
    rol: 'ADMIN',
    activo: true,
    mustChangePassword: true,
  })
  await setIfMissing('USUARIOS', 'demo-recepcionista', {
    nombre: 'Recepcionista de demostracion',
    email: 'recepcion.demo@example.com',
    password: await bcrypt.hash(receptionistPassword, 10),
    rol: 'RECEPCIONISTA',
    activo: true,
    mustChangePassword: true,
  })

  for (const room of seed.habitaciones) await setIfMissing('HABITACIONES', room.id, room)
  for (const guest of seed.huespedes) await setIfMissing('HUESPEDES', guest.id, guest)

  for (const reservation of seed.reservas) {
    const guest = guestsById.get(reservation.huespedId)
    const room = roomsById.get(reservation.habitacionId)
    if (!guest || !room) throw new Error(`La reserva ${reservation.id} no tiene huesped o habitacion de demostracion validos.`)
    await setIfMissing('RESERVAS', reservation.id, {
      ...reservation,
      creadoPor: 'demo-admin',
      huespedSnapshot: {
        nombre: guest.nombre,
        apellido: guest.apellido,
        documento: guest.documento,
        telefono: guest.telefono,
        email: guest.email,
      },
      habitacionSnapshot: { numero: room.numero, tipo: room.tipo, precio: room.precio },
    })
    // DISPONIBILIDADES es una proyeccion diaria de las reservas activas.
    for (const fecha of datesBetween(reservation.fechaInicio, reservation.fechaFin)) {
      await setIfMissing('DISPONIBILIDADES', `${room.id}_${fecha}`, {
        habitacionId: room.id,
        fecha,
        disponible: false,
      })
    }
  }

  for (const consumo of seed.consumos) {
    const reservation = reservationsById.get(consumo.reservaId)
    const guest = reservation && guestsById.get(reservation.huespedId)
    const room = reservation && roomsById.get(reservation.habitacionId)
    if (!reservation || !guest || !room) throw new Error(`El consumo ${consumo.id} no tiene una reserva de demostracion valida.`)
    await setIfMissing('CONSUMOS_EXTRAS', consumo.id, {
      ...consumo,
      reservaSnapshot: buildReservationSnapshot(reservation, guest, room),
    })
  }

  for (const payment of seed.pagos) {
    const reservation = reservationsById.get(payment.reservaId)
    const guest = reservation && guestsById.get(reservation.huespedId)
    const room = reservation && roomsById.get(reservation.habitacionId)
    if (!reservation || !guest || !room) throw new Error(`El pago ${payment.id} no tiene una reserva de demostracion valida.`)
    await setIfMissing('PAGOS', payment.id, {
      ...payment,
      reservaSnapshot: buildReservationSnapshot(reservation, guest, room),
    })
  }

  console.log('[SEED] Base de demostracion inicializada. Las cuentas deben cambiar su clave en el primer acceso.')
}

run().catch((error) => fail(error.message))
