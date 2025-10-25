<?php
require_once '../../library/config.php';
require_once '../../library/core/Response.php';
require_once '../../library/core/database.php';
require_once '../../library/managers/AuthManager.php';

// تنظیم CORS
Response::cors();

// بررسی method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

// بررسی احراز هویت
$authManager = new AuthManager();
$token = getBearerToken();

if (!$token) {
    Response::error('توکن احراز هویت ارسال نشده است', 401);
}

$user = $authManager->validateToken($token);
if (!$user) {
    Response::error('توکن نامعتبر یا منقضی شده است', 401);
}

// دریافت شماره سفارش
$order_number = $_GET['order_number'] ?? '';
if (empty($order_number)) {
    Response::error('شماره سفارش الزامی است');
}

try {
    $db = new Database();
    
    // دریافت اطلاعات سفارش
    $sql = "SELECT 
                ps.Pish_ID as id,
                ps.Serial as order_number,
                ps.Name as customer_name,
                ps.Phone as customer_phone,
                ps.Address as customer_address,
                ps.Date as order_date,
                ps.DateU as delivery_date,
                ps.TypeBuy as order_type,
                ps.Pay as payment_method,
                ps.Status as status,
                ps.CreatedAt as created_at
            FROM PSefaresh ps 
            WHERE ps.Serial = :order_number AND ps.ID_Agency = :user_id";
    
    $stmt = $db->query($sql, [
        ':order_number' => $order_number,
        ':user_id' => $user['ID']
    ]);
    
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        Response::error('سفارش یافت نشد', 404);
    }
    
    // دریافت محصولات سفارش
    $products_sql = "SELECT 
                        b.A_ID as product_code,
                        b.Tedad as total_quantity,
                        b.DA, b.CA, b.BA, b.AA,
                        b.Frim, b.Chob as color, b.Parche, b.Comment,
                        b.Cosan, b.Poshti,
                        p.NameFA as product_name,
                        p.Color as product_color,
                        p.Comment as product_comment
                     FROM Buy b
                     LEFT JOIN Products p ON b.A_ID = p.Code
                     WHERE b.Serial = :serial";
    
    $products_stmt = $db->query($products_sql, [':serial' => $order_number]);
    $order['products'] = $products_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // تبدیل تاریخ‌ها به شمسی
    $order['order_date_jalali'] = convertToJalali($order['order_date']);
    $order['delivery_date_jalali'] = convertToJalali($order['delivery_date']);
    $order['created_at_jalali'] = convertToJalali($order['created_at']);
    
    Response::success($order);
    
} catch (Exception $e) {
    error_log("Order details error: " . $e->getMessage());
    Response::error('خطا در دریافت جزئیات سفارش: ' . $e->getMessage());
}

function convertToJalali($gregorianDate) {
    if (empty($gregorianDate)) return '';
    
    require_once '../../library/jdf.php';
    
    $timestamp = strtotime($gregorianDate);
    if ($timestamp === false) return '';
    
    return jdate('Y/m/d H:i', $timestamp);
}
?>