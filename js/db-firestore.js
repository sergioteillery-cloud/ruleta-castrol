// Capa de datos: todo lo que habla con Firestore vive acá.
// admin.js y ruleta.js solo llaman a estas funciones.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const premiosCol = collection(db, "premios");

// Suscribe a la lista de premios en tiempo real, ordenada por "orden".
// Devuelve una función para cancelar la suscripción.
export function watchPremios(callback, onError) {
  const q = query(premiosCol, orderBy("orden", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const premios = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(premios);
    },
    onError,
  );
}

export async function addPremio({ nombre, imagen, stockInicial, orden }) {
  await addDoc(premiosCol, {
    nombre,
    imagen,
    stockInicial: Number(stockInicial),
    stockActual: Number(stockInicial),
    entregados: 0,
    orden: Number(orden),
  });
}

export async function updatePremio(id, cambios) {
  await updateDoc(doc(db, "premios", id), cambios);
}

export async function eliminarPremio(id) {
  await deleteDoc(doc(db, "premios", id));
}

// Reinicia stock y entregados de un premio a su valor inicial configurado.
export async function reiniciarPremio(id) {
  const ref = doc(db, "premios", id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const stockInicial = snap.data().stockInicial || 0;
    tx.update(ref, { stockActual: stockInicial, entregados: 0 });
  });
}

// Descuenta stock de forma segura (soporta varios dispositivos girando
// al mismo tiempo sin pisarse). Devuelve true si había stock, false si no.
export async function descontarStock(id) {
  const ref = doc(db, "premios", id);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("sin-premio");
      const data = snap.data();
      if ((data.stockActual || 0) <= 0) throw new Error("sin-stock");
      tx.update(ref, {
        stockActual: data.stockActual - 1,
        entregados: (data.entregados || 0) + 1,
      });
    });
    return true;
  } catch (e) {
    return false;
  }
}
