<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { apiFetch } from '../services/api'

const pagos = ref([])
const reservas = ref([])
const habitaciones = ref([])
const consumos = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const user = JSON.parse(localStorage.getItem('user') || '{}')
const esAdmin = computed(() => user.rol === 'ADMIN')
const pagoEditandoId = ref(null)
const vistaPagos = ref('TODOS')
const filtroMes = ref('')
const filtroEstado = ref('')

// Formulario para registrar un pago sobre una reserva existente.
const form = ref({
  reservaId: '',
  monto: '',
  metodo: 'EFECTIVO'
})

// Carga pagos, reservas y habitaciones para armar la tabla y el selector.
const cargarDatos = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [pagosData, reservasData, habitacionesData, consumosData] = await Promise.all([
      apiFetch('/pagos'),
      apiFetch('/reservas'),
      apiFetch('/habitaciones'),
      apiFetch('/consumos')
    ])

    pagos.value = pagosData
    reservas.value = reservasData
    habitaciones.value = habitacionesData
    consumos.value = consumosData
  } catch (error) {
    errorMessage.value = error.message || 'No se pudieron cargar los pagos'
  } finally {
    isLoading.value = false
  }
}

// Registra un pago en POST /pagos y refresca la informacion.
const registrarPago = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const estabaEditando = Boolean(pagoEditandoId.value)
    const endpoint = pagoEditandoId.value ? `/pagos/${pagoEditandoId.value}` : '/pagos'
    const method = pagoEditandoId.value ? 'PUT' : 'POST'

    await apiFetch(endpoint, {
      method,
      body: JSON.stringify({
        reservaId: form.value.reservaId,
        monto: Number(form.value.monto),
        metodo: form.value.metodo
      })
    })

    cancelarEdicion()
    successMessage.value = estabaEditando ? 'Pago actualizado correctamente.' : 'Pago registrado correctamente.'
    await cargarDatos()
  } catch (error) {
    errorMessage.value = error.message || 'No se pudo registrar el pago'
  } finally {
    isSubmitting.value = false
  }
}

const editarPago = (pago) => {
  // Reutiliza el formulario de alta como formulario de edicion.
  pagoEditandoId.value = pago.id
  form.value = {
    reservaId: pago.reservaId,
    monto: Number(pago.monto || 0),
    metodo: pago.metodo || 'EFECTIVO'
  }
}

const cancelarEdicion = () => {
  pagoEditandoId.value = null
  form.value = { reservaId: '', monto: '', metodo: 'EFECTIVO' }
}

const eliminarPago = async (pago) => {
  if (!confirm('Seguro que deseas eliminar este pago?')) return

  try {
    await apiFetch(`/pagos/${pago.id}`, { method: 'DELETE' })
    successMessage.value = 'Pago eliminado correctamente.'
    await cargarDatos()
  } catch (error) {
    errorMessage.value = error.message || 'No se pudo eliminar el pago'
  }
}

// Evita enviar pagos sin reserva o con monto invalido.
const formInvalido = computed(() => {
  return !form.value.reservaId || !form.value.monto || Number(form.value.monto) <= 0
})

// Solo se pueden cobrar reservas que no esten canceladas.
const reservasCobrables = computed(() => {
  return reservas.value.filter((reserva) => reserva.estado !== 'cancelled')
})

// Relaciona una reserva con su habitacion para mostrar "Hab. N".
const habitacionDeReserva = (reservaId) => {
  const reserva = reservas.value.find((item) => item.id === reservaId)
  const habitacion = habitaciones.value.find((item) => item.id === reserva?.habitacionId)
  return habitacion?.numero || 'Sin dato'
}

// Texto visible del selector de reservas.
const etiquetaReserva = (reserva) => {
  const huesped = reserva.huespedSnapshot
    ? `${reserva.huespedSnapshot.nombre || ''} ${reserva.huespedSnapshot.apellido || ''}`.trim()
    : 'Reserva anterior'
  return `${reserva.codigo || reserva.id.substring(0, 8)} - ${huesped}`
}

const reservaSeleccionada = computed(() => {
  return reservas.value.find((reserva) => reserva.id === form.value.reservaId)
})

// Noches facturables de la reserva; minimo 1 para evitar totales en cero por fechas iguales.
const nochesReserva = (reserva) => {
  if (!reserva?.fechaInicio || !reserva?.fechaFin) return 0
  const diff = new Date(reserva.fechaFin) - new Date(reserva.fechaInicio)
  return Math.max(1, Math.round(diff / 86400000))
}

const precioHabitacionReserva = (reserva) => {
  const precioSnapshot = Number(reserva?.habitacionSnapshot?.precio || 0)
  if (precioSnapshot > 0) return precioSnapshot
  const habitacion = habitaciones.value.find((item) => item.id === reserva?.habitacionId)
  return Number(habitacion?.precio || 0)
}

/** Sólo los consumos confirmados en cuenta forman parte del importe a cobrar. */
const consumosDeReserva = (reservaId) => {
  const estadosCobrables = ['EN_CUENTA', 'FACTURADO', 'CERRADO']
  return consumos.value.filter((consumo) => consumo.reservaId === reservaId && estadosCobrables.includes(consumo.estado))
}

