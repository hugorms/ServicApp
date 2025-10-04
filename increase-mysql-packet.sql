-- Aumentar max_allowed_packet para permitir imágenes en base64
SET GLOBAL max_allowed_packet=67108864; -- 64MB

-- Verificar el cambio
SELECT @@max_allowed_packet;

-- Mostrar en MB
SELECT @@max_allowed_packet / 1024 / 1024 AS max_packet_mb;
