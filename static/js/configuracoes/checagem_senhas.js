// Pega os elementos dos campos de senha
const novaSenhaInput = document.getElementById('new_password');
const confirmarSenhaInput = document.getElementById('confirm_password');
const senhaError = document.getElementById('senhaError'); // span para mostrar erro

// Função para validar se as senhas coincidem
function validarSenhas() {
    const novaSenha = novaSenhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;
    
    if (confirmarSenha === '') {
        senhaError.textContent = '';
        confirmarSenhaInput.classList.remove('error', 'success');
        return;
    }
    
    if (novaSenha === confirmarSenha) {
        senhaError.textContent = '✓ Senhas coincidem';
        senhaError.style.color = 'green';
        confirmarSenhaInput.classList.remove('error');
        confirmarSenhaInput.classList.add('success');
    } else {
        senhaError.textContent = '✗ Senhas não coincidem';
        senhaError.style.color = 'red';
        confirmarSenhaInput.classList.remove('success');
        confirmarSenhaInput.classList.add('error');
    }
}

// Eventos para validar enquanto o usuário digita
confirmarSenhaInput.addEventListener('input', validarSenhas);
novaSenhaInput.addEventListener('input', validarSenhas);

// Validação adicional no submit do form
document.getElementById('profileForm').addEventListener('submit', function(e) {
    const novaSenha = novaSenhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;
    
    if (novaSenha && novaSenha !== confirmarSenha) {
        e.preventDefault(); // Impede o envio
        alert('As senhas não coincidem!');
    }
});