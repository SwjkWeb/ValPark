<?php
// filepath: c:\Users\user\Desktop\PROYECTO UPSTEAM\PRUEBA 2\auth\register.php

require_once '../config/db_config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = trim($_POST['nombre'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    if (empty($nombre) || empty($email) || empty($password)) {
        header('Location: ../registro.html?error=empty');
        exit();
    }
    
    if ($password !== $confirm_password) {
        header('Location: ../registro.html?error=password');
        exit();
    }
    
    if (strlen($password) < 6) {
        header('Location: ../registro.html?error=short');
        exit();
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        header('Location: ../registro.html?error=email');
        exit();
    }
    
    $conn = getDBConnection();
    
    $checkStmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        $checkStmt->close();
        $conn->close();
        header('Location: ../registro.html?error=exists');
        exit();
    }
    
    $checkStmt->close();
    
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $nombre, $email, $hashed_password);
    
    if ($stmt->execute()) {
        $stmt->close();
        $conn->close();
        header('Location: ../index.html?message=registered');
        exit();
    } else {
        $stmt->close();
        $conn->close();
        header('Location: ../registro.html?error=database');
        exit();
    }
}

header('Location: ../registro.html');
exit();
?>