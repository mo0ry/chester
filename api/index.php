<?php
require_once '../library/config.php';
require_once '../library/core/Response.php';

// تنظیم CORS
Response::cors();

// دریافت مسیر درخواست
$requestUri = $_SERVER['REQUEST_URI'];

// تجزیه URL برای جداسازی مسیر از query string
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'] ?? '';

// تقسیم مسیر و گرفتن دو بخش آخر
$pathParts = array_filter(explode('/', $path)); // حذف بخش‌های خالی
$endpointParts = array_slice($pathParts, -2); // گرفتن دو بخش آخر

// تعیین endpoint اصلی
$mainEndpoint = $endpointParts[0] ?? '';
$subEndpoint = $endpointParts[1] ?? '';


// دریافت method و داده‌های ورودی
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

error_log("Request method: " . $method);
error_log("Request data: " . json_encode($input));

try {
    // مسیریابی بر اساس endpoint
    switch ($mainEndpoint) {
        case 'auth':
            if ($subEndpoint === 'login') {
                require_once 'auth/login.php';
            } else {
                Response::error('Auth endpoint not found: ' . $subEndpoint, 404);
            }
            break;
            
        case 'products':
            if ($subEndpoint === 'list' || $subEndpoint === 'categories') {
                require_once 'products/list.php';
            } else if ($subEndpoint === 'categories') {
                require_once 'products/categories.php';
			} else if ($subEndpoint === 'by_status') {
                require_once 'products/by_status.php';
            } else {
                Response::error('Products endpoint not found: ' . $subEndpoint, 404);
            }
            break;
            
        case 'orders':
            if ($subEndpoint === 'create') {
                require_once 'orders/create.php';
            } elseif ($subEndpoint === 'list') {
                require_once 'orders/list.php';
            } else {
                Response::error('Orders endpoint not found: ' . $subEndpoint, 404);
            }
            break;
            
        case '':
            Response::success([
                'endpoints' => [
                    'POST /auth/login' => 'User authentication',
                    'GET /products/list' => 'Get products list', 
                    'GET /products/categories' => 'Get product categories',
                    'POST /orders/create' => 'Create new order',
                    'GET /orders/list' => 'Get orders list'
                ]
            ], 'API is working');
            break;
            
        default:
            Response::error('Endpoint not found: ' . $mainEndpoint, 404);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    Response::error($e->getMessage(), 500);
}
?>