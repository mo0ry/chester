<?php
class Database {
    private $connection;
    
    public function __construct() {
        try {
            $this->connection = new PDO(
                "sqlsrv:Server=" . DB_HOST . ";Database=" . DB_NAME,
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::SQLSRV_ATTR_ENCODING => PDO::SQLSRV_ENCODING_UTF8
                ]
            );
            
            // ایجاد جدول توکن‌ها اگر وجود ندارد
            $this->createTokensTable();
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Connection failed: " . $e->getMessage());
        }
    }
    
    private function createTokensTable() {
        try {
            // بررسی وجود جدول توکن‌ها
            $checkTable = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                          WHERE TABLE_SCHEMA = 'MGT' AND TABLE_NAME = 'UserTokens'";
            $tableExists = $this->query($checkTable)->fetchColumn();
            
            if (!$tableExists) {
                $createTable = "
                CREATE TABLE MGT.UserTokens (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    user_id INT NOT NULL,
                    token NVARCHAR(255) NOT NULL UNIQUE,
                    expires_at DATETIME2 NOT NULL,
                    created_at DATETIME2 DEFAULT GETDATE(),
                    last_used_at DATETIME2 NULL,
                    is_active BIT DEFAULT 1,
                    
                    FOREIGN KEY (user_id) REFERENCES MGT.Agency(ID) ON DELETE CASCADE
                );
                
                CREATE INDEX IX_UserTokens_Token ON MGT.UserTokens (token);
                CREATE INDEX IX_UserTokens_UserID ON MGT.UserTokens (user_id);
                CREATE INDEX IX_UserTokens_Expires ON MGT.UserTokens (expires_at);
                ";
                
                $this->connection->exec($createTable);
                error_log("UserTokens table created successfully");
            }
            
        } catch (Exception $e) {
            error_log("Error creating tokens table: " . $e->getMessage());
        }
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query failed: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function select($table, $columns = '*', $where = '', $params = []) {
        $sql = "SELECT $columns FROM $table";
        if ($where) {
            $sql .= " WHERE $where";
        }
        return $this->query($sql, $params)->fetchAll();
    }
    
    public function insert($table, $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
        
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($data);
        return $this->connection->lastInsertId();
    }
    
    public function update($table, $data, $where, $whereParams = []) {
        $setParts = [];
        foreach (array_keys($data) as $column) {
            $setParts[] = "$column = :$column";
        }
        $setClause = implode(', ', $setParts);
        
        $sql = "UPDATE $table SET $setClause WHERE $where";
        $stmt = $this->connection->prepare($sql);
        return $stmt->execute(array_merge($data, $whereParams));
    }
    
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM $table WHERE $where";
        $stmt = $this->connection->prepare($sql);
        return $stmt->execute($params);
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollBack() {
        return $this->connection->rollBack();
    }
}
?>