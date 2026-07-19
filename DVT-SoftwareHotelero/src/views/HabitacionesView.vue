<script setup>
//  se cargan habitaciones/reservas, se calcula el estado operativo y se crea una habitacion.
import { computed, onMounted, ref } from 'vue'
import { apiFetch } from '../services/api'

const habitaciones = ref([])
const reservas = ref([])
const loadingInfo = ref('Cargando habitaciones...')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const habitacionEditandoId = ref(null)

// Usuario logueado. Se usa para permitir agregar habitaciones solo a ADMIN.
const user = JSON.parse(localStorage.getItem('user') || '{}')
const esAdmin = computed(() => user.rol === 'ADMIN')

// Formulario para crear una nueva habitacion.
const habitacionForm = ref({
  numero: '',
  tipo: '',
  precio: '',
  capacidad: 1,
  estado: 'DISPONIBLE',
  descripcion: '',
  amenities: '',
  piso: ''
})

// Carga habitaciones y reservas para calcular ocupacion y proximas reservas.
const cargarDatos = async () => {
  try {
    const [habitacionesData, reservasData] = await Promise.all([
      apiFetch('/habitaciones'),
      apiFetch('/reservas')
    ])
    habitaciones.value = habitacionesData
    reservas.value = reservasData
    loadingInfo.value = ''
  } catch (error) {
    loadingInfo.value = 'Error al cargar habitaciones: ' + error.message
  }
}

const resetHabitacionForm = () => {
  // Reutilizado despues de crear, editar, cancelar o borrar una habitacion.
  habitacionEditandoId.value = null
  habitacionForm.value = {
    numero: '',
    tipo: '',
    precio: '',
    capacidad: 1,
    estado: 'DISPONIBLE',
    descripcion: '',
    amenities: '',
    piso: ''
  }
}

// Envia una habitacion nueva o actualiza una existente y luego refresca el listado.
const guardarHabitacion = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const editando = Boolean(habitacionEditandoId.value)
    const endpoint = editando ? `/habitaciones/${habitacionEditandoId.value}` : '/habitaciones'
    const method = editando ? 'PUT' : 'POST'

    await apiFetch(endpoint, {
      method,
      body: JSON.stringify({
        ...habitacionForm.value,
        precio: Number(habitacionForm.value.precio),
        capacidad: Number(habitacionForm.value.capacidad)
      })
    })

    successMessage.value = editando ? 'Habitacion actualizada correctamente.' : 'Habitacion creada correctamente.'
    resetHabitacionForm()
    await cargarDatos()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}

const editarHabitacion = (habitacion) => {
  // Copia la habitacion al formulario para reutilizar la misma pantalla en modo edicion.
  habitacionEditandoId.value = habitacion.id
  habitacionForm.value = {
    numero: habitacion.numero || '',
    tipo: habitacion.tipo || '',
    precio: Number(habitacion.precio || 0),
    capacidad: Number(habitacion.capacidad || 1),
    estado: habitacion.estado || 'DISPONIBLE',
    descripcion: habitacion.descripcion || '',
    amenities: Array.isArray(habitacion.amenities) ? habitacion.amenities.join(', ') : (habitacion.amenities || ''),
    piso: habitacion.piso || ''
  }
}

const eliminarHabitacion = async (habitacion) => {
  if (!confirm(`Seguro que deseas eliminar la habitacion ${habitacion.numero}?`)) return

  try {
    await apiFetch(`/habitaciones/${habitacion.id}`, { method: 'DELETE' })
    successMessage.value = 'Habitacion eliminada correctamente.'
    // Si se estaba editando la misma habitacion, se limpia el formulario.
    if (habitacionEditandoId.value === habitacion.id) resetHabitacionForm()
    await cargarDatos()
  } catch (error) {
    errorMessage.value = error.message
  }
}

// Devuelve la clase CSS de color segun el estado operativo de la habitacion.
const obtenerClaseEstado = (habitacion) => {
  const estado = estadoOperativo(habitacion).estado
  if (estado === 'OCUPADA') return 'bg-ocupada'
  if (estado === 'PROXIMA') return 'bg-proxima'
  if (estado === 'MANTENIMIENTO') return 'bg-mantenimiento'
  return 'bg-disponible'
}

