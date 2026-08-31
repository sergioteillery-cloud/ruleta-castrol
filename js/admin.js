import {
  watchPremios,
  addPremio,
  updatePremio,
  eliminarPremio,
  reiniciarPremio,
  archivoABase64,
  modoLocal,
} from "./db.js";
import { SIN_IMAGEN } from "./util.js";

if (modoLocal) {
  const aviso = document.createElement("div");
  aviso.textContent =
    "🧪 MODO LOCAL: guardando en este navegador. Configurá js/firebase-config.js para publicar de verdad.";
  aviso.style.cssText =
    "background:#664d00;color:#ffd670;text-align:center;padding:8px;font-size:13px;font-weight:bold;";
  document.body.prepend(aviso);
}

let premiosActuales = [];
let idEnEdicion = null;

// ---------- Links para pantalla / tablet ----------

const linkPresentacion = new URL("presentacion.html", window.location.href)
  .href;
document.getElementById("linkPresentacion").value = linkPresentacion;

document.getElementById("btnCopiarLink").addEventListener("click", async () => {
  await navigator.clipboard.writeText(linkPresentacion);
  mostrarEstado("Link copiado", "ok");
});

const linkPresentacionTablet = new URL(
  "presentacion-tablet.html",
  window.location.href,
).href;
document.getElementById("linkPresentacionTablet").value =
  linkPresentacionTablet;

document
  .getElementById("btnCopiarLinkTablet")
  .addEventListener("click", async () => {
    await navigator.clipboard.writeText(linkPresentacionTablet);
    mostrarEstado("Link copiado", "ok");
  });

// ---------- Suscripción en tiempo real a los premios ----------

watchPremios(
  (premios) => {
    premiosActuales = premios;
    renderTabla(premios);
  },
  (err) => {
    mostrarEstado("Error leyendo Firestore: " + err.message, "error");
  },
);

function renderTabla(premios) {
  const cuerpo = document.getElementById("cuerpoTablaPremios");
  const vacio = document.getElementById("vacioPremios");

  if (premios.length === 0) {
    cuerpo.innerHTML = "";
    vacio.style.display = "block";
    return;
  }
  vacio.style.display = "none";

  cuerpo.innerHTML = premios
    .map(
      (p, i) => `
      <tr>
        <td>
          <div class="fila-acciones">
            <button ${i === 0 ? "disabled" : ""} onclick="moverPremio('${p.id}', -1)">▲</button>
            <button ${i === premios.length - 1 ? "disabled" : ""} onclick="moverPremio('${p.id}', 1)">▼</button>
          </div>
        </td>
        <td><img src="${p.imagen || SIN_IMAGEN}" alt="${p.nombre}" /></td>
        <td class="nombre">${escapeHtml(p.nombre)}</td>
        <td>${p.stockInicial}</td>
        <td>
          <input
            type="number"
            class="stock-input"
            value="${p.stockActual}"
            min="0"
            onchange="cambiarStockActual('${p.id}', this.value)"
          />
        </td>
        <td>${p.entregados}</td>
        <td>
          <div class="fila-acciones">
            <button onclick="abrirModalEditar('${p.id}')">Editar</button>
            <button onclick="reiniciarStock('${p.id}')">Reiniciar</button>
            <button class="eliminar" onclick="confirmarEliminar('${p.id}')">Eliminar</button>
          </div>
        </td>
      </tr>`,
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function mostrarEstado(texto, tipo) {
  const el = document.getElementById("mensajeEstado");
  el.textContent = texto;
  el.className = tipo || "";
  if (texto) {
    setTimeout(() => {
      if (el.textContent === texto) el.textContent = "";
    }, 4000);
  }
}

// ---------- Agregar premio ----------

const fImagen = document.getElementById("fImagen");
const fPreview = document.getElementById("fPreview");

fImagen.addEventListener("change", async () => {
  if (fImagen.files[0]) {
    fPreview.src = await archivoABase64(fImagen.files[0]);
    fPreview.style.display = "inline-block";
  }
});

document.getElementById("formPremio").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("fNombre").value.trim();
  const stockInicial = document.getElementById("fStock").value;
  const archivo = fImagen.files[0];

  if (!nombre) return;

  try {
    const imagen = archivo ? await archivoABase64(archivo) : "";
    const orden =
      premiosActuales.length > 0
        ? Math.max(...premiosActuales.map((p) => p.orden ?? 0)) + 1
        : 0;

    await addPremio({ nombre, imagen, stockInicial, orden });

    e.target.reset();
    fPreview.style.display = "none";
    mostrarEstado("Premio agregado", "ok");
  } catch (err) {
    mostrarEstado("Error agregando premio: " + err.message, "error");
  }
});

// ---------- Editar ----------

window.abrirModalEditar = function (id) {
  const premio = premiosActuales.find((p) => p.id === id);
  if (!premio) return;
  idEnEdicion = id;

  document.getElementById("eNombre").value = premio.nombre;
  document.getElementById("eStock").value = premio.stockInicial;
  document.getElementById("ePreview").src = premio.imagen || SIN_IMAGEN;
  document.getElementById("eImagen").value = "";

  document.getElementById("modalEditar").classList.add("show");
};

window.cerrarModalEditar = function () {
  document.getElementById("modalEditar").classList.remove("show");
  idEnEdicion = null;
};

document.getElementById("eImagen").addEventListener("change", async (e) => {
  if (e.target.files[0]) {
    document.getElementById("ePreview").src = await archivoABase64(
      e.target.files[0],
    );
  }
});

window.guardarEdicion = async function () {
  if (!idEnEdicion) return;

  const cambios = {
    nombre: document.getElementById("eNombre").value.trim(),
    stockInicial: Number(document.getElementById("eStock").value),
  };

  const archivo = document.getElementById("eImagen").files[0];
  if (archivo) {
    cambios.imagen = await archivoABase64(archivo);
  }

  try {
    await updatePremio(idEnEdicion, cambios);
    mostrarEstado("Premio actualizado", "ok");
  } catch (err) {
    mostrarEstado("Error actualizando: " + err.message, "error");
  }
  window.cerrarModalEditar();
};

// ---------- Stock / reinicio / eliminar / orden ----------

window.cambiarStockActual = async function (id, valor) {
  await updatePremio(id, { stockActual: Number(valor) });
};

window.reiniciarStock = async function (id) {
  await reiniciarPremio(id);
  mostrarEstado("Stock reiniciado", "ok");
};

window.confirmarEliminar = async function (id) {
  const premio = premiosActuales.find((p) => p.id === id);
  if (!premio) return;
  if (!confirm(`¿Eliminar "${premio.nombre}" de la ruleta?`)) return;
  await eliminarPremio(id);
  mostrarEstado("Premio eliminado", "ok");
};

window.moverPremio = async function (id, direccion) {
  const idx = premiosActuales.findIndex((p) => p.id === id);
  const idxVecino = idx + direccion;
  if (idx < 0 || idxVecino < 0 || idxVecino >= premiosActuales.length) return;

  const actual = premiosActuales[idx];
  const vecino = premiosActuales[idxVecino];

  await Promise.all([
    updatePremio(actual.id, { orden: vecino.orden }),
    updatePremio(vecino.id, { orden: actual.orden }),
  ]);
};
