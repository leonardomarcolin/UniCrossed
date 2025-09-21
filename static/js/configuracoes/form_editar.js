// form_editar.js - Versão corrigida
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('profileForm');
    
    // Initialize existing preferences checkboxes
    function initializeCheckboxes() {
        // Dados das preferências vindos do Django
        try {
            const preferenciasData = document.getElementById('preferencias-data');
            if (preferenciasData) {
                const preferences = JSON.parse(preferenciasData.textContent);
                console.log('Preferências carregadas:', preferences);
                
                // Marca os checkboxes baseado nos dados salvos
                Object.keys(preferences).forEach(fieldName => {
                    const values = preferences[fieldName];
                    if (values && Array.isArray(values)) {
                        values.forEach(value => {
                            const checkbox = document.querySelector(`input[name="${fieldName}"][value="${value}"]`);
                            if (checkbox) {
                                checkbox.checked = true;
                                console.log(`Marcado: ${fieldName} = ${value}`);
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.log('Erro ao carregar preferências:', e);
        }
    }
    
    // Initialize checkboxes on page load
    initializeCheckboxes();

    // Form submission with proper error handling
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
            const originalText = submitButton ? submitButton.textContent || submitButton.value : '';
            
            if (submitButton) {
                submitButton.disabled = true;
                if (submitButton.textContent !== undefined) {
                    submitButton.textContent = 'Salvando...';
                } else {
                    submitButton.value = 'Salvando...';
                }
                submitButton.classList.add('btn-loading');
            }
            
            const formData = new FormData(this);
            
            // CORREÇÃO 1: Garantir que universidade_nome não está vazio
            const universidadeInput = document.getElementById('universidade_nome');
            if (universidadeInput && !universidadeInput.value) {
                // Se estiver vazio, pegar do campo instituicao
                const instituicaoInput = document.getElementById('instituicao');
                if (instituicaoInput && instituicaoInput.value) {
                    formData.set('universidade_nome', instituicaoInput.value);
                } else {
                    // Valor padrão se não houver nada
                    formData.set('universidade_nome', 'Não informado');
                }
            }
            
            // CORREÇÃO 2: Processar checkboxes de preferência corretamente
            // Remover valores de array e adicionar individualmente
            const checkboxGroups = ['dia_semana', 'horario', 'metodo_preferido'];
            
            checkboxGroups.forEach(groupName => {
                // Primeiro, remove todos os valores existentes
                formData.delete(groupName);
                
                // Depois, adiciona cada checkbox marcado individualmente
                const checkboxes = document.querySelectorAll(`input[name="${groupName}"]:checked`);
                if (checkboxes.length === 0) {
                    // Se nenhum checkbox estiver marcado, enviar valor vazio
                    formData.append(groupName, '');
                } else {
                    checkboxes.forEach(checkbox => {
                        formData.append(groupName, checkbox.value);
                    });
                }
            });
            
            // Limpar campos de senha se estão ocultos (não visíveis para o usuário)
            const passwordFields = document.getElementById('passwordFields');
            if (passwordFields && (passwordFields.style.display === 'none' || !passwordFields.offsetParent)) {
                formData.delete('current_password');
                formData.delete('new_password');
                formData.delete('confirm_password');
                console.log('Campos de senha removidos (estavam ocultos)');
            }
            
            // Limpar campos vazios que podem causar erro nos forms do Django
            const fieldsToClean = ['phone_number', 'verification_code'];
            fieldsToClean.forEach(fieldName => {
                if (!formData.get(fieldName) || formData.get(fieldName).trim() === '') {
                    formData.delete(fieldName);
                }
            });
            
            // Debug: mostrar dados sendo enviados
            console.log('=== DADOS DO FORMULÁRIO ===');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            console.log('========================');
            
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => {
                console.log('Status da resposta:', response.status);
                
                if (!response.ok) {
                    // Se houver erro HTTP, tentar pegar a mensagem de erro
                    return response.text().then(text => {
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
                        } catch {
                            throw new Error(`Erro HTTP: ${response.status}`);
                        }
                    });
                }
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else {
                    // Se não retornar JSON, pode ser um redirect (sucesso)
                    return { status: 'success', message: 'Perfil atualizado com sucesso!' };
                }
            })
            .then(data => {
                console.log('Resposta recebida:', data);
                
                if (data.status === 'error') {
                    // Mostrar erro específico se disponível
                    if (data.errors) {
                        const errorMessages = Object.entries(data.errors)
                            .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                            .join('\n');
                        showMessage(errorMessages, 'error');
                    } else {
                        showMessage(data.message || 'Erro ao salvar perfil', 'error');
                    }
                } else if (data.status === 'success') {
                    showMessage(data.message || 'Perfil atualizado com sucesso!', 'success');
                    // Reload após sucesso para mostrar dados atualizados
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                showMessage(error.message || 'Erro ao salvar as alterações. Tente novamente.', 'error');
            })
            .finally(() => {
                // Reset button state
                if (submitButton) {
                    submitButton.disabled = false;
                    if (submitButton.textContent !== undefined) {
                        submitButton.textContent = originalText;
                    } else {
                        submitButton.value = originalText;
                    }
                    submitButton.classList.remove('btn-loading');
                }
            });
        });
    }
    
    // Function to show messages
    function showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.form-alert-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-alert-message alert-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-weight: 500;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        
        if (type === 'success') {
            messageDiv.style.backgroundColor = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
            messageDiv.innerHTML = `<i style="margin-right: 8px;">✅</i> ${message}`;
        } else {
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            // Formatar mensagem de erro para múltiplas linhas se necessário
            const formattedMessage = message.replace(/\n/g, '<br>');
            messageDiv.innerHTML = `<i style="margin-right: 8px;">❌</i> ${formattedMessage}`;
        }
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        if (!document.head.querySelector('style[data-form-animation]')) {
            style.setAttribute('data-form-animation', 'true');
            document.head.appendChild(style);
        }
        
        document.body.appendChild(messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 5000);
        
        // Click to dismiss
        messageDiv.addEventListener('click', () => {
            messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => messageDiv.remove(), 300);
        });
    }
});