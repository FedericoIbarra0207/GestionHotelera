<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiFetch } from '../services/api'

const reservas = ref([])
const habitaciones = ref([])
const habitacionesDisponibles = ref([])
const isLoading = ref(true)
const isSearching = ref(false)
const isSubmitting = ref(false)
const msjExito = ref('')
const msjError = ref('')
const user = JSON.parse(localStorage.getItem('user') || '{}')
const esAdmin = computed(() => user.rol === 'ADMIN')

// Lista fija para cargar datos de huesped sin depender de servicios externos.
const nacionalidades = [
  'Argentina',
  'Brasil',
  'Chile',
  'Uruguay',
  'Paraguay',
  'Bolivia',
  'Peru',
  'Colombia',
  'Venezuela',
  'Mexico',
  'Estados Unidos',
  'Canada',
  'Espana',
  'Francia',
  'Italia',
  'Alemania',
  'Reino Unido',
  'Otra'
]

// Rango de fechas que se consulta para saber que habitaciones estan libres.
const busqueda = ref({
  fechaInicio: '',
  fechaFin: ''
})

// Datos necesarios para confirmar una reserva nueva.
const form = ref({
  habitacionId: '',
  fechaInicio: '',
  fechaFin: '',
  huesped: {
    nombre: '',
    apellido: '',
    documento: '',
    telefono: '',
    email: '',
    nacionalidad: '',
    observaciones: ''
  },
  observaciones: ''
})

// Carga reservas activas y habitaciones para poder mostrar tablas y referencias.
const cargarDatos = async () => {
  try {
    isLoading.value = true
    msjError.value = ''

    const [resData, habData] = await Promise.all([
      apiFetch('/reservas'),
      apiFetch('/habitaciones')
    ])

    reservas.value = resData
    habitaciones.value = habData
  } catch (error) {
    msjError.value = 'Error al cargar datos: ' + error.message
  } finally {
    isLoading.value = false
  }
}

// Consulta GET /reservas/disponibilidad con las fechas seleccionadas.
const buscarDisponibilidad = async () => {
  msjError.value = ''
  msjExito.value = ''
  habitacionesDisponibles.value = []

  if (!busqueda.value.fechaInicio || !busqueda.value.fechaFin) {
    msjError.value = 'Selecciona fecha de entrada y salida.'
    return
  }

  if (new Date(busqueda.value.fechaInicio) >= new Date(busqueda.value.fechaFin)) {
    msjError.value = 'La fecha de salida debe ser posterior a la entrada.'
    return
  }

  try {
    isSearching.value = true
    const data = await apiFetch(`/reservas/disponibilidad?fechaInicio=${busqueda.value.fechaInicio}&fechaFin=${busqueda.value.fechaFin}`)
    habitacionesDisponibles.value = data.habitacionesDisponibles
    form.value.fechaInicio = busqueda.value.fechaInicio
    form.value.fechaFin = busqueda.value.fechaFin
  } catch (error) {
    msjError.value = error.message
  } finally {
    isSearching.value = false
  }
}

// Guarda la habitacion elegida dentro del formulario de reserva.
const seleccionarHabitacion = (id) => {
  form.value.habitacionId = id
}

// Envia la reserva al backend. El backend registra reserva, huesped y disponibilidad.
const crearReserva = async () => {
  msjError.value = ''
  msjExito.value = ''
  isSubmitting.value = true

  try {
    await apiFetch('/reservas', {
      method: 'POST',
      body: JSON.stringify(form.value)
    })

    msjExito.value = 'Reserva confirmada correctamente.'
    form.value = {
      habitacionId: '',
      fechaInicio: busqueda.value.fechaInicio,
      fechaFin: busqueda.value.fechaFin,
      huesped: {
        nombre: '',
        apellido: '',
        documento: '',
        telefono: '',
        email: '',
        nacionalidad: '',
        observaciones: ''
      },
      observaciones: ''
    }
    habitacionesDisponibles.value = []
    await cargarDatos()
  } catch (error) {
    msjError.value = error.message
  } finally {
    isSubmitting.value = false
  }
}

// Cancela la reserva y libera sus fechas asociadas.
const cancelarReserva = async (id) => {
  if (!confirm('Seguro que deseas cancelar esta reserva?')) return

  try {
    await apiFetch(`/reservas/${id}`, { method: 'DELETE' })
    msjExito.value = 'Reserva cancelada y fechas liberadas.'
    await cargarDatos()
  } catch (error) {
    msjError.value = 'Error al cancelar: ' + error.message
  }
}

