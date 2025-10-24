-- ========================================
-- MYSQL SETUP 09: POST LIFECYCLE SYSTEM
-- ========================================
-- Fecha: 21/10/2025
-- Descripción: Sistema completo de ciclo de vida para publicaciones
--              open → in_progress → completed
-- IMPORTANTE: Este archivo es para MySQL/MariaDB

-- ========================================
-- 1. AGREGAR CAMPOS A LA TABLA POSTS
-- ========================================

-- Agregar campo de estado (open, in_progress, completed)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';

-- Agregar campo para asignar trabajador
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS assigned_worker_id INT NULL;

-- Agregar campo para registrar fecha de finalización
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL;

-- ========================================
-- 2. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Índice para búsquedas por estado
CREATE INDEX idx_posts_status
ON posts(status);

-- Índice para buscar posts por trabajador asignado
CREATE INDEX idx_posts_assigned_worker
ON posts(assigned_worker_id);

-- ========================================
-- 3. ACTUALIZAR POSTS EXISTENTES
-- ========================================

-- Marcar todos los posts existentes sin estado como 'open'
UPDATE posts
SET status = 'open'
WHERE status IS NULL OR status = '';

-- ========================================
-- 4. VERIFICACIÓN DE INSTALACIÓN
-- ========================================

-- Verificar que los campos se agregaron correctamente
SELECT
    'Verificación de campos' AS check_name,
    CASE
        WHEN COUNT(*) = 3 THEN '✅ TODOS LOS CAMPOS CREADOS'
        ELSE '❌ FALTAN CAMPOS'
    END AS result
FROM information_schema.columns
WHERE table_schema = DATABASE()
AND table_name = 'posts'
AND column_name IN ('status', 'assigned_worker_id', 'completed_at');

-- Verificar índices
SELECT
    'Verificación de índices' AS check_name,
    CASE
        WHEN COUNT(*) >= 2 THEN '✅ ÍNDICES CREADOS'
        ELSE '⚠️ VERIFICAR ÍNDICES'
    END AS result
FROM information_schema.statistics
WHERE table_schema = DATABASE()
AND table_name = 'posts'
AND index_name IN ('idx_posts_status', 'idx_posts_assigned_worker');

-- Mostrar distribución de estados
SELECT
    'Distribución de estados' AS info,
    IFNULL(status, '(sin status)') AS status,
    COUNT(*) AS cantidad
FROM posts
GROUP BY status;

-- ========================================
-- NOTAS DE USO:
-- ========================================
-- Estados posibles:
--   'open'        → Post publicado, esperando aplicaciones
--   'in_progress' → Trabajador asignado, trabajo en curso
--   'completed'   → Trabajo finalizado y calificado
--
-- Flujo:
--   1. Contratista crea post → status = 'open'
--   2. Acepta aplicación → status = 'in_progress', assigned_worker_id = X
--   3. Califica trabajo → status = 'completed', completed_at = NOW()
--
-- ========================================
-- IMPORTANTE: Ejecutar línea por línea en phpMyAdmin
-- ========================================
-- Si obtienes errores, ejecuta este script en 4 pasos:
--
-- PASO 1: Agregar campos (copiar líneas 13-22)
-- PASO 2: Crear índices (copiar líneas 28-34)
-- PASO 3: Actualizar datos (copiar línea 40)
-- PASO 4: Verificar (copiar líneas 48-73)
-- ========================================