// Fecha de hoy sin horas/minutos para comparar correctamente con las reservas.
const hoy = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// Calcula si una habitacion esta ocupada, disponible, en mantenimiento o con reserva proxima.
const estadoOperativo = (habitacion) => {
  if (habitacion.estado === 'MANTENIMIENTO') {
    return { estado: 'MANTENIMIENTO', detalle: 'Fuera de servicio' }
  }

  const actual = hoy()
  const reservaActual = reservas.value.find((reserva) => {
    if (reserva.habitacionId !== habitacion.id || reserva.estado === 'cancelled') return false
    return new Date(reserva.fechaInicio) <= actual && new Date(reserva.fechaFin) > actual
  })

  if (reservaActual) {
    return { estado: 'OCUPADA', detalle: `${reservaActual.fechaInicio} a ${reservaActual.fechaFin}` }
  }

  const proxima = reservas.value
    .filter((reserva) => reserva.habitacionId === habitacion.id && reserva.estado !== 'cancelled')
    .filter((reserva) => new Date(reserva.fechaInicio) > actual)
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))[0]

  if (proxima) {
    return { estado: 'PROXIMA', detalle: `Proxima: ${proxima.fechaInicio}` }
  }

  return { estado: 'DISPONIBLE', detalle: 'Libre para reservar' }
}

// Numeros del resumen superior: total, ocupadas, disponibles, proximas, etc.
const resumen = computed(() => {
  const estados = habitaciones.value.map(estadoOperativo)
  const total = habitaciones.value.length
  const ocupadas = estados.filter((item) => item.estado === 'OCUPADA').length
  const proximas = estados.filter((item) => item.estado === 'PROXIMA').length
  const mantenimiento = estados.filter((item) => item.estado === 'MANTENIMIENTO').length
  const disponibles = estados.filter((item) => item.estado === 'DISPONIBLE').length
  const ocupacion = total ? Math.round((ocupadas / total) * 100) : 0

  return { total, ocupadas, proximas, disponibles, mantenimiento, ocupacion }
})

// Valida campos minimos antes de habilitar "Agregar habitacion".
const formInvalido = computed(() => {
  return !habitacionForm.value.numero ||
    !habitacionForm.value.tipo ||
    !habitacionForm.value.precio ||
    Number(habitacionForm.value.precio) <= 0 ||
    Number(habitacionForm.value.capacidad) <= 0
})

// Cuando se abre la vista, se cargan habitaciones y reservas.
onMounted(cargarDatos)
</script>

<!--
  TEMPLATE:
  Esta parte es la estructura visual de la pantalla.
  Muestra metricas, tarjetas de habitaciones, leyenda de colores y formulario de alta.
