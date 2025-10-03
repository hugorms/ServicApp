// Script para limpiar puertos completamente
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('🧹 Limpiando puertos completamente...');

async function cleanupPorts() {
    const ports = [3000, 3001, 3700, 4000];

    for (const port of ports) {
        try {
            console.log(`🔍 Verificando puerto ${port}...`);

            // Método 1: kill-port
            try {
                await execAsync(`npx kill-port ${port}`);
                console.log(`✅ Puerto ${port} liberado con kill-port`);
            } catch (e) {
                console.log(`⚠️ Puerto ${port} ya estaba libre`);
            }

            // Método 2: Windows netstat + taskkill
            try {
                const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
                if (stdout.trim()) {
                    const lines = stdout.trim().split('\n');
                    const pids = new Set();

                    lines.forEach(line => {
                        const parts = line.trim().split(/\s+/);
                        const pid = parts[parts.length - 1];
                        if (pid && pid !== '0' && !isNaN(pid)) {
                            pids.add(pid);
                        }
                    });

                    for (const pid of pids) {
                        try {
                            await execAsync(`taskkill /F /PID ${pid}`);
                            console.log(`🗑️ Proceso PID ${pid} terminado (puerto ${port})`);
                        } catch (e) {
                            console.log(`⚠️ No se pudo terminar PID ${pid}`);
                        }
                    }
                }
            } catch (e) {
                // Puerto no está en uso
            }

        } catch (error) {
            console.log(`❌ Error limpiando puerto ${port}:`, error.message);
        }
    }

    // Esperar un momento para que los puertos se liberen
    console.log('⏳ Esperando 2 segundos para que los puertos se liberen...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar que estén libres
    console.log('🔍 Verificación final...');
    for (const port of ports) {
        try {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            if (stdout.trim()) {
                console.log(`⚠️ Puerto ${port} aún ocupado:`, stdout.trim());
            } else {
                console.log(`✅ Puerto ${port} libre`);
            }
        } catch (e) {
            console.log(`✅ Puerto ${port} libre`);
        }
    }

    console.log('🎉 Limpieza completada. Ahora puedes ejecutar npm start');
}

cleanupPorts().catch(console.error);