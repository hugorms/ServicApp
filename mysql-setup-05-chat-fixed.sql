-- ============================================================================
-- MYSQL PARTE 5: SISTEMA DE CHAT (VERSIÓN CORREGIDA)
-- ============================================================================

USE servicios_app;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS update_chat_timestamp_trigger;

-- Eliminar vista existente si existe
DROP VIEW IF EXISTS chat_list_view;

-- Crear tabla de conversaciones/chats
CREATE TABLE IF NOT EXISTS chats (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Participantes de la conversación
  participant_1_id INT NOT NULL,
  participant_2_id INT NOT NULL,

  -- Información de la conversación
  title VARCHAR(255),
  chat_type ENUM('private', 'group') DEFAULT 'private',

  -- Metadatos
  is_pinned_by_p1 BOOLEAN DEFAULT FALSE,
  is_pinned_by_p2 BOOLEAN DEFAULT FALSE,
  is_archived_by_p1 BOOLEAN DEFAULT FALSE,
  is_archived_by_p2 BOOLEAN DEFAULT FALSE,

  -- Referencia al trabajo si existe
  related_post_id INT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (participant_1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_2_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_post_id) REFERENCES posts(id) ON DELETE SET NULL,

  -- Evitar conversaciones duplicadas entre las mismas personas
  UNIQUE KEY unique_chat (participant_1_id, participant_2_id),

  -- Asegurar que los participantes sean diferentes
  CHECK (participant_1_id != participant_2_id),

  -- Índices
  INDEX idx_chats_participant_1 (participant_1_id),
  INDEX idx_chats_participant_2 (participant_2_id),
  INDEX idx_chats_post (related_post_id)
);

-- Crear tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id INT NOT NULL,
  sender_id INT NOT NULL,

  -- Contenido del mensaje
  message_text TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file', 'location', 'system') DEFAULT 'text',

  -- Archivos adjuntos
  attachment_url VARCHAR(500),
  attachment_type VARCHAR(100),
  attachment_name VARCHAR(255),

  -- Estado del mensaje
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,

  -- Estado de lectura
  read_by_recipient BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,

  -- Mensaje al que responde (para replies)
  reply_to_message_id INT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL,

  -- Índices
  INDEX idx_messages_chat (chat_id),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_created (created_at DESC),
  INDEX idx_messages_read (read_by_recipient, sender_id)
);

-- Crear vista para obtener conversaciones con último mensaje
CREATE VIEW chat_list_view AS
SELECT
    c.id as chat_id,
    c.participant_1_id,
    c.participant_2_id,
    c.related_post_id,
    c.is_pinned_by_p1,
    c.is_pinned_by_p2,
    c.created_at as chat_created_at,
    c.updated_at as chat_updated_at,

    -- Información del último mensaje
    m.id as last_message_id,
    m.message_text as last_message_text,
    m.message_type as last_message_type,
    m.sender_id as last_message_sender_id,
    m.created_at as last_message_time,

    -- Conteo de mensajes no leídos para participante 1
    (SELECT COUNT(*)
     FROM messages m2
     WHERE m2.chat_id = c.id
     AND m2.read_by_recipient = FALSE
     AND m2.sender_id != c.participant_1_id) as unread_count_p1,

    -- Conteo de mensajes no leídos para participante 2
    (SELECT COUNT(*)
     FROM messages m2
     WHERE m2.chat_id = c.id
     AND m2.read_by_recipient = FALSE
     AND m2.sender_id != c.participant_2_id) as unread_count_p2

FROM chats c
LEFT JOIN messages m ON m.id = (
    SELECT m3.id
    FROM messages m3
    WHERE m3.chat_id = c.id
    ORDER BY m3.created_at DESC
    LIMIT 1
);

-- Trigger para actualizar timestamp del chat cuando se envía un mensaje
DELIMITER $$

CREATE TRIGGER update_chat_timestamp_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
BEGIN
    UPDATE chats
    SET updated_at = NEW.created_at
    WHERE id = NEW.chat_id;
END$$

DELIMITER ;

SELECT 'PARTE 5 COMPLETADA: Sistema de chat creado (versión corregida)' AS status;