-->
<template>
  <section class="habitaciones-section">
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>{{ resumen.total }}</h3>
        <p>Habitaciones totales</p>
      </div>
      <div class="metric-card">
        <h3>{{ resumen.ocupadas }}</h3>
        <p>Ocupadas hoy</p>
      </div>
      <div class="metric-card">
        <h3>{{ resumen.disponibles }}</h3>
        <p>Disponibles</p>
      </div>
      <div class="metric-card">
        <h3>{{ resumen.proximas }}</h3>
        <p>Proximas reservas</p>
      </div>
    </div>

    <p v-if="errorMessage" class="msg error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="msg success">{{ successMessage }}</p>

    <div class="content-grid">
      <div class="panel">
        <div class="header-title">
          <h2>Estado de habitaciones en tiempo real</h2>
        </div>

        <div v-if="loadingInfo" class="loading-state">
          {{ loadingInfo }}
        </div>

        <div v-else>
          <div class="rooms-grid">
            <div
              v-for="hab in habitaciones"
              :key="hab.id"
              class="room-block"
              :class="obtenerClaseEstado(hab)"
            >
              <strong>{{ hab.numero }}</strong>
              <span>{{ hab.tipo || 'Habitacion' }}</span>
              <span>${{ hab.precio }} / noche</span>
              <small>{{ estadoOperativo(hab).detalle }}</small>
              <div v-if="esAdmin" class="room-actions">
                <button type="button" @click.stop="editarHabitacion(hab)">Editar</button>
                <button type="button" @click.stop="eliminarHabitacion(hab)">Eliminar</button>
              </div>
            </div>
          </div>

          <div class="leyenda">
            <div class="leyenda-item"><span class="dot bg-disponible"></span> Disponible</div>
            <div class="leyenda-item"><span class="dot bg-ocupada"></span> Ocupada</div>
            <div class="leyenda-item"><span class="dot bg-proxima"></span> Proxima reserva</div>
            <div class="leyenda-item"><span class="dot bg-mantenimiento"></span> Mantenimiento</div>
          </div>
        </div>
      </div>

      <div v-if="esAdmin" class="panel">
        <h2>{{ habitacionEditandoId ? 'Editar habitacion' : 'Agregar habitacion' }}</h2>
        <form @submit.prevent="guardarHabitacion">
          <div class="field">
            <label>Numero</label>
            <input v-model="habitacionForm.numero" type="text" required>
          </div>
          <div class="field">
            <label>Tipo</label>
            <input v-model="habitacionForm.tipo" type="text" placeholder="Simple, doble, suite" required>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Precio por noche</label>
              <input v-model="habitacionForm.precio" type="number" min="1" required>
            </div>
            <div class="field">
              <label>Capacidad</label>
              <input v-model="habitacionForm.capacidad" type="number" min="1" required>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Estado</label>
              <select v-model="habitacionForm.estado">
                <option value="DISPONIBLE">Disponible</option>
                <option value="OCUPADA">Ocupada</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
            </div>
            <div class="field">
              <label>Piso</label>
              <input v-model="habitacionForm.piso" type="text">
            </div>
          </div>
          <div class="field">
            <label>Amenities</label>
            <input v-model="habitacionForm.amenities" type="text" placeholder="WiFi, TV, aire acondicionado">
          </div>
          <div class="field">
            <label>Descripcion</label>
            <textarea v-model="habitacionForm.descripcion" rows="3"></textarea>
          </div>
          <button class="btn-save" type="submit" :disabled="formInvalido || isSubmitting">
            {{ isSubmitting ? 'Guardando...' : (habitacionEditandoId ? 'Actualizar habitacion' : 'Agregar habitacion') }}
          </button>
          <button v-if="habitacionEditandoId" class="btn-cancel" type="button" @click="resetHabitacionForm">
            Cancelar edicion
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<!--
  STYLE SCOPED:
  Estilos solo para HabitacionesView.vue. No se aplican fuera de este componente.
-->
<style scoped>
.habitaciones-section { display: flex; flex-direction: column; gap: 25px; animation: fadeIn 0.5s ease; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; }
.metric-card { background: white; color: var(--dark); padding: 22px 18px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border-left: 5px solid var(--primary); }
.metric-card h3 { font-size: 2rem; margin: 0 0 6px 0; font-weight: bold; }
.metric-card p { margin: 0; font-size: 0.95rem; color: #64748b; }
.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; }
.panel { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
.header-title h2, .panel h2 { font-size: 1.2rem; color: var(--dark); margin: 0 0 18px; font-weight: bold; }
.rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; margin-bottom: 20px; }
.room-block { color: white; min-height: 154px; text-align: center; padding: 18px 14px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; justify-content: center; }
.room-block strong { font-size: 1.6rem; line-height: 1; }
.room-block span { margin-top: 8px; font-size: 0.85rem; opacity: 0.95; }
.room-block small { margin-top: 8px; line-height: 1.3; opacity: 0.95; }
.room-actions { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-top: 12px; }
.room-actions button { border: none; border-radius: 4px; padding: 6px 8px; font-weight: 700; cursor: pointer; background: rgba(255,255,255,0.9); color: #1f2937; }
.bg-ocupada { background-color: #e74c3c; }
.bg-disponible { background-color: #2ecc71; }
.bg-mantenimiento { background-color: #f39c12; }
.bg-proxima { background-color: #facc15; color: #3f3f1f; }
.leyenda { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 10px; border-top: 1px solid #eee; padding-top: 18px; }
.leyenda-item { display: flex; align-items: center; gap: 8px; font-size: 0.95rem; color: #555; font-weight: 500; }
.dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
.field { margin-bottom: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; }
input, select, textarea { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; }
.btn-save { background: var(--primary); color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-save:disabled { background: #cbd5e0; cursor: not-allowed; }
.btn-cancel { background: #edf2f7; color: #334155; border: none; padding: 10px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.loading-state, .msg { background: white; border-radius: 8px; padding: 14px; color: #64748b; }
.error { background: #fff5f5; color: #c53030; }
.success { background: #f0fff4; color: #2f855a; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1024px) { .content-grid, .form-row { grid-template-columns: 1fr; } }
</style>
