<?php
require_once '../config.php';

try {
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        sendResponse(false, null, 'Método no permitido');
    }

    // Leer datos JSON del cuerpo de la petición
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendResponse(false, null, 'Datos inválidos o formato JSON incorrecto');
    }

    $table = $input['table'] ?? '';
    $conditions = $input['conditions'] ?? '';

    if (empty($table) || empty($conditions)) {
        sendResponse(false, null, 'Tabla y condiciones son requeridas');
    }

    // Validar tabla permitida (seguridad)
    $allowedTables = ['posts', 'post_images', 'notifications', 'post_applications', 'active_projects', 'users'];
    if (!in_array($table, $allowedTables)) {
        sendResponse(false, null, 'Tabla no permitida: ' . $table);
    }

    // Construir y ejecutar consulta DELETE
    $sql = "DELETE FROM `$table` WHERE $conditions";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $affectedRows = $stmt->rowCount();

    sendResponse(true, [
        'message' => 'Registro(s) eliminado(s) correctamente',
        'affected_rows' => $affectedRows,
        'table' => $table
    ]);

} catch (PDOException $e) {
    sendResponse(false, null, 'Error de base de datos: ' . $e->getMessage());
} catch (Exception $e) {
    sendResponse(false, null, 'Error interno: ' . $e->getMessage());
}
?>