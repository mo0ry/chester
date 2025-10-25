<?php
require_once __DIR__ . '/../../library/core/Loader.php';

try {
    $loader = getLoader();
    $loader->checkMethod('POST');
    $user = $loader->optionalAuthentication();

    $input = $loader->getInputData();
    
    // اعتبارسنجی فیلدهای ضروری
    $required_fields = ['customer_name', 'customer_phone', 'customer_address', 'products'];
    $loader->validateRequiredFields($input, $required_fields);

    // اعتبارسنجی اضافی
    if (!preg_match('/^09\d{9}$/', $input['customer_phone'])) {
        Response::error('شماره تلفن نامعتبر است');
    }

    $db = $loader->getDatabase();
    $db->beginTransaction();

    // تولید سریال (مطابق منطق C#)
    $serial = generateSerial($db);
    
    // تاریخ‌ها (بهبود jdate)
    $current_date = jdate('Y/m/d');
    $delivery_date = jdate('Y/m/d', strtotime('+27 days'));

    // ذخیره در PSefaresh (با bind params)
    $order_id = $db->insert('PSefaresh', [
        'ID_Agency' => $user['ID'],
        'Name' => $input['customer_name'],
        'Phone' => $input['customer_phone'],
        'Address' => $input['customer_address'],
        'Date' => $current_date,
        'Pay' => $input['payment_method'] ?? '',
        'Serial' => $serial,
        'TypeBuy' => $input['order_type'] ?? 'فروش خانگی',
        'DateU' => $delivery_date
    ]);

    // پردازش محصولات
    foreach ($input['products'] as $product) {
        processProduct($db, $user['ID'], $serial, $product);
    }

    $db->commit();

    $loader->logAction('ORDER_CREATED', "Serial: {$serial}", $user['ID']);
    
    Response::success([
        'order_id' => $order_id,
        'serial' => $serial,
        'order_date' => $current_date,
        'delivery_date' => $delivery_date
    ], 'سفارش با موفقیت ثبت شد');

} catch (Exception $e) {
    if (isset($db)) $db->rollBack();
    $loader->logAction('ORDER_CREATION_FAILED', $e->getMessage(), $user['ID'] ?? null);
    Response::error('خطا در ثبت سفارش: ' . $e->getMessage());
}

// تغییر: بهبود jdate (هنوز ساده، اما دقیق‌تر. برای واقعی از کتابخانه jdf استفاده کنید)
if (!function_exists('jdate')) {
    function jdate($format, $timestamp = null) {
        if ($timestamp === null) {
            $timestamp = time();
        }
        $jd = gregorian_to_jalali(date('Y', $timestamp), date('m', $timestamp), date('d', $timestamp));
        switch ($format) {
            case 'Y/m/d':
                return sprintf('%04d/%02d/%02d', $jd[0], $jd[1], $jd[2]);
            case 'Y':
                return (string)$jd[0];
            case 'm':
                return sprintf('%02d', $jd[1]);
            case 'd':
                return sprintf('%02d', $jd[2]);
            default:
                return date($format, $timestamp);  // fallback
        }
    }
}

function generateSerial($db) {
    $current_year = jdate('Y');
    $yy_clean = substr($current_year, 2);  // تغییر: ساده‌تر (فرض 14xx)
    $mm = jdate('m');
    $dd = jdate('d');
    $prefix = $yy_clean . $mm . $dd;

    $sql = "SELECT Serial FROM PSefaresh WHERE Serial LIKE :prefix ORDER BY Pish_ID DESC LIMIT 1";
    $stmt = $db->query($sql, [':prefix' => $prefix . '%']);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return $prefix . '001';
    }

    $old_serial = $row['Serial'];
    $old_prefix = substr($old_serial, 0, 6);
    
    if ($prefix === $old_prefix) {
        $last_number = intval(substr($old_serial, 6));
        $new_number = $last_number + 1;
        return $prefix . str_pad($new_number, 3, '0', STR_PAD_LEFT);
    } else {
        return $prefix . '001';
    }
}

