// Two-Factor Authentication Manager for Config Profile
class TwoFactorAuthManager {
  constructor() {
    this.verificationCode = null;
    this.phoneNumber = null;
    this.isEnabled = false;
    this.deviceId = null;
    this.init();
  }

  init() {
    console.log('🔐 2FA Manager loaded!');
    this.setupEventListeners();
    this.loadCurrentState();
  }

  setupEventListeners() {
    // 2FA toggle
    const twoFactorToggle = document.getElementById('twoFactor');
    if (twoFactorToggle) {
      twoFactorToggle.addEventListener('change', (e) => {
        this.handleToggleChange(e.target.checked);
      });
    }

    // Send code button
    const sendCodeBtn = document.getElementById('send-code');
    if (sendCodeBtn) {
      sendCodeBtn.addEventListener('click', () => {
        this.sendVerificationCode();
      });
    }

    // Verify code button
    const verifyCodeBtn = document.getElementById('verify-code');
    if (verifyCodeBtn) {
      verifyCodeBtn.addEventListener('click', () => {
        this.verifyCode();
      });
    }

    // Phone number input validation
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
      // Remove any existing event listeners to prevent duplicates
      phoneInput.removeEventListener('input', this._phoneInputHandler);
      phoneInput.removeEventListener('blur', this._phoneBlurHandler);
      
      // Create bound event handlers
      this._phoneInputHandler = (e) => {
        console.log('Phone input event triggered, current value:', e.target.value);
        this.formatPhoneNumber(e.target);
        this.clearPhoneValidation(e.target);
      };
      
      this._phoneBlurHandler = (e) => {
        this.validatePhoneNumber(e.target);
      };
      
      // Add event listeners
      phoneInput.addEventListener('input', this._phoneInputHandler);
      phoneInput.addEventListener('blur', this._phoneBlurHandler);
    }

