import fs from 'node:fs/promises'
import path from 'node:path'
import { Presentation, PresentationFile } from '@oai/artifact-tool'

const output = process.env.FINAL_PPTX
const previewDir = process.env.PREVIEW_DIR
const qaDir = process.env.QA_DIR

if (!output || !previewDir || !qaDir) {
  throw new Error('FINAL_PPTX, PREVIEW_DIR y QA_DIR son obligatorios.')
}

const WIDTH = 1280
const HEIGHT = 720
const P = {
  ink: '#111827',
  muted: '#475569',
  rule: '#CBD5E1',
  panel: '#F1F5F9',
  blue: '#0F4C81',
  sky: '#D9EAF7',
  teal: '#0F766E',
  green: '#DDF4E8',
  amber: '#FFF2CC',
  rose: '#FCE7F3',
  white: '#FFFFFF',
}

async function writeBlob(file, blob) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, new Uint8Array(await blob.arrayBuffer()))
}

function box(slide, name, left, top, width, height, fill = P.panel, line = P.rule, radius = 'rounded-xl') {
  return slide.shapes.add({
    geometry: 'roundRect',
    name,
    position: { left, top, width, height },
    fill,
    line: { style: 'solid', fill: line, width: 1 },
    borderRadius: radius,
  })
}

function text(slide, name, value, left, top, width, height, options = {}) {
  const shape = slide.shapes.add({
    geometry: 'textbox',
    name,
    position: { left, top, width, height },
    fill: 'none',
    line: { style: 'solid', fill: 'none', width: 0 },
  })
  shape.text = value
  shape.text.style = {
    typeface: 'Arial',
    fontSize: options.fontSize ?? 22,
    color: options.color ?? P.ink,
    bold: options.bold ?? false,
    alignment: options.alignment ?? 'left',
    verticalAlignment: options.verticalAlignment ?? 'top',
    autoFit: 'shrinkText',
    insets: options.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
  }
  return shape
}

function line(slide, name, left, top, width, height = 0, color = P.rule, thickness = 1) {
  return slide.shapes.add({
    geometry: 'straightConnector1',
    name,
    position: { left, top, width, height },
    fill: 'none',
    line: { style: 'solid', fill: color, width: thickness },
  })
}

function addChrome(slide, number, eyebrow = 'DVT · PROYECTO FINAL INTEGRADOR') {
  slide.background.fill = P.white
  text(slide, `eyebrow-${number}`, eyebrow, 56, 36, 620, 24, { fontSize: 13, bold: true, color: P.blue })
  line(slide, `top-rule-${number}`, 56, 72, 1168, 0, P.rule, 1)
  text(slide, `page-${number}`, String(number), 1170, 670, 54, 20, { fontSize: 13, color: P.muted, alignment: 'right' })
}

function addTitle(slide, number, title, subtitle = '') {
  addChrome(slide, number)
  text(slide, `title-${number}`, title, 56, 102, 1080, 94, { fontSize: 40, bold: true, color: P.ink })
  if (subtitle) text(slide, `subtitle-${number}`, subtitle, 56, 208, 1100, 38, { fontSize: 19, color: P.muted })
}

function addPill(slide, name, label, left, top, width, fill = P.sky, color = P.blue) {
  box(slide, `${name}-box`, left, top, width, 34, fill, fill, 'rounded-full')
  text(slide, `${name}-text`, label, left + 12, top + 8, width - 24, 18, { fontSize: 14, bold: true, color, alignment: 'center' })
}

function addCard(slide, name, left, top, width, height, heading, body, accent = P.blue) {
  box(slide, `${name}-frame`, left, top, width, height, P.white, P.rule)
  slide.shapes.add({ geometry: 'rect', name: `${name}-accent`, position: { left, top, width: 7, height }, fill: accent, line: { style: 'solid', fill: accent, width: 0 } })
  text(slide, `${name}-heading`, heading, left + 28, top + 26, width - 48, 38, { fontSize: 23, bold: true })
  text(slide, `${name}-body`, body, left + 28, top + 78, width - 48, height - 100, { fontSize: 18, color: P.muted })
}

