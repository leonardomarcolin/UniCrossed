const SecuritySettings = {
    async enable2FA(phoneNumber) {
        const response = await fetch('/setup-2fatores/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.APP_CONFIG.csrfToken,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `phone_number=${phoneNumber}`
        });
        return response.json();
    },

    async verify2FASetup(deviceId, code) {
        const response = await fetch('/verificar-2fatores/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.APP_CONFIG.csrfToken,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `device_id=${deviceId}&token=${code}`
        });
        return response.json();
    },

    async disable2FA() {
        const response = await fetch('/desabilitar-2fatores/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.APP_CONFIG.csrfToken
            }
        });
        return response.json();
    },

    async getStatus() {
        const response = await fetch('/status-2fatores/');
        return response.json();
    },

    init() {
        this.loadCurrentStatus();
        this.setupEventListeners();
    },

    async loadCurrentStatus() {
        try {
            const status = await this.getStatus();
            const checkbox = document.getElementById('twoFactor');
            const statusText = document.getElementById('2fa-status');

            if (status.enabled) {
                checkbox.checked = true;
                statusText.textContent = `Ativo no número ***${status.phone_number}`;
            }
        } catch (error) {
            console.error('Erro ao carregar status da autenticação de 2 fatores:', error);
        }
    },

    setupEventListeners() {
        const checkbox = document.getElementById('twoFactor');
        const setupSection = document.getElementById('setup-2fa');
        const sendCodeBtn = document.getElementById('send-code');
        const verifyCodeBtn = document.getElementById('verify-code');

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                setupSection.style.display = 'block';
            } else {
                this.disable2FA();
                setupSection.style.display = 'none';
            }
        });

        sendCodeBtn.addEventListener('click', async () => {
            const phone = document.getElementById('phoneNumber').value;
            if (!phone) {
                alert('Digite um número de telefone');
                return;
            }

            try {
                const result = await this.enable2FA(phone);
                if (result.status === 'code_sent') {
                    document.getElementById('verification-step').style.display = 'block';
                    sendCodeBtn.textContent = 'Código Enviado';
                    sendCodeBtn.disabled = true;
                    // Armazenar device_id temporariamente
                    window.tempDeviceId = result.device_id;
                }
            } catch (error) {
                console.error('Erro ao enviar código:', error);
                alert('Erro ao enviar código SMS');
            }
        });

        verifyCodeBtn.addEventListener('click', async () => {
            const code = document.getElementById('verificationCode').value;
            if (!code || code.length !== 6) {
                alert('Digite o código de 6 dígitos');
                return;
            }

            try {
                const result = await this.verify2FASetup(window.tempDeviceId, code);
                if (result.status === 'success') {
                    document.getElementById('2fa-status').textContent = 'Autenticação de dois fatores ativada!';
                    document.getElementById('setup-2fa').style.display = 'none';
                    // Limpar campos
                    document.getElementById('phoneNumber').value = '';
                    document.getElementById('verificationCode').value = '';
                } else {
                    alert(result.error || 'Código inválido');
                }
            } catch (error) {
                console.error('Erro na verificação:', error);
                alert('Erro na verificação');
            }
        });
    }
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    SecuritySettings.init();
});
