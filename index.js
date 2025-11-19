import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
// Cargar variables de entorno lo antes posible
dotenv.config();

// Importamos los middlewares de error
import { notFoundMiddleware, errorHandlerMiddleware } from './src/middlewares/error.middleware.js'; 
import './src/config/firebase.config.js'; // Conexión a DB

// --- IMPORTAR RUTAS ---
import authRoutes from './src/routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globales
app.use(cors()); 
app.use(bodyParser.json()); 

// --- MONTAJE DE RUTAS ---
app.use('/api/auth', authRoutes); // Montar las rutas de autenticación
// app.use('/api/users', userRoutes); 
// app.use('/api/habitaciones', habitacionRoutes); 
// ------------------------

// --- MANEJO DE ERRORES ---
// 1. Middleware para rutas no encontradas (404)
app.use(notFoundMiddleware); 
// 2. Middleware GLOBAL de manejo de errores (500)
app.use(errorHandlerMiddleware);
// -------------------------

app.listen(PORT, () => {
    console.log(`[SERVER] Servidor corriendo en http://localhost:${PORT}`);
});
