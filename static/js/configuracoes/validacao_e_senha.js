document.addEventListener('DOMContentLoaded', function() {
    // Password change toggle functionality
    const changePasswordToggle = document.getElementById('changePasswordToggle');
    const passwordFields = document.getElementById('passwordFields');
    const currentPasswordInput = document.getElementById('current_password');
    const newPasswordInput = document.getElementById('new_password');
    const confirmPasswordInput = document.getElementById('confirm_password');

    // Toggle password fields visibility
    changePasswordToggle.addEventListener('change', function() {
        if (this.checked) {
            passwordFields.style.display = 'block';
            // Make password fields required when visible
            currentPasswordInput.required = true;
            newPasswordInput.required = true;
            confirmPasswordInput.required = true;
        } else {
            passwordFields.style.display = 'none';
            // Remove required attribute when hidden
            currentPasswordInput.required = false;
            newPasswordInput.required = false;
            confirmPasswordInput.required = false;
            // Clear password field values
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        }
    });

    // Phone number validation
    const phoneInput = document.getElementById('celular');
    
    phoneInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, ''); // Remove non-digits
        
        // Format phone number
        if (value.length >= 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 7) {
            value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }
        
        this.value = value;
    });

    // Form submission validation
    const form = document.getElementById('profileForm');
    
    form.addEventListener('submit', function(e) {
        let isValid = true;
        
        // Clear previous errors
        document.querySelectorAll('.field-error').forEach(error => {
            error.textContent = '';
        });

        // Phone validation
        const phoneValue = phoneInput.value.trim();
        if (phoneValue && phoneValue !== '' && !phoneValue.match(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)) {
            document.getElementById('telefoneError').textContent = 'Formato inválido. Use: (11) 91234-5678';
            isValid = false;
        }

        // Password validation (only if changing password)
        if (changePasswordToggle.checked) {
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!currentPassword) {
                document.getElementById('senhaAtualError').textContent = 'Senha atual é obrigatória';
                isValid = false;
            }

            if (!newPassword) {
                document.getElementById('senhaError').textContent = 'Nova senha é obrigatória';
                isValid = false;
            } else if (!newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)) {
                document.getElementById('senhaError').textContent = 'A senha não atende aos requisitos de segurança';
                isValid = false;
            }

            if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                document.getElementById('confirmPasswordError').textContent = 'As senhas não coincidem';
                isValid = false;
            }
        }

        if (!isValid) {
            e.preventDefault();
        }
    });

    // Password strength indicator (if changing password)
    newPasswordInput.addEventListener('input', function() {
        if (changePasswordToggle.checked) {
            checkPasswordStrength(this.value);
        }
    });

    function checkPasswordStrength(password) {
        const requirements = [
            { id: 'req-length', test: password.length >= 12 },
            { id: 'req-lowercase', test: /[a-z]/.test(password) },
            { id: 'req-uppercase', test: /[A-Z]/.test(password) },
            { id: 'req-number', test: /\d/.test(password) },
            { id: 'req-special', test: /[@$!%*?&]/.test(password) }
        ];

        requirements.forEach(req => {
            const element = document.getElementById(req.id);
            const icon = element.querySelector('i');
            
            if (req.test) {
                icon.className = 'fa-solid fa-circle-check';
                element.style.color = '#10b981';
            } else {
                icon.className = 'fa-solid fa-circle-xmark';
                element.style.color = '#ef4444';
            }
        });

        // Show requirements when typing
        const requirementsDiv = document.getElementById('passwordRequirements');
        if (password.length > 0) {
            requirementsDiv.style.display = 'block';
        }
    }
});