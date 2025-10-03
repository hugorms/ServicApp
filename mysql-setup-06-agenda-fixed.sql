-- ============================================================================
-- MYSQL PARTE 6: SISTEMA DE AGENDA Y CITAS (VERSIÓN CORREGIDA)
-- ============================================================================

USE servicios_app;

-- Eliminar vistas existentes si existen
DROP VIEW IF EXISTS contractor_agenda_view;
DROP VIEW IF EXISTS worker_agenda_view;

-- Crear tabla de disponibilidad de trabajadores
CREATE TABLE IF NOT EXISTS worker_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,

  -- Configuración de disponibilidad
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,

  -- Fechas específicas (para excepciones)
  specific_date DATE, -- Si se especifica, overrides el day_of_week

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Evitar conflictos de horario
  CHECK (start_time < end_time),

  -- Índices
  INDEX idx_worker_availability_worker (worker_id),
  INDEX idx_worker_availability_day (day_of_week),
  INDEX idx_worker_availability_date (specific_date)
);

-- Crear tabla de citas/appointments
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Participantes
  contractor_id INT NOT NULL,
  worker_id INT NOT NULL,

  -- Detalles de la cita
  title VARCHAR(255) NOT NULL,
  description TEXT,
  service_type VARCHAR(255) NOT NULL,

  -- Información de tiempo
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  estimated_duration_hours DECIMAL(3,1) NOT NULL DEFAULT 1.0,

  -- Ubicación
  location_address TEXT NOT NULL,
  location_urbanization VARCHAR(255),
  location_reference TEXT,

  -- Información de contacto
  contact_phone VARCHAR(20),

  -- Detalles del servicio
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),

  -- Estado de la cita
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled') DEFAULT 'pending',

  -- Confirmaciones
  confirmed_by_contractor BOOLEAN DEFAULT FALSE,
  confirmed_by_worker BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP NULL,

  -- Referencias
  related_post_id INT,
  related_application_id INT,

  -- Notas y observaciones
  contractor_notes TEXT,
  worker_notes TEXT,
  completion_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_post_id) REFERENCES posts(id) ON DELETE SET NULL,
  FOREIGN KEY (related_application_id) REFERENCES post_applications(id) ON DELETE SET NULL,

  -- Constraints
  CHECK (estimated_duration_hours > 0),
  CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  CHECK (final_cost IS NULL OR final_cost >= 0),

  -- Índices
  INDEX idx_appointments_contractor (contractor_id),
  INDEX idx_appointments_worker (worker_id),
  INDEX idx_appointments_date (scheduled_date),
  INDEX idx_appointments_status (status),
  INDEX idx_appointments_post (related_post_id)
);

-- Crear tabla para reprogramaciones/reagendamientos
CREATE TABLE IF NOT EXISTS appointment_reschedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,

  -- Datos anteriores
  old_date DATE NOT NULL,
  old_time TIME NOT NULL,

  -- Nuevos datos
  new_date DATE NOT NULL,
  new_time TIME NOT NULL,

  -- Información del cambio
  requested_by INT NOT NULL,
  reason TEXT,

  -- Estado del reagendamiento
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  responded_by INT,
  responded_at TIMESTAMP NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Índice
  INDEX idx_reschedules_appointment (appointment_id)
);

-- Crear vista para agenda del trabajador
CREATE VIEW worker_agenda_view AS
SELECT
    a.id,
    a.title,
    a.description,
    a.service_type,
    a.scheduled_date,
    a.scheduled_time,
    a.estimated_duration_hours,
    a.location_address,
    a.location_urbanization,
    a.location_reference,
    a.contact_phone,
    a.estimated_cost,
    a.status,
    a.contractor_notes,
    a.worker_notes,

    -- Información del contratista
    u.name as contractor_name,
    u.phone as contractor_phone,
    u.email as contractor_email,

    -- Información del post relacionado
    p.title as post_title,
    p.urgency as post_urgency,

    -- Timestamps
    a.created_at,
    a.updated_at

FROM appointments a
JOIN users u ON u.id = a.contractor_id
LEFT JOIN posts p ON p.id = a.related_post_id
ORDER BY a.scheduled_date ASC, a.scheduled_time ASC;

-- Crear vista para agenda del contratista
CREATE VIEW contractor_agenda_view AS
SELECT
    a.id,
    a.title,
    a.description,
    a.service_type,
    a.scheduled_date,
    a.scheduled_time,
    a.estimated_duration_hours,
    a.location_address,
    a.estimated_cost,
    a.final_cost,
    a.status,
    a.contractor_notes,
    a.completion_notes,

    -- Información del trabajador
    u.name as worker_name,
    u.phone as worker_phone,
    u.profession as worker_profession,
    u.rating as worker_rating,

    -- Información del post relacionado
    p.title as post_title,

    -- Timestamps
    a.created_at,
    a.updated_at

FROM appointments a
JOIN users u ON u.id = a.worker_id
LEFT JOIN posts p ON p.id = a.related_post_id
ORDER BY a.scheduled_date ASC, a.scheduled_time ASC;

SELECT 'PARTE 6 COMPLETADA: Sistema de agenda creado (versión corregida)' AS status;