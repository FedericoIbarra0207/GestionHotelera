<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '../services/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// Envia credenciales al backend. Si son validas, guarda token y usuario en localStorage.
const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })

    // Estos datos los usan apiFetch para autorizar peticiones y el router para permisos.
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value = error.message || 'Error al iniciar sesion'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <div class="brand-container">
        <img src="/img/logo.png" alt="Logo DVT" class="login-logo">
      </div>

      <h2>Ingreso al sistema</h2>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="email" required placeholder="tu@email.com">
        </div>

        <div class="form-group">
          <label>Contrasena</label>
          <input type="password" v-model="password" required>
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

    
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--light);
  padding: 20px;
}

.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  width: 100%;
  max-width: 400px;
}

.brand-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.login-logo {
  width: 250px;
  max-width: 100%;
  height: auto;
  display: block;
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--dark);
  font-size: 1.4rem;
}

.form-group {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
}

input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: var(--primary);
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px;
  width: 100%;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: #e74c3c;
  font-size: 0.9em;
  text-align: center;
  margin-bottom: 10px;
}

.link-text {
  text-align: center;
  margin-top: 20px;
  font-size: 0.9em;
}

.link-text a {
  color: var(--primary);
  text-decoration: none;
  font-weight: bold;
}
</style>
