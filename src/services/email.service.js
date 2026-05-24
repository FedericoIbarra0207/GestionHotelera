const hotelInfo = {
  nombre: process.env.HOTEL_NAME || "DVT Hotel",
  emailFrom: process.env.HOTEL_EMAIL_FROM || "DVT Reservas <reservas@example.com>",
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
};

const subjectByEvent = {
  created: "Reserva confirmada",
  updated: "Reserva modificada",
  cancelled: "Reserva cancelada",
};

const titleByEvent = {
  created: "Tu reserva fue confirmada",
  updated: "Tu reserva fue modificada",
  cancelled: "Tu reserva fue cancelada",
};

export const buildReservationEmail = (event, reserva) => {
  const huesped = reserva.huespedSnapshot || {};
  const habitacion = reserva.habitacionSnapshot || {};

  return {
    to: huesped.email,
    subject: `${subjectByEvent[event] || "Actualizacion de reserva"} - ${hotelInfo.nombre}`,
    html: `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${subjectByEvent[event]}</title>
        </head>
        <body style="margin:0;background:#f5f7fa;font-family:Arial,sans-serif;color:#1a1a2e;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fa;padding:24px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="background:#667eea;color:#ffffff;padding:28px;">
                      <h1 style="margin:0;font-size:24px;">${titleByEvent[event]}</h1>
                      <p style="margin:8px 0 0;">${hotelInfo.nombre}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px;">
                      <p style="margin:0 0 18px;">Hola ${huesped.nombre || ""} ${huesped.apellido || ""},</p>
                      <p style="margin:0 0 22px;">Te compartimos el detalle actualizado de tu reserva.</p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                        <tr><td style="padding:10px;border-bottom:1px solid #edf2f7;"><strong>Codigo</strong></td><td style="padding:10px;border-bottom:1px solid #edf2f7;">${reserva.codigo || reserva.id}</td></tr>
                        <tr><td style="padding:10px;border-bottom:1px solid #edf2f7;"><strong>Habitacion</strong></td><td style="padding:10px;border-bottom:1px solid #edf2f7;">${habitacion.numero || ""} - ${habitacion.tipo || ""}</td></tr>
                        <tr><td style="padding:10px;border-bottom:1px solid #edf2f7;"><strong>Entrada</strong></td><td style="padding:10px;border-bottom:1px solid #edf2f7;">${formatDate(reserva.fechaInicio)}</td></tr>
                        <tr><td style="padding:10px;border-bottom:1px solid #edf2f7;"><strong>Salida</strong></td><td style="padding:10px;border-bottom:1px solid #edf2f7;">${formatDate(reserva.fechaFin)}</td></tr>
                        <tr><td style="padding:10px;border-bottom:1px solid #edf2f7;"><strong>Estado</strong></td><td style="padding:10px;border-bottom:1px solid #edf2f7;">${reserva.estado}</td></tr>
                      </table>
                      <p style="margin:22px 0 0;color:#64748b;font-size:14px;">Ante cualquier consulta, responde este correo o comunicate con la recepcion del hotel.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
};

export const sendReservationEmail = async (event, reserva) => {
  const apiKey = process.env.RESEND_API_KEY;
  const email = buildReservationEmail(event, reserva);

  if (!email.to) return;

  if (!apiKey) {
    console.log(`[EMAIL] RESEND_API_KEY no configurada. Email pendiente: ${email.subject} -> ${email.to}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: hotelInfo.emailFrom,
      to: email.to,
      subject: email.subject,
      html: email.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`No se pudo enviar el email de reserva: ${body}`);
  }
};
