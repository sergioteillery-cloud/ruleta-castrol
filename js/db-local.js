// Implementación de respaldo para probar la app en tu propia PC, sin
// depender de Firebase: guarda todo en localStorage del navegador.
// Misma interfaz que db-firestore.js, así admin.js y ruleta.js no
// necesitan saber cuál de las dos está activa.
//
// Solo sirve para pruebas en un mismo navegador: no sincroniza con
// otros dispositivos (para eso hace falta configurar Firebase).

const KEY = "ruleta_premios_local";

// Premios oficiales del evento con su stock inicial. Se cargan una sola
// vez si todavía no hay nada guardado; después se editan libremente
// desde el panel de administración.
const PREMIOS_INICIALES = [
  ["Lápiz", 100],
  ["Botella Flexible", 5],
  ["Jockey", 50],
  ["Parasol", 16],
  ["Posa Vasos", 50],
  ["Sticker", 500],
].map(([nombre, stock], i) => ({
  id: "seed-" + i,
  nombre,
  imagen: "",
  stockInicial: stock,
  stockActual: stock,
  entregados: 0,
  orden: i,
}));

function leer() {
  const guardado = localStorage.getItem(KEY);
  if (guardado === null) {
    localStorage.setItem(KEY, JSON.stringify(PREMIOS_INICIALES));
    return PREMIOS_INICIALES;
  }
  return JSON.parse(guardado);
}

function escribir(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista));
  window.dispatchEvent(new Event("ruleta-local-changed"));
}

function idNuevo() {
  return "local-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
}

export function watchPremios(callback) {
  const handler = () => callback(leer().sort((a, b) => a.orden - b.orden));
  handler();
  window.addEventListener("ruleta-local-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("ruleta-local-changed", handler);
    window.removeEventListener("storage", handler);
  };
}

export async function addPremio({ nombre, imagen, stockInicial, orden }) {
  const lista = leer();
  lista.push({
    id: idNuevo(),
    nombre,
    imagen,
    stockInicial: Number(stockInicial),
    stockActual: Number(stockInicial),
    entregados: 0,
    orden: Number(orden),
  });
  escribir(lista);
}

export async function updatePremio(id, cambios) {
  const lista = leer();
  const i = lista.findIndex((p) => p.id === id);
  if (i >= 0) lista[i] = { ...lista[i], ...cambios };
  escribir(lista);
}

export async function eliminarPremio(id) {
  escribir(leer().filter((p) => p.id !== id));
}

export async function reiniciarPremio(id) {
  const lista = leer();
  const i = lista.findIndex((p) => p.id === id);
  if (i >= 0) {
    lista[i].stockActual = lista[i].stockInicial;
    lista[i].entregados = 0;
  }
  escribir(lista);
}

export async function descontarStock(id) {
  const lista = leer();
  const i = lista.findIndex((p) => p.id === id);
  if (i < 0 || lista[i].stockActual <= 0) return false;
  lista[i].stockActual -= 1;
  lista[i].entregados += 1;
  escribir(lista);
  return true;
}
