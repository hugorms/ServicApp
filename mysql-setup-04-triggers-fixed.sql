-- ============================================================================
-- MYSQL PARTE 4: TRIGGERS Y FUNCIONES AUTOMÁTICAS (VERSIÓN CORREGIDA)
-- ============================================================================

USE servicios_app;

-- Cambiar el delimiter para crear triggers
DELIMITER $$

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS update_user_rating_trigger$$
DROP TRIGGER IF EXISTS notify_new_application_trigger$$
DROP TRIGGER IF EXISTS notify_matching_workers_trigger$$
DROP TRIGGER IF EXISTS create_appointment_trigger$$

-- Trigger para actualizar rating promedio cuando se inserta una nueva calificación
CREATE TRIGGER update_user_rating_trigger
    AFTER INSERT ON ratings
    FOR EACH ROW
BEGIN
    UPDATE users SET
        rating = (
            SELECT ROUND(AVG(rating), 2)
            FROM ratings
            WHERE to_user_id = NEW.to_user_id
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM ratings
            WHERE to_user_id = NEW.to_user_id
        )
    WHERE id = NEW.to_user_id;
END$$

-- Trigger para notificar cuando alguien aplica a un trabajo
CREATE TRIGGER notify_new_application_trigger
    AFTER INSERT ON post_applications
    FOR EACH ROW
BEGIN
    DECLARE contractor_name VARCHAR(255);
    DECLARE post_title VARCHAR(255);
    DECLARE worker_name VARCHAR(255);
    DECLARE contractor_id_var INT;

    -- Obtener datos necesarios
    SELECT u.name, p.title, p.contractor_id
    INTO contractor_name, post_title, contractor_id_var
    FROM posts p
    JOIN users u ON u.id = p.contractor_id
    WHERE p.id = NEW.post_id;

    SELECT name INTO worker_name
    FROM users
    WHERE id = NEW.worker_id;

    -- Crear notificación para el contratista
    INSERT INTO notifications (user_id, title, message, type, post_id, application_id)
    VALUES (
        contractor_id_var,
        '¡Nueva aplicación recibida!',
        CONCAT(worker_name, ' ha aplicado a tu trabajo "', post_title, '"'),
        'info',
        NEW.post_id,
        NEW.id
    );
END$$

-- Trigger para notificar a trabajadores cuando se crea un nuevo post
CREATE TRIGGER notify_matching_workers_trigger
    AFTER INSERT ON posts
    FOR EACH ROW
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE worker_id_var INT;
    DECLARE worker_name_var VARCHAR(255);
    DECLARE contractor_name VARCHAR(255);

    -- Cursor para obtener trabajadores con la especialidad coincidente
    DECLARE worker_cursor CURSOR FOR
        SELECT u.id, u.name
        FROM users u
        WHERE u.user_type = 'worker'
        AND u.specialties LIKE CONCAT('%"', NEW.specialty, '"%')
        AND u.notification_preferences LIKE '%"new_applications": true%';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Obtener nombre del contratista
    SELECT name INTO contractor_name
    FROM users
    WHERE id = NEW.contractor_id;

    -- Abrir cursor
    OPEN worker_cursor;

    -- Loop para notificar a cada trabajador
    worker_loop: LOOP
        FETCH worker_cursor INTO worker_id_var, worker_name_var;
        IF done THEN
            LEAVE worker_loop;
        END IF;

        INSERT INTO notifications (user_id, title, message, type, post_id)
        VALUES (
            worker_id_var,
            '¡Nuevo trabajo disponible!',
            CONCAT(contractor_name, ' ha publicado un trabajo de ', NEW.specialty, ' en ', NEW.location),
            'info',
            NEW.id
        );
    END LOOP;

    -- Cerrar cursor
    CLOSE worker_cursor;
END$$

-- Trigger para crear cita cuando se acepta una aplicación
CREATE TRIGGER create_appointment_trigger
    AFTER UPDATE ON post_applications
    FOR EACH ROW
BEGIN
    DECLARE post_title VARCHAR(255);
    DECLARE post_description TEXT;
    DECLARE post_specialty VARCHAR(255);
    DECLARE post_location VARCHAR(255);
    DECLARE contractor_phone VARCHAR(20);
    DECLARE contractor_urbanization VARCHAR(255);

    -- Solo procesar cuando el status cambia a 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        -- Obtener datos del post
        SELECT p.title, p.description, p.specialty, p.location
        INTO post_title, post_description, post_specialty, post_location
        FROM posts p
        WHERE p.id = NEW.post_id;

        -- Obtener datos del contratista
        SELECT u.phone, u.location_urbanization
        INTO contractor_phone, contractor_urbanization
        FROM users u
        JOIN posts p ON p.contractor_id = u.id
        WHERE p.id = NEW.post_id;

        -- Crear la cita
        INSERT INTO appointments (
            contractor_id,
            worker_id,
            title,
            description,
            service_type,
            scheduled_date,
            scheduled_time,
            estimated_duration_hours,
            location_address,
            location_urbanization,
            estimated_cost,
            related_post_id,
            related_application_id,
            contact_phone,
            status
        )
        SELECT
            p.contractor_id,
            NEW.worker_id,
            post_title,
            post_description,
            post_specialty,
            DATE_ADD(CURDATE(), INTERVAL 1 DAY), -- Fecha tentativa: mañana
            '09:00:00', -- Hora tentativa
            IFNULL(NEW.estimated_completion_time, 2.0), -- Duración estimada
            IFNULL(post_location, 'Ubicación por confirmar'),
            contractor_urbanization,
            NEW.proposed_cost,
            NEW.post_id,
            NEW.id,
            contractor_phone,
            'pending'
        FROM posts p
        WHERE p.id = NEW.post_id;
    END IF;
END$$

-- Trigger para actualizar métricas de trabajador cuando completa un trabajo
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
END$$

-- Restaurar delimiter
DELIMITER ;

SELECT 'PARTE 4 COMPLETADA: Triggers automáticos creados (versión corregida)' AS status;