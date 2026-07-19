<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiFetch } from '../services/api'

const usuarios = ref([])
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)

// Formulario para crear usuarios internos del sistema.
// Por defecto se crean recepcionistas para reducir riesgo de altas con permisos admin.
const form = ref({
  nombre: '',
  email: '',
  password: '',
  rol: 'RECEPCIONISTA'
})

// Carga la tabla de usuarios internos desde GET /users.
const cargarUsuarios = async () => {
  try {
    isLoading.value = true
    usuarios.value = await apiFetch('/users')
  } catch (error) {
    errorMessage.value = error.message || 'No se pudieron cargar los usuarios'
  } finally {
    isLoading.value = false
  }
}

// Crea un usuario interno y luego refresca la tabla.
const crearUsuario = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(form.value)
    })
    successMessage.value = 'Usuario interno creado correctamente.'
    form.value = { nombre: '', email: '', password: '', rol: 'RECEPCIONISTA' }
    await cargarUsuarios()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}

// Elimina un usuario por id y vuelve a cargar el listado.
const eliminarUsuario = async (id) => {
  if (!confirm('Seguro que deseas eliminar este usuario interno?')) return

  try {
    await apiFetch(`/users/${id}`, { method: 'DELETE' })
    successMessage.value = 'Usuario eliminado correctamente.'
    await cargarUsuarios()
  } catch (error) {
    errorMessage.value = error.message
  }
}

// Valida campos minimos antes de habilitar el boton de creacion.
const formInvalido = computed(() => {
  return !form.value.nombre || !form.value.email || form.value.password.length < 8 || !form.value.rol
})

// Al abrir la pantalla, se carga el listado inicial.
onMounted(cargarUsuarios)
</script>

<template>
  <section class="page">
    <div class="header">
      <h1>Usuarios internos</h1>
      <p>Gestion de administradores y recepcionistas del hotel.</p>
    </div>

    <p v-if="errorMessage" class="msg error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="msg success">{{ successMessage }}</p>

    <div class="layout-grid">
      <div class="panel">
        <h3>Equipo del sistema</h3>
        <div v-if="isLoading" class="empty">Cargando usuarios...</div>
        <table v-else class="tabla-custom">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.id">
              <td>{{ usuario.nombre }}</td>
              <td>{{ usuario.email }}</td>
              <td><span class="badge">{{ usuario.rol }}</span></td>
              <td><button class="btn-delete" @click="eliminarUsuario(usuario.id)">Eliminar</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel">
        <h3>Nuevo usuario</h3>
        <form @submit.prevent="crearUsuario">
          <div class="field">
            <label>Nombre completo</label>
            <input v-model="form.nombre" type="text" required>
          </div>
          <div class="field">
            <label>Email</label>
            <input v-model="form.email" type="email" required>
          </div>
          <div class="field">
            <label>Contrasena inicial</label>
            <input v-model="form.password" type="password" minlength="8" required>
          </div>
          <div class="field">
            <label>Rol</label>
            <select v-model="form.rol">
              <option value="RECEPCIONISTA">Recepcionista</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <button class="btn-save" type="submit" :disabled="formInvalido || isSubmitting">
            {{ isSubmitting ? 'Creando...' : 'Crear usuario' }}
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
.layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; }
.panel { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
h3 { margin-bottom: 20px; color: var(--dark); border-bottom: 2px solid var(--light); padding-bottom: 10px; }
.tabla-custom { width: 100%; border-collapse: collapse; }
.tabla-custom th { text-align: left; padding: 12px; color: #718096; font-size: 0.85rem; text-transform: uppercase; }
.tabla-custom td { padding: 15px 12px; border-top: 1px solid #edf2f7; }
.field { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; }
input, select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; }
.btn-save { background: var(--primary); color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-save:disabled { background: #cbd5e0; cursor: not-allowed; }
.btn-delete { background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
.msg, .empty { padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; }
.error { background: #fff5f5; color: #c53030; }
.success { background: #f0fff4; color: #2f855a; }
.empty { background: #f8fafc; color: #64748b; }
.badge { display: inline-block; background: #edf2ff; color: #4c51bf; border-radius: 999px; padding: 4px 8px; font-size: 0.8rem; font-weight: 700; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1024px) { .layout-grid { grid-template-columns: 1fr; } }
</style>
