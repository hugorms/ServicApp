-- ============================================================================
-- MYSQL SETUP 07 - CARACTERÍSTICAS AVANZADAS DEL SISTEMA DE TRABAJADORES
-- ============================================================================
-- Archivo: mysql-setup-07-worker-features.sql
-- Propósito: Tablas y funciones para WorkerProfileModal avanzado
-- Requiere: mysql-setup-01-users.sql y mysql-setup-02-posts.sql ejecutados
-- ============================================================================

-- ============================================================================
-- TABLA 1: REVIEWS/COMENTARIOS DE TRABAJADORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS worker_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,
  contractor_id INT NOT NULL,
  post_id INT NOT NULL,

  -- Detalles del review
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  comment TEXT,

  -- Ratings específicos
  punctuality_rating DECIMAL(2,1) CHECK (punctuality_rating >= 1.0 AND punctuality_rating <= 5.0),
  quality_rating DECIMAL(2,1) CHECK (quality_rating >= 1.0 AND quality_rating <= 5.0),
  price_rating DECIMAL(2,1) CHECK (price_rating >= 1.0 AND price_rating <= 5.0),
  communication_rating DECIMAL(2,1) CHECK (communication_rating >= 1.0 AND communication_rating <= 5.0),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Foreign keys
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,

  -- Evitar reviews duplicados
  UNIQUE KEY unique_review (worker_id, contractor_id, post_id),

  -- Índices
  INDEX idx_worker_reviews (worker_id),
  INDEX idx_contractor_reviews (contractor_id),
  INDEX idx_featured_reviews (worker_id, is_featured),
  INDEX idx_recent_reviews (worker_id, created_at DESC)
);

-- ============================================================================
-- TABLA 2: PORTFOLIO DE TRABAJADORES (Fotos de trabajos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS worker_portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,

  -- Detalles de la foto
  title VARCHAR(200),
  description TEXT,
  image_url LONGTEXT NOT NULL, -- Para imágenes Base64

  -- Clasificación
  category VARCHAR(100), -- 'before', 'after', 'during', 'tools', 'certificate'
  specialty VARCHAR(100), -- 'Plomería', 'Electricidad', etc.

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_featured BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 0,

  -- Relacionar con trabajos
  related_post_id INT NULL,

  -- Foreign keys
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_post_id) REFERENCES posts(id) ON DELETE SET NULL,

  -- Índices
  INDEX idx_worker_portfolio (worker_id),
  INDEX idx_featured_portfolio (worker_id, is_featured),
  INDEX idx_category_portfolio (worker_id, category),
  INDEX idx_order_portfolio (worker_id, order_index)
);

-- ============================================================================
-- TABLA 3: FAVORITOS DE CONTRATISTAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS contractor_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  worker_id INT NOT NULL,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT, -- Notas privadas del contratista

  -- Foreign keys
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Evitar duplicados
  UNIQUE KEY unique_favorite (contractor_id, worker_id),

  -- Índices
  INDEX idx_contractor_favorites (contractor_id),
  INDEX idx_worker_favorited (worker_id)
);

-- ============================================================================
-- TABLA 4: HISTORIAL DE COLABORACIONES
-- ============================================================================
CREATE TABLE IF NOT EXISTS collaboration_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  worker_id INT NOT NULL,
  post_id INT NOT NULL,

  -- Detalles de la colaboración
  start_date DATE,
  end_date DATE,
  final_cost DECIMAL(10,2),

  -- Estado del proyecto
  status ENUM('completed', 'cancelled', 'in_progress') DEFAULT 'completed',

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,

  -- Índices
  INDEX idx_contractor_history (contractor_id),
  INDEX idx_worker_history (worker_id),
  INDEX idx_collaboration_pair (contractor_id, worker_id)
);

-- ============================================================================
-- TABLA 5: MÉTRICAS AVANZADAS DE TRABAJADORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS worker_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,

  -- Métricas de tiempo
  average_response_time_hours DECIMAL(5,2) DEFAULT 0,
  average_completion_time_days DECIMAL(5,2) DEFAULT 0,

  -- Métricas de calidad
  success_rate DECIMAL(5,2) DEFAULT 100.0,
  repeat_customer_rate DECIMAL(5,2) DEFAULT 0,
  on_time_completion_rate DECIMAL(5,2) DEFAULT 100.0,

  -- Contadores
  total_jobs_completed INT DEFAULT 0,
  total_jobs_cancelled INT DEFAULT 0,
  jobs_last_30_days INT DEFAULT 0,
  jobs_last_7_days INT DEFAULT 0,

  -- Earnings
  total_earnings DECIMAL(12,2) DEFAULT 0,
  average_job_value DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Solo un registro por trabajador
  UNIQUE KEY unique_worker_metrics (worker_id),

  -- Índices
  INDEX idx_top_workers (success_rate DESC, total_jobs_completed DESC),
  INDEX idx_active_workers (jobs_last_30_days DESC)
);

-- ============================================================================
-- TRIGGERS PARA AUTOMATIZAR MÉTRICAS
-- ============================================================================

-- Eliminar trigger si existe y crear uno nuevo
DROP TRIGGER IF EXISTS update_worker_metrics_on_completion;

