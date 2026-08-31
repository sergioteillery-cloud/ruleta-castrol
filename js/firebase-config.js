// ============================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================
// Reemplazá los valores de abajo por los que te da la consola
// de Firebase al crear tu proyecto (Configuración del proyecto
// > tus apps > SDK setup and configuration > Config).
//
// Pasos rápidos:
// 1. Entrá a https://console.firebase.google.com/
// 2. Creá un proyecto nuevo (ej: "ruleta-castrol")
// 3. En el menú lateral: Compilación > Firestore Database > Crear
//    base de datos (elegí modo "producción" y la región más cercana)
// 4. En Reglas de Firestore, pegá el contenido del archivo
//    firestore.rules (está en esta misma carpeta) y publicá.
// 5. En Configuración del proyecto (ícono de tuerca) > agregar app
//    Web (</>) > registrá la app > copiá el objeto firebaseConfig
//    y pegalo acá abajo, reemplazando el de ejemplo.
//
// Mientras esto tenga los valores de ejemplo ("TU_API_KEY"), la app
// funciona en modo local (guarda solo en este navegador) para que
// puedas probarla sin configurar nada.
// ============================================================

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID",
};
