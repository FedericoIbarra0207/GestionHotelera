

// 1. Importar dependencias
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import './src/config/firebase.config.js'; // <-- IMPORTACIÓN DE FIREBASE PARA INICIALIZACIÓN
import { notFoundMiddleware, errorHandlerMiddleware } from './src/middlewares/error.middleware.js';
// ...
// 2. Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middlewares Globales
app.use(cors()); // Habilitar CORS [cite: 88]
app.use(bodyParser.json()); // Habilitar body-parser para JSON [cite: 88]

// (Aquí se agregarán las rutas más adelante)

// 4. Middleware para rutas no encontradas (404)
app.use(notFoundMiddleware); // Usar el middleware 404 [cite: 88]
app.use(errorHandlerMiddleware); // Middleware general de manejo de errores

// 5. Inicializar Servidor
app.listen(PORT, () => {
    console.log(`[SERVER] Servidor corriendo en http://localhost:${PORT}`);
});
