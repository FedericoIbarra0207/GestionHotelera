// Importamos los módulos necesarios de Firebase Admin SDK
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar las credenciales JSON desde el sistema de archivos para evitar problemas
// con import assertions en algunas configuraciones de Node.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const credPath = path.resolve(__dirname, '../../firebase-credentials.json');
let serviceAccount = {};
try {
    serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
} catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[FIREBASE] No se pudo leer '${credPath}':`, err.message);
    throw err;
}

// Inicializar la aplicación de Firebase con las credenciales
const firebaseApp = initializeApp({
    credential: cert(serviceAccount)
});


// Obtener la instancia de Firestore
export const db = getFirestore(firebaseApp);

console.log('[FIRESTORE] Conexión a Firestore establecida.');
