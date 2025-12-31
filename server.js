const express = require('express');
const path = require('path');
const app = express();

/**
 * Cloud Run inyecta el puerto dinámicamente en la variable de entorno PORT.
 * Es obligatorio usarla para que el despliegue sea exitoso.
 */
const port = process.env.PORT || 8080;

// 1. Endpoint de salud (Health Check) - Requerido por balanceadores de carga
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

/**
 * 2. Configuración de archivos estáticos.
 * Servimos los .tsx como texto plano para que el navegador los reciba
 * y Babel Standalone pueda compilarlos.
 */
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'text/plain');
    }
  }
}));

// 3. Soporte para SPA (Single Page Application)
// Redirige cualquier ruta no encontrada al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * 4. Arranque del Servidor.
 * DEBE escuchar en '0.0.0.0' para que Cloud Run pueda enrutar el tráfico.
 */
app.listen(port, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 Evolution Beauty Center - ONLINE`);
  console.log(`🌍 Host: 0.0.0.0`);
  console.log(`🔌 Puerto: ${port}`);
  console.log(`✅ Salud: http://localhost:${port}/health`);
  console.log(`==================================================`);
});
