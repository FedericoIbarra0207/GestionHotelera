<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Usuario guardado al iniciar sesion. Se usa para mostrar opciones segun el rol.
const user = JSON.parse(localStorage.getItem('user') || '{}')
const isAdmin = user.rol === 'ADMIN'
const mobileMenuOpen = ref(false)

/** Cierra el menú compacto luego de elegir una sección en pantallas pequeñas. */
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// Cierra la sesion local y devuelve al login.
const logout = () => {
  closeMobileMenu()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-layout">
    <nav class="sidebar" :class="{ 'is-open': mobileMenuOpen }" aria-label="Navegación principal">
      <div class="sidebar-brand">
        <img src="/img/logo.png" alt="Logo DVT" class="nav-logo">
        <button
          class="sidebar-toggle"
          type="button"
          :aria-expanded="mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'"
          aria-controls="dashboardNavigation"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span aria-hidden="true">{{ mobileMenuOpen ? '×' : '☰' }}</span>
        </button>
      </div>

      <ul id="dashboardNavigation" class="nav-links">
        <li>
          <RouterLink to="/dashboard/operativo" active-class="active" @click="closeMobileMenu">Operativo</RouterLink>
        </li>
        <li>
          <RouterLink to="/dashboard/habitaciones" active-class="active" @click="closeMobileMenu">Habitaciones</RouterLink>
        </li>
        <li>
          <RouterLink to="/dashboard/reservas" active-class="active" @click="closeMobileMenu">Reservas</RouterLink>
        </li>
        <li>
          <RouterLink to="/dashboard/pagos" active-class="active" @click="closeMobileMenu">Pagos</RouterLink>
        </li>
        <li>
          <RouterLink to="/dashboard/consumos" active-class="active" @click="closeMobileMenu">Consumos</RouterLink>
        </li>
        <li v-if="isAdmin">
          <RouterLink to="/dashboard/usuarios" active-class="active" @click="closeMobileMenu">Usuarios</RouterLink>
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
  /* En escritorio la navegación permanece fija; sólo el panel central desplaza. */
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  flex: 0 0 260px;
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

.sidebar-toggle { display: none; }

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
  white-space: nowrap;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #c0392b;
}

.content {
  flex-grow: 1;
  /* Permite que tablas y formularios se reduzcan dentro del panel central. */
  min-width: 0;
  padding: 30px;
  background: var(--light);
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 900px) {
  .content { padding: 20px; }
}

@media (max-width: 900px) {
  .dashboard-layout {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    /* El desplazamiento pasa al documento para que la cabecera compacta pueda
       mantenerse disponible durante toda la navegación móvil. */
    overflow: visible;
  }

  .sidebar {
    width: 100%;
    flex: none;
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .sidebar-brand {
    padding: 5px 12px;
    justify-content: space-between;
  }
  .nav-logo { width: 118px; }

  .sidebar-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: white;
    color: var(--primary-dark);
    width: 40px;
    height: 40px;
    padding: 0;
    font-weight: 700;
    font-size: 1.35rem;
    line-height: 1;
    cursor: pointer;
  }

  .nav-links {
    display: none;
    grid-template-columns: repeat(2, 1fr);
    margin-top: 0;
  }

  .sidebar.is-open .nav-links { display: grid; }

  .nav-links li a {
    padding: 11px 14px;
    font-size: .95rem;
  }

  .btn-logout { display: none; margin: 12px; }
  .sidebar.is-open .btn-logout { display: block; }

  .content {
    padding: 14px;
    overflow: visible;
  }
}
</style>