const eliminarReservaCancelada = async (id) => {
  // Esta accion borra definitivamente solo reservas que ya fueron canceladas.
  if (!confirm('Seguro que deseas eliminar definitivamente esta reserva cancelada?')) return

  try {
    await apiFetch(`/reservas/${id}/definitiva`, { method: 'DELETE' })
    msjExito.value = 'Reserva cancelada eliminada del listado.'
    await cargarDatos()
  } catch (error) {
    msjError.value = 'Error al eliminar: ' + error.message
  }
}

// Validacion minima para evitar enviar reservas incompletas.
const formInvalido = computed(() => {
  const huesped = form.value.huesped
  return !form.value.habitacionId ||
    !form.value.fechaInicio ||
    !form.value.fechaFin ||
    !huesped.nombre ||
    !huesped.apellido ||
    !huesped.documento ||
    !huesped.telefono ||
    !huesped.email
})

// Busca datos de habitacion cuando una reserva solo trae habitacionId.
const obtenerHabitacion = (id) => {
  return habitaciones.value.find((habitacion) => habitacion.id === id)
}

// Devuelve nombre del huesped desde el snapshot guardado en la reserva.
const huespedNombre = (reserva) => {
  if (reserva.huespedSnapshot) {
    return `${reserva.huespedSnapshot.nombre || ''} ${reserva.huespedSnapshot.apellido || ''}`.trim()
  }
  return 'Reserva anterior'
}

const reservasActivas = computed(() => {
  // Se separan para que recepcion trabaje sobre reservas vigentes y admin vea historial.
  return reservas.value.filter((reserva) => reserva.estado !== 'cancelled')
})

const reservasCanceladas = computed(() => {
  return reservas.value.filter((reserva) => reserva.estado === 'cancelled')
})

// Al entrar a la pantalla se precargan reservas y habitaciones.
onMounted(cargarDatos)
</script>

