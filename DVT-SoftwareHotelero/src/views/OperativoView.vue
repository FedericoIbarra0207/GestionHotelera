<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiFetch } from '../services/api'

const reservas = ref([])
const habitaciones = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

// Fecha actual en formato YYYY-MM-DD para comparar contra las fechas de reservas.
const todayString = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Carga la informacion que alimenta metricas, check-ins y check-outs.
const cargarDatos = async () => {
  try {
    isLoading.value = true
    const [reservasData, habitacionesData] = await Promise.all([
      apiFetch('/reservas'),
      apiFetch('/habitaciones')
    ])
    reservas.value = reservasData
    habitaciones.value = habitacionesData
  } catch (error) {
    errorMessage.value = error.message || 'No se pudo cargar el dashboard operativo'
  } finally {
    isLoading.value = false
  }
}

// Reservas que todavia afectan la operacion del hotel.
const reservasActivas = computed(() => {
  return reservas.value.filter((reserva) => reserva.estado !== 'cancelled' && reserva.estado !== 'checked_out')
})

// Entradas programadas para hoy.
const checkInsHoy = computed(() => {
  const hoy = todayString()
  return reservasActivas.value.filter((reserva) => reserva.fechaInicio === hoy)
})

// Salidas programadas para hoy.
const checkOutsHoy = computed(() => {
  const hoy = todayString()
  return reservasActivas.value.filter((reserva) => reserva.fechaFin === hoy)
})

// Habitaciones ocupadas hoy: fechaInicio <= hoy y fechaFin > hoy.
const habitacionesOcupadas = computed(() => {
  const hoy = new Date(todayString())
  return habitaciones.value.filter((habitacion) => {
    return reservasActivas.value.some((reserva) => {
      return reserva.habitacionId === habitacion.id &&
        new Date(reserva.fechaInicio) <= hoy &&
        new Date(reserva.fechaFin) > hoy
    })
  })
})

// Cantidad disponible calculada desde total de habitaciones menos ocupadas.
const habitacionesDisponibles = computed(() => {
  return habitaciones.value.length - habitacionesOcupadas.value.length
})

// Primeras reservas futuras para mostrar en el resumen operativo.
const proximasReservas = computed(() => {
  const hoy = new Date(todayString())
  return reservasActivas.value
    .filter((reserva) => new Date(reserva.fechaInicio) >= hoy)
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
    .slice(0, 6)
})

// Nombre visible del huesped desde el snapshot de la reserva.
const huespedNombre = (reserva) => {
  const huesped = reserva.huespedSnapshot || {}
  return `${huesped.nombre || ''} ${huesped.apellido || ''}`.trim() || 'Sin huesped'
}

// Numero de habitacion desde snapshot o desde el listado cargado.
const habitacionNombre = (reserva) => {
  return reserva.habitacionSnapshot?.numero || habitaciones.value.find((habitacion) => habitacion.id === reserva.habitacionId)?.numero || 'Sin dato'
}

// Ejecuta acciones operativas sobre una reserva: check-in o check-out.
const cambiarEstado = async (reserva, accion) => {
  try {
    await apiFetch(`/reservas/${reserva.id}/${accion}`, { method: 'PATCH' })
    await cargarDatos()
  } catch (error) {
    errorMessage.value = error.message
  }
}

// Carga inicial del dashboard operativo.
onMounted(cargarDatos)
</script>