function addSource(slide, number, value) {
  text(slide, `source-${number}`, value, 56, 646, 920, 18, { fontSize: 11, color: P.muted })
}

function addStep(slide, name, left, top, width, label, detail, fill = P.sky) {
  box(slide, `${name}-box`, left, top, width, 180, fill, fill)
  text(slide, `${name}-number`, label, left + 22, top + 22, 44, 32, { fontSize: 24, bold: true, color: P.blue })
  text(slide, `${name}-detail`, detail, left + 22, top + 74, width - 44, 80, { fontSize: 20, bold: true, color: P.ink })
}

const deck = Presentation.create({ slideSize: { width: WIDTH, height: HEIGHT } })

// 1. Cover
{
  const s = deck.slides.add()
  s.background.fill = P.white
  text(s, 'cover-eyebrow', 'INSTITUTO DE FORMACIÓN TÉCNICA SUPERIOR 24', 58, 52, 730, 26, { fontSize: 14, bold: true, color: P.blue })
  text(s, 'cover-title', 'DVT — Software\nde Gestión Hotelera', 58, 178, 860, 180, { fontSize: 64, bold: true, color: P.ink })
  text(s, 'cover-subtitle', 'Proyecto Final Integrador · Tecnicatura Superior en Desarrollo de Software', 58, 388, 760, 48, { fontSize: 23, color: P.muted })
  line(s, 'cover-rule', 58, 474, 720, 0, P.blue, 3)
  text(s, 'cover-author', 'Iván Federico Ibarra\nTutor: Ing. Julio Cesar Leppen\n2026', 58, 516, 470, 100, { fontSize: 19, color: P.muted })
  box(s, 'cover-mark', 956, 148, 210, 210, P.sky, P.sky)
  text(s, 'cover-mark-text', 'DVT', 980, 205, 162, 74, { fontSize: 52, bold: true, color: P.blue, alignment: 'center' })
  text(s, 'cover-mark-caption', 'Gestión hotelera\ninteligente', 980, 288, 162, 42, { fontSize: 16, color: P.muted, alignment: 'center' })
}

// 2. Problem
{
  const s = deck.slides.add(); addTitle(s, 2, 'La recepción necesita una única fuente de información', 'Reservas, huéspedes, consumos y pagos deben conservar su relación operativa.')
  addCard(s, 'problem-a', 56, 270, 335, 230, 'Registro disperso', 'Los datos se reparten entre papeles, planillas o mensajes y se vuelven difíciles de consultar.', P.rose)
  addCard(s, 'problem-b', 472, 270, 335, 230, 'Decisiones tardías', 'Sin disponibilidad centralizada pueden aparecer solapamientos o estados desactualizados.', P.amber)
  addCard(s, 'problem-c', 888, 270, 335, 230, 'Poca trazabilidad', 'Un reclamo exige reconstruir qué se consumió, qué se incluyó en la cuenta y qué se pagó.', P.green)
  text(s, 'problem-close', 'DVT organiza esos eventos en una aplicación web con reglas de negocio verificables.', 56, 548, 1040, 42, { fontSize: 27, bold: true, color: P.blue })
}

// 3. Objective and scope
{
  const s = deck.slides.add(); addTitle(s, 3, 'El proyecto concentra la operación diaria del alojamiento', 'El alcance se definió para resolver flujos internos antes que integrar servicios externos.')
  addStep(s, 'scope-1', 56, 270, 250, '01', 'Gestionar habitaciones y huéspedes', P.sky)
  addStep(s, 'scope-2', 350, 270, 250, '02', 'Operar reservas y disponibilidad', P.green)
  addStep(s, 'scope-3', 644, 270, 250, '03', 'Registrar consumos y pagos', P.amber)
  addStep(s, 'scope-4', 938, 270, 250, '04', 'Aplicar roles y trazabilidad', P.rose)
  text(s, 'scope-note', 'No se incluye pasarela de pago, facturación fiscal ni motor de reservas público: son extensiones futuras.', 56, 542, 1080, 48, { fontSize: 20, color: P.muted })
}

