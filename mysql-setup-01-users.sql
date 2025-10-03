-- ============================================================================
-- MYSQL PARTE 1: TABLA DE USUARIOS
-- ============================================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS servicios_app;
USE servicios_app;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  user_type ENUM('contractor', 'worker') NOT NULL,

  -- Campos para trabajadores
  profession VARCHAR(255),
  professions JSON DEFAULT NULL COMMENT 'Array de profesiones [{profession, specialties, custom_specialty}]',
  specialties LONGTEXT,
  identity_card VARCHAR(50),
  experience_years INT,
  description TEXT,
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_ratings INT DEFAULT 0,

  -- Campos para contratistas
  company_name VARCHAR(255),
  company_type VARCHAR(255),
  company_description TEXT,

  -- Campos de ubicación detallada
  location_urbanization VARCHAR(255),
  location_condominium VARCHAR(255),
  location_apartment_floor INT,
  location_apartment_number VARCHAR(20),
  location_house_number VARCHAR(20),
  location_quinta_number VARCHAR(20),

  -- Configuración de notificaciones
  notification_preferences LONGTEXT DEFAULT ('{"email": true, "push": true, "sms": false, "new_applications": true, "job_updates": true, "messages": true}'),

  -- URLs de archivos
  profile_photo_url LONGTEXT,
  identity_card_url LONGTEXT,
  portfolio_urls LONGTEXT,
  company_logo_url LONGTEXT,
  business_license_url LONGTEXT,
  id_scan_front_url LONGTEXT,
  id_scan_back_url LONGTEXT,
  facial_scan_url LONGTEXT,

  -- Estado del perfil
  profile_completed TINYINT(1) DEFAULT 0 COMMENT 'Indica si el usuario completó su perfil (0=no, 1=sí)',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Índices
  INDEX idx_users_email (email),
  INDEX idx_users_user_type (user_type),
  INDEX idx_users_rating (rating DESC),
  INDEX idx_users_location (location_urbanization),
  INDEX idx_users_company (company_name)
);

SELECT 'PARTE 1 COMPLETADA: Tabla users creada con índices' AS status;