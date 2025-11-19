import { Router } from 'express';
import { loginUser } from '../controllers/auth.controller.js';
import { registerNewUser } from '../controllers/user.controller.js';

const router = Router();

// Requisito: Endpoint /auth/login que devuelve un token válido
router.post('/login', loginUser); 

// Ruta para registrar un nuevo usuario
router.post('/register', registerNewUser);

export default router;