// 4. Solution surfaces
{
  const s = deck.slides.add(); addTitle(s, 4, 'Una landing pública deriva hacia una aplicación interna', 'Ambas experiencias se sirven desde el mismo despliegue, pero cumplen objetivos distintos.')
  box(s, 'landing-surface', 56, 270, 510, 265, P.sky, P.sky)
  text(s, 'landing-title', 'Sitio comercial', 88, 306, 380, 42, { fontSize: 31, bold: true, color: P.blue })
  text(s, 'landing-body', 'Presenta la propuesta de valor, los módulos y el acceso rápido a la plataforma.', 88, 376, 400, 72, { fontSize: 22, color: P.muted })
  addPill(s, 'landing-path', '/', 88, 470, 78)
  box(s, 'app-surface', 712, 270, 510, 265, P.green, P.green)
  text(s, 'app-title', 'Aplicación de recepción', 744, 306, 430, 42, { fontSize: 31, bold: true, color: P.teal })
  text(s, 'app-body', 'Autentica usuarios internos y habilita vistas operativas según el rol asignado.', 744, 376, 400, 72, { fontSize: 22, color: P.muted })
  addPill(s, 'app-path', '/app/login', 744, 470, 136, P.white, P.teal)
  line(s, 'surface-link', 566, 402, 146, 0, P.blue, 3)
  text(s, 'surface-link-label', 'acceso', 602, 372, 76, 24, { fontSize: 16, bold: true, color: P.blue, alignment: 'center' })
}

// 5. Architecture
{
  const s = deck.slides.add(); addTitle(s, 5, 'La arquitectura separa interfaz, reglas de negocio y persistencia', 'El backend aplica validaciones y permisos antes de consultar la base de datos.')
  line(s, 'arch-line-1', 306, 373, 180, 0, P.rule, 3); line(s, 'arch-line-2', 748, 373, 180, 0, P.rule, 3)
  box(s, 'arch-ui', 56, 292, 250, 164, P.sky, P.sky); box(s, 'arch-api', 486, 270, 262, 210, P.amber, P.amber); box(s, 'arch-db', 928, 292, 250, 164, P.green, P.green)
  text(s, 'arch-ui-title', 'Interfaz web', 80, 324, 200, 32, { fontSize: 26, bold: true, color: P.blue, alignment: 'center' })
  text(s, 'arch-ui-body', 'Landing estática\nVue 3 + Vite', 80, 370, 200, 60, { fontSize: 19, color: P.muted, alignment: 'center' })
  text(s, 'arch-api-title', 'API REST', 518, 306, 198, 34, { fontSize: 29, bold: true, color: P.ink, alignment: 'center' })
  text(s, 'arch-api-body', 'Node.js + Express\nJWT · CORS · Servicios', 512, 360, 210, 66, { fontSize: 19, color: P.muted, alignment: 'center' })
  text(s, 'arch-db-title', 'Cloud Firestore', 952, 324, 200, 32, { fontSize: 26, bold: true, color: P.teal, alignment: 'center' })
  text(s, 'arch-db-body', 'Colecciones y documentos\nFirebase Admin SDK', 952, 370, 200, 60, { fontSize: 19, color: P.muted, alignment: 'center' })
  text(s, 'arch-https', 'HTTPS + JWT', 334, 332, 128, 26, { fontSize: 15, bold: true, color: P.blue, alignment: 'center' })
  text(s, 'arch-data', 'lectura y escritura', 764, 332, 148, 26, { fontSize: 15, bold: true, color: P.teal, alignment: 'center' })
  addSource(s, 5, 'Tecnologías: Vue.js (2026), Firebase (2026), Node.js (2026).')
}

