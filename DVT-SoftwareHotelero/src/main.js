import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// El router habilita las pantallas /login y /dashboard/*.
app.use(router)

// Monta toda la aplicacion Vue dentro del div #app de index.html.
app.mount('#app')