const pagosDeReserva = (reservaId) => {
  return pagos.value.filter((pago) => pago.reservaId === reservaId && pago.id !== pagoEditandoId.value)
}

const detallePagoSugerido = computed(() => {
  const reserva = reservaSeleccionada.value
  if (!reserva) {
    return { noches: 0, alojamiento: 0, consumos: 0, pagado: 0, total: 0, saldo: 0 }
  }

  const noches = nochesReserva(reserva)
  const alojamiento = noches * precioHabitacionReserva(reserva)
  const consumosTotal = consumosDeReserva(reserva.id).reduce((total, consumo) => total + Number(consumo.monto || 0), 0)
  const pagado = pagosDeReserva(reserva.id).reduce((total, pago) => total + Number(pago.monto || 0), 0)
  const total = alojamiento + consumosTotal
  // El saldo sugerido descuenta pagos previos y nunca muestra un monto negativo.
  const saldo = Math.max(total - pagado, 0)

  return { noches, alojamiento, consumos: consumosTotal, pagado, total, saldo }
})

// Suma simple de todos los pagos cargados.
const totalPagos = computed(() => {
  return pagosFiltrados.value.reduce((total, pago) => total + Number(pago.monto || 0), 0)
})

/** Lee fechas Firestore o ISO para filtrar sin modificar los movimientos. */
const paymentDate = (pago) => {
  const value = pago.createdAt?.toDate?.() || pago.createdAt
  return value ? new Date(value) : null
}

/** Filtra el historial de cobros por estado, período y pestaña seleccionada. */
const pagosFiltrados = computed(() => pagos.value.filter((pago) => {
  const fecha = paymentDate(pago)
  const estado = pago.estado || 'CONFIRMADO'
  const cumpleMes = !filtroMes.value || (fecha && `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}` === filtroMes.value)
  const cumpleEstado = !filtroEstado.value || estado === filtroEstado.value
  const cumpleVista = vistaPagos.value === 'TODOS' || (vistaPagos.value === 'HISTORIAL' && estado === 'CONFIRMADO') || (vistaPagos.value === 'OTROS' && estado !== 'CONFIRMADO')
  return cumpleMes && cumpleEstado && cumpleVista
}))

/** Reservas que requieren cobro, calculadas por el backend junto a su saldo. */
const reservasPendientes = computed(() => reservas.value.filter((reserva) => Number(reserva.resumenFinanciero?.saldoPendiente || 0) > 0))

/** Restablece los cobros visibles sin cambiar registros financieros. */
const limpiarFiltros = () => {
  vistaPagos.value = 'TODOS'
  filtroMes.value = ''
  filtroEstado.value = ''
}

watch(() => form.value.reservaId, () => {
  // Al elegir reserva nueva, precarga el saldo pendiente como monto sugerido.
  if (!pagoEditandoId.value) {
    form.value.monto = detallePagoSugerido.value.saldo || ''
  }
})

// Carga inicial de la pantalla.
onMounted(cargarDatos)
</script>

