-- ============================================================================
-- MYSQL SETUP 08 - SISTEMA DE 3 ETAPAS CON FOTOS
-- ============================================================================
-- Archivo: mysql-setup-08-project-stages.sql
-- Propósito: Agregar campos para fotos de progreso en 3 etapas
-- Requiere: mysql-setup-07-worker-features.sql ejecutado
-- ============================================================================

-- Agregar columnas para las 3 fotos de etapas
ALTER TABLE active_projects
ADD COLUMN IF NOT EXISTS stage_1_photo LONGTEXT NULL COMMENT 'Foto Etapa 1: Iniciado (Base64)',
ADD COLUMN IF NOT EXISTS stage_1_uploaded_at TIMESTAMP NULL COMMENT 'Fecha de subida foto 1',
ADD COLUMN IF NOT EXISTS stage_2_photo LONGTEXT NULL COMMENT 'Foto Etapa 2: En Curso (Base64)',
ADD COLUMN IF NOT EXISTS stage_2_uploaded_at TIMESTAMP NULL COMMENT 'Fecha de subida foto 2',
ADD COLUMN IF NOT EXISTS stage_3_photo LONGTEXT NULL COMMENT 'Foto Etapa 3: Finalizado (Base64)',
ADD COLUMN IF NOT EXISTS stage_3_uploaded_at TIMESTAMP NULL COMMENT 'Fecha de subida foto 3';

-- Actualizar los estados para que coincidan con las 3 etapas
ALTER TABLE active_projects
MODIFY COLUMN status ENUM('assigned', 'started', 'in_progress', 'completed', 'cancelled', 'paid') DEFAULT 'assigned';

-- ============================================================================
-- TRIGGER PARA ACTUALIZAR PROGRESO AUTOMÁTICAMENTE
-- ============================================================================

DROP TRIGGER IF EXISTS auto_update_progress_on_photo_upload;

DELIMITER //
CREATE TRIGGER auto_update_progress_on_photo_upload
BEFORE UPDATE ON active_projects
FOR EACH ROW
BEGIN
  -- Si se sube foto 1, cambiar a 'started' y progreso 33%
  IF NEW.stage_1_photo IS NOT NULL AND OLD.stage_1_photo IS NULL THEN
    SET NEW.status = 'started';
    SET NEW.progress_percentage = 33;
    SET NEW.started_at = CURRENT_TIMESTAMP;
  END IF;

  -- Si se sube foto 2, cambiar a 'in_progress' y progreso 66%
  IF NEW.stage_2_photo IS NOT NULL AND OLD.stage_2_photo IS NULL THEN
    SET NEW.status = 'in_progress';
    SET NEW.progress_percentage = 66;
  END IF;

  -- Si se sube foto 3, cambiar a 'completed' y progreso 100%
  IF NEW.stage_3_photo IS NOT NULL AND OLD.stage_3_photo IS NULL THEN
    SET NEW.status = 'completed';
    SET NEW.progress_percentage = 100;
    SET NEW.completed_at = CURRENT_TIMESTAMP;
  END IF;
END//
DELIMITER ;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
SELECT '✅ SISTEMA DE 3 ETAPAS CONFIGURADO' as status;
SELECT '✅ Campos agregados a active_projects:' as info;
SELECT '  - stage_1_photo (Iniciado - 33%)' as stage1;
SELECT '  - stage_2_photo (En Curso - 66%)' as stage2;
SELECT '  - stage_3_photo (Finalizado - 100%)' as stage3;
SELECT '✅ Trigger automático creado para actualizar progreso' as trigger_info;

-- Mostrar estructura actualizada
DESCRIBE active_projects;
