// index.js

// 1. Importar dependencias
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { notFoundMiddleware } from './src/middlewares/error.middleware.js'; // Lo crearemos en la siguiente fase

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

// 5. Inicializar Servidor
app.listen(PORT, () => {
    console.log(`[SERVER] Servidor corriendo en http://localhost:${PORT}`);
});
