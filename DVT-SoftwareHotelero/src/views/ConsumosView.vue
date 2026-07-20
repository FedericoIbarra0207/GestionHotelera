<script setup>
//  se guarda el estado del formulario y se llama al backend.
import { computed, onMounted, ref } from 'vue'
import { apiFetch } from '../services/api'

const consumos = ref([])
const reservas = ref([])
const habitaciones = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const user = JSON.parse(localStorage.getItem('user') || '{}')
const esAdmin = computed(() => user.rol === 'ADMIN')
// ADMIN y RECEPCIONISTA cargan y corrigen consumos; sólo ADMIN cierra o elimina.
const puedeEditar = computed(() => ['ADMIN', 'RECEPCIONISTA'].includes(user.rol))
const consumoEditandoId = ref(null)
const vistaConsumos = ref('TODOS')
const filtroMes = ref('')
const filtroReserva = ref('')
const filtroHabitacion = ref('')
const filtroHuesped = ref('')

// Formulario para registrar consumos extras asociados a una reserva.
const form = ref({
  reservaId: '',
  categoria: 'GASTRONOMIA',
  descripcion: '',
  monto: ''
})

// Carga consumos, reservas y habitaciones para armar la tabla y el selector.
const cargarDatos = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [consumosData, reservasData, habitacionesData] = await Promise.all([
      apiFetch('/consumos'),
      apiFetch('/reservas'),
      apiFetch('/habitaciones')
    ])

    consumos.value = consumosData
    reservas.value = reservasData
    habitaciones.value = habitacionesData
  } catch (error) {
    errorMessage.value = error.message || 'No se pudieron cargar los consumos'
  } finally {
    isLoading.value = false
  }
}

// Envia un nuevo consumo al backend y refresca la informacion.
const registrarConsumo = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const estabaEditando = Boolean(consumoEditandoId.value)
    const endpoint = consumoEditandoId.value ? `/consumos/${consumoEditandoId.value}` : '/consumos'
    const method = consumoEditandoId.value ? 'PUT' : 'POST'

    const consumoGuardado = await apiFetch(endpoint, {
      method,
      body: JSON.stringify({
        reservaId: form.value.reservaId,
        categoria: form.value.categoria,
        descripcion: form.value.descripcion,
        monto: Number(form.value.monto)
      })
    })

    /* Inserta el resultado de inmediato para evitar que el listado quede vacío
       mientras se sincroniza la siguiente consulta a Firestore. */
    if (estabaEditando) {
      consumos.value = consumos.value.map((consumo) => consumo.id === consumoGuardado.id ? consumoGuardado : consumo)
    } else {
      consumos.value = [consumoGuardado, ...consumos.value]
    }

    cancelarEdicion()
    // Después de registrar, vuelve al contexto completo para mostrar el nuevo cargo.
    limpiarFiltros()
    successMessage.value = estabaEditando ? 'Consumo actualizado correctamente.' : 'Consumo registrado correctamente.'
    await cargarDatos()
  } catch (error) {
    errorMessage.value = error.message || 'No se pudo registrar el consumo'
  } finally {
    isSubmitting.value = false
  }
}

const editarConsumo = (consumo) => {
  // Reutiliza el formulario lateral para corregir consumos cargados previamente.
  consumoEditandoId.value = consumo.id
  form.value = {
    reservaId: consumo.reservaId,
    categoria: consumo.categoria || 'OTROS',
    descripcion: consumo.descripcion,
    monto: Number(consumo.monto || 0)
  }
}

const cancelarEdicion = () => {
  consumoEditandoId.value = null
  form.value = { reservaId: '', categoria: 'GASTRONOMIA', descripcion: '', monto: '' }
}

const eliminarConsumo = async (consumo) => {
  if (!confirm('Seguro que deseas eliminar este consumo?')) return

  try {
    await apiFetch(`/consumos/${consumo.id}`, { method: 'DELETE' })
    successMessage.value = 'Consumo eliminado correctamente.'
    await cargarDatos()
  } catch (error) {
    errorMessage.value = error.message || 'No se pudo eliminar el consumo'
  }
}

