<?php
// مسیر اصلی
define('ABSPATH', dirname(__DIR__) . '/');

// تنظیمات پایگاه داده
define('DB_HOST', 'localhost');
define('DB_NAME', 'Furniture');
define('DB_USER', 'moory');
define('DB_PASS', 'NetworkWTM1986');

// تنظیمات امنیتی
define('SECRET_KEY', 'furniture-system-secret-2024');
define('TOKEN_EXPIRY_HOURS', 24);
define('JWT_SECRET', 'furniture-jwt-secret-2024');

// تنظیمات API
define('API_VERSION', '1.0.0');
define('DEBUG_MODE', true);

// توابع کمکی ساده
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

function getAuthorizationHeader() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(
            array_map('ucwords', array_keys($requestHeaders)), 
            array_values($requestHeaders)
        );
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

function getBearerToken() {
    $headers = getAuthorizationHeader();
    if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}
?>