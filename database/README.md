# Replicación de Firestore

`seed-data.example.json` contiene exclusivamente datos ficticios y representa las colecciones que utiliza la aplicación: `USUARIOS`, `HABITACIONES`, `HUESPEDES`, `RESERVAS`, `DISPONIBILIDADES`, `CONSUMOS_EXTRAS` y `PAGOS`. La disponibilidad diaria se genera desde la reserva de demostración.

El script de inicialización no sube ni descarga una base de producción. Para ejecutarlo, se requieren las credenciales de Firebase configuradas localmente como en la aplicación (`firebase-credentials.json` o las variables `FIREBASE_SERVICE_ACCOUNT_BASE64` / `FIREBASE_SERVICE_ACCOUNT_JSON`) y dos claves de demostración:

```powershell
$env:SEED_ADMIN_PASSWORD='UnaClaveSegura'
$env:SEED_RECEPTIONIST_PASSWORD='OtraClaveSegura'
npm run db:seed -- --apply
```

El argumento `--apply` es obligatorio. El proceso crea sólo documentos con el prefijo `demo-`, omite los que ya existen y no elimina ni reemplaza datos reales. Las cuentas creadas son `admin.demo@example.com` y `recepcion.demo@example.com`; ambas requieren cambiar la clave en su primer inicio de sesión.
