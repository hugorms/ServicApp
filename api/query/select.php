<?php
require_once '../config.php';

try {
    $table = $_GET['table'] ?? '';
    $conditions = $_GET['conditions'] ?? '';
    $orderBy = $_GET['order_by'] ?? '';
    $limit = $_GET['limit'] ?? '';

    if (empty($table)) {
        sendResponse(false, null, 'Tabla requerida');
    }

    // Construir query base
    $sql = "SELECT ";

    // Query específica para posts con información del contratista
    if ($table === 'posts') {
        $sql .= "p.*, u.name as contractor_name, u.profile_photo_url as contractor_photo
                FROM posts p
                LEFT JOIN users u ON p.contractor_id = u.id";
    } else {
        $sql .= "* FROM $table";
    }

    // Agregar condiciones WHERE
    if (!empty($conditions)) {
        $sql .= " WHERE $conditions";
    }

    // Agregar ORDER BY
    if (!empty($orderBy)) {
        $sql .= " ORDER BY $orderBy";
    } else if ($table === 'posts') {
        $sql .= " ORDER BY p.created_at DESC";
    }

    // Agregar LIMIT
    if (!empty($limit)) {
        $sql .= " LIMIT $limit";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll();

    sendResponse(true, $results);

} catch (PDOException $e) {
    sendResponse(false, null, 'Error de base de datos: ' . $e->getMessage());
} catch (Exception $e) {
    sendResponse(false, null, 'Error: ' . $e->getMessage());
}
?>