    // Verification code input
    const verificationInput = document.getElementById('verificationCode');
    if (verificationInput) {
      verificationInput.addEventListener('input', (e) => {
        this.formatVerificationCode(e.target);
      });
    }
  }

  loadCurrentState() {
    // Check 2FA status from Django backend
    this.check2FAStatus();
  }

  async check2FAStatus() {
    try {
      const response = await fetch('/2fa/status/', {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.enabled) {
          this.isEnabled = true;
          this.updateUIState(true);
          this.updateStatusText(`2FA ativado (****${data.phone_number})`);
        }
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  }

  async handleToggleChange(enabled) {
    if (enabled) {
      this.showSetupSection();
    } else {
      // Ask for confirmation before disabling
      if (confirm('Tem certeza que deseja desabilitar a autenticação de dois fatores? Isso tornará sua conta menos segura.')) {
        await this.disable2FA();
      } else {
        // Revert the toggle if user cancels
        const twoFactorToggle = document.getElementById('twoFactor');
        if (twoFactorToggle) {
          twoFactorToggle.checked = true;
        }
      }
    }
  }

  showSetupSection() {
    const setupSection = document.getElementById('setup-2fa');
    if (setupSection) {
      setupSection.style.display = 'block';
    }
    this.updateStatusText('Configure o número de celular para ativar a 2FA');
  }

  hideSetupSection() {
    const setupSection = document.getElementById('setup-2fa');
    if (setupSection) {
      setupSection.style.display = 'none';
    }
  }

  updateStatusText(text) {
    const statusElement = document.getElementById('2fa-status');
    if (statusElement) {
      statusElement.textContent = text;
    }
  }

  validatePhoneNumber(input) {
    const phoneRegex = /^\+55\s\(\d{2}\)\s\d{4,5}-\d{4}$/;
    const isValid = phoneRegex.test(input.value);
    
    if (isValid) {
      input.classList.remove('invalid');
      input.classList.add('valid');
      this.phoneNumber = input.value;
      return true;
    } else {
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.phoneNumber = null;
      return false;
    }
  }

  clearPhoneValidation(input) {
    input.classList.remove('valid', 'invalid');
    input.style.borderColor = '';
  }

  formatVerificationCode(input) {
    // Only allow numbers and limit to 6 digits
    input.value = input.value.replace(/\D/g, '').substring(0, 6);
  }

  async sendVerificationCode() {
    if (!this.validatePhoneNumber(document.getElementById('phoneNumber'))) {
      this.showError('Por favor, insira um número de celular válido.');
      return;
    }

    const sendCodeBtn = document.getElementById('send-code');
    const originalText = sendCodeBtn.textContent;
    
    try {
      // Show loading state
      sendCodeBtn.disabled = true;
      sendCodeBtn.classList.add('btn-loading');
      sendCodeBtn.textContent = 'Enviando...';

      // Send request to Django backend
      const formData = new FormData();
      formData.append('phone_number', this.phoneNumber);
      formData.append('csrfmiddlewaretoken', this.getCSRFToken());

      const response = await fetch('/2fa/setup/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.status === 'code_sent') {
        // Store device ID for verification
        this.deviceId = data.device_id;
        
        // Show verification step
        this.showVerificationStep();
        this.showSuccess('Código de verificação enviado com sucesso!');
        
        // Show demo code (in production, this would be sent via SMS)
        this.showDemoCode();
      } else {
        throw new Error(data.error || 'Erro ao enviar código');
      }
      
    } catch (error) {
      this.showError('Erro ao enviar código. Tente novamente.');
      console.error('Error sending code:', error);
    } finally {
      // Reset button state
      sendCodeBtn.disabled = false;
      sendCodeBtn.classList.remove('btn-loading');
      sendCodeBtn.textContent = originalText;
    }
  }



  showDemoCode() {
    // Create a temporary notification showing the demo code
    const notification = document.createElement('div');
    notification.className = 'demo-code-notification';
    notification.innerHTML = `
      <div style="background: var(--card-bg); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); margin: 16px 0;">
        <strong>🔐 Código de Demonstração:</strong><br>
        <span style="color: var(--text-muted);">Verifique o console do navegador para ver o código de demonstração</span><br>
        <small style="color: var(--text-muted);">Em produção, este código seria enviado via SMS</small>
      </div>
    `;
    
    const setupSection = document.getElementById('setup-2fa');
    setupSection.appendChild(notification);
    
    // Remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }

  showVerificationStep() {
    const verificationStep = document.getElementById('verification-step');
    if (verificationStep) {
      verificationStep.style.display = 'block';
    }
    
    // Focus on verification input
    const verificationInput = document.getElementById('verificationCode');
    if (verificationInput) {
      verificationInput.focus();
    }
  }

  async verifyCode() {
    const verificationInput = document.getElementById('verificationCode');
    const enteredCode = verificationInput.value;
    
    if (enteredCode.length !== 6) {
      this.showError('Por favor, insira o código de 6 dígitos.');
      return;
    }

    if (!this.deviceId) {
      this.showError('Erro: ID do dispositivo não encontrado. Tente enviar o código novamente.');
      return;
    }

    const verifyBtn = document.getElementById('verify-code');
    const originalText = verifyBtn.textContent;
    
    try {
      // Show loading state
      verifyBtn.disabled = true;
      verifyBtn.classList.add('btn-loading');
      verifyBtn.textContent = 'Verificando...';

      // Send verification request to Django backend
      const formData = new FormData();
      formData.append('device_id', this.deviceId);
      formData.append('verification_code', enteredCode);
      formData.append('csrfmiddlewaretoken', this.getCSRFToken());

      const response = await fetch('/2fa/verify/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Success - enable 2FA
        this.enable2FA();
      } else {
        this.showError(data.error || 'Código incorreto. Tente novamente.');
        verificationInput.value = '';
        verificationInput.focus();
      }
      
    } catch (error) {
      this.showError('Erro na verificação. Tente novamente.');
      console.error('Error verifying code:', error);
    } finally {
      // Reset button state
      verifyBtn.disabled = false;
      verifyBtn.classList.remove('btn-loading');
      verifyBtn.textContent = originalText;
    }
  }

  enable2FA() {
    this.isEnabled = true;
    
    // Update UI
    this.updateStatusText('2FA ativado com sucesso! ✅');
    this.hideSetupSection();
    
    // Update toggle state
    const twoFactorToggle = document.getElementById('twoFactor');
    if (twoFactorToggle) {
      twoFactorToggle.checked = true;
    }
    
    // Show success message
    this.showSuccess('Autenticação de dois fatores ativada com sucesso!');
    
    // Update form submission to include 2FA data
    this.updateFormData();
  }

  async disable2FA() {
    try {
      const formData = new FormData();
      formData.append('csrfmiddlewaretoken', this.getCSRFToken());

      const response = await fetch('/2fa/disable/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        this.isEnabled = false;
        
        // Update UI
        this.updateStatusText('Adicione uma camada extra de segurança à sua conta');
        this.hideSetupSection();
        
        // Update toggle state
        const twoFactorToggle = document.getElementById('twoFactor');
        if (twoFactorToggle) {
          twoFactorToggle.checked = false;
        }
        
        // Reset form data
        this.resetFormData();
        
        this.showSuccess('2FA desabilitado com sucesso!');
      } else {
        const data = await response.json();
        this.showError(data.error || 'Erro ao desabilitar 2FA');
      }
    } catch (error) {
      this.showError('Erro ao desabilitar 2FA');
      console.error('Error disabling 2FA:', error);
    }
  }

  updateFormData() {
    // Add hidden fields to the form for 2FA data
    const form = document.getElementById('profileForm');
    if (form) {
      // Remove existing 2FA fields
      const existingFields = form.querySelectorAll('[name^="2fa_"]');
      existingFields.forEach(field => field.remove());
      
      // Add new 2FA fields
      const twoFactorEnabled = document.createElement('input');
      twoFactorEnabled.type = 'hidden';
      twoFactorEnabled.name = '2fa_enabled';
      twoFactorEnabled.value = 'true';
      form.appendChild(twoFactorEnabled);
      
      const phoneField = document.createElement('input');
      phoneField.type = 'hidden';
      phoneField.name = '2fa_phone';
      phoneField.value = this.phoneNumber;
      form.appendChild(phoneField);
    }
  }

  resetFormData() {
    // Remove 2FA fields from form
    const form = document.getElementById('profileForm');
    if (form) {
      const existingFields = form.querySelectorAll('[name^="2fa_"]');
      existingFields.forEach(field => field.remove());
    }
    
    // Clear phone number input
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
      phoneInput.value = '';
    }
    
    // Clear verification code input
    const verificationInput = document.getElementById('verificationCode');
    if (verificationInput) {
      verificationInput.value = '';
    }
    
    // Hide verification step
    const verificationStep = document.getElementById('verification-step');
    if (verificationStep) {
      verificationStep.style.display = 'none';
    }
    
    // Hide success/error messages
    this.hideMessages();
  }

  showSuccess(message) {
    this.hideMessages();
    const successElement = document.getElementById('verification-success');
    if (successElement) {
      successElement.style.display = 'block';
      const messageSpan = successElement.querySelector('span');
      if (messageSpan) {
        messageSpan.textContent = message;
      }
    }
  }

  showError(message) {
    this.hideMessages();
    const errorElement = document.getElementById('verification-error');
    if (errorElement) {
      errorElement.style.display = 'block';
      const messageSpan = errorElement.querySelector('#error-text');
      if (messageSpan) {
        messageSpan.textContent = message;
      }
    }
  }

  hideMessages() {
    const successElement = document.getElementById('verification-success');
    const errorElement = document.getElementById('verification-error');
    
    if (successElement) successElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'none';
  }

  updateUIState(enabled) {
    const twoFactorToggle = document.getElementById('twoFactor');
    if (twoFactorToggle) {
      twoFactorToggle.checked = enabled;
    }
    
    const securityOption = document.querySelector('.security-option');
    if (securityOption) {
      if (enabled) {
        securityOption.classList.remove('disabled');
        securityOption.classList.add('enabled');
        this.updateStatusText('2FA ativado com sucesso! ✅');
        this.hideSetupSection();
      } else {
        securityOption.classList.remove('enabled');
        securityOption.classList.add('disabled');
        this.updateStatusText('Adicione uma camada extra de segurança à sua conta');
      }
    }
  }

  // Method to check if 2FA is enabled (can be called from other parts of the app)
  is2FAEnabled() {
    return this.isEnabled;
  }

  // Method to get the phone number (can be called from other parts of the app)
  getPhoneNumber() {
    return this.phoneNumber;
  }

  // Helper method to get CSRF token
  getCSRFToken() {
    const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    return tokenElement ? tokenElement.value : '';
  }
}

// Initialize the 2FA manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TwoFactorAuthManager();
});