// 6. Technology
{
  const s = deck.slides.add(); addTitle(s, 6, 'El stack fue elegido para construir y desplegar una SPA completa', 'Cada tecnología cumple una responsabilidad concreta dentro de la solución.')
  addCard(s, 'tech-1', 56, 256, 255, 244, 'Frontend', 'Vue 3, Vue Router y Vite para vistas reactivas, rutas y build de producción.', P.blue)
  addCard(s, 'tech-2', 350, 256, 255, 244, 'Backend', 'Node.js y Express para API REST, middlewares y reglas de negocio.', P.teal)
  addCard(s, 'tech-3', 644, 256, 255, 244, 'Datos', 'Cloud Firestore y Firebase Admin SDK para persistencia NoSQL.', '#B45309')
  addCard(s, 'tech-4', 938, 256, 255, 244, 'Hosting', 'Render Web Service para build, inicio y health check público.', '#9D174D')
  addSource(s, 6, 'Fuentes: Node.js (2026), Vue.js (2026), Vite (2026), Firebase (2026), Render (2026).')
}

// 7. Modules
{
  const s = deck.slides.add(); addTitle(s, 7, 'Los módulos reflejan el recorrido real de la recepción', 'La aplicación no reúne pantallas aisladas: cada módulo alimenta el siguiente.')
  const modules = [['Usuarios', 'roles y claves'], ['Habitaciones', 'inventario y tarifa'], ['Huéspedes', 'datos de estadía'], ['Reservas', 'fechas y operación'], ['Consumos', 'cuenta corriente'], ['Pagos', 'movimientos confirmados']]
  modules.forEach((m, i) => {
    const col = i % 3; const row = Math.floor(i / 3); const left = 56 + col * 394; const top = 254 + row * 156
    box(s, `module-${i}`, left, top, 338, 114, i % 2 === 0 ? P.panel : P.white, P.rule)
    text(s, `module-title-${i}`, m[0], left + 22, top + 24, 282, 30, { fontSize: 23, bold: true })
    text(s, `module-body-${i}`, m[1], left + 22, top + 67, 282, 24, { fontSize: 17, color: P.muted })
  })
  text(s, 'modules-close', 'Los snapshots en reservas, consumos y pagos preservan el contexto histórico aunque cambien los registros maestros.', 56, 572, 1090, 38, { fontSize: 20, color: P.blue, bold: true })
}

// 8. Reservation flow
{
  const s = deck.slides.add(); addTitle(s, 8, 'Las reservas se validan antes de bloquear la disponibilidad', 'La lógica compara rangos de fechas y estados activos para evitar solapamientos.')
  const steps = [['1', 'Seleccionar habitación', 'No se permite mantenimiento.'], ['2', 'Validar fechas', 'Ingreso anterior a salida.'], ['3', 'Buscar conflictos', 'No hay reservas activas superpuestas.'], ['4', 'Confirmar operación', 'Se guarda snapshot y disponibilidad diaria.']]
  steps.forEach((step, i) => {
    const left = 56 + i * 292
    addStep(s, `reserve-${i}`, left, 294, 238, step[0], step[1], i === 2 ? P.amber : P.sky)
    text(s, `reserve-note-${i}`, step[2], left + 20, 494, 198, 40, { fontSize: 15, color: P.muted, alignment: 'center' })
  })
  text(s, 'reserve-states', 'Estados operativos: pending · confirmed · checked_in · checked_out · cancelled', 56, 577, 850, 34, { fontSize: 20, color: P.teal, bold: true })
}

// 9. Consumption and payment
{
  const s = deck.slides.add(); addTitle(s, 9, 'Agregar un consumo a la cuenta no equivale a cobrarlo', 'La separación de estados evita confundir el registro operativo con el ingreso de dinero.')
  const flow = [['PENDIENTE', 'Se registra el servicio y todavía puede corregirse.', P.rose], ['EN CUENTA', 'El cargo se suma al saldo de la reserva.', P.amber], ['PAGO CONFIRMADO', 'Se crea un movimiento con método y monto.', P.green]]
  flow.forEach((item, i) => {
    const left = 70 + i * 397
    box(s, `money-box-${i}`, left, 284, 312, 210, item[2], item[2])
    text(s, `money-title-${i}`, item[0], left + 26, 320, 260, 34, { fontSize: 24, bold: true, color: i === 2 ? P.teal : P.ink, alignment: 'center' })
    text(s, `money-body-${i}`, item[1], left + 30, 376, 252, 78, { fontSize: 18, color: P.muted, alignment: 'center' })
    if (i < 2) text(s, `money-arrow-${i}`, '→', left + 324, 359, 52, 44, { fontSize: 38, bold: true, color: P.blue, alignment: 'center' })
  })
  text(s, 'money-rule', 'Categorías normalizadas: gastronomía · lavandería · estacionamiento · spa · otros.', 70, 560, 920, 36, { fontSize: 19, color: P.muted })
}

