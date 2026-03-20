import { createApp } from 'vue'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'
import './firebase'
import router from './router'

registerSW({ immediate: true })

// 1. Creamos la instancia de la app
const app = createApp(App)

// 2. LE DECIMOS QUE USE EL ROUTER (Esto es lo que te falta)
app.use(router)

// 3. Recién ahí la montamos
app.mount('#app')