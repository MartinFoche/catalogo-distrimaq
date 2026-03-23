<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'; 
import { query, onSnapshot, collection, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import EasyLightbox from 'vue-easy-lightbox'
import { jsPDF } from "jspdf";

interface Producto {
  id: string;
  nombre: string;
  marca: string;    
  categoria?: string;
  imagenUrl: string;
  novedad?: boolean;
}

const productos = ref<Producto[]>([]);
const busqueda = ref('');
const modoEdicion = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);
const mostrarModal = ref(false);
const productoAEditar = ref<any>(null);
const visibleRef = ref(false)
const indexRef = ref(0) 
const imgsRef = ref<string[]>([])


const generarPDFVisual = async () => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const lista = productos.value;

  if (lista.length === 0) return alert("No hay productos para exportar");

  for (let i = 0; i < lista.length; i++) {
    const p = lista[i];

    if (i > 0) doc.addPage();

    try {
      const img = new Image();
      img.src = p.imagenUrl;
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - 70;
      let imgWidth = img.width;
      let imgHeight = img.height;
      const ratio = imgWidth / imgHeight;

      if (imgWidth > maxWidth) {
        imgWidth = maxWidth;
        imgHeight = imgWidth / ratio;
      }
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * ratio;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = 20;

      doc.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(200, 0, 0); // Un rojo para Distrimaq
      doc.text(p.nombre.toUpperCase(), pageWidth / 2, y + imgHeight + 20, { align: 'center' });

      if (p.marca) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(p.marca, pageWidth / 2, y + imgHeight + 32, { align: 'center' });
      }

    } catch (error) {
      console.error("Error con imagen:", p.nombre);
    }
  }

  const fechaActual = new Date();
  const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0'); 
  const anio = fechaActual.getFullYear().toString(); 
  const nombreArchivo = `Distrimaq ${mes}-${anio}.pdf`;
  doc.save(nombreArchivo);
};

const showImg = (index: number) => {
  // Armamos la lista de imágenes para el zoom
  imgsRef.value = productosFiltrados.value.map(p => p.imagenUrl)
  indexRef.value = index
  visibleRef.value = true
}

const onHide = () => (visibleRef.value = false)
// Variables para la "nueva" posición
const nuevaUbicacion = ref('Sin cambiar'); 

const abrirEdicion = (prod: any) => {
  productoAEditar.value = { ...prod };
  nuevaUbicacion.value = 'Sin cambiar';
  mostrarModal.value = true;
};

const confirmarCambios = async () => {
  if (!productoAEditar.value) return;

  try {
    const batch = writeBatch(db);
    const docRef = doc(db, "productos", productoAEditar.value.id);

    batch.update(docRef, {
      nombre: productoAEditar.value.nombre,
      marca: productoAEditar.value.marca, 
      novedad: !!productoAEditar.value.novedad 
    });

    await batch.commit();
    
    mostrarModal.value = false;
  } catch (error) {
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

  if (e.deltaY !== 0) {
    e.preventDefault(); 
    container.scrollBy({
      left: e.deltaY * 2, 
      behavior: 'smooth' 
    });
  }
};


onMounted(async () => {
  const q = query(collection(db, "productos"));
  
  onSnapshot(q, (snapshot) => {
    const rawData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Producto[];;

    productos.value = rawData.sort((a, b) => {
      if (a.novedad !== b.novedad) {
        return a.novedad ? -1 : 1;
      }

      const marcaA = (a.marca || "").toLowerCase();
      const marcaB = (b.marca || "").toLowerCase();
      if (marcaA !== marcaB) {
        return marcaA.localeCompare(marcaB);
      }

      const nombreA = (a.nombre || "").toLowerCase();
      const nombreB = (b.nombre || "").toLowerCase();
      return nombreA.localeCompare(nombreB);
    });
  });
});
const productosFiltrados = computed(() => {
  const termino = busqueda.value.toLowerCase().trim();
  
  if (!termino) return productos.value;

  return productos.value.filter(p => {
    return p.nombre.toLowerCase().includes(termino) || 
           p.categoria?.toLowerCase().includes(termino) ||
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
    <div class="gestionar-generar-container">
      <button @click="modoEdicion = !modoEdicion" :class="{ 'btn-edit-activo': modoEdicion }" class="btn-gestionar">
        {{ modoEdicion ? 'Listo' : 'Gestionar' }}
      </button>
      <button @click="generarPDFVisual" class="btn-pdf">
        Generar PDF
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
          <div v-if="prod.novedad" class="badge-novedad">
            NUEVO
          </div>
          <img :src="prod.imagenUrl" alt="Foto" loading="lazy" draggable="false" @click="showImg(productosFiltrados.indexOf(prod))" style="cursor: zoom-in;"/>
          <span v-if="prod.marca" class="tag" style="background: #2ecc71;">{{ prod.marca }}</span>
          <span v-if="prod.categoria !== ''" style="top: 50px;" class="tag">{{ prod.categoria }}</span>
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
        <label>Marca:</label>
        <input v-model="productoAEditar.marca" type="text" placeholder="Ej: Guaymallen" />
      </div>

      <div class="campo-checkbox">
        <label for="checkNovedad">Es novedad</label>
        <input 
          type="checkbox" 
          id="checkNovedad" 
          v-model="productoAEditar.novedad" 
        />
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
  left: 0;
  box-sizing: border-box;
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

.btn-gestionar:hover {
  background: #f1f1f1;
}

.btn-edit-activo {
  background: #2ecc71;
  color: white;
}

.btn-edit-activo:hover {
  background: #139248;
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
  align-items: center;
  text-align: center;
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
.campo-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
}

.campo-checkbox input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.campo-checkbox label {
  font-weight: bold;
  color: #2c3e50;
}

.badge-novedad {
  position: absolute;
  top: 15px;   
  left: 50%;     
  transform: translateX(-50%); 
  background: #ff0000;
  color: #ffffff;
  padding: 4px 15px;
  border-radius: 50px;
  font-weight: 900;
  font-size: 0.75rem;
  z-index: 20;    
  white-space: nowrap; 
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  animation: pulsoNovedad 2s infinite;
}

@keyframes pulsoNovedad {
  0% { 
    transform: translateX(-50%) scale(1); 
  }
  50% { 
    transform: translateX(-50%) scale(1.1); 
  }
  100% { 
    transform: translateX(-50%) scale(1); 
  }
}

.gestionar-generar-container{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.btn-pdf{
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: white;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-pdf:hover {
  background: #f1f1f1;
}
</style>