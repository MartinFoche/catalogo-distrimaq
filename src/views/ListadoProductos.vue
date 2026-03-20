<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'; 
import { query, orderBy, onSnapshot, collection, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const productos = ref<any[]>([]);
const busqueda = ref('');
const modoEdicion = ref(false);

const scrollContainer = ref<HTMLElement | null>(null);

const eliminarProducto = async (id: string, nombre: string) => {
  const confirmar = confirm(`¿Estás seguro de borrar "${nombre}"?`);
  if (!confirmar) return;

  try {
    await deleteDoc(doc(db, "productos", id));
  } catch (e) {
    alert("No se pudo borrar");
  }
};

const stopDragging = () => {
  scrollContainer.value?.classList.remove('active');
};

const handleWheel = (e: WheelEvent) => {
  const container = scrollContainer.value;
  if (!container) return;

  // Si hay movimiento vertical en la rueda
  if (e.deltaY !== 0) {
    e.preventDefault(); 
    container.scrollBy({
      left: e.deltaY * 2, 
      behavior: 'smooth' 
    });
  }
};

// Esta función se trae los datos y "se queda escuchando"
onMounted(async () => {
  const q = query(collection(db, "productos"), orderBy("orden", "asc"));
  
  onSnapshot(q, (snapshot) => {
    productos.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Esto te va a decir en consola si los datos vienen del disco o de internet
    const fuente = snapshot.metadata.fromCache ? "Caché Local" : "Servidor";
    console.log("Datos cargados desde:", fuente);
  }, (error) => {
    console.error("Error en el snapshot:", error);
  });
});

const productosFiltrados = computed(() => {
  const termino = busqueda.value.toLowerCase().trim();
  
  // Si no hay nada escrito, mostramos todo
  if (!termino) return productos.value;

  // Filtramos por nombre o por categoría
  return productos.value.filter(p => {
    return p.nombre.toLowerCase().includes(termino) || 
           p.categoria.toLowerCase().includes(termino) ||
           (p.marca && p.marca.toLowerCase().includes(termino));
  });
});
watch(busqueda, () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft = 0;
  }
});
</script>
<template>
  <section class="listado">
    <div>
      <button @click="modoEdicion = !modoEdicion" :class="{ 'btn-edit-activo': modoEdicion }" class="btn-editar">
        {{ modoEdicion ? '✅ Listo' : '⚙️ Gestionar' }}
      </button>
    </div>
    <div class="contenedor-busqueda">
      <div class="input-wrapper">
        <span class="icono">🔍</span>
        <input 
          v-model="busqueda" 
          type="text" 
          placeholder="Buscar alfajor, marca o categoría..." 
        />
        <button v-if="busqueda" @click="busqueda = ''" class="btn-limpiar">✕</button>
      </div>
      <p class="resultados-count">
        {{ productosFiltrados.length }} productos encontrados
      </p>
    </div>

    <div 
      ref="scrollContainer"
      class="scroll-horizontal"
      @mouseleave="stopDragging"
      @mouseup="stopDragging"
      @wheel.prevent="handleWheel"
      @touchend="stopDragging"
    >
      <div v-for="prod in productosFiltrados" :key="prod.id" class="card-producto" :class="{ 'modo-edicion-vibrar': modoEdicion }">
        <div class="contenedor-img">
          <img :src="prod.imagenUrl" alt="Foto" loading="lazy" draggable="false" />
          <span v-if="prod.categoria !== 'Sin categoría'" class="tag">{{ prod.categoria }}</span>
          <span v-if="prod.marca" class="tag" style="top: 50px; background: #2ecc71;">{{ prod.marca }}</span>
            <button 
            v-if="modoEdicion" 
            class="btn-eliminar" 
            @click.stop="eliminarProducto(prod.id, prod.nombre)"
          >
          
            🗑️
          </button>
        </div>
        <div class="info">
          <h3>{{ prod.nombre }}</h3>
        </div>
      </div>
    </div>

    <p v-if="productosFiltrados.length === 0 && busqueda" class="vacio">
      No hay nada que coincida con "{{ busqueda }}"
    </p>
  </section>
</template>
<style scoped>
.listado {
  width: 100%;
  max-width: 500px; 
  margin: 0 auto; 
  overflow: hidden;
  position: relative;
  background: #fff;
}

.scroll-horizontal {
  display: grid;
  grid-template-rows: 600px; 
  grid-auto-flow: column;
  grid-auto-columns: 100%; 
  gap: 0; 
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%; 
  scroll-snap-type: x mandatory;
  padding: 0; 
  margin: 0;
  user-select: none;
  padding-bottom: 5px;
}

.scroll-horizontal::-webkit-scrollbar {
  height: 10px !important; 
  cursor: grab;
}

.card-producto {
  background: white;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  scroll-snap-align: center;
  scroll-snap-stop: always; 
  overflow: hidden;
  position: relative;
  border-radius: 10px;
}

.card-producto img {
  pointer-events: none; 
}

.contenedor-img {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px; 
  box-sizing: border-box;
}

.contenedor-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom, 
    rgba(0,0,0,0.3) 0%, 
    transparent 20%, 
    transparent 80%, 
    rgba(0,0,0,0.4) 100%
  );
  pointer-events: none;
}

.contenedor-img img {
  width: 100%;
  height: 100%;
  object-fit: contain; 
  border-radius: 8px;
  pointer-events: none;
}

.info {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(transparent, rgba(0,0,0,0.7)); 
  padding: 40px 15px 15px; 
  text-align: center;
}

.info h3 {
  margin: 0;
  font-size: 1.2rem;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

.scroll-horizontal::-webkit-scrollbar-thumb {
  background: rgb(172, 3, 3);
  border-radius: 10px;
}
.contenedor-busqueda {
  padding: 10px 0px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 15px 12px 40px;
  border-radius: 12px;
  border: 1px solid #ddd;
  font-size: 1rem;
  outline: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.input-wrapper .icono {
  position: absolute;
  left: 12px;
  color: #999;
}

.btn-limpiar {
  position: absolute;
  right: 10px;
  background: #eee;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  color: #666;
}

.resultados-count {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-top: 8px;
  margin-left: 5px;
}
.tag {
  position: absolute;
  top: 15px;
  left: 15px; 
  background: #3498db;
  color: white;
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  font-weight: bold;
  z-index: 5;
}

.btn-editar {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: white;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-edit-activo {
  background: #2ecc71;
  color: white;
  border-color: #27ae60;
}


.btn-eliminar {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e74c3c;
  color: white;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 10;
}

.modo-edicion-vibrar {
  animation: vibrar 0.3s backwards;
}

@keyframes vibrar {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(0.3deg); } 
  75% { transform: rotate(-0.3deg); }
  100% { transform: rotate(0deg); }
}
</style>