-- ============================================================================
-- MYSQL PARTE 3: NOTIFICACIONES E HISTORIAL
-- ============================================================================

USE servicios_app;

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  -- Contenido de la notificación
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',

  -- Referencias opcionales
  post_id INT,
  application_id INT,

  -- Estado
  read_at TIMESTAMP NULL,

  -- Metadatos
  metadata LONGTEXT DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
  FOREIGN KEY (application_id) REFERENCES post_applications(id) ON DELETE SET NULL,

  -- Índices
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (read_at),
  INDEX idx_notifications_created (created_at DESC),
  INDEX idx_notifications_type (type)
);

-- Crear tabla de historial de trabajo
CREATE TABLE IF NOT EXISTS work_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,
  contractor_id INT NOT NULL,
  post_id INT,

  -- Detalles del trabajo
  title VARCHAR(255) NOT NULL,
  description TEXT,
  specialty VARCHAR(255) NOT NULL,

  -- Fechas
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NULL,

  -- Resultados
  final_cost DECIMAL(10,2),
  hours_worked INT,

  -- Estado
  status ENUM('completed', 'cancelled', 'disputed') DEFAULT 'completed',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,

  -- Índices
  INDEX idx_work_history_worker (worker_id),
  INDEX idx_work_history_contractor (contractor_id),
  INDEX idx_work_history_status (status),
  INDEX idx_work_history_completed (completed_at DESC)
);

-- Crear tabla de calificaciones
CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_history_id INT NOT NULL,

  -- Quién califica a quién
  from_user_id INT NOT NULL,
  to_user_id INT NOT NULL,

  -- Calificación
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Aspectos específicos (para trabajadores)
  punctuality_rating INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (work_history_id) REFERENCES work_history(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Evitar calificaciones duplicadas
  UNIQUE KEY unique_rating (work_history_id, from_user_id, to_user_id),

  -- Índices
  INDEX idx_ratings_work_history (work_history_id),
  INDEX idx_ratings_to_user (to_user_id),
  INDEX idx_ratings_from_user (from_user_id)
);

SELECT 'PARTE 3 COMPLETADA: Tablas notifications, work_history, ratings creadas' AS status;