// 10. Roles and security
{
  const s = deck.slides.add(); addTitle(s, 10, 'La seguridad combina sesión, roles y resguardo de secretos', 'La autorización se verifica en el backend; no depende sólo de ocultar botones.')
  box(s, 'security-left', 56, 256, 536, 290, P.sky, P.sky)
  text(s, 'security-left-title', 'ADMIN', 88, 292, 440, 38, { fontSize: 30, bold: true, color: P.blue })
  text(s, 'security-left-body', 'Gestiona usuarios, habitaciones, cierres y eliminaciones.\n\nAsigna claves temporales tras validar identidad.', 88, 358, 420, 126, { fontSize: 21, color: P.muted })
  box(s, 'security-right', 688, 256, 536, 290, P.green, P.green)
  text(s, 'security-right-title', 'RECEPCIONISTA', 720, 292, 440, 38, { fontSize: 30, bold: true, color: P.teal })
  text(s, 'security-right-body', 'Opera huéspedes, reservas, consumos pendientes y pagos.\n\nNo administra usuarios ni elimina movimientos críticos.', 720, 358, 420, 126, { fontSize: 21, color: P.muted })
  addPill(s, 'jwt-pill', 'JWT · sesión de 8 horas', 56, 582, 218)
  addPill(s, 'bcrypt-pill', 'bcrypt · hash de claves', 294, 582, 220, P.green, P.teal)
  addPill(s, 'cors-pill', 'CORS · lista blanca', 534, 582, 204, P.amber, '#8A5A00')
  addSource(s, 10, 'Referencia: RFC 7519 para JWT; OWASP (2026) para almacenamiento de contraseñas.')
}

// 11. Recovery
{
  const s = deck.slides.add(); addTitle(s, 11, 'La recuperación de acceso es interna y auditable', 'No se simula un correo de contraseña: el administrador valida y asigna una clave temporal.')
  const recovery = [['01', 'Solicitud', 'El usuario informa su correo desde el login.'], ['02', 'Registro', 'Se guarda una solicitud PENDIENTE sin exponer si existe la cuenta.'], ['03', 'Validación', 'El administrador revisa la identidad y resuelve el pedido.'], ['04', 'Cambio obligatorio', 'La clave temporal se hashea y el usuario debe reemplazarla.']]
  recovery.forEach((item, i) => {
    const left = 56 + i * 292
    addStep(s, `recovery-${i}`, left, 282, 238, item[0], item[1], i === 3 ? P.green : P.panel)
    text(s, `recovery-detail-${i}`, item[2], left + 14, 480, 210, 54, { fontSize: 15, color: P.muted, alignment: 'center' })
  })
}

// 12. Deployment / reproducibility
{
  const s = deck.slides.add(); addTitle(s, 12, 'El despliegue y la reproducción quedan documentados', 'El repositorio, Render y el seed ficticio permiten verificar la solución fuera del equipo de desarrollo.')
  addCard(s, 'deploy-repo', 56, 268, 340, 250, 'GitHub', 'El código, render.yaml, README y los datos ficticios se versionan sin secretos.', P.blue)
  addCard(s, 'deploy-render', 470, 268, 340, 250, 'Render', 'Web Service: build de Vue, inicio de Express y health check en /api/health.', P.teal)
  addCard(s, 'deploy-seed', 884, 268, 340, 250, 'Firestore seed', 'El script requiere --apply, crea sólo demo-* y no borra ni sobrescribe datos.', '#B45309')
  text(s, 'deploy-url', 'URL pública: gestionhotelera-dm5p.onrender.com', 56, 568, 780, 30, { fontSize: 21, bold: true, color: P.blue })
  addSource(s, 12, 'Render (2026): las instancias gratuitas pueden reanudarse al recibir una nueva solicitud.')
}