<template>
  <section class="dashboard-page">
    <div class="header">
      <h1>Dashboard operativo</h1>
      <p>Vista rapida para recepcion y administracion diaria del hotel.</p>
    </div>

    <p v-if="errorMessage" class="msg error">{{ errorMessage }}</p>
    <div v-if="isLoading" class="panel">Cargando informacion operativa...</div>

    <template v-else>
      <div class="metrics-grid">
        <div class="metric-card">
          <span>Check-ins hoy</span>
          <strong>{{ checkInsHoy.length }}</strong>
        </div>
        <div class="metric-card">
          <span>Check-outs hoy</span>
          <strong>{{ checkOutsHoy.length }}</strong>
        </div>
        <div class="metric-card">
          <span>Ocupadas</span>
          <strong>{{ habitacionesOcupadas.length }}</strong>
        </div>
        <div class="metric-card">
          <span>Disponibles</span>
          <strong>{{ habitacionesDisponibles }}</strong>
        </div>
      </div>

      <div class="layout-grid">
        <div class="panel">
          <h3>Entradas de hoy</h3>
          <div v-if="checkInsHoy.length === 0" class="empty">No hay check-ins programados para hoy.</div>
          <div v-for="reserva in checkInsHoy" :key="reserva.id" class="reservation-row">
            <div>
              <strong>{{ huespedNombre(reserva) }}</strong>
              <span>Hab. {{ habitacionNombre(reserva) }} - {{ reserva.codigo }}</span>
            </div>
            <button v-if="reserva.estado !== 'checked_in'" @click="cambiarEstado(reserva, 'check-in')" class="btn-primary">
              Check-in
            </button>
          </div>
        </div>

        <div class="panel">
          <h3>Salidas de hoy</h3>
          <div v-if="checkOutsHoy.length === 0" class="empty">No hay check-outs programados para hoy.</div>
          <div v-for="reserva in checkOutsHoy" :key="reserva.id" class="reservation-row">
            <div>
              <strong>{{ huespedNombre(reserva) }}</strong>
              <span>Hab. {{ habitacionNombre(reserva) }} - {{ reserva.codigo }}</span>
            </div>
            <button v-if="reserva.estado === 'checked_in'" @click="cambiarEstado(reserva, 'check-out')" class="btn-secondary">
              Check-out
            </button>
          </div>
        </div>
      </div>

      <div class="panel">
        <h3>Proximas reservas</h3>
        <div class="table-scroll" tabindex="0" role="region" aria-label="Próximas reservas. Desplaza horizontalmente para ver todas las columnas.">
        <table class="tabla-custom">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Huesped</th>
              <th>Habitacion</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reserva in proximasReservas" :key="reserva.id">
              <td>{{ reserva.codigo }}</td>
              <td>{{ huespedNombre(reserva) }}</td>
              <td>Hab. {{ habitacionNombre(reserva) }}</td>
              <td>{{ reserva.fechaInicio }}</td>
              <td>{{ reserva.fechaFin }}</td>
              <td><span class="badge">{{ reserva.estado }}</span></td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.dashboard-page { animation: fadeIn 0.5s ease; }
.header { margin-bottom: 20px; }
.header h1 { margin: 0 0 4px; color: var(--dark); }
.header p { color: #64748b; margin: 0; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; margin-bottom: 22px; }
.metric-card, .panel { background: white; border-radius: 8px; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
.metric-card { border-left: 5px solid var(--primary); }
.metric-card span { display: block; color: #64748b; }
.metric-card strong { display: block; font-size: 2rem; margin-top: 4px; }
.layout-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; margin-bottom: 22px; }
h3 { margin: 0 0 16px; color: var(--dark); border-bottom: 2px solid var(--light); padding-bottom: 10px; }
.reservation-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid #edf2f7; }
.reservation-row strong, .reservation-row span { display: block; }
.reservation-row span { color: #64748b; font-size: 0.9rem; }
.btn-primary, .btn-secondary { border: none; border-radius: 6px; padding: 9px 12px; font-weight: 700; cursor: pointer; color: white; }
.btn-primary { background: var(--primary); }
.btn-secondary { background: #0f766e; }
.tabla-custom { width: 100%; border-collapse: collapse; }
.tabla-custom th { text-align: left; padding: 12px; color: #718096; font-size: 0.85rem; text-transform: uppercase; }
.tabla-custom td { padding: 14px 12px; border-top: 1px solid #edf2f7; }
.badge { display: inline-block; background: #edf2ff; color: #4c51bf; border-radius: 999px; padding: 4px 8px; font-size: 0.8rem; font-weight: 700; }
.empty { color: #64748b; background: #f8fafc; padding: 12px; border-radius: 8px; }
.msg { padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; }
.error { background: #fff5f5; color: #c53030; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }
</style>
