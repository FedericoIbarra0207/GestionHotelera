<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { apiFetch } from '../services/api'

const email = ref('')
const message = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// Envía el correo al backend. La respuesta es deliberadamente genérica para
// no informar desde el navegador qué direcciones existen en el sistema.
const requestReset = async () => {
  isLoading.value = true
  message.value = ''
  errorMessage.value = ''

  try {
    const data = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.value })
    })
    message.value = data.message
  } catch (error) {
    errorMessage.value = error.message || 'No se pudo procesar la solicitud'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="auth-wrapper">
    <section class="auth-card">
      <h2>Recuperar contrasena</h2>
      <p class="description">Ingresa tu email para registrar la solicitud. Un administrador verificara tu identidad y te entregara una contrasena temporal.</p>
      <form @submit.prevent="requestReset">
        <div class="form-group">
          <label for="reset-email">Email</label>
          <input id="reset-email" v-model="email" type="email" required placeholder="tu@email.com">
        </div>
        <p v-if="message" class="success-msg">{{ message }}</p>
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Registrando...' : 'Solicitar recuperacion' }}
        </button>
      </form>
      <p class="link-text"><RouterLink :to="{ name: 'login' }">Volver al inicio de sesion</RouterLink></p>
    </section>
  </main>
</template>

<style scoped src="./auth-forms.css"></style>