// 13. Validation
{
  const s = deck.slides.add(); addTitle(s, 13, 'La calidad se verifica por flujo, código y disponibilidad', 'La evidencia combina controles automáticos, pruebas de integración y chequeo del despliegue.')
  const checks = [
    ['Código', 'ESLint y build de Vite finalizan sin errores.'],
    ['Seguridad', 'Rutas privadas sin token responden 401.'],
    ['Negocio', 'Reservas, consumos, cuenta y pagos siguen estados definidos.'],
    ['Producción', 'Landing, /app/login y /api/health se revisan antes de exponer.'],
  ]
  checks.forEach((item, i) => {
    const top = 250 + i * 82
    box(s, `check-row-${i}`, 56, top, 1120, 56, i % 2 ? P.white : P.panel, P.rule)
    text(s, `check-title-${i}`, item[0], 82, top + 15, 170, 26, { fontSize: 19, bold: true, color: P.blue })
    text(s, `check-body-${i}`, item[1], 302, top + 15, 820, 26, { fontSize: 18, color: P.muted })
  })
  text(s, 'check-close', 'La demostración final repite estos flujos con datos ficticios y una lista de verificación.', 56, 592, 1000, 34, { fontSize: 21, bold: true, color: P.teal })
}

// 14. Results / limits
{
  const s = deck.slides.add(); addTitle(s, 14, 'El resultado es funcional y deja límites explícitos', 'La tesis diferencia lo implementado hoy de las extensiones necesarias para una operación comercial completa.')
  addCard(s, 'result-left', 56, 266, 520, 276, 'Implementado', 'Aplicación interna, roles, reservas, consumos, pagos, clave temporal, Render, README y seed ficticio.', P.teal)
  addCard(s, 'result-right', 704, 266, 520, 276, 'Evolución futura', 'MFA, rate limiting, facturación fiscal, pasarela de pago, reportes, auditoría ampliada y pruebas automatizadas.', '#B45309')
  text(s, 'result-close', 'Explicitar límites fortalece la defensa: demuestra criterio técnico y evita afirmar integraciones inexistentes.', 56, 592, 1100, 34, { fontSize: 20, color: P.muted })
}

// 15. Conclusion
{
  const s = deck.slides.add(); addChrome(s, 15, 'DVT · CIERRE')
  text(s, 'final-title', 'DVT transforma tareas dispersas\nen una operación trazable', 56, 164, 1000, 138, { fontSize: 53, bold: true, color: P.ink })
  text(s, 'final-body', 'La solución integra recepción, reglas de negocio, seguridad, despliegue y documentación reproducible en un mismo proyecto académico.', 56, 350, 860, 70, { fontSize: 25, color: P.muted })
  line(s, 'final-rule', 56, 482, 742, 0, P.blue, 3)
  text(s, 'final-points', '• Operación centralizada\n• Roles y trazabilidad\n• Deploy verificable\n• Base de demostración reproducible', 56, 516, 520, 108, { fontSize: 20, color: P.blue })
  text(s, 'final-url', 'gestionhotelera-dm5p.onrender.com', 826, 556, 350, 26, { fontSize: 18, bold: true, color: P.teal, alignment: 'right' })
}

await fs.mkdir(previewDir, { recursive: true })
await fs.mkdir(qaDir, { recursive: true })

for (const [index, slide] of deck.slides.items.entries()) {
  await writeBlob(path.join(previewDir, `slide-${String(index + 1).padStart(2, '0')}.png`), await deck.export({ slide, format: 'png', scale: 1 }))
  await fs.writeFile(path.join(qaDir, `slide-${String(index + 1).padStart(2, '0')}.layout.json`), await (await slide.export({ format: 'layout' })).text())
}
await writeBlob(path.join(qaDir, 'deck-montage.webp'), await deck.export({ format: 'webp', montage: true, scale: 1 }))
await fs.writeFile(path.join(qaDir, 'deck-inspect.ndjson'), (await deck.inspect({ kind: 'slide,textbox,shape', maxChars: 16000 })).ndjson)
const pptx = await PresentationFile.exportPptx(deck)
await pptx.save(output)
console.log(`Presentación creada: ${output}`)
