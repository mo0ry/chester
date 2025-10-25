<?php
// بررسی method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Wrong method: " . $_SERVER['REQUEST_METHOD']);
    Response::error('Method not allowed. Use POST.', 405);
}
// دریافت داده‌های ورودی
$input = json_decode(file_get_contents('php://input'), true);

// اعتبارسنجی
if (empty($input['username']) || empty($input['password'])) {
    error_log("Validation failed - missing username or password");
    Response::error('نام کاربری و رمز عبور الزامی است');
}

// پاسخ موفق
$responseData = [
    'token' => 'test_token_' . bin2hex(random_bytes(16)),
    'user' => [
        'id' => 1,
        'username' => $input['username'],
        'name' => 'کاربر ' . $input['username'],
        'status' => '0'
    ]
];

Response::success($responseData, 'ورود موفقیت‌آمیز بود');
?>