// توابع کمکی و utility

// مدیریت API calls
// مدیریت API calls
class ApiClient {
    static async request(endpoint, data = {}) {
        // ساخت آدرس کامل API
        let apiUrl;
        if (window.API_BASE_URL) {
            // استفاده از آدرس کامل
            if (window.API_BASE_URL.startsWith('http')) {
                // آدرس کامل
                apiUrl = `${window.API_BASE_URL}/${endpoint}`;
            } else {
                // آدرس نسبی - تبدیل به کامل
                const basePath = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/');
                apiUrl = `${basePath}/${window.API_BASE_URL}/${endpoint}`;
            }
        } else {
            // حالت پیش‌فرض
            apiUrl = `api/${endpoint}`;
        }
        
        console.log('API Request:', { 
            apiUrl, 
            endpoint, 
            basePath: window.location.origin + window.location.pathname,
            fullUrl: apiUrl 
        });

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            console.error('Request details:', { apiUrl, data });
            throw error;
        }
    }

    static async requestWithToken(endpoint, data = {}, type = 'user') {
        const token = type === 'user' 
            ? localStorage.getItem('user_token') 
            : localStorage.getItem('admin_token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        return await this.request(endpoint, { ...data, token });
    }
}

// مدیریت notifications
class NotificationManager {
    static show(message, type = 'info', duration = 5000) {
        // ایجاد container برای notifications اگر وجود ندارد
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        // ایجاد notification
        const notification = document.createElement('div');
        const alertClass = this.getAlertClass(type);
        const icon = this.getIcon(type);

        notification.className = `alert ${alertClass}`;
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="mr-auto text-inherit opacity-70 hover:opacity-100">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // حذف خودکار
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }

        return notification;
    }

    static getAlertClass(type) {
        const classes = {
            success: 'alert-success',
            error: 'alert-error',
            warning: 'alert-warning',
            info: 'alert-info'
        };
        return classes[type] || classes.info;
    }

    static getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// مدیریت فرم‌ها
class FormManager {
    static serializeForm(form) {
        const formData = new FormData(form);
        return Object.fromEntries(formData);
    }

    static setLoading(form, isLoading) {
        const buttons = form.querySelectorAll('button[type="submit"]');
        buttons.forEach(button => {
            if (isLoading) {
                button.disabled = true;
                const originalText = button.innerHTML;
                button.setAttribute('data-original-text', originalText);
                button.innerHTML = '<i class="fas fa-spinner animate-spin"></i><span>در حال پردازش...</span>';
            } else {
                button.disabled = false;
                const originalText = button.getAttribute('data-original-text');
                if (originalText) {
                    button.innerHTML = originalText;
                }
            }
        });
    }

    static showFormError(form, message) {
        let errorDiv = form.querySelector('.form-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error alert alert-error';
            form.prepend(errorDiv);
        }
        
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    static clearFormErrors(form) {
        const errors = form.querySelectorAll('.form-error');
        errors.forEach(error => error.remove());
    }
}

// مدیریت localStorage با انقضا
class StorageManager {
    static set(key, value, expiryMinutes = null) {
        const item = {
            value: value,
            timestamp: new Date().getTime()
        };

        if (expiryMinutes) {
            item.expiry = expiryMinutes * 60 * 1000; // تبدیل به میلی‌ثانیه
        }

        localStorage.setItem(key, JSON.stringify(item));
    }

    static get(key) {
        const itemStr = localStorage.getItem(key);
        
        if (!itemStr) {
            return null;
        }

        try {
            const item = JSON.parse(itemStr);
            
            // بررسی انقضا
            if (item.expiry && (new Date().getTime() - item.timestamp > item.expiry)) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch (error) {
            console.error('Error parsing stored item:', error);
            return null;
        }
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static clear() {
        localStorage.clear();
    }
}

// توابع utility
const utils = {
    // فرمت‌بندی اعداد
    formatNumber(num) {
        return new Intl.NumberFormat('fa-IR').format(num);
    },

    // فرمت‌بندی تاریخ
    formatDate(date, includeTime = false) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            calendar: 'persian',
            numberingSystem: 'arab'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return new Intl.DateTimeFormat('fa-IR', options).format(new Date(date));
    },

    // کپی به کلیپ‌بورد
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            NotificationManager.show('متن با موفقیت کپی شد', 'success', 2000);
            return true;
        } catch (error) {
            console.error('Failed to copy text:', error);
            NotificationManager.show('خطا در کپی کردن متن', 'error');
            return false;
        }
    },

    // ایجاد تاخیر
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // بررسی اینکه آیا موبایل است یا نه
    isMobile() {
        return window.innerWidth <= 768;
    }
};

// قرار دادن توابع در global scope برای دسترسی آسان
window.ApiClient = ApiClient;
window.NotificationManager = NotificationManager;
window.FormManager = FormManager;
window.StorageManager = StorageManager;
window.utils = utils;

// راه‌اندازی زمانی که DOM لود شد
document.addEventListener('DOMContentLoaded', function() {
    // اضافه کردن کلاس‌های responsive به body
    if (utils.isMobile()) {
        document.body.classList.add('mobile');
    }

    // مدیریت resize window
    window.addEventListener('resize', () => {
        if (utils.isMobile()) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
    });
});