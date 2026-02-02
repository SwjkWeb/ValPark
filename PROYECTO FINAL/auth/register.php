<?php
require_once 'config.php';

// Obtener datos del POST
$input = json_decode(file_get_contents('php://input'), true);

// Validar que se recibieron los datos
if (!isset($input['name']) || !isset($input['email']) || !isset($input['password'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos incompletos'
    ]);
    exit;
}

$name = trim($input['name']);
$email = trim($input['email']);
$password = $input['password'];

// Validar email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Email no válido'
    ]);
    exit;
}

// Validar longitud de la contraseña
if (strlen($password) < 6) {
    echo json_encode([
        'success' => false,
        'message' => 'La contraseña debe tener al menos 6 caracteres'
    ]);
    exit;
}

// Conectar a la base de datos
$conn = getDBConnection();

if (!$conn) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ]);
    exit;
}

// Verificar si el email ya existe
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'message' => 'El email ya está registrado'
    ]);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Hash de la contraseña
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insertar el nuevo usuario
$stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password, fecha_registro) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("sss", $name, $email, $hashedPassword);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Registro exitoso. Ya puedes iniciar sesión'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error al registrar el usuario'
    ]);
}

$stmt->close();
$conn->close();
?>
