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

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--light);
  color: var(--dark);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}
</style>