<template>
  <section class="reservas-page">
    <div class="header">
      <h1>Gestion de reservas</h1>
      <p>Flujo rapido para recepcion: buscar disponibilidad, seleccionar habitacion y registrar huesped.</p>
    </div>

    <p v-if="msjError" class="msg error">{{ msjError }}</p>
    <p v-if="msjExito" class="msg success">{{ msjExito }}</p>

    <div class="booking-flow">
      <div class="panel">
        <h3>1. Buscar disponibilidad</h3>
        <div class="search-grid">
          <div class="field">
            <label>Entrada</label>
            <input type="date" v-model="busqueda.fechaInicio">
          </div>
          <div class="field">
            <label>Salida</label>
            <input type="date" v-model="busqueda.fechaFin">
          </div>
          <button class="btn-save" @click="buscarDisponibilidad" :disabled="isSearching">
            {{ isSearching ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>

        <div v-if="habitacionesDisponibles.length" class="available-grid">
          <button
            v-for="habitacion in habitacionesDisponibles"
            :key="habitacion.id"
            type="button"
            class="room-option"
            :class="{ selected: form.habitacionId === habitacion.id }"
            @click="seleccionarHabitacion(habitacion.id)"
          >
            <strong>Hab. {{ habitacion.numero }}</strong>
            <span>{{ habitacion.tipo }} - ${{ habitacion.precio }}</span>
            <small>Capacidad {{ habitacion.capacidad || 1 }}</small>
          </button>
        </div>

        <div v-else class="empty-note">
          Busca un rango de fechas para ver habitaciones libres.
        </div>
      </div>

      <div class="panel">
        <h3>2. Datos del huesped</h3>
        <form @submit.prevent="crearReserva">
          <div class="guest-grid">
            <div class="field">
              <label>Nombre</label>
              <input type="text" v-model="form.huesped.nombre" required>
            </div>
            <div class="field">
              <label>Apellido</label>
              <input type="text" v-model="form.huesped.apellido" required>
            </div>
            <div class="field">
              <label>DNI / Pasaporte</label>
              <input type="text" v-model="form.huesped.documento" required>
            </div>
            <div class="field">
              <label>Telefono</label>
              <input type="tel" v-model="form.huesped.telefono" required>
            </div>
            <div class="field">
              <label>Email</label>
              <input type="email" v-model="form.huesped.email" required>
            </div>
            <div class="field">
              <label>Nacionalidad</label>
              <select v-model="form.huesped.nacionalidad">
                <option value="">Seleccione nacionalidad...</option>
                <option v-for="nacionalidad in nacionalidades" :key="nacionalidad" :value="nacionalidad">
                  {{ nacionalidad }}
                </option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>Observaciones</label>
            <textarea v-model="form.observaciones" rows="3" placeholder="Pedido especial, hora estimada de llegada, etc."></textarea>
          </div>

          <button type="submit" class="btn-save" :disabled="formInvalido || isSubmitting">
            {{ isSubmitting ? 'Confirmando...' : 'Confirmar reserva' }}
          </button>
        </form>
      </div>
    </div>

    <div class="panel listado">
      <h3>Reservas activas</h3>
      <div v-if="isLoading" class="msg">Cargando reservas...</div>
      <table v-else class="tabla-custom">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Huesped</th>
            <th>Habitacion</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="res in reservasActivas" :key="res.id">
            <td>{{ res.codigo || res.id.substring(0, 8) }}</td>
            <td>{{ huespedNombre(res) }}</td>
            <td>Hab. {{ res.habitacionSnapshot?.numero || obtenerHabitacion(res.habitacionId)?.numero || 'Sin dato' }}</td>
            <td>{{ res.fechaInicio }}</td>
            <td>{{ res.fechaFin }}</td>
            <td><span class="badge">{{ res.estado || 'confirmed' }}</span></td>
            <td>
              <button @click="cancelarReserva(res.id)" class="btn-delete" :disabled="res.estado === 'cancelled'">
                Cancelar
              </button>
            </td>
          </tr>
          <tr v-if="reservasActivas.length === 0">
            <td colspan="7" class="text-center">No hay reservas registradas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="panel listado canceladas">
      <h3>Reservas canceladas</h3>
      <table class="tabla-custom">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Huesped</th>
            <th>Habitacion</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="res in reservasCanceladas" :key="res.id">
            <td>{{ res.codigo || res.id.substring(0, 8) }}</td>
            <td>{{ huespedNombre(res) }}</td>
            <td>Hab. {{ res.habitacionSnapshot?.numero || obtenerHabitacion(res.habitacionId)?.numero || 'Sin dato' }}</td>
            <td>{{ res.fechaInicio }}</td>
            <td>{{ res.fechaFin }}</td>
            <td>
              <button v-if="esAdmin" @click="eliminarReservaCancelada(res.id)" class="btn-delete">
                Eliminar
              </button>
              <span v-else class="muted">Solo admin</span>
            </td>
          </tr>
          <tr v-if="reservasCanceladas.length === 0">
            <td colspan="6" class="text-center">No hay reservas canceladas.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.reservas-page { animation: fadeIn 0.5s ease; }
.header { margin-bottom: 20px; }
.header h1 { margin: 0 0 4px; color: var(--dark); }
.header p { color: #64748b; margin: 0; }
.booking-flow { display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px; margin-bottom: 25px; }
.panel { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
.listado { margin-top: 22px; }
.canceladas { border-top: 4px solid #fed7d7; }
h3 { margin-bottom: 20px; color: var(--dark); border-bottom: 2px solid var(--light); padding-bottom: 10px; }
.search-grid { display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end; }
.guest-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.available-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-top: 20px; }
.room-option { border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; padding: 14px; border-radius: 8px; text-align: left; cursor: pointer; }
.room-option strong, .room-option span, .room-option small { display: block; }
.room-option.selected { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(102,126,234,0.18); }
.empty-note { margin-top: 18px; color: #64748b; background: #f8fafc; padding: 14px; border-radius: 8px; }
.tabla-custom { width: 100%; border-collapse: collapse; }
.tabla-custom th { text-align: left; padding: 12px; color: #718096; font-size: 0.85rem; text-transform: uppercase; }
.tabla-custom td { padding: 15px 12px; border-top: 1px solid #edf2f7; vertical-align: top; }
.field { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; }
input, select, textarea { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; }
.btn-save { background: var(--primary); color: white; border: none; padding: 12px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-save:disabled { background: #cbd5e0; cursor: not-allowed; }
.btn-delete { background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
.msg { padding: 10px; border-radius: 6px; margin: 10px 0; font-size: 0.9rem; }
.error { background: #fff5f5; color: #c53030; }
.success { background: #f0fff4; color: #2f855a; }
.badge { display: inline-block; background: #edf2ff; color: #4c51bf; border-radius: 999px; padding: 4px 8px; font-size: 0.8rem; font-weight: 700; }
.text-center { text-align: center; color: #718096; }
.muted { color: #718096; font-size: 0.9rem; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1024px) {
  .booking-flow, .guest-grid, .search-grid { grid-template-columns: 1fr; }
}
</style>