<template>
  <section class="page">
    <div class="header">
      <h1>Gestion de pagos</h1>
      <p>Registra pagos asociados a reservas y controla los ingresos confirmados.</p>
    </div>

    <div class="summary">
      <div class="summary-item">
        <span>Pagos del filtro</span>
        <strong>{{ pagosFiltrados.length }}</strong>
      </div>
      <div class="summary-item">
        <span>Total confirmado</span>
        <strong>${{ totalPagos }}</strong>
      </div>
    </div>

    <p v-if="errorMessage" class="msg error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="msg success">{{ successMessage }}</p>

    <div class="panel filters">
      <div class="tabs"><button v-for="vista in ['TODOS', 'HISTORIAL', 'OTROS']" :key="vista" :class="{ active: vistaPagos === vista }" @click="vistaPagos = vista">{{ vista === 'TODOS' ? 'Todos' : vista === 'HISTORIAL' ? 'Historial confirmado' : 'Pendientes / otros' }}</button></div>
      <input v-model="filtroMes" type="month">
      <select v-model="filtroEstado"><option value="">Todos los estados</option><option value="CONFIRMADO">Confirmado</option><option value="PENDIENTE">Pendiente</option><option value="RECHAZADO">Rechazado</option><option value="ANULADO">Anulado</option></select>
      <button type="button" class="btn-clear" @click="limpiarFiltros">Limpiar filtros</button>
    </div>

    <div class="panel pendientes" v-if="reservasPendientes.length">
      <h3>Reservas con saldo pendiente</h3>
      <div v-for="reserva in reservasPendientes" :key="reserva.id" class="pending-row"><span>{{ etiquetaReserva(reserva) }} · Hab. {{ habitacionDeReserva(reserva.id) }}</span><strong>Saldo ${{ reserva.resumenFinanciero.saldoPendiente }}</strong></div>
    </div>

    <div class="layout-grid">
      <div class="panel">
        <h3>Pagos registrados</h3>

        <div v-if="isLoading" class="empty-state">Cargando pagos...</div>
        <table v-else class="tabla-custom">
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Habitacion</th>
              <th>Metodo</th>
              <th>Monto</th>
              <th>Estado</th>
              <th v-if="esAdmin">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pago in pagosFiltrados" :key="pago.id">
              <td>{{ pago.reservaSnapshot?.codigo || pago.reservaId }}</td>
              <td>Hab. {{ pago.reservaSnapshot?.habitacion?.numero || habitacionDeReserva(pago.reservaId) }}</td>
              <td>{{ pago.metodo }}</td>
              <td>${{ pago.monto }}</td>
              <td><span class="badge">{{ pago.estado || 'CONFIRMADO' }}</span></td>
              <td v-if="esAdmin" class="actions">
                <button class="btn-edit" @click="editarPago(pago)">Editar</button>
                <button class="btn-delete" @click="eliminarPago(pago)">Eliminar</button>
              </td>
            </tr>
            <tr v-if="pagosFiltrados.length === 0">
              <td :colspan="esAdmin ? 6 : 5" class="text-center">No hay pagos registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel">
        <h3>{{ pagoEditandoId ? 'Editar pago' : 'Nuevo pago' }}</h3>
        <form @submit.prevent="registrarPago">
          <div class="field">
            <label>Reserva</label>
            <select v-model="form.reservaId" required>
              <option value="" disabled>Seleccione una reserva...</option>
              <option v-for="reserva in reservasCobrables" :key="reserva.id" :value="reserva.id">
                {{ etiquetaReserva(reserva) }} - Hab. {{ habitacionDeReserva(reserva.id) }}
              </option>
            </select>
          </div>

          <div class="field">
            <label>Monto</label>
            <input type="number" min="1" step="0.01" v-model="form.monto" required>
          </div>

          <div v-if="form.reservaId" class="payment-breakdown">
            <div><span>Alojamiento</span><strong>${{ detallePagoSugerido.alojamiento }}</strong></div>
            <div><span>Consumos incluidos en cuenta</span><strong>${{ detallePagoSugerido.consumos }}</strong></div>
            <div><span>Ya pagado</span><strong>${{ detallePagoSugerido.pagado }}</strong></div>
            <div class="total"><span>Saldo sugerido</span><strong>${{ detallePagoSugerido.saldo }}</strong></div>
          </div>

          <div class="field">
            <label>Metodo de pago</label>
            <select v-model="form.metodo">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>

          <button type="submit" class="btn-save" :disabled="formInvalido || isSubmitting">
            {{ isSubmitting ? 'Guardando...' : (pagoEditandoId ? 'Actualizar pago' : 'Confirmar pago') }}
          </button>
          <button v-if="pagoEditandoId" type="button" class="btn-cancel" @click="cancelarEdicion">
            Cancelar edicion
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page { animation: fadeIn 0.5s ease; }
.header { margin-bottom: 20px; }
.header h1 { margin: 0 0 4px; color: var(--dark); }
.header p { color: #64748b; margin: 0; }
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
.summary-item { background: white; border-radius: 8px; padding: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
.summary-item span { display: block; color: #64748b; font-size: 0.9rem; }
.summary-item strong { display: block; color: var(--dark); font-size: 1.8rem; margin-top: 6px; }
.layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; }
.panel { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
h3 { margin-bottom: 20px; color: var(--dark); border-bottom: 2px solid var(--light); padding-bottom: 10px; }
.tabla-custom { width: 100%; border-collapse: collapse; }
.tabla-custom th { text-align: left; padding: 12px; color: #718096; font-size: 0.85rem; text-transform: uppercase; }
.tabla-custom td { padding: 15px 12px; border-top: 1px solid #edf2f7; vertical-align: top; }
.field { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; }
input, select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; }
.btn-save { background: var(--primary); color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-save:disabled { background: #cbd5e0; cursor: not-allowed; }
.btn-cancel { background: #edf2f7; color: #334155; border: none; padding: 10px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-edit, .btn-delete { border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: 700; }
.btn-edit { background: #edf2ff; color: #4c51bf; }
.btn-delete { background: #fff5f5; color: #e53e3e; }
.payment-breakdown { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
.payment-breakdown div { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; color: #475569; }
.payment-breakdown .total { border-top: 1px solid #e2e8f0; margin-top: 4px; padding-top: 9px; color: var(--dark); }
.filters { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.tabs button { border: 1px solid #cbd5e0; background: #fff; padding: 8px 10px; border-radius: 6px; cursor: pointer; }
.tabs button.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.btn-clear { border: 1px solid #cbd5e0; background: #fff; padding: 9px 12px; border-radius: 6px; cursor: pointer; }
.pendientes { margin-bottom: 20px; border-left: 5px solid #d97706; }
.pending-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #edf2f7; }
.msg { padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; }
.error { background: #fff5f5; color: #c53030; }
.success { background: #f0fff4; color: #2f855a; }
.badge { display: inline-block; background: #edf2ff; color: #4c51bf; border-radius: 999px; padding: 4px 8px; font-size: 0.8rem; font-weight: 700; }
.empty-state, .text-center { text-align: center; color: #718096; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1024px) { .layout-grid { grid-template-columns: 1fr; } }
</style>
