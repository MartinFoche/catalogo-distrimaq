<script setup lang="ts">
import { ref } from 'vue';
import CargaView from '../views/CargaProductos.vue';
import CatalogoView from '../views/ListadoProductos.vue';
import '../style.css';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'vue-router'
const router = useRouter();

const cerrarSesion = async () => {
  try {
    await signOut(auth);
    router.push('/login'); // Lo mandamos al login al toque
  } catch (error) {
    console.error("Error al salir:", error);
  }
};

const vistaActual = ref<'carga' | 'catalogo'>('catalogo');
</script>

<template>
    <div class="app-container" style="background-color: white;">
    <nav class="tabs">
      <button 
        :class="{ activo: vistaActual === 'catalogo' }" 
        @click="vistaActual = 'catalogo'"
      >
        📖 Ver Catálogo
      </button>
      <button 
        :class="{ activo: vistaActual === 'carga' }" 
        @click="vistaActual = 'carga'"
      >
        ➕ Cargar Nueva
      </button>
      <div class="separador-salir">
        <button @click="cerrarSesion" class="btn-salir">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        </button>
      </div>
    </nav>

    <main class="contenido">
      <CatalogoView v-if="vistaActual === 'catalogo'" />
      <CargaView v-else />
    </main>
  </div>
</template>

<style>
/* Estilos globales para que se vea como App */
body { margin: 0; background-color: #f4f7f6; font-family: sans-serif; }
.app-container { max-width: 600px; margin: 0 auto; margin-top: 10px; margin-bottom: 10px; height: 100vh; border-radius: 15px; width: 95%; box-shadow: 0 4px 12px rgba(0,0,0,0.1);}

.tabs {
  display: flex;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.tabs button {
  flex: 1;
  padding: 15px;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: bold;
  color: #7f8c8d;
  cursor: pointer;
  border-bottom: 3px solid transparent;
}

.tabs button:hover {
  border-bottom: 3px solid rgba(172, 3, 3, 0.356);
}

.tabs button.activo {
  color: black;
  border-bottom: 3px solid rgb(172, 3, 3);
}

.contenido { padding: 20px; }

.admin-header {
  display: flex;
  justify-content: flex-end;
  padding: 10px;
}

.btn-salir {
  background: none;
  padding: 5px 12px;
  font-size: 0.8rem;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.separador-salir {
  margin-left: auto;
  padding-right: 15px;
  display: flex;
  align-items: center;
}
</style>