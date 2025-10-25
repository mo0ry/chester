console.log('🔧 DashboardManager.js script loading...');

class DashboardManager {
    constructor() {
        console.log('🚀 DashboardManager constructor called');
        this.apiClient = null;
        this.init();
    }

    async init() {
        console.log('🔧 DashboardManager.init() called');
        
        // صبر کن تا apiClient آماده شود
        await this.waitForApiClient();
        
        this.setupEventListeners();
        this.loadDashboardData();
    }

    waitForApiClient() {
        return new Promise((resolve) => {
            console.log('⏳ DashboardManager waiting for apiClient...');
            
            const checkApiClient = () => {
                if (window.apiClient && typeof window.apiClient.get === 'function') {
                    console.log('✅ DashboardManager - apiClient is ready!');
                    this.apiClient = window.apiClient;
                    resolve();
                } else {
                    console.log('⏳ DashboardManager - apiClient not ready yet...');
                    setTimeout(checkApiClient, 100);
                }
            };
            
            // همچنین به event گوش ده
            document.addEventListener('apiClientReady', () => {
                console.log('🎯 DashboardManager - apiClientReady event received');
                if (window.apiClient) {
                    this.apiClient = window.apiClient;
                    resolve();
                }
            });
            
            checkApiClient();
        });
    }

    setupEventListeners() {
        console.log('🔧 DashboardManager setting up event listeners...');
        
        // رفرش دستی داده‌ها
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDashboardData());
            console.log('✅ Refresh button event listener added');
        }

        // اتو رفرش هر 30 ثانیه
        setInterval(() => {
            this.loadDashboardData(false); // بدون نمایش loading
        }, 30000);
    }

    async loadDashboardData(showLoading = true) {
        console.log('📊 DashboardManager loading data...');
        
        // بررسی وجود apiClient
        if (!this.apiClient) {
            console.error('❌ DashboardManager - apiClient is not available!');
            this.showError('خطا در اتصال به سرور');
            return;
        }

        console.log('✅ DashboardManager - apiClient is available');

        try {
            if (showLoading) {
                this.showLoadingState();
            }

            console.log('📤 DashboardManager - Sending API requests...');
            
            // استفاده از داده‌های تستی تا زمانی که API واقعی آماده شود
            this.displayTestData();
            
            // وقتی API واقعی آماده شد، این خطوط را فعال کن:
            // const [statsResponse, ordersResponse] = await Promise.all([
            //     this.apiClient.get('dashboard/stats'),
            //     this.apiClient.get('orders/recent')
            // ]);
            // 
            // this.displayStats(statsResponse.data);
            // this.displayRecentOrders(ordersResponse.data);
            
            this.hideLoadingState();

        } catch (error) {
            console.error('❌ DashboardManager - Error loading data:', error);
            this.showError('خطا در بارگذاری داده‌های داشبورد');
            this.hideLoadingState();
        }
    }

    displayTestData() {
        console.log('📈 Displaying test data...');
        
        // داده‌های تستی
        const testStats = {
            summary: {
                total_orders: 24,
                active_orders: 8,
                pending_orders: 3,
                avg_delivery_days: 27
            }
        };

        const testOrders = [
            {
                serial: '140302001',
                product_name: 'مبلمان کلاسیک',
                status: 'completed',
                created_date: '1403/03/02',
                delivery_date: '1403/03/29',
                customer_name: 'علی محمدی'
            },
            {
                serial: '140301015',
                product_name: 'سرویس خواب مدرن',
                status: 'processing',
                created_date: '1403/03/01',
                delivery_date: '1403/03/28',
                customer_name: 'فاطمه احمدی'
            }
        ];

        this.displayStats(testStats);
        this.displayRecentOrders(testOrders);
    }

    displayStats(stats) {
        console.log('📊 Displaying stats...');
        
        // آمار کلی
        if (stats.summary) {
            const totalOrdersEl = document.getElementById('total-orders-count');
            const activeOrdersEl = document.getElementById('active-orders-count');
            const pendingOrdersEl = document.getElementById('pending-orders-count');
            const deliveryDaysEl = document.getElementById('delivery-days');

            if (totalOrdersEl) totalOrdersEl.textContent = stats.summary.total_orders || 0;
            if (activeOrdersEl) activeOrdersEl.textContent = stats.summary.active_orders || 0;
            if (pendingOrdersEl) pendingOrdersEl.textContent = stats.summary.pending_orders || 0;
            if (deliveryDaysEl) deliveryDaysEl.textContent = stats.summary.avg_delivery_days || 27;
        }

        console.log('✅ Stats displayed successfully');
    }

    displayRecentOrders(orders) {
        console.log('📋 Displaying recent orders...');
        
        const container = document.getElementById('orders-container');
        
        if (!container) {
            console.error('❌ Orders container not found');
            return;
        }

        if (!orders || orders.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('هنوز سفارشی ثبت نشده است');
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="dashboard-order-card dashboard-hover-lift">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <i class="fas fa-shopping-cart text-white/70"></i>
                        </div>
                        <div>
                            <div class="text-white font-semibold">سفارش #${order.serial}</div>
                            <div class="text-white/60 text-sm">${order.product_name || 'محصول نامشخص'}</div>
                        </div>
                    </div>
                    <div class="order-status status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div class="text-white/60">تاریخ ثبت:</div>
                        <div class="text-white">${order.created_date}</div>
                    </div>
                    <div>
                        <div class="text-white/60">تاریخ تحویل:</div>
                        <div class="text-white">${order.delivery_date}</div>
                    </div>
                </div>
                
                ${order.customer_name ? `
                    <div class="mt-3 pt-3 border-t border-white/10">
                        <div class="text-white/60 text-sm">مشتری:</div>
                        <div class="text-white text-sm">${order.customer_name}</div>
                    </div>
                ` : ''}
            </div>
        `).join('');

        console.log(`✅ ${orders.length} orders displayed`);
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'در انتظار',
            'processing': 'در حال پردازش',
            'completed': 'تکمیل شده',
            'delivered': 'تحویل شده'
        };
        return statusMap[status] || status;
    }

    showLoadingState() {
        console.log('🔄 Showing loading state...');
        const containers = ['orders-container', 'stats-container'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="dashboard-loading">
                        <i class="fas fa-spinner dashboard-loading-spinner"></i>
                        <div>در حال بارگذاری...</div>
                    </div>
                `;
            }
        });
    }

    hideLoadingState() {
        console.log('✅ Hiding loading state...');
        // پاک کردن حالت loading اگر نیاز باشد
    }

    showError(message) {
        console.error('❌ Showing error:', message);
        const messageContainer = document.getElementById('message-container') || this.createMessageContainer();
        const errorElement = document.createElement('div');
        errorElement.className = 'alert alert-error mb-2';
        errorElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle ml-2"></i>
                    <span>${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="text-inherit opacity-70 hover:opacity-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        messageContainer.appendChild(errorElement);
    }

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'message-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }

    getEmptyStateHTML(message) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <div class="text-white/60">${message}</div>
            </div>
        `;
    }
}

// مقداردهی اولیه با تاخیر برای اطمینان از لود شدن apiClient
console.log('🔧 Starting DashboardManager initialization...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - Creating DashboardManager');
    window.dashboardManager = new DashboardManager();
});

console.log('✅ DashboardManager.js script loaded');