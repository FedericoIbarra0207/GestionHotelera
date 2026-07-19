// Importamos los módulos necesarios de Firebase Admin SDK
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar credenciales desde variables de entorno en produccion o desde archivo local
// en desarrollo. Esto evita subir el JSON privado al proveedor de hosting.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const credPath = path.resolve(__dirname, '../../firebase-credentials.json');
let serviceAccount = {};
try {
    // Orden de prioridad:
    // 1. Base64 para hosting que no maneja JSON multilinea.
    // 2. JSON plano en variable de entorno.
    // 3. Archivo local para desarrollo.
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
        serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    }
} catch (err) {
    // eslint-disable-next-line no-console
    console.error('[FIREBASE] No se pudieron cargar las credenciales:', err.message);
    throw err;
}

// Inicializar la aplicación de Firebase con las credenciales
const firebaseApp = initializeApp({
    credential: cert(serviceAccount)
});


// Obtener la instancia de Firestore
export const db = getFirestore(firebaseApp);

console.log('[FIRESTORE] Conexión a Firestore establecida.');