/** Incluye el consumo en la cuenta; el pago real se registra aparte en Pagos. */
const incluirEnCuenta = async (consumo) => {
  if (!confirm(`Agregar “${consumo.descripcion}” a la cuenta del huésped?`)) return
  try {
    const consumoConfirmado = await apiFetch(`/consumos/${consumo.id}/incluir-en-cuenta`, { method: 'PATCH' })
    consumos.value = consumos.value.map((item) => item.id === consumoConfirmado.id ? consumoConfirmado : item)
    successMessage.value = 'Consumo agregado a la cuenta. El cobro se registra desde Pagos.'
    await cargarDatos()
  } catch (error) {
    errorMessage.value = error.message || 'No se pudo agregar el consumo a la cuenta'
  }
}

// Valida que el formulario tenga reserva, descripcion y monto positivo.
const formInvalido = computed(() => {
  return !form.value.reservaId || !form.value.descripcion || !form.value.monto || Number(form.value.monto) <= 0
})

// Solo muestra reservas que siguen activas para poder cargar consumos.
const reservasConEstadiaActiva = computed(() => {
  return reservas.value.filter((reserva) => reserva.estado !== 'cancelled' && reserva.estado !== 'checked_out')
})

// Busca el numero de habitacion asociado a una reserva.
const habitacionDeReserva = (reservaId) => {
  const reserva = reservas.value.find((item) => item.id === reservaId)
  const habitacion = habitaciones.value.find((item) => item.id === reserva?.habitacionId)
  return habitacion?.numero || 'Sin dato'
}

// Texto que se muestra en el selector de reservas.
const etiquetaReserva = (reserva) => {
  const huesped = reserva.huespedSnapshot
    ? `${reserva.huespedSnapshot.nombre || ''} ${reserva.huespedSnapshot.apellido || ''}`.trim()
    : 'Reserva anterior'
  return `${reserva.codigo || reserva.id.substring(0, 8)} - ${huesped}`
}

// Suma todos los consumos cargados.
const totalConsumos = computed(() => {
  return consumosFiltrados.value.reduce((total, consumo) => total + Number(consumo.monto || 0), 0)
})

/** Total pendiente de confirmación: todavía no integra el saldo a cobrar. */
const totalPendienteConfirmacion = computed(() => {
  return consumos.value
    .filter((consumo) => !['EN_CUENTA', 'FACTURADO', 'CERRADO'].includes(consumo.estado))
    .reduce((total, consumo) => total + Number(consumo.monto || 0), 0)
})

/** Obtiene fecha de alta compatible con Timestamp de Firestore y valores ISO. */
const consumoDate = (consumo) => {
  const value = consumo.createdAt?.toDate?.() || consumo.createdAt
  return value ? new Date(value) : null
}

/** Separa cargos pendientes de los que ya integran la cuenta del huésped. */
const consumosFiltrados = computed(() => consumos.value.filter((consumo) => {
  const fecha = consumoDate(consumo)
  const confirmado = ['EN_CUENTA', 'FACTURADO', 'CERRADO'].includes(consumo.estado)
  const habitacion = consumo.reservaSnapshot?.habitacion?.numero || habitacionDeReserva(consumo.reservaId)
  const huesped = `${consumo.reservaSnapshot?.huesped?.nombre || ''} ${consumo.reservaSnapshot?.huesped?.apellido || ''}`.toLowerCase()
  return (!filtroMes.value || (fecha && `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}` === filtroMes.value)) &&
    (!filtroReserva.value || consumo.reservaId === filtroReserva.value) &&
    (!filtroHabitacion.value || String(habitacion) === filtroHabitacion.value) &&
    (!filtroHuesped.value || huesped.includes(filtroHuesped.value.trim().toLowerCase())) &&
    (vistaConsumos.value === 'TODOS' || (vistaConsumos.value === 'PENDIENTES' && !confirmado) || (vistaConsumos.value === 'HISTORIAL' && confirmado))
}))

