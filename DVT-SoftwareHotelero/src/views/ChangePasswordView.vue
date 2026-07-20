<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { apiFetch } from '../services/api'

const router = useRouter()
const currentPassword = ref('')
const password = ref('')
const confirmation = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

/** Valida y confirma el cambio de credenciales de una sesión autenticada. */
const savePassword = async () => {
  errorMessage.value = ''
  if (password.value !== confirmation.value) {
    errorMessage.value = 'Las contrasenas no coinciden'
    return
  }
  isLoading.value = true
  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: currentPassword.value, password: password.value })
    })
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    localStorage.setItem('user', JSON.stringify({ ...user, mustChangePassword: false }))
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value = error.message || 'No se pudo actualizar la contrasena'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="auth-wrapper"><section class="auth-card">
    <h2>Cambiar contrasena</h2>
    <p class="description">Por seguridad, confirma tu contrasena actual antes de guardar la nueva.</p>
    <form @submit.prevent="savePassword">
      <div class="form-group"><label>Contrasena actual</label><input v-model="currentPassword" type="password" required></div>
      <div class="form-group"><label>Nueva contrasena</label><input v-model="password" type="password" minlength="8" required></div>
      <div class="form-group"><label>Repetir nueva contrasena</label><input v-model="confirmation" type="password" minlength="8" required></div>
      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      <button type="submit" class="btn-primary" :disabled="isLoading">{{ isLoading ? 'Guardando...' : 'Actualizar contrasena' }}</button>
    </form>
    <p class="link-text"><RouterLink :to="{ name: 'dashboard' }">Volver al panel</RouterLink></p>
  </section></main>
</template>

<style scoped src="./auth-forms.css"></style>
