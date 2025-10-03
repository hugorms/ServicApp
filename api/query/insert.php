<?php
require_once '../config.php';

try {
    // Obtener datos del POST request
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendResponse(false, null, 'No se recibieron datos');
    }

    $table = $input['table'] ?? '';
    $data = $input['data'] ?? [];

    if (empty($table) || empty($data)) {
        sendResponse(false, null, 'Tabla o datos faltantes');
    }

    // Preparar query de inserción
    $columns = array_keys($data);
    $placeholders = ':' . implode(', :', $columns);
    $columnsList = implode(', ', $columns);

    $sql = "INSERT INTO $table ($columnsList) VALUES ($placeholders)";
    $stmt = $pdo->prepare($sql);

    // Ejecutar inserción
    if ($stmt->execute($data)) {
        $insertId = $pdo->lastInsertId();

        // Si es una publicación, obtener los datos completos
        if ($table === 'posts') {
            $getPostSql = "SELECT p.*, u.name as contractor_name, u.profile_photo_url as contractor_photo
                          FROM posts p
                          LEFT JOIN users u ON p.contractor_id = u.id
                          WHERE p.id = :id";
            $getStmt = $pdo->prepare($getPostSql);
            $getStmt->execute(['id' => $insertId]);
            $newPost = $getStmt->fetch();

            sendResponse(true, [
                'id' => $insertId,
                'post' => $newPost,
                'message' => 'Publicación creada exitosamente'
            ]);
        } else {
            sendResponse(true, [
                'id' => $insertId,
                'message' => 'Registro creado exitosamente'
            ]);
        }
    } else {
        sendResponse(false, null, 'Error al insertar en la base de datos');
    }

} catch (PDOException $e) {
    sendResponse(false, null, 'Error de base de datos: ' . $e->getMessage());
} catch (Exception $e) {
    sendResponse(false, null, 'Error: ' . $e->getMessage());
}
?>