/** Presenta estados técnicos con lenguaje operativo comprensible para recepción. */
const etiquetaEstado = (estado) => ({
  PENDIENTE_FACTURACION: 'PENDIENTE DE CONFIRMAR',
  EN_CUENTA: 'INCLUIDO EN CUENTA',
  FACTURADO: 'INCLUIDO EN CUENTA',
  CERRADO: 'CERRADO'
}[estado] || 'PENDIENTE DE CONFIRMAR')

/** Devuelve el listado completo después de una búsqueda o vista específica. */
const limpiarFiltros = () => {
  vistaConsumos.value = 'TODOS'
  filtroMes.value = ''
  filtroReserva.value = ''
  filtroHabitacion.value = ''
  filtroHuesped.value = ''
}

const reservasConConsumos = computed(() => {
  // Cuenta reservas unicas con consumos, no la cantidad total de items.
  return new Set(consumos.value.map((consumo) => consumo.reservaId)).size
})

// Al abrir o recargar la vista, no se conserva ningún filtro de una sesión previa.
onMounted(async () => {
  limpiarFiltros()
  await cargarDatos()
})
</script>

<!--
definicion de lo que se ve en pantalla.
  Usa las variables del <script setup> para mostrar resumen, tabla, mensajes y formulario.
-->
<template>
  <section class="page">
    <div class="header">
      <h1>Consumos extras</h1>
      <p>Registra servicios adicionales vinculados a cada reserva.</p>
    </div>

    <div class="summary">
      <div class="summary-item">
        <span>Consumos registrados</span>
        <strong>{{ consumos.length }}</strong>
      </div>
      <div class="summary-item">
        <span>Reservas con consumos</span>
        <strong>{{ reservasConConsumos }}</strong>
      </div>
      <div class="summary-item highlight">
        <span>Pendiente de confirmar</span>
        <strong>${{ totalPendienteConfirmacion }}</strong>
      </div>
    </div>

    <p v-if="errorMessage" class="msg error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="msg success">{{ successMessage }}</p>

    <div class="panel filters">
      <div class="tabs"><button v-for="vista in ['TODOS', 'PENDIENTES', 'HISTORIAL']" :key="vista" :class="{ active: vistaConsumos === vista }" @click="vistaConsumos = vista">{{ vista === 'PENDIENTES' ? 'Por confirmar' : vista === 'HISTORIAL' ? 'Incluidos en cuenta' : 'Todos' }}</button></div>
      <input v-model="filtroMes" type="month">
      <input v-model="filtroHuesped" placeholder="Filtrar por huésped">
      <select v-model="filtroReserva"><option value="">Todas las reservas</option><option v-for="reserva in reservas" :key="reserva.id" :value="reserva.id">{{ etiquetaReserva(reserva) }}</option></select>
      <select v-model="filtroHabitacion"><option value="">Todas las habitaciones</option><option v-for="habitacion in habitaciones" :key="habitacion.id" :value="String(habitacion.numero)">Hab. {{ habitacion.numero }}</option></select>
      <button type="button" class="btn-clear" @click="limpiarFiltros">Limpiar filtros</button>
    </div>
    <p v-if="vistaConsumos === 'HISTORIAL'" class="history-help">Estos cargos ya integran la cuenta del huésped. El dinero se registra recién al confirmar un pago en el módulo Pagos.</p>

    <div class="layout-grid">
      <div class="panel">
        <h3>Listado de consumos</h3>

        <div v-if="isLoading" class="empty-state">Cargando consumos...</div>
        <table v-else class="tabla-custom">
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Habitacion</th>
              <th>Categoría</th>
              <th>Descripcion</th>
              <th>Monto</th>
              <th>Estado</th>
              <th v-if="puedeEditar">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="consumo in consumosFiltrados" :key="consumo.id">
              <td data-label="Reserva">{{ consumo.reservaSnapshot?.codigo || consumo.reservaId }}</td>
              <td data-label="Habitación">Hab. {{ consumo.reservaSnapshot?.habitacion?.numero || habitacionDeReserva(consumo.reservaId) }}</td>
              <td data-label="Categoría"><strong>{{ consumo.categoria || 'OTROS' }}</strong></td>
              <td data-label="Descripción">{{ consumo.descripcion }}</td>
              <td data-label="Monto">${{ consumo.monto }}</td>
              <td data-label="Estado"><span class="badge">{{ etiquetaEstado(consumo.estado) }}</span></td>
              <td v-if="puedeEditar" data-label="Acciones" class="actions">
                <button v-if="!['EN_CUENTA', 'CERRADO', 'FACTURADO'].includes(consumo.estado)" class="btn-edit" @click="editarConsumo(consumo)">Editar</button>
                <button v-if="!['EN_CUENTA', 'CERRADO', 'FACTURADO'].includes(consumo.estado)" class="btn-close" @click="incluirEnCuenta(consumo)">Agregar a cuenta</button>
                <button v-if="esAdmin" class="btn-delete" @click="eliminarConsumo(consumo)">Eliminar</button>
              </td>
            </tr>
            <tr v-if="consumosFiltrados.length === 0">
              <td :colspan="puedeEditar ? 7 : 6" class="text-center">No hay consumos para este filtro. Usa “Limpiar filtros” para ver todos.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel">
        <h3>{{ consumoEditandoId ? 'Editar consumo' : 'Nuevo consumo' }}</h3>
        <form @submit.prevent="registrarConsumo">
          <div class="field">
            <label>Reserva</label>
            <select v-model="form.reservaId" required>
              <option value="" disabled>Seleccione una reserva...</option>
              <option v-for="reserva in reservasConEstadiaActiva" :key="reserva.id" :value="reserva.id">
                {{ etiquetaReserva(reserva) }} - Hab. {{ habitacionDeReserva(reserva.id) }}
              </option>
            </select>
          </div>

          <div class="field">
            <label>Categoría de consumo</label>
            <select v-model="form.categoria" required>
              <option value="GASTRONOMIA">Gastronomía</option><option value="LAVANDERIA">Lavandería</option><option value="ESTACIONAMIENTO">Estacionamiento</option><option value="SPA">Spa</option><option value="OTROS">Otros</option>
            </select>
          </div>
          <div class="field">
            <label>Descripcion</label>
            <input type="text" v-model="form.descripcion" placeholder="Ej: Desayuno buffet para 2 personas" required>
          </div>

          <div class="field">
            <label>Monto</label>
            <input type="number" min="1" step="0.01" v-model="form.monto" required>
          </div>

          <button type="submit" class="btn-save" :disabled="formInvalido || isSubmitting">
            {{ isSubmitting ? 'Guardando...' : (consumoEditandoId ? 'Actualizar consumo' : 'Registrar consumo') }}
          </button>
          <button v-if="consumoEditandoId" type="button" class="btn-cancel" @click="cancelarEdicion">
            Cancelar edicion
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<!--
  STYLE SCOPED:
  Estilos solo para esta vista. "scoped" evita que afecten a otros componentes.
