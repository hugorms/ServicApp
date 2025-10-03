-- ============================================================================
-- MYSQL PARTE 2: POSTS Y APLICACIONES
-- ============================================================================

USE servicios_app;

-- Crear tabla de publicaciones
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  specialty VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  municipality VARCHAR(100),
  parish VARCHAR(100),
  sector VARCHAR(100),
  property_type VARCHAR(50),
  specific_address TEXT,
  reference_info TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  contact_phone VARCHAR(20),
  urgency ENUM('low', 'medium', 'high', 'urgent') NOT NULL,

  -- Precios
  price VARCHAR(100),
  estimated_hours INT,

  -- Estado del trabajo
  status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Índices
  INDEX idx_posts_contractor (contractor_id),
  INDEX idx_posts_specialty (specialty),
  INDEX idx_posts_status (status),
  INDEX idx_posts_urgency (urgency),
  INDEX idx_posts_created (created_at DESC)
);

-- Crear tabla de aplicaciones a trabajos
CREATE TABLE IF NOT EXISTS post_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  worker_id INT NOT NULL,

  -- Datos de la aplicación
  message TEXT,
  proposed_cost DECIMAL(10,2),
  estimated_completion_time INT,

  -- Estado de la aplicación
  status ENUM('pending', 'accepted', 'rejected', 'withdrawn') DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Evitar aplicaciones duplicadas
  UNIQUE KEY unique_application (post_id, worker_id),

  -- Índices
  INDEX idx_applications_post (post_id),
  INDEX idx_applications_worker (worker_id),
  INDEX idx_applications_status (status),
  INDEX idx_applications_applied (applied_at DESC)
);

-- Crear tabla de imágenes de posts
CREATE TABLE IF NOT EXISTS post_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  image_url LONGTEXT NOT NULL,  -- CAMBIADO: LONGTEXT para soportar imágenes Base64 grandes
  description VARCHAR(255),
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,

  -- Índice
  INDEX idx_post_images_post (post_id)
);

-- ============================================================================
-- FIX PARA TABLAS EXISTENTES: Modificar columna image_url para soportar Base64
-- ============================================================================

-- Si la tabla post_images ya existe, modificar la columna image_url
ALTER TABLE post_images MODIFY COLUMN image_url LONGTEXT NOT NULL;

SELECT 'PARTE 2 COMPLETADA: Tablas posts, post_applications, post_images creadas' AS status;
SELECT 'FIX APLICADO: Columna image_url modificada para soportar imágenes Base64 grandes' AS fix_status;