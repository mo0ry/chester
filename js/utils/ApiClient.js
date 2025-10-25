console.log('🔧 ApiClient.js script loading...');

class ApiClient {
    constructor() {
        console.log('🚀 ApiClient constructor called');
        this.baseURL = this.getApiBaseUrl();
        this.token = null;
        this.initializeToken();
        console.log('✅ ApiClient initialized', {
            baseURL: this.baseURL,
            token: this.token ? '***' : 'null'
        });
    }

    log(message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[ApiClient ${timestamp}] ${message}`;
        console.log(logMessage, data || '');
    }

    initializeToken() {
        this.log('Initializing token...');
        if (typeof TokenManager !== 'undefined') {
            this.token = TokenManager.getToken();
            this.log('TokenManager found, token:', this.token ? '***' : 'null');
        } else {
            this.log('❌ TokenManager not defined yet');
        }
    }

    getApiBaseUrl() {
        // استفاده از مقدار global اگر وجود دارد
        if (window.API_BASE_URL) {
            return window.API_BASE_URL;
        }

        // محاسبه داینامیک
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/');
        
        // حذف فایل از مسیر
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart.includes('.html') || lastPart === '') {
            pathParts.pop();
        }
        
        const basePath = pathParts.join('/');
        return window.location.origin + basePath + '/api';
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

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    setToken(token) {
        this.token = token;
        if (typeof TokenManager !== 'undefined') {
            TokenManager.setToken(token);
        }
    }
}

// ایجاد instance جهانی - روش مطمئن‌تر
function initializeApiClient() {
    console.log('🔧 Initializing ApiClient...');
    
    // صبر کن تا TokenManager لود شود
    if (typeof TokenManager === 'undefined') {
        console.log('⏳ Waiting for TokenManager...');
        setTimeout(initializeApiClient, 100);
        return;
    }

    try {
        window.apiClient = new ApiClient();
        console.log('✅ ApiClient created successfully');
        
        // اطلاع به کامپوننت‌های دیگر
        document.dispatchEvent(new CustomEvent('apiClientReady'));
        
    } catch (error) {
        console.error('❌ Failed to create ApiClient:', error);
    }
}

// شروع فرآیند مقداردهی اولیه
console.log('🚀 Starting ApiClient initialization...');
setTimeout(initializeApiClient, 100);