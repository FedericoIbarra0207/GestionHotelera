<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiFetch } from '../services/api'

const consumos = ref([])
const reservas = ref([])
const habitaciones = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = ref({
  reservaId: '',
  descripcion: '',
  monto: ''
})

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

const registrarConsumo = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await apiFetch('/consumos', {
      method: 'POST',
      body: JSON.stringify({
        reservaId: form.value.reservaId,
        descripcion: form.value.descripcion,
        monto: Number(form.value.monto)
      })
    })

    form.value = { reservaId: '', descripcion: '', monto: '' }
    successMessage.value = 'Consumo registrado correctamente.'
    await cargarDatos()
  } catch (error) {
    errorMessage.value = error.message || 'No se pudo registrar el consumo'
  } finally {
    isSubmitting.value = false
  }
}

const formInvalido = computed(() => {
  return !form.value.reservaId || !form.value.descripcion || !form.value.monto || Number(form.value.monto) <= 0
})

const reservasConEstadiaActiva = computed(() => {
  return reservas.value.filter((reserva) => reserva.estado !== 'cancelled' && reserva.estado !== 'checked_out')
})

const habitacionDeReserva = (reservaId) => {
  const reserva = reservas.value.find((item) => item.id === reservaId)
  const habitacion = habitaciones.value.find((item) => item.id === reserva?.habitacionId)
  return habitacion?.numero || 'Sin dato'
}

const etiquetaReserva = (reserva) => {
  const huesped = reserva.huespedSnapshot
    ? `${reserva.huespedSnapshot.nombre || ''} ${reserva.huespedSnapshot.apellido || ''}`.trim()
    : 'Reserva anterior'
  return `${reserva.codigo || reserva.id.substring(0, 8)} - ${huesped}`
}

const totalConsumos = computed(() => {
  return consumos.value.reduce((total, consumo) => total + Number(consumo.monto || 0), 0)
})

onMounted(cargarDatos)
</script>

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
        <span>Total pendiente/facturable</span>
        <strong>${{ totalConsumos }}</strong>
      </div>
    </div>

    <p v-if="errorMessage" class="msg error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="msg success">{{ successMessage }}</p>

    <div class="layout-grid">
      <div class="panel">
        <h3>Listado de consumos</h3>

        <div v-if="isLoading" class="empty-state">Cargando consumos...</div>
        <table v-else class="tabla-custom">
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Habitacion</th>
              <th>Descripcion</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="consumo in consumos" :key="consumo.id">
              <td>{{ consumo.reservaSnapshot?.codigo || consumo.reservaId }}</td>
              <td>Hab. {{ consumo.reservaSnapshot?.habitacion?.numero || habitacionDeReserva(consumo.reservaId) }}</td>
              <td>{{ consumo.descripcion }}</td>
              <td>${{ consumo.monto }}</td>
            </tr>
            <tr v-if="consumos.length === 0">
              <td colspan="4" class="text-center">No hay consumos registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel">
        <h3>Nuevo consumo</h3>
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
            <label>Descripcion</label>
            <input type="text" v-model="form.descripcion" placeholder="Ej: lavanderia, minibar, desayuno" required>
          </div>

          <div class="field">
            <label>Monto</label>
            <input type="number" min="1" step="0.01" v-model="form.monto" required>
          </div>

          <button type="submit" class="btn-save" :disabled="formInvalido || isSubmitting">
            {{ isSubmitting ? 'Guardando...' : 'Registrar consumo' }}
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
.msg { padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; }
.error { background: #fff5f5; color: #c53030; }
.success { background: #f0fff4; color: #2f855a; }
.empty-state, .text-center { text-align: center; color: #718096; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1024px) { .layout-grid { grid-template-columns: 1fr; } }
</style>
