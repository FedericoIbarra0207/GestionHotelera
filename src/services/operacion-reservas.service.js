import * as reservasModel from '../reservas/reservas.model.js'
import * as pagosModel from '../pagos/pagos.model.js'
import * as consumosModel from '../consumos/consumos.model.js'

// Sólo estos estados forman parte de la cuenta a cobrar; los pendientes aún se pueden corregir.
const CONSUMOS_EN_CUENTA = ['EN_CUENTA', 'FACTURADO', 'CERRADO']

/** Convierte una fecha de reserva a día local para comparaciones operativas. */
const toDay = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

/** Calcula noches de alojamiento sin permitir resultados negativos. */
const nights = (reserva) => Math.max(1, Math.round((toDay(reserva.fechaFin) - toDay(reserva.fechaInicio) ) / 86400000))

/**
 * Enriquece cada reserva con su cuenta corriente y estado de operación.
 * No modifica documentos existentes: el historial es una vista calculada,
 * preservando la trazabilidad original de reservas, pagos y consumos.
 */
export const getOperationalReservations = async () => {
  const [reservas, pagos, consumos] = await Promise.all([
    reservasModel.getAll(),
    pagosModel.getAllPagos(),
    consumosModel.getAllConsumos(),
  ])
  const today = toDay(new Date())

  return reservas.map((reserva) => {
    const pagosReserva = pagos.filter((pago) => pago.reservaId === reserva.id && (pago.estado || 'CONFIRMADO') === 'CONFIRMADO')
    const consumosReserva = consumos.filter((consumo) => consumo.reservaId === reserva.id)
    const consumosCobrables = consumosReserva.filter((consumo) => CONSUMOS_EN_CUENTA.includes(consumo.estado))
    const precioNoche = Number(reserva.habitacionSnapshot?.precio || 0)
    const alojamiento = nights(reserva) * precioNoche
    const totalConsumos = consumosCobrables.reduce((sum, consumo) => sum + Number(consumo.monto || 0), 0)
    const abonado = pagosReserva.reduce((sum, pago) => sum + Number(pago.monto || 0), 0)
    const total = alojamiento + totalConsumos
    const saldoPendiente = Math.max(total - abonado, 0)
    const consumosPendientes = consumosReserva.some((consumo) => !CONSUMOS_EN_CUENTA.includes(consumo.estado))
    const estadiaTerminada = reserva.estado === 'checked_out' || toDay(reserva.fechaFin) < today
    const cerrada = reserva.estado !== 'cancelled' && estadiaTerminada && saldoPendiente === 0 && !consumosPendientes

    return {
      ...reserva,
      resumenFinanciero: { alojamiento, totalConsumos, total, abonado, saldoPendiente, consumosPendientes },
      estadoOperativo: reserva.estado === 'cancelled' ? 'CANCELADA' : cerrada ? 'HISTORIAL' : saldoPendiente > 0 || consumosPendientes ? 'PENDIENTE' : 'ACTIVA',
    }
  })
}
