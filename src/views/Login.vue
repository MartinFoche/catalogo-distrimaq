<script setup lang="ts">
import { ref } from 'vue';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();

const iniciarSesion = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push('/'); 
  } catch (error) {
    alert("Error: Usuario o contraseña incorrectos");
  }
};
</script>

<template>
  <div class="login-container">
    <form @submit.prevent="iniciarSesion" class="login-card">
      <h2 style="display: flex; justify-content: center;">Acceso Admin</h2>
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <button type="submit">Entrar</button>
    </form>
  </div>
</template>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; padding-top: 20px; }
.login-card { display: flex; flex-direction: column; gap: 15px; padding: 30px; background: #eee; border-radius: 8px; }
input { padding: 10px; border-radius: 4px; border: 1px solid #ccc; }
button { padding: 10px; background: #c00; color: white; border: none; cursor: pointer; border-radius: 20px; transition: background-color 0.3s ease; }
button:hover { background: #a00; }
</style>