<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// Usuario guardado al iniciar sesion. Se usa para mostrar opciones segun el rol.
const user = JSON.parse(localStorage.getItem('user') || '{}')
const isAdmin = user.rol === 'ADMIN'

// Cierra la sesion local y devuelve al login.
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-layout">
    <nav class="sidebar">
      <div class="sidebar-brand">
        <img src="/img/logo.png" alt="Logo DVT" class="nav-logo">
      </div>

      <ul class="nav-links">
        <li>
          <RouterLink to="/dashboard/operativo" active-class="active">Operativo</RouterLink>
        </li>
        <li>
          <RouterLink to="/dashboard/habitaciones" active-class="active">Habitaciones</RouterLink>
        </li>
        <li>
          <RouterLink to="/dashboard/reservas" active-class="active">Reservas</RouterLink>
        </li>
        <li>
          <RouterLink to="/dashboard/pagos" active-class="active">Pagos</RouterLink>
        </li>
        <li>
          <RouterLink to="/dashboard/consumos" active-class="active">Consumos</RouterLink>
        </li>
        <li v-if="isAdmin">
          <RouterLink to="/dashboard/usuarios" active-class="active">Usuarios</RouterLink>
        </li>
      </ul>

      <button @click="logout" class="btn-logout">Cerrar sesion</button>
    </nav>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: var(--dark);
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-brand {
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  background-color: white;
}

.nav-logo {
  width: 180px;
  height: auto;
  display: block;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin-top: 20px;
  flex-grow: 1;
}

.nav-links li a {
  display: block;
  padding: 15px 25px;
  color: #a0aec0;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 1.05rem;
}

.nav-links li a:hover {
  color: white;
  background: rgba(255,255,255,0.05);
}

.nav-links li a.active {
  background: var(--primary);
  color: white;
  border-left: 4px solid var(--secondary);
}

.btn-logout {
  margin: 20px;
  background: #e74c3c;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #c0392b;
}

.content {
  flex-grow: 1;
  padding: 30px;
  background: var(--light);
  overflow-y: auto;
}

@media (max-width: 760px) {
  .dashboard-layout {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
  }

  .sidebar {
    width: 100%;
  }

  .nav-links {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    margin-top: 0;
  }

  .content {
    padding: 20px;
  }
}
</style>
