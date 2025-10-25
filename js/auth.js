// مدیریت سیستم احراز هویت
class AuthManager {
    constructor() {
        this.currentTab = 'user';
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.setupLoginForms();
        // حذف چک session خودکار - این باعث رفرش می‌شود
        // this.checkExistingSession();
    }

    // مدیریت تغییر تب‌ها
    setupTabSwitching() {
        const userTab = document.getElementById('user-tab');
        const adminTab = document.getElementById('admin-tab');
        const userForm = document.getElementById('user-login-form');
        const adminForm = document.getElementById('admin-login-form');

        if (userTab && adminTab) {
            userTab.addEventListener('click', () => this.switchTab('user', userTab, adminTab, userForm, adminForm));
            adminTab.addEventListener('click', () => this.switchTab('admin', userTab, adminTab, userForm, adminForm));
        }
    }

    switchTab(tab, userTab, adminTab, userForm, adminForm) {
        this.currentTab = tab;
        
        if (tab === 'user') {
            userTab.classList.add('active');
            adminTab.classList.remove('active');
            userForm.classList.remove('hidden');
            adminForm.classList.add('hidden');
        } else {
            adminTab.classList.add('active');
            userTab.classList.remove('active');
            adminForm.classList.remove('hidden');
            userForm.classList.add('hidden');
        }
    }

    // مدیریت فرم‌های ورود
    setupLoginForms() {
        const userForm = document.getElementById('user-login-form');
        const adminForm = document.getElementById('admin-login-form');

        if (userForm) {
            userForm.addEventListener('submit', (e) => this.handleLogin(e, 'user'));
        }

        if (adminForm) {
            adminForm.addEventListener('submit', (e) => this.handleLogin(e, 'admin'));
        }
    }

    // پردازش ورود
    async handleLogin(event, type) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalContent = submitBtn.innerHTML;

        // نمایش حالت لودینگ
        this.setLoadingState(submitBtn, true);

        try {
            const endpoint = type === 'user' ? 'user_login' : 'admin_login';
            const response = await this.makeApiRequest(endpoint, data);

            if (response.success) {
                await this.handleSuccessfulLogin(response, type);
            } else {
                this.showError(response.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.');
        } finally {
            this.setLoadingState(submitBtn, false, originalContent);
        }
    }

    // درخواست API
    async makeApiRequest(action, data) {
        const apiUrl = this.getApiUrl();
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ...data
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // دریافت URL API
    getApiUrl() {
        // اگر از ساختار جدید API استفاده می‌کنیم
        if (window.API_BASE_URL) {
            return `${window.API_BASE_URL}/${this.currentTab === 'user' ? 'user_login' : 'admin_login'}`;
        }
        
        // ساختار قدیمی
        return 'api.php';
    }

    // مدیریت ورود موفق
	async handleSuccessfulLogin(response, type) {
		if (type === 'user') {
			localStorage.setItem('user_token', response.token);
			localStorage.setItem('user_data', JSON.stringify(response.user));
			
			this.showSuccess('ورود موفق! در حال انتقال...');
			
			// انتقال به داشبورد
			setTimeout(() => {
				window.location.href = 'dashboard.html';
			}, 1500);
		} else {
			localStorage.setItem('admin_token', response.token);
			localStorage.setItem('admin_data', JSON.stringify(response.user));
			
			this.showSuccess('ورود مدیر موفق! در حال انتقال...');
			
			// انتقال به پنل مدیریت
			setTimeout(() => {
				window.location.href = 'admin.html';
			}, 1500);
		}
	}

    // بررسی وجود session قبلی
	    /*
    checkExistingSession() {
        const userToken = localStorage.getItem('user_token');
        const adminToken = localStorage.getItem('admin_token');

        if (userToken) {
            // اگر توکن کاربر وجود دارد، به داشبورد منتقل شو
            window.location.href = 'dashboard.html';
        } else if (adminToken) {
            // اگر توکن ادمین وجود دارد، به پنل مدیریت منتقل شو
            window.location.href = 'admin.html';
        }
    }
*/

    // تنظیم حالت لودینگ
    setLoadingState(button, isLoading, originalContent = null) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner animate-spin"></i><span>در حال ورود...</span>';
        } else {
            button.disabled = false;
            if (originalContent) {
                button.innerHTML = originalContent;
            }
        }
    }

    // نمایش خطا
    showError(message) {
        this.showMessage(message, 'error');
    }

    // نمایش موفقیت
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    // نمایش پیام
    showMessage(message, type = 'error') {
        const resultDiv = document.getElementById('login-result');
        if (!resultDiv) return;

        const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';

        resultDiv.innerHTML = `
            <div class="alert ${alertClass}">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            </div>
        `;

        // حذف خودکار پیام خطا بعد از 5 ثانیه
        if (type === 'error') {
            setTimeout(() => {
                resultDiv.innerHTML = '';
            }, 5000);
        }
    }

    // خروج از سیستم
    static logout(type = 'user') {
        if (type === 'user') {
            localStorage.removeItem('user_token');
            localStorage.removeItem('user_data');
        } else {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_data');
        }
        
        window.location.href = 'index.html';
    }

    // بررسی اعتبار توکن
    static async validateToken(type = 'user') {
        const token = type === 'user' 
            ? localStorage.getItem('user_token') 
            : localStorage.getItem('admin_token');

        if (!token) {
            return false;
        }

        try {
            const endpoint = type === 'user' ? 'get_user_licenses' : 'get_stats';
            const apiUrl = window.API_BASE_URL ? `${window.API_BASE_URL}/${endpoint}` : 'api.php';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: endpoint,
                    token: token
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }
}

// راه‌اندازی زمانی که DOM لود شد
document.addEventListener('DOMContentLoaded', function() {
    new AuthManager();
});

// توابع global برای استفاده در سایر فایل‌ها
window.AuthManager = AuthManager;