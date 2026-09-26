<?php
/**
 * guardar.php
 * Recibe los datos del formulario de contacto (JSON) y los agrega
 * como una nueva línea en data/mensajes.txt
 *
 * Requiere un hosting con soporte PHP (por ejemplo InfinityFree,
 * 000webhost, o un servidor local con XAMPP/WAMP para pruebas).
 */

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Método no permitido';
    exit;
}

$entrada = json_decode(file_get_contents('php://input'), true);

$nombre  = isset($entrada['nombre'])  ? trim($entrada['nombre'])  : '';
$correo  = isset($entrada['correo'])  ? trim($entrada['correo'])  : '';
$area    = isset($entrada['area'])    ? trim($entrada['area'])    : '';
$mensaje = isset($entrada['mensaje']) ? trim($entrada['mensaje']) : '';

// Validación básica también en el servidor (nunca confiar solo en el navegador)
if (strlen($nombre) < 3 || !filter_var($correo, FILTER_VALIDATE_EMAIL) ||
    $area === '' || strlen($mensaje) < 10) {
    http_response_code(400);
    echo 'Datos inválidos';
    exit;
}

$carpetaDatos = __DIR__ . '/../data';
if (!is_dir($carpetaDatos)) {
    mkdir($carpetaDatos, 0755, true);
}

$archivoDatos = $carpetaDatos . '/mensajes.txt';

$linea = sprintf(
    "[%s] Nombre: %s | Correo: %s | Área: %s | Mensaje: %s%s",
    date('Y-m-d H:i:s'),
    $nombre,
    $correo,
    $area,
    str_replace(["\r", "\n"], ' ', $mensaje),
    PHP_EOL
);

file_put_contents($archivoDatos, $linea, FILE_APPEND | LOCK_EX);

echo 'ok';
