<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'; 
import { query, orderBy, onSnapshot, collection, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import EasyLightbox from 'vue-easy-lightbox'

const productos = ref<any[]>([]);
const busqueda = ref('');
const modoEdicion = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);
const mostrarModal = ref(false);
const productoAEditar = ref<any>(null);
const visibleRef = ref(false)
const indexRef = ref(0) // Para saber qué imagen mostrar
const imgsRef = ref<string[]>([])

const showImg = (index: number) => {
  // Armamos la lista de imágenes para el zoom
  imgsRef.value = productosFiltrados.value.map(p => p.imagenUrl)
  indexRef.value = index
  visibleRef.value = true
}

const onHide = () => (visibleRef.value = false)
// Variables para la "nueva" posición
const nuevaUbicacion = ref('Sin cambiar'); 
const productoReferenciaId = ref('');

const abrirEdicion = (prod: any) => {
  productoAEditar.value = { ...prod };
  nuevaUbicacion.value = 'Sin cambiar';
  mostrarModal.value = true;
};

const confirmarCambios = async () => {
  if (!productoAEditar.value) return;

  try {
    const batch = writeBatch(db);
    let nuevoOrden = productoAEditar.value.orden;

    if (nuevaUbicacion.value !== 'Sin cambiar') {
      const todosLosProductos = [...productos.value].sort((a, b) => a.orden - b.orden);

      if (nuevaUbicacion.value === 'principio') {
        // Buscamos el menor orden actual y le restamos 1
        const minOrden = todosLosProductos.length > 0 ? todosLosProductos[0].orden : 0;
        nuevoOrden = minOrden - 1;
      } 
      else if (nuevaUbicacion.value === 'final') {
        // Buscamos el mayor orden actual y le sumamos 1
        const maxOrden = todosLosProductos.length > 0 ? todosLosProductos[todosLosProductos.length - 1].orden : 0;
        nuevoOrden = maxOrden + 1;
      } 
      else if (nuevaUbicacion.value === 'despues') {
        // Buscamos el producto de referencia
        const refProd = productos.value.find(p => p.id === productoReferenciaId.value);
        if (refProd) {
          nuevoOrden = refProd.orden + 1;
          // Empujamos a todos los que tengan orden >= nuevoOrden
          const productosAMover = productos.value.filter(p => p.orden >= nuevoOrden && p.id !== productoAEditar.value.id);
          productosAMover.forEach(p => {
            const pRef = doc(db, "productos", p.id);
            batch.update(pRef, { orden: p.orden + 1 });
          });
        }
      }
    }

    // Actualizamos el producto que estamos editando
    const docRef = doc(db, "productos", productoAEditar.value.id);
    batch.update(docRef, {
      nombre: productoAEditar.value.nombre,
      orden: nuevoOrden
    });

    // Ejecutamos todos los cambios juntos
    await batch.commit();
    
    mostrarModal.value = false;
    alert("¡Producto actualizado correctamente!");
  } catch (error) {
    console.error("Error al guardar cambios:", error);
    alert("Hubo un error al guardar.");
  }
};
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
      <button @click="modoEdicion = !modoEdicion" :class="{ 'btn-edit-activo': modoEdicion }" class="btn-gestionar">
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
          <img :src="prod.imagenUrl" alt="Foto" loading="lazy" draggable="false" @click="showImg(productosFiltrados.indexOf(prod))" style="cursor: zoom-in;"/>
          <span v-if="prod.categoria !== 'Sin categoría'" class="tag">{{ prod.categoria }}</span>
          <span v-if="prod.marca" class="tag" style="top: 50px; background: #2ecc71;">{{ prod.marca }}</span>
          <div class="botones-edicion">
            <button 
              v-if="modoEdicion" 
              class="btn-eliminar" 
              @click.stop="eliminarProducto(prod.id, prod.nombre)"
            >
              🗑️
            </button>
            <button 
              v-if="modoEdicion" 
              class="btn-editar"  
              @click.stop="abrirEdicion(prod)" >
               ✏️
            </button>
          </div>
          
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
  <div v-if="mostrarModal" class="modal-overlay">
    <div class="modal-content">
      <div class="campo">
        <label>Nombre:</label>
        <input v-model="productoAEditar.nombre" type="text" />
      </div>

      <div class="campo">
        <label>¿Mover a otra posición?</label>
        <select v-model="nuevaUbicacion">
          <option value="Sin cambiar">Mantener donde está</option>
          <option value="principio">Al principio de todo</option>
          <option value="final">Al final de todo</option>
          <option value="despues">Después de otro producto...</option>
        </select>
      </div>

      <div v-if="nuevaUbicacion === 'despues'" class="campo">
        <label>¿Después de cuál?</label>
        <select v-model="productoReferenciaId">
          <option v-for="p in productos.filter(x => x.id !== productoAEditar.id)" 
                  :key="p.id" :value="p.id">
            {{ p.nombre }}
          </option>
        </select>
      </div>

      <div class="botones-modal">
        <button @click="mostrarModal = false" class="btn-cancelar">Cerrar</button>
        <button @click="confirmarCambios" class="btn-guardar">Actualizar Producto</button>
      </div>
    </div>
  </div>
  <EasyLightbox
    :visible="visibleRef"
    :imgs="imgsRef"
    :index="indexRef"
    @hide="onHide"
  />
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

.btn-gestionar {
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
}

.botones-edicion{
  position: absolute;
  inset: 0;
  height: 20%;
  display: flex;
  flex-direction: column;
  align-items: end;
  padding-right: 10px;
  padding-top: 10px;
  gap: 8px;
}
.btn-eliminar {
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
  transition: scale 0.2s ease;
}

.btn-eliminar:hover {
  scale: 1.1;
}

.btn-editar{
  background: rgb(238, 255, 2);
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
  transition: scale 0.2s ease;
}
.btn-editar:hover {
  scale: 1.1;
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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px); /* Le da un toque moderno */
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 15px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.campo {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.campo label {
  font-size: 0.9rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.campo input, .campo select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.botones-modal {
  margin-top: 25px;
  display: flex;
  gap: 10px;
}

.btn-guardar {
  flex: 1;
  background: #2ecc71;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-guardar:hover {
  background: #139248;
}

.btn-cancelar {
  flex: 1;
  background: #eee;
  color: #666;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.btn-cancelar:hover {
  background: #d1d1d1;
}
</style>