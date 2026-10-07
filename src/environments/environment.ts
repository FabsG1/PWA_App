/**
 * ⚠️ CONFIGURACIÓN DE FIREBASE
 * --------------------------------------------------------------------------
 * Reemplaza los valores "TU_..." con los de tu proyecto:
 *   Firebase Console → ⚙️ Configuración del proyecto → General → Tus apps → Web (</>)
 *
 * vapidKey (para notificaciones push):
 *   Firebase Console → ⚙️ Configuración del proyecto → Cloud Messaging
 *   → Configuración web → Certificados push web → "Generar par de claves"
 *
 * Estos valores NO son secretos: identifican tu proyecto en el navegador.
 * La seguridad real la dan las reglas de Firestore (firestore.rules).
 * Guía completa: FIREBASE_SETUP.md en la raíz del proyecto.
 */
export const environment = {
  firebase: {
    apiKey: "AIzaSyBDJprzwo0xX4jnrOsIq03GpreAAmvlJWo",
  authDomain: "thinkerlog-c3794.firebaseapp.com",
  projectId: "thinkerlog-c3794",
  storageBucket: "thinkerlog-c3794.firebasestorage.app",
  messagingSenderId: "220160034331",
  appId: "1:220160034331:web:7c38409bb6eb5585761abe"
  },
  vapidKey: 'BB5rApBmQ2oZ6CBCy88rv04FxkyaVWNhY7lP5UNa-bdzHtA_zua_ngTjVz3gnu_Djiu2aWixfOTRV3EIOonAUgo',
};