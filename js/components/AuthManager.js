console.log('🔧 AuthManager.js script loading...');

class AuthManager {
    constructor() {
        console.log('🚀 AuthManager constructor called');
        this.apiClient = null;
        this.init();
    }

    async init() {
        console.log('🔧 AuthManager.init() called');
        
        // صبر کن تا apiClient آماده شود
        await this.waitForApiClient();
        
        this.checkAuthentication();
        this.setupEventListeners();
    }

    waitForApiClient() {
        return new Promise((resolve) => {
            console.log('⏳ Waiting for apiClient...');
            
            const checkApiClient = () => {
                if (window.apiClient && typeof window.apiClient.post === 'function') {
                    console.log('✅ apiClient is ready!');
                    this.apiClient = window.apiClient;
                    resolve();
                } else {
                    console.log('⏳ apiClient not ready yet, checking again...');
                    setTimeout(checkApiClient, 100);
                }
            };
            
            // همچنین به event گوش ده
            document.addEventListener('apiClientReady', () => {
                console.log('🎯 apiClientReady event received');
                if (window.apiClient) {
                    this.apiClient = window.apiClient;
                    resolve();
                }
            });
            
            checkApiClient();
        });
    }

async request(endpoint, options = {}) {
    const url = `${this.baseURL}/${endpoint}`;
    
    this.log('📤 Making API request', {
        endpoint,
        url,
        method: options.method || 'GET',
        hasToken: !!this.token
    });

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (this.token) {
        config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
        const response = await fetch(url, config);
        
        // بررسی وضعیت HTTP
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        // بررسی ساختار پاسخ
        if (result && typeof result.success !== 'undefined') {
            return result;
        } else {
            throw new Error('پاسخ سرور نامعتبر است');
        }

    } catch (error) {
        this.log('💥 API request failed', error.message);
        throw error;
    }
}
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        const loginForm = document.getElementById('user-login-form');
        console.log('📝 Login form found:', !!loginForm);
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('✅ Login form event listener added');
        }

        const logoutBtn = document.getElementById('logout-btn');
        console.log('🚪 Logout button found:', !!logoutBtn);
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
            console.log('✅ Logout button event listener added');
        }
    }

	async handleLogin(event) {
		console.log('🔐 handleLogin called');
		event.preventDefault();
		
		if (!this.apiClient) {
			console.error('❌ apiClient is not available!');
			this.showMessage('خطا در اتصال به سرور', 'error');
			return;
		}

		const form = event.target;
		const formData = new FormData(form);
		const data = {
			username: formData.get('username')?.toString().trim(),
			password: formData.get('password')?.toString()
		};
		
		// اعتبارسنجی اولیه
		if (!data.username || !data.password) {
			this.showMessage('نام کاربری و رمز عبور الزامی است', 'error');
			return;
		}

		const submitBtn = form.querySelector('button[type="submit"]');
		const originalText = submitBtn.innerHTML;

		try {
			this.setLoadingState(submitBtn, true);
			const response = await this.apiClient.post('auth/login', data);

			if (response.success && response.data && response.data.token) {
				TokenManager.setToken(response.data.token);
				TokenManager.setUser(response.data.user);
				this.apiClient.setToken(response.data.token);

				this.showMessage('ورود موفقیت‌آمیز بود!', 'success');
				setTimeout(() => {
					window.location.href = './dashboard.html';
				}, 1000);
			} else {
				throw new Error(response.error || 'خطا در ورود');
			}

		} catch (error) {
			console.error('❌ Login failed:', error);
			const errorMessage = error.message.includes('HTTP') 
				? 'خطا در ارتباط با سرور' 
				: error.message;
			this.showMessage(errorMessage, 'error');
		} finally {
			this.setLoadingState(submitBtn, false, originalText);
		}
	}

    async handleLogout() {
        console.log('🚪 handleLogout called');
        try {
            if (this.apiClient) {
                await this.apiClient.post('auth/logout');
            }
        } catch (error) {
            console.error('❌ Logout API call failed:', error);
        } finally {
            TokenManager.clearToken();
            window.location.href = './index.html';
        }
    }

    checkAuthentication() {
        console.log('🔐 checkAuthentication called');
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('index.html') || currentPage.endsWith('/');
        const isAuthenticated = TokenManager.isAuthenticated();

        console.log('📊 Auth status:', {
            currentPage,
            isLoginPage,
            isAuthenticated
        });

        if (isAuthenticated && isLoginPage) {
            console.log('🔄 Redirecting to dashboard...');
            window.location.href = './dashboard.html';
        } else if (!isAuthenticated && !isLoginPage) {
            console.log('🔄 Redirecting to login...');
            window.location.href = './index.html';
        } else {
            console.log('✅ User is on correct page');
            this.displayUserInfo();
        }
    }

    displayUserInfo() {
        console.log('👤 displayUserInfo called');
        const user = TokenManager.getUser();
        if (user) {
            const userElements = document.querySelectorAll('[data-user-info]');
            userElements.forEach(element => {
                const infoType = element.getAttribute('data-user-info');
                if (infoType === 'name') {
                    element.textContent = user.name;
                } else if (infoType === 'username') {
                    element.textContent = user.username;
                }
            });
        }
    }

    setLoadingState(button, isLoading, originalContent = null) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال پردازش...';
        } else {
            button.disabled = false;
            if (originalContent) {
                button.innerHTML = originalContent;
            }
        }
    }

    showMessage(message, type = 'info') {
        console.log('💬 showMessage:', type, message);
        
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }

        const messageElement = document.createElement('div');
        const alertClass = type === 'error' ? 'alert-error' : 
                          type === 'success' ? 'alert-success' : 'alert-info';
        
        messageElement.className = `alert ${alertClass} mb-2`;
        messageElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 
                                  type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} 
                       ml-2"></i>
                    <span>${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="text-inherit opacity-70 hover:opacity-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        messageContainer.appendChild(messageElement);

        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, 5000);
    }
}

// مقداردهی اولیه
console.log('🔧 Starting AuthManager initialization...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - Creating AuthManager');
    window.authManager = new AuthManager();
});