-->
<style scoped>
.page { animation: fadeIn 0.5s ease; }
.header { margin-bottom: 20px; }
.header h1 { margin: 0 0 4px; color: var(--dark); }
.header p { color: #64748b; margin: 0; }
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
.summary-item { background: white; border-radius: 8px; padding: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
.summary-item.highlight { border-left: 5px solid #0f766e; }
.summary-item span { display: block; color: #64748b; font-size: 0.9rem; }
.summary-item strong { display: block; color: var(--dark); font-size: 1.8rem; margin-top: 6px; }
.filters { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.tabs button { border: 1px solid #cbd5e0; background: #fff; padding: 8px 10px; border-radius: 6px; cursor: pointer; }
.tabs button.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.btn-clear { border: 1px solid #cbd5e0; background: #fff; padding: 9px 12px; border-radius: 6px; cursor: pointer; }
.history-help { margin: -8px 0 16px; color: #64748b; font-size: .9rem; }
.layout-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: 25px; align-items: start; }
.panel { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
h3 { margin-bottom: 20px; color: var(--dark); border-bottom: 2px solid var(--light); padding-bottom: 10px; }
.tabla-custom { width: 100%; border-collapse: collapse; table-layout: fixed; }
.tabla-custom th { text-align: left; padding: 12px; color: #718096; font-size: 0.85rem; text-transform: uppercase; }
.tabla-custom td { padding: 15px 12px; border-top: 1px solid #edf2f7; vertical-align: top; overflow-wrap: anywhere; }
.tabla-custom th:nth-child(1) { width: 20%; }
.tabla-custom th:nth-child(2) { width: 11%; }
.tabla-custom th:nth-child(3) { width: 16%; }
.tabla-custom th:nth-child(4) { width: 12%; }
.tabla-custom th:nth-child(5) { width: 9%; }
.tabla-custom th:nth-child(6) { width: 18%; }
.tabla-custom th:last-child { width: 14%; }
.badge { display: inline-block; max-width: 100%; padding: 3px 7px; border-radius: 999px; background: #eef2ff; color: #4338ca; font-size: .78rem; font-weight: 700; line-height: 1.25; }
.field { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; }
input, select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; }
.btn-save { background: var(--primary); color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-save:disabled { background: #cbd5e0; cursor: not-allowed; }
.btn-cancel { background: #edf2f7; color: #334155; border: none; padding: 10px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-edit, .btn-delete, .btn-close { border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: 700; white-space: nowrap; }
.btn-edit { background: #edf2ff; color: #4c51bf; }
.btn-close { background: #ecfdf5; color: #047857; }
.btn-delete { background: #fff5f5; color: #e53e3e; }
.msg { padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; }
.error { background: #fff5f5; color: #c53030; }
.success { background: #f0fff4; color: #2f855a; }
.empty-state, .text-center { text-align: center; color: #718096; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1480px) {
  .layout-grid { grid-template-columns: 1fr; }
  .filters > input, .filters > select { flex: 1 1 220px; }
}

/* Con la barra lateral visible, una tabla de siete columnas deja de ser legible
   en anchos medios. Aquí cada consumo se presenta como una ficha ordenada. */
@media (max-width: 1380px) {
  .tabla-custom, .tabla-custom tbody, .tabla-custom tr, .tabla-custom td { display: block; width: 100%; }
  .tabla-custom thead { display: none; }
  .tabla-custom tr { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; margin-bottom: 14px; }
  .tabla-custom td { display: grid; grid-template-columns: minmax(125px, 34%) 1fr; gap: 12px; padding: 10px 0; border-top: 1px solid #edf2f7; text-align: right; }
  .tabla-custom td:first-child { border-top: 0; }
  .tabla-custom td::before { content: attr(data-label); color: #64748b; font-size: .78rem; font-weight: 700; text-align: left; text-transform: uppercase; }
  .tabla-custom .actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; }
  .tabla-custom .actions::before { margin-right: auto; }
  .tabla-custom .text-center { display: block; text-align: center; }
  .tabla-custom .text-center::before { content: none; }
}

@media (max-width: 720px) {
  .header h1 { font-size: 1.55rem; }
  .panel { padding: 16px; }
  .summary { grid-template-columns: 1fr; gap: 10px; }
  .filters { align-items: stretch; gap: 9px; }
  .tabs { display: grid; grid-template-columns: repeat(3, 1fr); }
  .tabs button, .filters > input, .filters > select, .btn-clear { width: 100%; }
  .tabla-custom tr { padding: 6px 12px; }
  .tabla-custom td { grid-template-columns: minmax(105px, 38%) 1fr; gap: 10px; padding: 9px 0; }
}
</style>
