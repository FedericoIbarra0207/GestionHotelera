import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import OperativoView from '../views/OperativoView.vue'
import HabitacionesView from '../views/HabitacionesView.vue'
import ReservasView from '../views/ReservasView.vue'
import PagosView from '../views/PagosView.vue'
import ConsumosView from '../views/ConsumosView.vue'
import UsuariosView from '../views/UsuariosView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ChangePasswordView from '../views/ChangePasswordView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Entrada principal: siempre redirige al login.
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/registro',
      redirect: '/login'
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: ChangePasswordView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      redirect: '/dashboard/operativo',
      // Secciones internas que se renderizan dentro de DashboardView con <RouterView />.
      children: [
        {
          path: 'operativo',
          name: 'operativo',
          component: OperativoView
        },
        {
          path: 'habitaciones',
          name: 'habitaciones',
          component: HabitacionesView
        },
        {
          path: 'reservas',
          name: 'reservas',
          component: ReservasView
        },
        {
          path: 'pagos',
          name: 'pagos',
          component: PagosView
        },
        {
          path: 'consumos',
          name: 'consumos',
          component: ConsumosView
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: UsuariosView
        }
      ]
    }
  ]
})

// Guardia global de rutas:
// - bloquea el dashboard si no hay token
// - bloquea Usuarios si el usuario no es ADMIN
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (to.path.startsWith('/dashboard') && !token) {
    return { name: 'login' }
  }

  if (token && user.mustChangePassword && to.name !== 'change-password') {
    return { name: 'change-password' }
  }

  if (to.path.startsWith('/dashboard/usuarios') && user.rol !== 'ADMIN') {
    return { name: 'operativo' }
  }

  return true
})

export default router
