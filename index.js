import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
import usersRoutes from './src/routes/user.routes.js';
import huespedesRoutes from "./src/huespedes/huespedes.routes.js";


const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, 'DVT-SoftwareHotelero', 'dist');
const landingPath = path.join(__dirname, 'public');

// Lista blanca de origenes para CORS. Si no se configura, se permite el uso local
// para no bloquear el entorno de desarrollo.
const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

// Middlewares globales
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origen no permitido por CORS"));
    },
}));
app.use(bodyParser.json());

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'DVT Software de Gestion Hotelera',
        timestamp: new Date().toISOString(),
    });
});

// Cada modulo mantiene sus propias rutas, controladores y reglas de permisos.
// El archivo principal solo orquesta middlewares globales y monta los endpoints.

// --------------------------------------
// RUTAS PÚBLICAS (sin token)
// --------------------------------------
app.use('/api/auth', authRoutes);

// Usuarios internos - requiere ADMIN
app.use('/api/users', usersRoutes);

// --------------------------------------
// RUTAS PRIVADAS (requieren token)
// --------------------------------------

app.use('/api/habitaciones', authMiddleware, habitacionesRoutes);

app.use("/api/reservas", authMiddleware, reservasRoutes);
app.use("/api/huespedes", huespedesRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/consumos", consumosRoutes);
app.use("/api/disponibilidades", disponibilidadesRoutes);

// La app interna se publica bajo /app. La página principal permanece como
// landing comercial estática y dirige al usuario hacia /app/login.
app.use('/app', express.static(frontendDistPath));
app.get(['/app', '/app/{*splat}'], (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.use(express.static(landingPath));
// --------------------------------------
// MANEJO DE ERRORES
// --------------------------------------
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`[SERVER] Servidor corriendo en http://localhost:${PORT}`);
});
