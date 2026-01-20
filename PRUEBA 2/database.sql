CREATE DATABASE IF NOT EXISTS valencia_gps_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
USE valencia_gps_db; 
 
CREATE TABLE IF NOT EXISTS usuarios ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    nombre VARCHAR(100) NOT NULL, 
    email VARCHAR(150) NOT NULL UNIQUE, 
    password VARCHAR(255) NOT NULL, 
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    ultimo_acceso TIMESTAMP NULL, 
    activo BOOLEAN DEFAULT TRUE, 
    INDEX idx_email (email), 
    INDEX idx_activo (activo) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 
 
INSERT INTO usuarios (nombre, email, password) VALUES  
('Usuario Prueba', 'prueba@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); 
