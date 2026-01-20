<?php
// script to query cuentas_bancarias for a given sucursal
$sucursal = $argv[1] ?? '3';
$dbFile = __DIR__ . '/../database/database.sqlite';
if (!file_exists($dbFile)) { echo json_encode(['error'=>'database file not found', 'path'=>$dbFile]); exit(1); }
try {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->prepare('SELECT id, id_sucursal, banco, nombre, alias, numero_cuenta FROM cuentas_bancarias WHERE id_sucursal = :s LIMIT 50');
    $stmt->execute([':s' => $sucursal]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['sucursal' => $sucursal, 'rows' => $rows], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
