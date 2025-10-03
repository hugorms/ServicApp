// Start script más seguro para evitar conflictos de puerto
process.env.NODE_ENV = 'development';
process.env.GENERATE_SOURCEMAP = 'false';

console.log('🚀 Iniciando ServicApp de forma segura...');

// Función para verificar si un puerto está disponible
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();

    server.listen(port, (err) => {
      if (err) {
        server.close();
        resolve(false);
      } else {
        server.close();
        resolve(true);
      }
    });

    server.on('error', () => {
      resolve(false);
    });
  });
}

async function startApp() {
  try {
    // Verificar puertos antes de iniciar
    const port3000Available = await checkPortAvailable(3000);
    const port3700Available = await checkPortAvailable(3700);

    if (!port3000Available) {
      console.log('❌ Puerto 3000 ocupado. Ejecuta: node cleanup-ports.js');
      process.exit(1);
    }

    if (!port3700Available) {
      console.log('❌ Puerto 3700 ocupado. Ejecuta: node cleanup-ports.js');
      process.exit(1);
    }

    console.log('✅ Puertos disponibles, iniciando aplicación...');

    // Verificar XAMPP
    console.log('🔍 Verificando XAMPP...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost/api/query/select.php?table=users&limit=1');
      const data = await response.json();
      if (data.success !== undefined) {
        console.log('✅ XAMPP MySQL funcionando correctamente');
      }
    } catch (e) {
      console.log('⚠️ XAMPP no disponible - funcionalidades limitadas');
    }

    // Iniciar Socket.IO
    try {
      const SocketServer = require('./server/socketServer');
      const socketServer = new SocketServer();
      await socketServer.start();
      console.log('✅ Socket.IO iniciado correctamente');
    } catch (error) {
      console.log('⚠️ Socket.IO no disponible:', error.message);
    }

    // Iniciar React
    console.log('⚛️ Iniciando React...');
    require('react-scripts/scripts/start');

  } catch (error) {
    console.log('❌ Error iniciando aplicación:', error.message);
    process.exit(1);
  }
}

startApp();