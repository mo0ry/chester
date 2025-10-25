<?php
class AuthManager {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    public function authenticate($username, $password) {
        try {
            // استفاده از جدول MGT.Agency مانند سیستم موجود
            $sql = "SELECT * FROM MGT.Agency WHERE UserName = ? AND PassWord = ?";
            $stmt = $this->db->query($sql, [$username, $password]);
            $user = $stmt->fetch();
            
            if ($user) {
                // ایجاد توکن
                $token = $this->createUserToken($user['ID']);
                
                return [
                    'success' => true,
                    'token' => $token,
                    'user' => [
                        'id' => $user['ID'],
                        'username' => $user['UserName'],
                        'name' => ($user['FirstName'] ?? '') . ' ' . ($user['LastName'] ?? ''),
                        'status' => $user['Status'] ?? '0'
                    ]
                ];
            }
            
            return ['success' => false, 'error' => 'نام کاربری یا رمز عبور اشتباه است'];
            
        } catch (Exception $e) {
            error_log("Authentication error: " . $e->getMessage());
            return ['success' => false, 'error' => 'خطا در احراز هویت'];
        }
    }
    
    private function createUserToken($userId) {
        $token = generateToken(32);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));
        
        // ذخیره توکن در دیتابیس
        $this->db->insert('MGT.UserTokens', [
            'user_id' => $userId,
            'token' => $token,
            'expires_at' => $expiresAt,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        return $token;
    }
    
    public function validateToken($token) {
        try {
            $sql = "SELECT u.* FROM MGT.UserTokens ut 
                    JOIN MGT.Agency u ON ut.user_id = u.ID 
                    WHERE ut.token = ? AND ut.expires_at > GETDATE()";
            $stmt = $this->db->query($sql, [$token]);
            $user = $stmt->fetch();
            
            return $user ?: null;
            
        } catch (Exception $e) {
            error_log("Token validation error: " . $e->getMessage());
            return null;
        }
    }
    
    public function logout($token) {
        try {
            $sql = "DELETE FROM MGT.UserTokens WHERE token = ?";
            $this->db->query($sql, [$token]);
            return true;
        } catch (Exception $e) {
            error_log("Logout error: " . $e->getMessage());
            return false;
        }
    }
}
?>