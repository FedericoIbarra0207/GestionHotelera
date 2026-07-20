# Módulo de recuperación de credenciales

## Objetivo
Permitir recuperar el acceso de personal interno sin depender de correo externo ni exponer contraseñas.

## Flujo
1. El recepcionista registra una solicitud desde `Olvidé mi contraseña`.
2. Un ADMIN verifica la identidad por un canal institucional.
3. El ADMIN asigna una contraseña temporal desde el módulo de usuarios.
4. El sistema marca `mustChangePassword=true`.
5. Al ingresar, el usuario sólo puede acceder a `Cambiar contraseña` hasta reemplazarla.

## Seguridad y tecnologías
- **Firestore** registra solicitudes, estado y auditoría; nunca guarda claves temporales.
- **bcryptjs** guarda únicamente hashes de contraseñas.
- **JWT** identifica la sesión que confirma el cambio de clave.
- **Express** separa rutas públicas de solicitudes y rutas protegidas de cambio.
- **Vue** aplica el bloqueo de navegación mientras el cambio sea obligatorio.

La contraseña temporal se entrega por un canal verificado y no se almacena en texto plano.
