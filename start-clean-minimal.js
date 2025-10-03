// Configuración optimizada para stack MySQL + React
process.env.NODE_ENV = 'development';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.REACT_APP_VERBOSE = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';

// Backup de métodos originales de consola
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info
};

// Suprimir warnings de proceso (mejorado de start-clean.js)
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, type, code) => {
  const suppressedCodes = [
    'DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE',
    'DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE',
    'DEP0040', // Buffer constructor deprecated
    'DEP0005'  // Buffer() is deprecated
  ];

  if (suppressedCodes.includes(code)) {
    return;
  }
  originalEmitWarning.call(process, warning, type, code);
};

// Override console methods para filtrar logs
console.log = (...args) => {
  const message = args.join(' ');
  
  // Solo mostrar logs que contengan estos prefijos importantes
  const allowedPrefixes = ['🚀', '🟢', '🔴', '💬', '⚠️', '❌', '✅', '🔄', '🏠', '🚪', '👤'];
  const isImportant = allowedPrefixes.some(prefix => message.includes(prefix));
  
  // Filtros específicos para suprimir (mejorados)
  const suppressed = [
    'webpack compiled',
    'asset size limit',
    'entrypoint size limit',
    'PostToolUse',
    'Hook cancelled',
    'compiled successfully',
    'starting the development server',
    'Hot Module Replacement',
    'webpack performance recommendations',
    'React Router Future Flag Warning'
  ];
  
  const shouldSuppress = suppressed.some(term => message.includes(term));
  
  if (isImportant && !shouldSuppress) {
    originalConsole.log.apply(console, args);
  } else if (!shouldSuppress && (message.includes('Error') || message.includes('error'))) {
    // Siempre mostrar errores reales
    originalConsole.log.apply(console, args);
  }
};

console.warn = (...args) => {
  const message = args.join(' ');

  // Solo mostrar warnings críticos (actualizado para MySQL)
  const criticalWarnings = ['EADDRINUSE', 'ENOTFOUND', 'ECONNREFUSED', 'Database', 'MySQL', 'XAMPP', 'localhost'];
  const isCritical = criticalWarnings.some(warning => message.includes(warning));

  // Warnings adicionales que siempre queremos ver
  const importantWarnings = ['Error', 'Failed', 'Cannot'];
  const isImportant = importantWarnings.some(warning => message.includes(warning));

  if (isCritical || isImportant) {
    originalConsole.warn.apply(console, args);
  }
};

// Suprimir warnings de proceso
process.emitWarning = () => {};

console.log('🚀 Iniciando ServicApp con configuración optimizada...');
console.log('📊 Stack: React + MySQL (XAMPP) + Socket.IO');

// Función para verificar MySQL API
function checkMySQLAPI() {
  console.log('🔍 Verificando MySQL API...');

  // Verificar si MySQL API está corriendo
  fetch('http://localhost:3009/api/test')
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        console.log('✅ MySQL API funcionando correctamente');
      }
    })
    .catch(() => {
      console.log('⚠️ Esperando MySQL API en puerto 3009...');
    });
}

// Manejo de terminación de proceso (del start-clean.js)
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando aplicación...');
  console.log('👋 ¡Hasta luego!');
  process.exit(0);
});

// Verificar MySQL API (Socket.IO ya se inicia con concurrently)
setTimeout(() => {
  checkMySQLAPI();
}, 2000);

// Start React con configuración limpia
console.log('⚛️ Iniciando React...');
require('react-scripts/scripts/start');