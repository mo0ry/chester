<?php
require_once __DIR__ . '/../../library/core/Loader.php';

try {
    $loader = getLoader();
    $loader->checkMethod('GET');
    $user = $loader->optionalAuthentication();

    // استفاده از ProductManager
    $productManager = $loader->getProductManager();
    
    // دریافت پارامترها
    $filters = [
        'statos' => $_GET['statos'] ?? '',
        'search' => $_GET['search'] ?? ''
    ];
    
    // دریافت محصولات
    $products = $productManager->getProducts($filters);
    
    // لاگ action
    $loader->logAction('PRODUCTS_LISTED', "Count: " . count($products), $user['ID'] ?? null);
    
    Response::success($products);
    
} catch (Exception $e) {
    if (isset($loader)) {
        $loader->logAction('PRODUCTS_LIST_FAILED', "Error: " . $e->getMessage(), $user['ID'] ?? null);
    }
    Response::error('خطا در دریافت لیست محصولات: ' . $e->getMessage());
}
?>