function processProduct($db, $user_id, $serial, $product) {
    $product_type = $product['type']; // 11 for mbl, 2-9 for others
    $product_name = $product['name'];
    
    // دریافت کد محصول
    $sql = "SELECT Code FROM Products WHERE NameFA = :name AND Status = :status";
    $stmt = $db->query($sql, [
        ':name' => $product_name,
        ':status' => $product_type
    ]);
    $product_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product_data) {
        throw new Exception("محصول یافت نشد: {$product_name}");
    }
    
    $product_code = $product_data['Code'];
    
    if ($product_type == 11) {
        // پردازش مبل (دارای انواع مختلف)
        processMabalProduct($db, $user_id, $serial, $product, $product_code);
    } else {
        // پردازش سایر محصولات
        processSimpleProduct($db, $user_id, $serial, $product, $product_type, $product_code);
    }
}

function processMabalProduct($db, $user_id, $serial, $product, $product_code) {
    $quantities = $product['quantities'];
    
    // DA - تک نفره
    if (!empty($quantities['DA']) && $quantities['DA'] > 0) {
        $db->insert('Buy', [
            'ID_Agency' => $user_id,
            'A_ID' => 11, // نوع محصول: مبل تک نفره
            'Serial' => $serial,
            'Tedad' => $quantities['DA'],
            'Frim' => $product['frim_da'] ?? '',
            'Chob' => $product['color'] ?? '',
            'Parche' => $product['parche_da'] ?? '',
            'Comment' => $product['comment'] ?? '',
            'M_ID' => $product_code,
            'Cosan' => $product['cosan'] ?? '',
            'Poshti' => $product['poshti'] ?? ''
        ]);
    }
    
    // CA - دو نفره
    if (!empty($quantities['CA']) && $quantities['CA'] > 0) {
        $db->insert('Buy', [
            'ID_Agency' => $user_id,
            'A_ID' => 12, // نوع محصول: مبل دو نفره
            'Serial' => $serial,
            'Tedad' => $quantities['CA'],
            'Frim' => $product['frim_ca'] ?? '',
            'Chob' => $product['color'] ?? '',
            'Parche' => $product['parche_ca'] ?? '',
            'Comment' => $product['comment'] ?? '',
            'M_ID' => $product_code,
            'Cosan' => $product['cosan'] ?? '',
            'Poshti' => $product['poshti'] ?? ''
        ]);
    }
    
    // BA - سه نفره
    if (!empty($quantities['BA']) && $quantities['BA'] > 0) {
        $db->insert('Buy', [
            'ID_Agency' => $user_id,
            'A_ID' => 13, // نوع محصول: مبل سه نفره
            'Serial' => $serial,
            'Tedad' => $quantities['BA'],
            'Frim' => $product['frim_ba'] ?? '',
            'Chob' => $product['color'] ?? '',
            'Parche' => $product['parche_ba'] ?? '',
            'Comment' => $product['comment'] ?? '',
            'M_ID' => $product_code,
            'Cosan' => $product['cosan'] ?? '',
            'Poshti' => $product['poshti'] ?? ''
        ]);
    }
    
    // AA - کنج/پاف
    if (!empty($quantities['AA']) && $quantities['AA'] > 0) {
        $db->insert('Buy', [
            'ID_Agency' => $user_id,
            'A_ID' => 14, // نوع محصول: کنج/پاف
            'Serial' => $serial,
            'Tedad' => $quantities['AA'],
            'Frim' => $product['frim_aa'] ?? '',
            'Chob' => $product['color'] ?? '',
            'Parche' => $product['parche_aa'] ?? '',
            'Comment' => $product['comment'] ?? '',
            'M_ID' => $product_code,
            'Cosan' => $product['cosan'] ?? '',
            'Poshti' => $product['poshti'] ?? ''
        ]);
    }
}

function processSimpleProduct($db, $user_id, $serial, $product, $product_type, $product_code) {
    $base_data = [
        'A_ID' => $product_type,
        'Serial' => $serial,
        'ID_Agency' => $user_id,
        'Tedad' => $product['quantity'],
        'Chob' => $product['color'] ?? '',
        'Comment' => $product['comment'] ?? '',
        'M_ID' => $product_code
    ];
    
    // محصولات خاص (صندلی غذا خوری)
    if ($product_type == 3) {
        $base_data['Parche'] = $product['parche'] ?? '';
        $base_data['Frim'] = $product['frim'] ?? '';
    }
    
    $db->insert('Buy', $base_data);
}
?>