DELIMITER //
CREATE TRIGGER update_worker_metrics_on_completion
AFTER UPDATE ON post_applications
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Actualizar contador de trabajos completados
    INSERT INTO worker_metrics (worker_id, total_jobs_completed, jobs_last_30_days, jobs_last_7_days)
    VALUES (NEW.worker_id, 1, 1, 1)
    ON DUPLICATE KEY UPDATE
      total_jobs_completed = total_jobs_completed + 1,
      jobs_last_30_days = (
        SELECT COUNT(*) FROM post_applications
        WHERE worker_id = NEW.worker_id
        AND status = 'completed'
        AND applied_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ),
      jobs_last_7_days = (
        SELECT COUNT(*) FROM post_applications
        WHERE worker_id = NEW.worker_id
        AND status = 'completed'
        AND applied_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      );
  END IF;
END//
DELIMITER ;

-- ============================================================================
-- DATOS DE EJEMPLO PARA TESTING
-- ============================================================================

-- Insertar algunas reviews de ejemplo (solo si existen usuarios)
INSERT IGNORE INTO worker_reviews (worker_id, contractor_id, post_id, rating, comment, punctuality_rating, quality_rating, price_rating, communication_rating, is_featured)
SELECT
  u1.id as worker_id,
  u2.id as contractor_id,
  1 as post_id,
  4.5 as rating,
  'Excelente trabajo, muy profesional y puntual.' as comment,
  5.0 as punctuality_rating,
  4.5 as quality_rating,
  4.0 as price_rating,
  5.0 as communication_rating,
  true as is_featured
FROM users u1
CROSS JOIN users u2
WHERE u1.user_type = 'worker'
AND u2.user_type = 'contractor'
AND u1.id != u2.id
LIMIT 3;

-- Insertar disponibilidad por defecto para trabajadores (estructura existente)
INSERT IGNORE INTO worker_availability (worker_id, day_of_week, start_time, end_time, is_available)
SELECT
  u.id as worker_id,
  1 as day_of_week,
  '08:00:00' as start_time,
  '18:00:00' as end_time,
  1 as is_available
FROM users u
WHERE u.user_type = 'worker'
AND NOT EXISTS (
  SELECT 1 FROM worker_availability wa
  WHERE wa.worker_id = u.id AND wa.day_of_week = 1
);

INSERT IGNORE INTO worker_availability (worker_id, day_of_week, start_time, end_time, is_available)
SELECT
  u.id as worker_id,
  2 as day_of_week,
  '08:00:00' as start_time,
  '18:00:00' as end_time,
  1 as is_available
FROM users u
WHERE u.user_type = 'worker'
AND NOT EXISTS (
  SELECT 1 FROM worker_availability wa
  WHERE wa.worker_id = u.id AND wa.day_of_week = 2
);

INSERT IGNORE INTO worker_availability (worker_id, day_of_week, start_time, end_time, is_available)
SELECT
  u.id as worker_id,
  5 as day_of_week,
  '08:00:00' as start_time,
  '18:00:00' as end_time,
  1 as is_available
FROM users u
WHERE u.user_type = 'worker'
AND NOT EXISTS (
  SELECT 1 FROM worker_availability wa
  WHERE wa.worker_id = u.id AND wa.day_of_week = 5
);

-- Insertar métricas por defecto para trabajadores
INSERT IGNORE INTO worker_metrics (worker_id, average_response_time_hours, success_rate)
SELECT
  id as worker_id,
  ROUND(1 + (RAND() * 3), 1) as average_response_time_hours,
  ROUND(85 + (RAND() * 15), 1) as success_rate
FROM users
WHERE user_type = 'worker';

-- ============================================================================
-- TABLA 6: PROYECTOS ACTIVOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS active_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  contractor_id INT NOT NULL,
  worker_id INT NOT NULL,
  application_id INT NOT NULL,

  -- Detalles del proyecto
  title VARCHAR(255) NOT NULL,
  description TEXT,
  specialty VARCHAR(100),
  location TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),

  -- Estado del proyecto
  status ENUM('assigned', 'started', 'in_progress', 'completed', 'paid') DEFAULT 'assigned',
  progress_percentage INT DEFAULT 0,

  -- Timestamps importantes
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  paid_at TIMESTAMP NULL,

  -- Notas y observaciones
  worker_notes TEXT,
  contractor_notes TEXT,
  final_amount DECIMAL(10,2),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES post_applications(id) ON DELETE CASCADE,

  -- Índices
  INDEX idx_active_post (post_id),
  INDEX idx_active_contractor (contractor_id),
  INDEX idx_active_worker (worker_id),
  INDEX idx_active_application (application_id),
  INDEX idx_active_status (status)
);

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
SELECT 'WORKER FEATURES SETUP COMPLETADO - Archivo 07' as status;
SELECT 'Tablas creadas:' as info;
SELECT '✅ worker_reviews - Sistema de reviews y calificaciones' as table1;
SELECT '✅ worker_portfolio - Portfolio de fotos de trabajos' as table2;
SELECT '✅ contractor_favorites - Sistema de favoritos' as table3;
SELECT '✅ collaboration_history - Historial de colaboraciones' as table4;
SELECT '✅ worker_metrics - Métricas avanzadas automatizadas' as table5;
SELECT '✅ active_projects - Proyectos activos en progreso' as table6;

-- Mostrar conteo de registros
SELECT
  (SELECT COUNT(*) FROM worker_reviews) as reviews_count,
  (SELECT COUNT(*) FROM worker_portfolio) as portfolio_count,
  (SELECT COUNT(*) FROM worker_availability) as availability_count,
  (SELECT COUNT(*) FROM contractor_favorites) as favorites_count,
  (SELECT COUNT(*) FROM collaboration_history) as history_count,
  (SELECT COUNT(*) FROM worker_metrics) as metrics_count;