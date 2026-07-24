<template>
  <RouterView />
</template>

<style>
/* Estilos globales básicos */
:root {
  --primary: #667eea;
  --primary-dark: #5568d3;
  --secondary: #764ba2;
  --dark: #1a1a2e;
  --light: #f5f7fa;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--light);
  color: var(--dark);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  width: 100%;
}

/* Evita que imágenes o controles generen desborde horizontal en móviles. */
img { max-width: 100%; }
input, select, textarea, button { font: inherit; }

/* Las tablas preservan sus columnas en móvil; el contenedor permite deslizar
   horizontalmente en vez de comprimir o cortar datos operativos. */
.table-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
  scrollbar-color: var(--primary) #e2e8f0;
  scrollbar-width: thin;
}

.table-scroll:focus-visible {
  outline: 3px solid rgba(102, 126, 234, 0.35);
  outline-offset: 3px;
}

@media (max-width: 900px) {
  /* Se fuerza un ancho de tabla real para que el gesto horizontal se aplique
     al contenedor y no convierta filas en texto comprimido. */
  #app .table-scroll {
    display: block;
    overflow-x: auto;
    overflow-y: hidden;
  }

  #app .table-scroll .tabla-custom {
    width: 760px;
    min-width: 760px;
    table-layout: auto;
  }

  .table-scroll::after {
    content: 'Deslizá la tabla para ver más columnas →';
    display: block;
    width: max-content;
    color: #64748b;
    font-size: 0.8rem;
    padding: 8px 2px 2px;
  }
}
</style>
