console.log('🔧 TokenManager.js script loading...');

class TokenManager {
    static getToken() {
        const token = localStorage.getItem('furniture_token');
        console.log('🔑 TokenManager.getToken():', token ? '***' : 'null');
        return token;
    }

    static setToken(token) {
        console.log('💾 TokenManager.setToken():', token ? '***' : 'null');
        localStorage.setItem('furniture_token', token);
    }

    static clearToken() {
        console.log('🗑️ TokenManager.clearToken()');
        localStorage.removeItem('furniture_token');
        localStorage.removeItem('furniture_user');
    }

    static getUser() {
        const userStr = localStorage.getItem('furniture_user');
        const user = userStr ? JSON.parse(userStr) : null;
        console.log('👤 TokenManager.getUser():', user);
        return user;
    }

    static setUser(user) {
        console.log('💾 TokenManager.setUser():', user);
        localStorage.setItem('furniture_user', JSON.stringify(user));
    }

    static isAuthenticated() {
        const token = this.getToken();
        const isAuth = !!token;
        console.log('🔐 TokenManager.isAuthenticated():', isAuth);
        return isAuth;
    }

    static async validateToken() {
        console.log('✅ TokenManager.validateToken() called');
        if (!this.isAuthenticated()) {
            console.log('❌ No token to validate');
            return false;
        }

        try {
            console.log('🔍 Validating token with API...');
            const response = await window.apiClient.get('auth/validate');
            console.log('✅ Token validation result:', response.success);
            return response.success;
        } catch (error) {
            console.error('❌ Token validation failed:', error);
            this.clearToken();
            return false;
        }
    }
}

// ایجاد instance جهانی
console.log('✅ TokenManager class defined');
window.TokenManager = TokenManager;
console.log('🌐 TokenManager added to window object');