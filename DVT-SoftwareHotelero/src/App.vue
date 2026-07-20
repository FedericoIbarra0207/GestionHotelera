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
</style>
