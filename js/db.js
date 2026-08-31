// Punto único de acceso a datos para admin.js y ruleta.js.
//
// Si firebase-config.js todavía tiene las claves de ejemplo, usamos
// db-local.js (guarda en el navegador) para poder probar la app sin
// configurar nada. Apenas pongas tus claves reales de Firebase, esto
// cambia solo a db-firestore.js (sincroniza entre dispositivos).

import { firebaseConfig } from "./firebase-config.js";
export { archivoABase64 } from "./util.js";

export const modoLocal = firebaseConfig.apiKey === "TU_API_KEY";

const impl = await import(modoLocal ? "./db-local.js" : "./db-firestore.js");

export const watchPremios = impl.watchPremios;
export const addPremio = impl.addPremio;
export const updatePremio = impl.updatePremio;
export const eliminarPremio = impl.eliminarPremio;
export const reiniciarPremio = impl.reiniciarPremio;
export const descontarStock = impl.descontarStock;
