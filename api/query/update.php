<?php
require_once '../config.php';

try {
    // Obtener datos del PUT request
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendResponse(false, null, 'No se recibieron datos');
    }

    $table = $input['table'] ?? '';
    $data = $input['data'] ?? [];
    $conditions = $input['conditions'] ?? '';

    if (empty($table) || empty($data) || empty($conditions)) {
        sendResponse(false, null, 'Tabla, datos o condiciones faltantes');
    }

    // Preparar query de actualización
    $setParts = [];
    foreach ($data as $key => $value) {
        $setParts[] = "$key = :$key";
    }
    $setClause = implode(', ', $setParts);

    $sql = "UPDATE $table SET $setClause WHERE $conditions";
    $stmt = $pdo->prepare($sql);

    // Ejecutar actualización
    if ($stmt->execute($data)) {
        $affectedRows = $stmt->rowCount();

        sendResponse(true, [
            'affected_rows' => $affectedRows,
            'message' => 'Registro actualizado exitosamente'
        ]);
    } else {
        sendResponse(false, null, 'Error al actualizar la base de datos');
    }

} catch (PDOException $e) {
    sendResponse(false, null, 'Error de base de datos: ' . $e->getMessage());
} catch (Exception $e) {
    sendResponse(false, null, 'Error: ' . $e->getMessage());
}
?>