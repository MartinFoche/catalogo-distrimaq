<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/cloudinary';
import imageCompression from 'browser-image-compression'; 

const nombre = ref('');
const categoria = ref('Sin categoría');
const archivo = ref<File | null>(null);
const marca = ref('');
const cargando = ref(false);
const modoOrden = ref('final'); 
const productoReferenciaId = ref(''); 
const productosExistentes = ref<any[]>([]);
const busquedaReferencia = ref(''); 
const mostrarResultados = ref(false);

const categoriasDisponibles: string[] = ['Alfajores','Turrones','Medicamentos','Pastillas','Barritas', 'Galletitas', 'Chocolates','Gomitas','Malvaviscos', 'Caramelos','Chupetines'];

const seleccionarArchivo = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    archivo.value = target.files[0];
  }
};

onMounted(async () => {
  const q = query(collection(db, "productos"), orderBy("orden", "asc"));
  
  onSnapshot(q, (snapshot) => {
    productosExistentes.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  });
});

const productosFiltrados = computed(() => {
  if (!busquedaReferencia.value) return productosExistentes.value;
  return productosExistentes.value.filter(p => 
    p.nombre.toLowerCase().includes(busquedaReferencia.value.toLowerCase())
  );
});

watch(busquedaReferencia, (nuevoValor) => {
  if (nuevoValor === '') {
    productoReferenciaId.value = '';
  }
});

const guardarProducto = async () => {
  if (!nombre.value) return alert("Poné un nombre para el producto");
  if (!archivo.value) return alert("Tenés que elegir una imagen");
  cargando.value = true;

  try {
    const opciones = {
      maxSizeMB: 0.8,          
      maxWidthOrHeight: 1200, 
      useWebWorker: true
    };
    if (modoOrden.value === 'despues' && !productoReferenciaId.value) {
      alert("Por favor, seleccioná un producto de la lista para usar como referencia.");
      cargando.value = false;
      return;
    }
    // Comprimimos el archivo que está en archivo.value
    const archivoComprimido = await imageCompression(archivo.value, opciones)
    // 1. Subir la imagen a Cloudinary
    const urlLink = await uploadToCloudinary(archivoComprimido);
    
    let valorOrden = Date.now(); 

    if (modoOrden.value === 'principio') {
      
      const minOrden = Math.min(...productosExistentes.value.map(p => p.orden || Date.now()));
      valorOrden = minOrden - 1; 
    } else if (modoOrden.value === 'despues' && productoReferenciaId.value) {
      
      const refProd = productosExistentes.value.find(p => p.id === productoReferenciaId.value);
      if (refProd) {
        valorOrden = refProd.orden + 0.01; 
      }
    }

    if (categoria.value === 'Sin categoría') {
      categoria.value = '';
    }
    
    await addDoc(collection(db, "productos"), {
      nombre: nombre.value,
      categoria: categoria.value,
      marca: marca.value,
      imagenUrl: urlLink,
      orden: valorOrden, 
      fechaCarga: serverTimestamp()
    });

    alert("¡Producto guardado con éxito!"); 
    
    nombre.value = '';
    marca.value = '';
    archivo.value = null;
    categoria.value = ''; 
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';

  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Hubo un error al subir el producto.");
  } finally {
    cargando.value = false;
  }
};

const categoriasOrdenadas = computed(() => {
  const ordenadas = [...categoriasDisponibles].sort((a, b) => a.localeCompare(b));
  return ['Sin categoría', ...ordenadas];
});

const seleccionarReferencia = (p: any) => {
  productoReferenciaId.value = p.id;
  busquedaReferencia.value = p.nombre; 
  mostrarResultados.value = false;
};
</script>

<template>
  <div class="contenedor">
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
        <select v-model="categoria" >
          <option v-for="cat in categoriasOrdenadas" :key="cat" :value="cat" >
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

      <div class="campo">
        <label>¿Dónde ubicarlo?</label>
        <select v-model="modoOrden">
          <option value="final">Al final de todo</option>
          <option value="principio">Al principio de todo</option>
          <option value="despues">Después de un producto...</option>
        </select>
      </div>

      <div class="campo" v-if="modoOrden === 'despues'">
        <label>Elegí el producto de referencia</label>
        <div class="buscador-container">
          <input 
            v-model="busquedaReferencia" 
            type="text" 
            placeholder="Escribí el nombre..." 
            @focus="mostrarResultados = true"
          />
          
          <ul v-if="mostrarResultados && productosFiltrados.length > 0" class="lista-resultados">
            <li 
              v-for="p in productosFiltrados" 
              :key="p.id" 
              @click="seleccionarReferencia(p)"
            >
              {{ p.nombre }}
            </li>
          </ul>
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

.buscador-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lista-resultados {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  list-style: none;
  padding: 0;
  margin: 5px 0 0 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.lista-resultados li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.lista-resultados li:hover {
  background-color: #f1f1f1;
}
</style>