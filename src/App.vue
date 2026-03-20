<script setup lang="ts">
import MyHeader from './components/Header.vue';
import './style.css';
</script>

<template>
  <MyHeader />
  <router-view />
</template>

<style>
/* Estilos globales para que se vea como App */
body { margin: 0; background-color: #f4f7f6; font-family: sans-serif; }

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