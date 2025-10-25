<?php
// تعریف مسیر اصلی
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__DIR__, 2) . DIRECTORY_SEPARATOR);
}

class Loader {
    private static $instance = null;
    private $database;
    private $authManager;
    private $initialized = false;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->initialize();
    }
    
    private function initialize() {
        if ($this->initialized) {
            return;
        }
        
        try {
            // بارگذاری تنظیمات با مسیر مطلق
            $config_file = ABSPATH . 'library' . DIRECTORY_SEPARATOR . 'config.php';
            if (!file_exists($config_file)) {
                throw new Exception('فایل پیکربندی یافت نشد: ' . $config_file);
            }
            
            require_once $config_file;
            
            // بارگذاری کلاس Response
            $response_file = ABSPATH . 'library' . DIRECTORY_SEPARATOR . 'core' . DIRECTORY_SEPARATOR . 'Response.php';
            if (!file_exists($response_file)) {
                throw new Exception('فایل Response یافت نشد: ' . $response_file);
            }
            require_once $response_file;
            
            // تنظیم CORS
            Response::cors();
            
            // بارگذاری دیتابیس
            $database_file = ABSPATH . 'library' . DIRECTORY_SEPARATOR . 'core' . DIRECTORY_SEPARATOR . 'database.php';
            if (!file_exists($database_file)) {
                throw new Exception('فایل database یافت نشد: ' . $database_file);
            }
            require_once $database_file;
            
            try {
                $this->database = new Database();
            } catch (PDOException $e) {
                throw new Exception('خطا در اتصال به دیتابیس: ' . $e->getMessage());
            }
            
            // بارگذاری AuthManager
            $auth_manager_file = ABSPATH . 'library' . DIRECTORY_SEPARATOR . 'managers' . DIRECTORY_SEPARATOR . 'AuthManager.php';
            if (file_exists($auth_manager_file)) {
                require_once $auth_manager_file;
                $this->authManager = new AuthManager();
            }
            
            // بارگذاری jdf
            $jdf_file = ABSPATH . 'library' . DIRECTORY_SEPARATOR . 'jdf.php';
            if (file_exists($jdf_file)) {
                require_once $jdf_file;
            }
            
            $this->initialized = true;
            
        } catch (Exception $e) {
            error_log("Loader initialization error: " . $e->getMessage());
            if (class_exists('Response')) {
                Response::error($e->getMessage(), 500);
            } else {
                // Fallback response
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    }
    
    public function getDatabase() {
        if (!$this->initialized) {
            $this->initialize();
        }
        return $this->database;
    }
    
    public function getAuthManager() {
        if (!$this->initialized) {
            $this->initialize();
        }
        return $this->authManager;
    }
    
    public function authenticate($requireAuth = true) {
        if (!$requireAuth) {
            return null;
        }
        
        $token = $this->getBearerToken();
        
        if (empty($token)) {
            Response::error('توکن احراز هویت ارسال نشده است', 401);
        }
        
        if (!$this->authManager) {
            Response::error('سیستم احراز هویت در دسترس نیست', 500);
        }
        
        $user = $this->authManager->validateToken($token);
        
        if (!$user) {
            Response::error('توکن نامعتبر یا منقضی شده است', 401);
        }
        
        return $user;
    }
    
    public function requireAuthentication() {
        return $this->authenticate(true);
    }
    
    public function optionalAuthentication() {
        return $this->authenticate(false);
    }
    
    public function getInputData() {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (strpos($contentType, 'application/json') !== false) {
            $input = json_decode(file_get_contents('php://input'), true);
            return $input ?? [];
        }
        
        if ($method === 'POST') {
            return $_POST;
        }
        
        return $_GET;
    }
    
    public function validateRequiredFields($data, $requiredFields) {
        $errors = [];
        
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $errors[] = "فیلد {$field} الزامی است";
            }
        }
        
        if (!empty($errors)) {
            Response::error(implode(' | ', $errors));
        }
        
        return true;
    }
    
    public function checkMethod($allowedMethods) {
        $currentMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        if (!in_array($currentMethod, (array)$allowedMethods)) {
            Response::error('Method not allowed. Use: ' . implode(', ', (array)$allowedMethods), 405);
        }
        
        return true;
    }
    
    public function sanitizeData($data) {
        if (is_array($data)) {
            return array_map([$this, 'sanitizeData'], $data);
        }
        
        if (is_string($data)) {
            // حذف تگ‌های HTML و اسکریپت‌های خطرناک
            $data = strip_tags($data);
            // حذف اسلش‌های اضافه
            $data = stripslashes($data);
            // تبدیل کاراکترهای خاص
            $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        }
        
        return $data;
    }
    
    public function logAction($action, $details = '', $userId = null) {
        $logFile = ABSPATH . 'logs/api_actions.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        $logMessage = "[{$timestamp}] [{$ip}]";
        
        if ($userId) {
            $logMessage .= " [User:{$userId}]";
        }
        
        $logMessage .= " {$action}";
        
        if ($details) {
            if (is_array($details)) {
                $details = json_encode($details, JSON_UNESCAPED_UNICODE);
            }
            $logMessage .= " - {$details}";
        }
        
        $logMessage .= " [UA: {$userAgent}]" . PHP_EOL;
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    public function generateOrderNumber() {
        $db = $this->getDatabase();
        
        try {
            if (function_exists('jdate')) {
                $fullYear = jdate('Y');
                $yy_clean = str_replace('14', '', $fullYear);
                $mm = jdate('m');
                $dd = jdate('d');
                $prefix = $yy_clean . $mm . $dd;
            } else {
                $prefix = date('ymd');
            }

            $sql = "SELECT TOP 1 Serial FROM PSefaresh ORDER BY Pish_ID DESC";
            $stmt = $db->query($sql);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                $serial = $prefix . '001';
            } else {
                $old = $row['Serial'];
                if (strpos($old, $prefix) === 0) {
                    $suffix = intval(substr($old, strlen($prefix)));
                    $newSuffix = str_pad($suffix + 1, 3, '0', STR_PAD_LEFT);
                    $serial = $prefix . $newSuffix;
                } else {
                    $serial = $prefix . '001';
                }
            }

            return $serial;
        } catch (Exception $e) {
            error_log("generateOrderNumber error: " . $e->getMessage());
            // Fallback
            return 'ORD-' . time() . '-' . mt_rand(1000, 9999);
        }
    }
    
    public function convertJalaliToGregorian($jalaliDate) {
        if (empty($jalaliDate)) {
            return date('Y-m-d');
        }
        
        // اگر تاریخ میلادی است، برگردان
        if (strpos($jalaliDate, '-') !== false) {
            return $jalaliDate;
        }
        
        // تبدیل تاریخ شمسی به میلادی
        if (function_exists('jalali_to_gregorian')) {
            $dateParts = explode('/', $jalaliDate);
            if (count($dateParts) === 3) {
                $gregorian = jalali_to_gregorian($dateParts[0], $dateParts[1], $dateParts[2]);
                return $gregorian[0] . '-' . str_pad($gregorian[1], 2, '0', STR_PAD_LEFT) . '-' . str_pad($gregorian[2], 2, '0', STR_PAD_LEFT);
            }
        }
        
        return date('Y-m-d');
    }
    
    public function convertToJalali($gregorianDate) {
        if (empty($gregorianDate)) return '';
        
        $timestamp = strtotime($gregorianDate);
        if ($timestamp === false) return '';
        
        if (function_exists('jdate')) {
            return jdate('Y/m/d H:i', $timestamp);
        }
        
        return date('Y/m/d H:i', $timestamp);
    }
    
    private function getBearerToken() {
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
        
        if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
        
        // بررسی در GET یا POST
        if (!empty($_GET['token'])) {
            return $_GET['token'];
        }
        
        $input = $this->getInputData();
        if (!empty($input['token'])) {
            return $input['token'];
        }
        
        return null;
    }
	
	public function getProductManager() {
		if (!$this->initialized) {
			$this->initialize();
		}
		
		// بارگذاری ProductManager اگر نیاز باشد
		$product_manager_file = ABSPATH . 'library' . DIRECTORY_SEPARATOR . 'managers' . DIRECTORY_SEPARATOR . 'ProductManager.php';
		if (file_exists($product_manager_file)) {
			require_once $product_manager_file;
			return new ProductManager($this->database);
		}
		
		throw new Exception('ProductManager not available');
	}
}

// تابع global برای دسترسی آسان
function getLoader() {
    return Loader::getInstance();
}

// تابع کمکی برای لاگ
function log_action($action, $details = '', $userId = null) {
    return getLoader()->logAction($action, $details, $userId);
}
?>