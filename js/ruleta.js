import { watchPremios, descontarStock, updatePremio, modoLocal } from "./db.js";

if (modoLocal) {
  const aviso = document.createElement("div");
  aviso.textContent = "🧪 MODO LOCAL (solo este navegador)";
  aviso.style.cssText =
    "position:absolute;top:0;left:0;right:0;background:#664d00;color:#ffd670;text-align:center;padding:6px;font-size:14px;font-weight:bold;z-index:50;";
  document.getElementById("pantalla").prepend(aviso);
}

const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

const centroX = 300;
const centroY = 300;
const radioRuleta = 260;
const radioAnillo = 282;
const radioHub = 72;

const VERDE = "#038738";
const ROJO = "#e30521";

let premios = []; // [{id, nombre, imagen, stockActual, stockInicial, entregados, orden}]
const cacheImagenes = new Map(); // id -> { src, img }

const iconoCentro = new Image();
iconoCentro.src = "img/icono.png";

let anguloInicio = 0;
let girando = false;

// ---------- Datos en tiempo real ----------

watchPremios(
  (nuevaLista) => {
    premios = nuevaLista;
    actualizarCacheImagenes(premios);
    actualizarTablaPopup();

    const hayPremios = premios.length > 0;
    document.getElementById("vistaRuleta").style.display = hayPremios
      ? "block"
      : "none";
    document.getElementById("mensajeVacio").style.display = hayPremios
      ? "none"
      : "block";
  },
  (err) => {
    console.error("Error leyendo premios:", err);
  },
);

function actualizarCacheImagenes(lista) {
  for (const p of lista) {
    if (!p.imagen) {
      cacheImagenes.delete(p.id);
      continue;
    }
    const entrada = cacheImagenes.get(p.id);
    if (!entrada || entrada.src !== p.imagen) {
      const img = new Image();
      img.src = p.imagen;
      cacheImagenes.set(p.id, { src: p.imagen, img });
    }
  }
  // limpiar imágenes de premios eliminados
  const idsVigentes = new Set(lista.map((p) => p.id));
  for (const id of cacheImagenes.keys()) {
    if (!idsVigentes.has(id)) cacheImagenes.delete(id);
  }
}

// ---------- Dibujo ----------

function dibujarAnillo() {
  ctx.beginPath();
  ctx.arc(centroX, centroY, radioAnillo, 0, Math.PI * 2);
  ctx.lineWidth = 20;
  ctx.strokeStyle = VERDE;
  ctx.stroke();
}

function dibujarRuleta() {
  const total = premios.length;
  if (total === 0) return;
  const angulo = (2 * Math.PI) / total;

  for (let i = 0; i < total; i++) {
    ctx.beginPath();
    ctx.fillStyle = i % 2 === 0 ? "#fff" : VERDE;
    ctx.moveTo(centroX, centroY);
    ctx.arc(
      centroX,
      centroY,
      radioRuleta,
      anguloInicio + i * angulo,
      anguloInicio + (i + 1) * angulo,
    );
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = VERDE;
    ctx.stroke();

    const entrada = cacheImagenes.get(premios[i].id);
    ctx.save();
    ctx.translate(centroX, centroY);
    ctx.rotate(anguloInicio + i * angulo + angulo / 2);
    if (entrada && entrada.img.complete) {
      ctx.drawImage(entrada.img, 150, -35, 70, 70);
    } else {
      ctx.fillStyle = i % 2 === 0 ? VERDE : "#fff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(premios[i].nombre, 195, 0, 100);
    }
    ctx.restore();
  }
}

function dibujarHubCentral() {
  ctx.beginPath();
  ctx.arc(centroX, centroY, radioHub, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = VERDE;
  ctx.stroke();

  if (iconoCentro.complete && iconoCentro.naturalWidth > 0) {
    const lado = radioHub * 1.4;
    ctx.drawImage(
      iconoCentro,
      centroX - lado / 2,
      centroY - lado / 2,
      lado,
      lado,
    );
  }
}

function dibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarAnillo();
  dibujarRuleta();
  dibujarHubCentral();
}

