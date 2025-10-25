<?php
require_once __DIR__ . '/../../library/core/Loader.php';

try {
    $loader = getLoader();
    $loader->checkMethod('GET');
    $user = $loader->optionalAuthentication();

    $status = $_GET['status'] ?? '';
    if (empty($status)) {
        Response::error('پارامتر status الزامی است');
    }

    $db = $loader->getDatabase();
    
    $sql = "SELECT 
                Code, 
                NameFA, 
                NameEN, 
                Color, 
                Comment, 
                DA, 
                CA, 
                BA, 
                AA,
                Cloth,
                PriceA,
                Status,
                Active
            FROM Products 
            WHERE Status = :status AND Active = 1 
            ORDER BY NameFA";
    
    $stmt = $db->query($sql, [':status' => $status]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($products)) {
        Response::success([], 'هیچ محصولی برای این دسته یافت نشد');
    }
    
    // فرمت‌دهی محصولات
    $formatted_products = [];
    foreach ($products as $product) {
        $formatted_products[] = [
            'code' => $product['Code'],
            'name_fa' => $product['NameFA'],
            'name_en' => $product['NameEN'],
            'color' => $product['Color'],
            'comment' => $product['Comment'],
            'quantities' => [
                'DA' => (int)$product['DA'],
                'CA' => (int)$product['CA'],
                'BA' => (int)$product['BA'],
                'AA' => (int)$product['AA']
            ],
            'cloth' => $product['Cloth'],
            'price' => (float)$product['PriceA'],
            'status' => (int)$product['Status'],
            'active' => (bool)$product['Active']
        ];
    }
    
    $loader->logAction('PRODUCTS_BY_STATUS', "Status: {$status}, Count: " . count($formatted_products), $user['ID'] ?? null);
    
    Response::success($formatted_products);
    
} catch (Exception $e) {
    if (isset($loader)) {
        $loader->logAction('PRODUCTS_BY_STATUS_FAILED', $e->getMessage(), $user['ID'] ?? null);
    }
    Response::error('خطا در دریافت محصولات: ' . $e->getMessage());
}
?>