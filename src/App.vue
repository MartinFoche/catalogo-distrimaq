<script setup lang="ts">
import { ref } from 'vue';
import CargaView from './views/CargaProductos.vue';
import CatalogoView from './views/ListadoProductos.vue';
import MyHeader from './components/Header.vue';
import './style.css';

const vistaActual = ref<'carga' | 'catalogo'>('catalogo');
</script>

<template>
  <MyHeader />
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

.tabs button.activo {
  color: black;
  border-bottom: 3px solid rgb(172, 3, 3);
}

.contenido { padding: 20px; }
</style>