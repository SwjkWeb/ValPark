<?php
require_once 'config.php';

// Obtener datos del POST
$input = json_decode(file_get_contents('php://input'), true);

// Validar que se recibieron los datos
if (!isset($input['email']) || !isset($input['password'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos incompletos'
    ]);
    exit;
}

$email = trim($input['email']);
$password = $input['password'];

// Conectar a la base de datos
$conn = getDBConnection();

if (!$conn) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ]);
    exit;
}

// Buscar el usuario por email
$stmt = $conn->prepare("SELECT id, nombre, email, password FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Email o contraseña incorrectos'
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Verificar la contraseña
if (password_verify($password, $user['password'])) {
    // Actualizar último acceso
    $updateStmt = $conn->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
    $updateStmt->bind_param("i", $user['id']);
    $updateStmt->execute();
    $updateStmt->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Bienvenido, ' . $user['nombre'],
        'userId' => $user['id'],
        'userName' => $user['nombre'],
        'userEmail' => $user['email']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Email o contraseña incorrectos'
    ]);
}

$conn->close();
?>
