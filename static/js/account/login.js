const LoginManager = {
    async login(username, password, twoFactorCode = null) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        if (twoFactorCode) {
            formData.append('otp_token', twoFactorCode);
        }
        
        const response = await fetch('/auth/login/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.APP_CONFIG.csrfToken
            },
            body: formData
        });
        return response.json();
    }
};