<script setup lang="ts">
import { computed, ref } from 'vue';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/cloudinary';
import imageCompression from 'browser-image-compression'; 

// --- ESTADO DEL FORMULARIO ---
const nombre = ref('');
const categoria = ref('Sin categoría');
const archivo = ref<File | null>(null);
const marca = ref('');
const cargando = ref(false);

// Podés agregar o quitar categorías acá
const categoriasDisponibles: string[] = ['Alfajores','Turrones','Medicamentos','Pastillas','Barritas', 'Galletitas', 'Chocolates','Gomitas','Malvaviscos', 'Caramelos','Chupetines'];

// --- FUNCIONES ---
const seleccionarArchivo = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    archivo.value = target.files[0];
  }
};

const guardarProducto = async () => {
  // Validaciones básicas
  if (!nombre.value) return alert("Poné un nombre para el producto");
  if (!archivo.value) return alert("Tenés que elegir una imagen");

  cargando.value = true;
  
  try {
    const opciones = {
      maxSizeMB: 0.8,          // Menos de 1MB (ajustalo si querés más calidad)
      maxWidthOrHeight: 1200, // Tamaño ideal para celular
      useWebWorker: true
    };
    // Comprimimos el archivo que está en archivo.value
    const archivoComprimido = await imageCompression(archivo.value, opciones)
    // 1. Subir la imagen a Cloudinary
    const urlLink = await uploadToCloudinary(archivoComprimido);

    // 2. Guardar los datos en la colección "productos" de Firebase
    await addDoc(collection(db, "productos"), {
      nombre: nombre.value,
      categoria: categoria.value,
      marca: marca.value,
      imagenUrl: urlLink,
      orden: Date.now(), 
      fechaCarga: serverTimestamp()
    });

    alert("¡Producto guardado con éxito!"); 
    
    // Limpiar formulario para la siguiente carga
    nombre.value = '';
    marca.value = '';
    archivo.value = null;
    categoria.value = 'Sin categoría'; 
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';

  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Hubo un error al subir el producto. Revisá la consola.");
  } finally {
    cargando.value = false;
  }
};

const categoriasOrdenadas = computed(() => {
  // Primero ordenamos las del array (alfabéticamente)
  const ordenadas = [...categoriasDisponibles].sort((a, b) => a.localeCompare(b));
  
  // Retornamos un nuevo array que tiene 'Sin categoría' PRIMERO 
  // y después el resto de las ordenadas
  return ['Sin categoría', ...ordenadas];
});
</script>

<template>
  <div class="contenedor">
    <header>
      <h1>Distrimaq Catálogo</h1>
      <p>Carga de nuevos productos</p>
    </header>

    <main class="formulario">
      <div class="campo">
        <label>Nombre del Producto</label>
        <input 
          v-model="nombre" 
          type="text" 
          placeholder="Ej: Alfajor Triple Negro" 
        />
      </div>

      <div class="campo">
        <label>Categoría</label>
        <select v-model="categoria">
          <option v-for="cat in categoriasOrdenadas" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="campo">
        <label>Marca</label>
        <input 
          v-model="marca" 
          type="text" 
          placeholder="Ej: Havanna" 
        />
      </div>


      <div class="campo">
        <label>Foto del Producto</label>
        <div class="upload-area">
          <input 
            type="file" 
            accept="image/*" 
            @change="seleccionarArchivo" 
          />
        </div>
      </div>

      <button 
        @click="guardarProducto" 
        :disabled="cargando" 
        class="btn-principal"
      >
        <span v-if="!cargando">Añadir al Catálogo</span>
        <span v-else>Subiendo...</span>
      </button>
    </main>
  </div>
</template>

<style scoped>
.contenedor {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

header h1 {
  margin: 0;
  color: #2c3e50;
}

header p {
  color: #7f8c8d;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f9f9f9;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: bold;
  font-size: 0.9rem;
}

input[type="text"], select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.upload-area {
  border: 2px dashed #cbd5e0;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  background: white;
}

.file-name {
  font-size: 0.8rem;
  color: #27ae60;
  margin-top: 10px;
}

.btn-principal {
  background-color: #c00;
  color: white;
  border: none;
  padding: 15px;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-principal:hover:not(:disabled) {
  background-color: rgb(134, 3, 3);
}

.btn-principal:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}
</style>