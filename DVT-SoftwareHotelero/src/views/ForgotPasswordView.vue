<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { apiFetch } from '../services/api'

const email = ref('')
const message = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// Registra una solicitud interna. La respuesta es genérica para no revelar
// desde el navegador qué direcciones existen en el sistema.
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
      <h2>Solicitar clave temporal</h2>
      <p class="description">Ingresa el email de tu cuenta. Si está registrado, un administrador verá la solicitud, verificará tu identidad y te entregará una clave temporal por un canal interno.</p>
      <form @submit.prevent="requestReset">
        <div class="form-group">
          <label for="reset-email">Email</label>
          <input id="reset-email" v-model="email" type="email" required placeholder="tu@email.com">
        </div>
        <p v-if="message" class="success-msg">{{ message }}</p>
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Registrando...' : 'Enviar solicitud al administrador' }}
        </button>
      </form>
      <p class="link-text"><RouterLink :to="{ name: 'login' }">Volver al inicio de sesion</RouterLink></p>
    </section>
  </main>
</template>

<style scoped src="./auth-forms.css"></style>
