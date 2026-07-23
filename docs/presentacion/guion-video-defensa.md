# Guion de video y defensa — DVT Gestión Hotelera Inteligente

**Duración objetivo:** 18 a 22 minutos.  
**Modalidad:** cámara web encendida, presentación en pantalla y demostración sobre la instancia pública de Render.  
**Regla de oro:** realizar el recorrido con datos ficticios, nunca exhibir secretos, tokens, claves reales ni el panel de variables de entorno.

## Preparación previa (no grabar)

1. Verificar que Render muestra el último deploy de `main` como **Live**.
2. Abrir en pestañas separadas la página pública, la aplicación (`/app/login`) y la presentación PPTX.
3. Iniciar una sesión de administrador y dejar lista una cuenta de recepcionista para la demostración de permisos.
4. Tener una reserva de ejemplo con huésped, habitación y saldo pendiente. Si se va a crear durante el video, usar nombres ficticios.
5. Probar el audio, cámara y resolución de pantalla. Se recomienda 1280×720 o superior.
6. Abrir la aplicación unos minutos antes: en el plan gratuito Render puede tardar en activarse después de un período sin tráfico.

## Recorrido cronometrado

| Tiempo | Pantalla | Mensaje y demostración |
|---|---|---|
| 0:00–1:00 | Cámara + portada | Presentarse, indicar carrera, nombre del proyecto y objetivo de la exposición. Explicar que se presenta una solución web para la operación hotelera. |
| 1:00–2:30 | Diapositivas 2 y 3 | Describir el problema: información dispersa y dificultad para controlar disponibilidad, reservas, consumos y pagos. Mencionar alcance y límites: no es un sistema contable ni una pasarela de pago. |
| 2:30–4:00 | Diapositivas 4 a 6 | Explicar la separación entre sitio comercial estático y aplicación de gestión. Describir Vue/Vite en frontend, Node/Express en backend, Firebase Firestore como base y Render como hosting. |
| 4:00–5:00 | Página pública | Abrir la URL de Render. Mostrar la página comercial, navegar hasta el pie y usar el botón para volver arriba. Presionar **Ingresar** para pasar al login. |
| 5:00–6:30 | Login | Iniciar sesión con un usuario administrador. Explicar que la sesión usa autenticación con JWT y que las contraseñas se almacenan con hash bcrypt, no en texto plano. |
| 6:30–8:30 | Reservas | Mostrar la grilla, filtros y botón **Limpiar filtros**. Crear o abrir una reserva de ejemplo. Explicar validación de disponibilidad y prevención de solapamientos para una misma habitación y fechas. |
| 8:30–10:00 | Habitaciones y operativo | Mostrar estado de habitaciones y acciones operativas relevantes. Explicar cómo la información de reserva impacta la operación de recepción. |
| 10:00–12:30 | Consumos | Registrar un consumo de ejemplo con una categoría normalizada, por ejemplo gastronomía o lavandería. Mostrar que aparece de inmediato en el listado. Explicar diferencia entre `PENDIENTE_FACTURACION` y consumo incluido en cuenta. |
| 12:30–14:00 | Pagos | Incluir el consumo en la cuenta y abrir el módulo de pagos. Registrar un pago de ejemplo. Aclarar que **facturar/incluir en cuenta no significa cobrar**: el cobro se confirma desde Pagos y reduce el saldo. |
| 14:00–15:30 | Usuarios y roles | Mostrar el módulo de usuarios como administrador. Explicar matriz de permisos: el administrador gestiona usuarios y la recepción opera reservas, consumos y pagos. Si es posible, iniciar con recepcionista o indicar brevemente qué acciones quedan restringidas. |
| 15:30–17:00 | Recuperación de acceso | Mostrar la solicitud de clave temporal. Explicar el flujo: el usuario solicita, el administrador ve la alerta, establece una clave temporal y el usuario queda obligado a crear una nueva al iniciar. Aclarar que no se afirma envío automático de correo real. |
| 17:00–18:30 | Diapositivas 12 y 13 | Mostrar brevemente repositorio, `render.yaml`, variables de entorno sin valores y archivo de datos ficticios. Explicar que el proyecto puede reproducirse sin versionar credenciales. |
| 18:30–20:00 | Diapositivas 14 y 15 | Presentar resultados, limitaciones y próximos pasos. Cerrar retomando el objetivo: centralizar la operación hotelera con una aplicación desplegada y control de roles. |

## Frases técnicas sugeridas

- “La aplicación se despliega como un único Web Service: Express sirve la API y también el frontend compilado.”
- “Las credenciales de Firebase y el secreto JWT se administran como variables de entorno en Render; no se almacenan en el repositorio.”
- “La recuperación de acceso es un flujo interno controlado por administración; genera una solicitud y una clave temporal, no simula un correo electrónico.”
- “Un consumo pendiente todavía no es un pago. Se incorpora a la cuenta y luego se registra el cobro para actualizar el saldo.”
- “El repositorio incluye datos ficticios de ejemplo y un comando de carga explícito, que no sobreescribe datos existentes.”

## Preguntas probables del jurado

### ¿Por qué Render?

Porque permite desplegar el backend Node, servir el frontend compilado y administrar variables de entorno en un mismo servicio. Para esta etapa académica se utilizó su plan gratuito; la contrapartida es la demora de activación por inactividad.

### ¿Por qué Firebase Firestore?

Es una base de datos administrada que reduce tareas de infraestructura y se integra con el SDK del proyecto. La aplicación mantiene colecciones separadas para usuarios, huéspedes, habitaciones, reservas, consumos, pagos, disponibilidades y solicitudes de recuperación.

### ¿Cómo se protege una contraseña?

El backend aplica bcrypt antes de guardar o actualizar una contraseña. En el login se compara el hash y, si es válido, se genera un JWT para las solicitudes autenticadas.

### ¿Cómo se evita que dos reservas ocupen la misma habitación?

Al crear o modificar una reserva se valida el rango de fechas y la disponibilidad de la habitación; los rangos solapados se rechazan antes de confirmar la operación.

### ¿Qué sucede si Render se “duerme”?

No se pierde información ni se cae el servicio de manera definitiva. El primer acceso después de inactividad puede demorar mientras Render inicia nuevamente la instancia. Por eso se debe abrir la URL antes de la defensa.

### ¿Qué prueba que el proyecto es reproducible?

El repositorio contiene instrucciones, `.env.example`, `render.yaml`, datos ficticios versionables y el script `npm run db:seed -- --apply`. Las credenciales reales se configuran externamente como variables de entorno.

## Cierre recomendado

“DVT Gestión Hotelera Inteligente propone una solución web operativa para centralizar reservas, huéspedes, habitaciones, consumos y pagos. El proyecto integra una interfaz pública y una aplicación interna con roles, controles de seguridad y despliegue en Render. Como continuidad, se podrían incorporar reportes avanzados, notificaciones por correo reales y una pasarela de pagos, manteniendo la misma arquitectura base.”
