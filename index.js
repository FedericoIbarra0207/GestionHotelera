import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Cargar variables de entorno lo antes posible
dotenv.config();

// Importar middlewares de error
import { notFoundMiddleware, errorHandlerMiddleware } from './src/middlewares/error.middleware.js'; 

// Importar la conexión a Firebase Admin SDK
import './src/config/firebase.config.js';

// Middlewares para autenticación y roles
import { authMiddleware } from './src/middlewares/auth.middleware.js';

// Importar rutas
import authRoutes from './src/routes/auth.routes.js';
import habitacionesRoutes from './src/habitaciones/habitaciones.routes.js';
import reservasRoutes from "./src/reservas/reservas.routes.js";
import consumosRoutes from "./src/consumos/consumos.routes.js";
import pagosRoutes from "./src/pagos/pagos.routes.js";
import disponibilidadesRoutes from "./src/disponibilidades/disponibilidades.routes.js";


const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(bodyParser.json());

// --------------------------------------
// RUTAS PÚBLICAS (sin token)
// --------------------------------------
app.use('/api/auth', authRoutes);

// --------------------------------------
// RUTAS PRIVADAS (requieren token)
// --------------------------------------

app.use('/api/habitaciones', authMiddleware, habitacionesRoutes);

app.use("/api/reservas", authMiddleware, reservasRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/consumos", consumosRoutes);
app.use("/api/disponibilidades", disponibilidadesRoutes);
// --------------------------------------
// MANEJO DE ERRORES
// --------------------------------------
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`[SERVER] Servidor corriendo en http://localhost:${PORT}`);
});
