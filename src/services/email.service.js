const hotelInfo = {
  nombre: process.env.HOTEL_NAME || 'DVT Hotel',
  emailFrom: process.env.HOTEL_EMAIL_FROM || 'DVT Reservas <reservas@example.com>',
}

/** Envía notificaciones de reservas; es independiente del módulo de credenciales. */
export const sendReservationEmail = async (event, reserva) => {
  const apiKey = process.env.RESEND_API_KEY
  const to = reserva.huespedSnapshot?.email
  if (!to) return
  if (!apiKey) {
    console.log(`[EMAIL] Notificacion pendiente (${event}) para ${to}`)
    return
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: hotelInfo.emailFrom,
      to,
      subject: `Actualizacion de reserva - ${hotelInfo.nombre}`,
      html: '<p>Tu reserva fue actualizada. Consulta al hotel para mas informacion.</p>',
    }),
  })
  if (!response.ok) throw new Error(`No se pudo enviar el email: ${await response.text()}`)
}
