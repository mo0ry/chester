<?php
class ProductManager {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function getProducts($filters = []) {
        $where_conditions = ["Active = 1"];
        $params = [];
        
        // فیلتر بر اساس Status
        if (!empty($filters['Statos'])) {
            $where_conditions[] = "Statos = :statos";
            $params[':Statos'] = $filters['Statos'];
        }
        
        // فیلتر جستجو
        if (!empty($filters['search'])) {
            $where_conditions[] = "(NameFA LIKE :search OR Code LIKE :search)";
            $params[':search'] = "%{$filters['search']}%";
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
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
                    PriceB, 
                    PriceC,
                    PriceD,
                    Statos,
                    Active
                FROM Products 
                WHERE $where_clause 
                ORDER BY NameFA";
        
        $stmt = $this->db->query($sql, $params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $this->formatProducts($products);
    }
    
    public function getProductByCode($code) {
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
                    PriceB, 
                    PriceC,
                    PriceD,
                    Statos,
                    Active
                FROM Products 
                WHERE Code = :code AND Active = 1";
        
        $stmt = $this->db->query($sql, [':code' => $code]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $product ? $this->formatProduct($product) : null;
    }
    
    private function formatProducts($products) {
        $formatted = [];
        
        foreach ($products as $product) {
            $formatted[] = $this->formatProduct($product);
        }
        
        return $formatted;
    }
    
    private function formatProduct($product) {
        return [
            'Code' => $product['Code'],
            'NameFA' => $product['NameFA'],
            'Name' => $product['NameFA'], // برای سازگاری با فرانت‌اند
            'NameEN' => $product['NameEN'],
            'Color' => $product['Color'],
            'Comment' => $product['Comment'],
            'DA' => $product['DA'],
            'CA' => $product['CA'], 
            'BA' => $product['BA'],
            'AA' => $product['AA'],
            'Category' => $this->getCategoryName($product['Statos']),
            'Statos' => $product['Statos'],
            'Price' => $product['PriceA'], // قیمت پیش‌فرض
            'Active' => $product['Active'],
            'Cloth' => $product['Cloth'],
            'PriceA' => $product['PriceA'],
            'PriceB' => $product['PriceB'],
            'PriceC' => $product['PriceC'],
            'PriceD' => $product['PriceD']
        ];
    }
    
    private function getCategoryName($status) {
        $categories = [
            11 => 'مبلمان',
            2 => 'جلو مبلی',
            3 => 'صندلی غذا خوری',
            4 => 'میز غذا خوری',
            5 => 'عسلی',
            6 => 'سایر محصولات',
            7 => 'کنسول',
            8 => 'میز تلویزیون',
            9 => 'سرویس خواب'
        ];
        
        return $categories[$status] ?? 'سایر';
    }
    
    public function getProductQuantities($code) {
        $product = $this->getProductByCode($code);
        
        if (!$product) {
            return null;
        }
        
        return [
            'DA' => $product['DA'],
            'CA' => $product['CA'],
            'BA' => $product['BA'], 
            'AA' => $product['AA']
        ];
    }
}
?>