// ============================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================
// Proyecto: https://console.firebase.google.com/project/ruleta-castrol
// Firestore (base de datos "premios") en la región southamerica-west1 (Santiago).
//
// Este archivo se sube al repo SOLO con valores de ejemplo. Al publicar en
// GitHub Pages, el workflow .github/workflows/deploy.yml genera la versión
// real de este archivo a partir de los Secrets del repositorio (Settings >
// Secrets and variables > Actions), así la clave real nunca queda commiteada.
//
// Para desarrollo local, reemplazá los valores de abajo por los reales
// (los mismos que están cargados como Secrets) o dejalos así para probar
// en modo local (localStorage, sin sincronizar entre dispositivos).
// ============================================================

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID",
};