function bucleDibujo() {
  dibujar();
  requestAnimationFrame(bucleDibujo);
}

// ---------- Giro ----------

async function girarRuleta() {
  if (girando || premios.length === 0) return;

  // El sorteo solo elige entre premios con stock: el sector agotado se
  // sigue viendo en la ruleta, pero la flecha nunca cae en él hasta que
  // se le recargue stock o se elimine desde el panel de administración.
  const indicesConStock = premios
    .map((_, i) => i)
    .filter((i) => (premios[i].stockActual || 0) > 0);

  if (indicesConStock.length === 0) {
    mostrarMensaje("😔 No quedan premios disponibles");
    return;
  }

  girando = true;
  document.getElementById("girar").disabled = true;

  const total = premios.length;
  const anguloPorSeccion = (2 * Math.PI) / total;
  const indiceGanador =
    indicesConStock[Math.floor(Math.random() * indicesConStock.length)];
  const premioElegido = premios[indiceGanador];

  const anguloGanador =
    ((3 * Math.PI) / 2 -
      indiceGanador * anguloPorSeccion -
      anguloPorSeccion / 2) %
    (2 * Math.PI);

  // Tiene que ser un numero ENTERO de vueltas: si no, el angulo final
  // queda desplazado al azar respecto al premio sorteado.
  const vueltas = 6 + Math.floor(Math.random() * 4);
  const anguloFinal = anguloGanador + vueltas * 2 * Math.PI;
  const duracion = 6000;
  const inicio = performance.now();

  function animar(t) {
    const progreso = Math.min((t - inicio) / duracion, 1);
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    anguloInicio = anguloFinal * ease(progreso);
    if (progreso < 1) {
      requestAnimationFrame(animar);
    } else {
      anguloInicio = anguloFinal % (2 * Math.PI);
      terminarGiro(premioElegido.id, premioElegido.nombre);
    }
  }
  requestAnimationFrame(animar);
}

async function terminarGiro(premioId, nombre) {
  const huboStock = await descontarStock(premioId);

  if (huboStock) {
    mostrarMensaje("🎉 ¡Ganaste " + nombre + "!");
  } else {
    mostrarMensaje("❌ SIN STOCK de " + nombre);
  }

  girando = false;
  document.getElementById("girar").disabled = false;
}

function mostrarMensaje(texto) {
  const modal = document.getElementById("modalGanador");
  const contenido = document.getElementById("ganadorTexto");
  contenido.innerText = texto;
  modal.classList.add("show");
  modal.onclick = () => modal.classList.remove("show");
}

// ---------- Inventario ----------

function actualizarTablaPopup() {
  const tabla = document.getElementById("tablaStockPopup");
  tabla.innerHTML = `
    <tr><th>Premio</th><th>Stock</th><th>Entregados</th><th>Agregar stock</th></tr>
    ${premios
      .map(
        (p) =>
          `<tr>
            <td>${p.nombre}</td>
            <td>${p.stockActual}</td>
            <td>${p.entregados}</td>
            <td>
              <input type="number" class="input-agregar-stock" id="agregar-${p.id}" value="100" min="1" />
              <button onclick="agregarStock('${p.id}')">+ Agregar</button>
            </td>
          </tr>`,
      )
      .join("")}`;
}

document.getElementById("btnInventario").onclick = () => {
  document.getElementById("modalInventario").classList.add("show");
};

window.cerrarInventario = function () {
  document.getElementById("modalInventario").classList.remove("show");
};

window.agregarStock = async function (id) {
  const input = document.getElementById(`agregar-${id}`);
  const cantidad = Number(input.value);
  if (!cantidad || cantidad <= 0) return;

  const premio = premios.find((p) => p.id === id);
  if (!premio) return;

  await updatePremio(id, { stockActual: premio.stockActual + cantidad });
};

document.getElementById("girar").addEventListener("click", girarRuleta);
bucleDibujo();
