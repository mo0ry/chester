<?php
require_once '../../library/core/Loader.php';

$loader = getLoader();

// بررسی method
$loader->checkMethod('GET');

// احراز هویت کاربر
$user = $loader->requireAuthentication();

try {
    $db = $loader->getDatabase();
    
    // دریافت پارامترها
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(50, max(1, intval($_GET['limit'] ?? 10));
    $status = $_GET['status'] ?? '';
    $search = $_GET['search'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // ساخت کوئری
    $where_conditions = ["ps.ID_Agency = :user_id"];
    $params = [':user_id' => $user['ID']];
    
    if ($status && in_array($status, ['pending', 'processing', 'completed', 'cancelled'])) {
        $where_conditions[] = "ps.Status = :status";
        $params[':status'] = $status;
    }
    
    if ($search) {
        $where_conditions[] = "(ps.Serial LIKE :search OR ps.Name LIKE :search OR ps.Phone LIKE :search)";
        $params[':search'] = "%$search%";
    }
    
    $where_clause = implode(' AND ', $where_conditions);
    
    // تعداد کل رکوردها
    $count_sql = "SELECT COUNT(*) FROM PSefaresh ps WHERE $where_clause";
    $stmt = $db->query($count_sql, $params);
    $total_count = $stmt->fetchColumn();
    
    // دریافت سفارش‌ها
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
                ps.CreatedAt as created_at,
                (SELECT COUNT(*) FROM Buy b WHERE b.Serial = ps.Serial) as items_count,
                (SELECT SUM(Tedad) FROM Buy b WHERE b.Serial = ps.Serial) as total_quantity
            FROM PSefaresh ps 
            WHERE $where_clause 
            ORDER BY ps.Pish_ID DESC 
            LIMIT :limit OFFSET :offset";
    
    $params[':limit'] = $limit;
    $params[':offset'] = $offset;
    
    $stmt = $db->query($sql, $params);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // دریافت محصولات هر سفارش
    foreach ($orders as &$order) {
        $products_sql = "SELECT 
                            b.A_ID as product_code,
                            b.Tedad as quantity,
                            b.DA, b.CA, b.BA, b.AA,
                            b.Frim, b.Chob as color, b.Parche, b.Comment,
                            b.Cosan, b.Poshti,
                            p.NameFA as product_name,
                            p.Color as product_color
                         FROM Buy b
                         LEFT JOIN Products p ON b.A_ID = p.Code
                         WHERE b.Serial = :serial";
        
        $products_stmt = $db->query($products_sql, [':serial' => $order['order_number']]);
        $order['products'] = $products_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // تبدیل تاریخ‌ها به شمسی
        $order['order_date_jalali'] = $loader->convertToJalali($order['order_date']);
        $order['delivery_date_jalali'] = $loader->convertToJalali($order['delivery_date']);
        $order['created_at_jalali'] = $loader->convertToJalali($order['created_at']);
    }
    
    // لاگ action
    $loader->logAction('ORDERS_LISTED', "Page: {$page}, Limit: {$limit}", $user['ID']);
    
    Response::success([
        'orders' => $orders,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total_count,
            'pages' => ceil($total_count / $limit)
        ]
    ]);
    
} catch (Exception $e) {
    $loader->logAction('ORDERS_LIST_FAILED', "Error: " . $e->getMessage(), $user['ID']);
    Response::error('خطا در دریافت لیست سفارش‌ها: ' . $e->getMessage());
}
?>