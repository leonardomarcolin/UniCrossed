// UniCrossed Configuration Page JavaScript
// Enhanced functionality for settings and user preferences

// Helper function to get CSRF token (moved outside DOMContentLoaded)
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Toast notification function (moved outside DOMContentLoaded)
function showToast(message, type = 'success', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: 'fa-check',
    error: 'fa-times',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  toast.innerHTML = `
    <i class="fa-solid ${icons[type]}"></i>
    <span>${message}</span>
    <button class="toast-close">
      <i class="fa-solid fa-times"></i>
    </button>
  `;

  document.body.appendChild(toast);

  // Show animation
  setTimeout(() => toast.classList.add('show'), 100);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, duration);

  // Manual close
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  });
}

// Apply settings function (moved outside DOMContentLoaded)
function applySettings(settings) {
  // Apply light mode
  if (settings.lightMode || settings.modo_escuro) {
    document.body.classList.add('light-mode');
    localStorage.setItem('modoClaroToggle', 'true');
  } else {
    document.body.classList.remove('light-mode');
    localStorage.setItem('modoClaroToggle', 'false');
  }

  // Apply font size
  const fontSize = settings.fontSize || settings.tamanho_fonte || 'medium';
  document.documentElement.style.fontSize = {
    small: '14px',
    medium: '16px',
    large: '18px'
  }[fontSize] || '16px';

  // Store settings for other pages to use
  localStorage.setItem('appSettings', JSON.stringify(settings));
}

// Settings persistence function (moved outside DOMContentLoaded)
async function saveSettings() {
  console.log('🔄 Iniciando saveSettings...');
  
  try {
    // Show loading state
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    }

    // Get CSRF token
    const csrfToken = getCookie('csrftoken');
    console.log('🔑 CSRF Token encontrado:', csrfToken ? 'Sim' : 'Não');
    
    if (!csrfToken) {
      throw new Error('CSRF token não encontrado. Recarregue a página e tente novamente.');
    }

    // Collect all settings from the form
    const settings = {
      modo_escuro: document.getElementById('modoClaroToggle')?.checked || false,
      tamanho_fonte: document.getElementById('fontSize')?.value || 'medium',
      idioma: document.getElementById('language')?.value || 'pt-br',
      backup_automatico: document.getElementById('autoBackup')?.checked || true,

      // Notifications
      notificacao_matchs: document.getElementById('notifMatchs')?.checked || true,
      notificacao_eventos_grupos: document.getElementById('notifEventos')?.checked || false,
      notificacao_mensagens: document.getElementById('notifMsg')?.checked || true,
      notificacao_sons: document.getElementById('notifSound')?.checked || true,

      // Privacy
      mostrar_status_online: document.getElementById('mostrarStatusOnline')?.checked || true,
      confirmacao_leitura: document.getElementById('confirmacaoVisualizacao')?.checked || true,
      visibilidade_perfil: document.getElementById('perfilPublico')?.checked || true,
      mostrar_curso: document.getElementById('mostrarCurso')?.checked || true
    };

    console.log('📋 Configurações coletadas:', settings);
    console.log('🌐 URL da requisição: /accounts/api/configuracoes/');

    // Send to database via API
    const response = await fetch('/accounts/api/configuracoes/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify(settings)
    });

    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Status text:', response.statusText);
    console.log('📡 URL final:', response.url);

    // Log da resposta completa para debug
    const responseText = await response.text();
    console.log('📝 Resposta completa:', responseText);

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    // Verificar se a resposta é JSON válido
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      console.error('📄 Resposta recebida:', responseText);
      throw new Error('Servidor retornou uma resposta inválida (não é JSON válido)');
    }

    console.log('✅ Resultado parseado:', result);

    if (result.status === 'success') {
      // Save to localStorage as backup
      Object.keys(settings).forEach(key => {
        if (typeof settings[key] === 'object') {
          localStorage.setItem(key, JSON.stringify(settings[key]));
        } else {
          localStorage.setItem(key, settings[key]);
        }
      });

      // Apply settings immediately
      applySettings(settings);

      showToast('✅ Configurações salvas no banco de dados!', 'success');
    } else {
      throw new Error(result.message || 'Erro desconhecido ao salvar configurações');
    }

  } catch (error) {
    console.error('❌ Erro detalhado em saveSettings:', error);
    console.error('📊 Stack trace:', error.stack);
    
    // Verificar se é erro de rede ou servidor
    if (error.message.includes('404')) {
      showToast('❌ Erro 404: Endpoint não encontrado. Verifique se o servidor Django está rodando.', 'error', 6000);
    } else if (error.message.includes('CSRF')) {
      showToast('🔐 Erro de autenticação. Recarregue a página e tente novamente.', 'error', 6000);
    } else {
      showToast(`❌ Erro ao salvar: ${error.message}`, 'error', 6000);
    }
  } finally {
    // Reset button state
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="fa-solid fa-save"></i> Salvar Todas as Configurações';
    }
  }
}

// Load settings on page load
async function loadSettings() {
  console.log('🔄 Carregando configurações...');
  
  try {
    const csrfToken = getCookie('csrftoken');
    
    // Try to load from database first
    const response = await fetch('/accounts/api/configuracoes/', {
      method: 'GET',
      headers: {
        'X-CSRFToken': csrfToken
      }
    });

    console.log('📡 Status GET:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('📋 Configurações carregadas:', result);
      
      if (result.status === 'success') {
        const config = result.config;

        // Set form values from database
        if (document.getElementById('modoClaroToggle')) {
          document.getElementById('modoClaroToggle').checked = config.modo_escuro;
        }
        if (document.getElementById('fontSize')) {
          document.getElementById('fontSize').value = config.tamanho_fonte;
        }
        if (document.getElementById('language')) {
          document.getElementById('language').value = config.idioma;
        }
        if (document.getElementById('autoBackup')) {
          document.getElementById('autoBackup').checked = config.backup_automatico;
        }

        // Set notification toggles
        if (document.getElementById('notifMatchs')) {
          document.getElementById('notifMatchs').checked = config.notificacao_matchs;
        }
        if (document.getElementById('notifEventos')) {
          document.getElementById('notifEventos').checked = config.notificacao_eventos_grupos;
        }
        if (document.getElementById('notifMsg')) {
          document.getElementById('notifMsg').checked = config.notificacao_mensagens;
        }
        if (document.getElementById('notifSound')) {
          document.getElementById('notifSound').checked = config.notificacao_sons;
        }

        // Set privacy toggles
        if (document.getElementById('mostrarStatusOnline')) {
          document.getElementById('mostrarStatusOnline').checked = config.mostrar_status_online;
        }
        if (document.getElementById('confirmacaoVisualizacao')) {
          document.getElementById('confirmacaoVisualizacao').checked = config.confirmacao_leitura;
        }
        if (document.getElementById('perfilPublico')) {
          document.getElementById('perfilPublico').checked = config.visibilidade_perfil;
        }
        if (document.getElementById('mostrarCurso')) {
          document.getElementById('mostrarCurso').checked = config.mostrar_curso;
        }

        // Apply current settings
        applySettings({
          lightMode: config.modo_escuro,
          fontSize: config.tamanho_fonte,
          language: config.idioma
        });

        // Save to localStorage as backup
        Object.keys(config).forEach(key => {
          localStorage.setItem(key, config[key]);
        });

        console.log('✅ Configurações aplicadas com sucesso');
        return;
      }
    }

    // Fallback to localStorage if database fails
    console.log('⚠️ Fallback para localStorage');
    loadSettingsFromLocalStorage();

  } catch (error) {
    console.warn('⚠️ Erro ao carregar configurações do servidor:', error);
    loadSettingsFromLocalStorage();
  }
}

// Fallback function to load from localStorage
function loadSettingsFromLocalStorage() {
  try {
    const lightMode = localStorage.getItem('modoClaroToggle') === 'true';
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    const language = localStorage.getItem('language') || 'pt-br';

    if (document.getElementById('modoClaroToggle')) {
      document.getElementById('modoClaroToggle').checked = lightMode;
    }
    if (document.getElementById('fontSize')) {
      document.getElementById('fontSize').value = fontSize;
    }
    if (document.getElementById('language')) {
      document.getElementById('language').value = language;
    }

    applySettings({ lightMode, fontSize, language });
    console.log('✅ Configurações carregadas do localStorage');
  } catch (error) {
    console.warn('⚠️ Erro ao carregar do localStorage:', error);
  }
}

// Auto-save settings when changed
function setupAutoSave() {
  const settingsInputs = document.querySelectorAll('.toggle-input, .select-input, input[type="checkbox"]');
  console.log('🔧 Configurando auto-save para', settingsInputs.length, 'elementos');
  
  settingsInputs.forEach(input => {
    input.addEventListener('change', () => {
      console.log('🔄 Auto-save acionado para:', input.id);
      setTimeout(saveSettings, 100); // Small delay to ensure the value is updated
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 UniCrossed Enhanced Config loaded!');

  // Initialize settings on page load
  loadSettings();
  setupAutoSave();

  // Interest Tags System
  let interests = new Set();

  function createInterestTag(tagText) {
    const interessesTags = document.getElementById('interessesTags');
    if (!interessesTags) return;

    const tag = document.createElement('span');
    tag.className = 'interest-tag';
    tag.innerHTML = `
      ${tagText}
      <button type="button" class="tag-remove" aria-label="Remover ${tagText}">
        <i class="fa-solid fa-times"></i>
      </button>
    `;

    // Remove tag on click
    tag.querySelector('.tag-remove').addEventListener('click', () => {
      interests.delete(tagText);
      tag.style.transform = 'scale(0.8)';
      tag.style.opacity = '0';
      setTimeout(() => tag.remove(), 300);
      updateInterestsValue();
    });

    interessesTags.appendChild(tag);
    // Animate in
    tag.style.opacity = '0';
    tag.style.transform = 'scale(0.8)';
    setTimeout(() => {
      tag.style.transition = 'all 0.3s ease';
      tag.style.opacity = '1';
      tag.style.transform = 'scale(1)';
    }, 10);
  }

  function addTag(tagText) {
    if (!tagText.trim() || interests.has(tagText.trim())) return;
    interests.add(tagText.trim());
    createInterestTag(tagText.trim());
    updateInterestsValue();
  }

  function updateInterestsValue() {
    const originalInput = document.getElementById('interesses');
    const interestsArray = Array.from(interests);
    if (originalInput) {
      originalInput.value = interestsArray.join(', ');
    }
    localStorage.setItem('interests', interestsArray.join(','));
  }

  // Set up interests input
  const interessesInput = document.getElementById('interessesInput');
  if (interessesInput) {
    // Prevent Enter key from submitting form
    interessesInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        addTag(interessesInput.value);
        interessesInput.value = '';
        return false;
      }
    });

    interessesInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });
  }

  // Set up suggestion clicks
  const suggestions = document.querySelectorAll('.suggestion-tag');
  suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', function () {
      const tagText = suggestion.getAttribute('data-tag');
      addTag(tagText);
      suggestion.style.opacity = '0.5';
      setTimeout(() => suggestion.style.opacity = '1', 1000);
    });
  });

  // Load saved interests
  const savedInterests = localStorage.getItem('interests');
  if (savedInterests) {
    const interestsList = savedInterests.split(',').filter(interest => interest.trim());
    interestsList.forEach(interest => {
      interests.add(interest.trim());
      createInterestTag(interest.trim());
    });
  }

  // Profile Picture Upload
  const uploadArea = document.getElementById('uploadArea');
  const profilePicture = document.getElementById('profilePicture');
  const profilePreview = document.getElementById('profilePreview');

  if (uploadArea && profilePicture && profilePreview) {
    // Click to upload
    uploadArea.addEventListener('click', () => profilePicture.click());

    // File selection
    profilePicture.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione apenas arquivos de imagem.', 'error');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast('A imagem deve ter no máximo 5MB.', 'error');
        return;
      }

      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        profilePreview.src = imageData;
        uploadArea.classList.add('uploaded');
        localStorage.setItem('profilePicture', imageData);
        showToast('Foto atualizada com sucesso!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  // Load saved profile picture
  const savedProfilePic = localStorage.getItem('profilePicture');
  if (savedProfilePic && profilePreview && uploadArea) {
    profilePreview.src = savedProfilePic;
    uploadArea.classList.add('uploaded');
  }

  // Password strength meter
  const passwordInput = document.getElementById('senha');
  const passwordToggle = document.getElementById('passwordToggle');
  const passwordStrength = document.getElementById('passwordStrength');
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');

  if (passwordInput && passwordToggle) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      const icon = passwordToggle.querySelector('i');
      icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });

    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value;
      if (!password) {
        if (passwordStrength) passwordStrength.style.display = 'none';
        return;
      }

      if (passwordStrength) passwordStrength.style.display = 'block';

      let strength = 0;
      const checks = [
        password.length >= 8,
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^a-zA-Z0-9]/.test(password)
      ];

      strength = checks.filter(Boolean).length;
      const percentage = (strength / 5) * 100;

      if (strengthFill) strengthFill.style.width = `${percentage}%`;

      if (strengthText) {
        if (strength <= 2) {
          strengthFill.style.background = '#f44336';
          strengthText.textContent = 'Senha fraca';
        } else if (strength <= 3) {
          strengthFill.style.background = '#ff9800';
          strengthText.textContent = 'Senha média';
        } else if (strength <= 4) {
          strengthFill.style.background = '#4caf50';
          strengthText.textContent = 'Senha forte';
        } else {
          strengthFill.style.background = '#00b86b';
          strengthText.textContent = 'Senha muito forte';
        }
      }
    });
  }

  // Progress tracking
  const requiredFields = ['nome', 'email', 'curso', 'faculdade', 'semestre'];
  const optionalFields = ['senha', 'numero', 'interesses', 'diasEstudo', 'metodoEstudo'];

  function updateProgress() {
    let filledRequired = 0;
    let filledOptional = 0;

    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field && field.value.trim()) filledRequired++;
    });

    optionalFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field && field.value.trim()) filledOptional++;
    });

    const requiredProgress = (filledRequired / requiredFields.length) * 70;
    const optionalProgress = (filledOptional / optionalFields.length) * 30;
    const totalProgress = Math.round(requiredProgress + optionalProgress);

    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');

    if (progressFill && progressPercentage) {
      progressFill.style.width = `${totalProgress}%`;
      progressPercentage.textContent = `${totalProgress}%`;

      if (totalProgress >= 80) {
        progressFill.style.background = 'linear-gradient(90deg, #00b86b, #4ecdc4)';
      } else if (totalProgress >= 50) {
        progressFill.style.background = 'linear-gradient(90deg, #ffa726, #ffcc02)';
      } else {
        progressFill.style.background = 'linear-gradient(90deg, #ef5350, #f44336)';
      }
    }
  }

  // Auto-save and progress update
  const allFields = [...requiredFields, ...optionalFields];
  allFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', () => {
        updateProgress();
        if (field.id && field.value !== undefined) {
          localStorage.setItem(field.id, field.value);
        }
      });
      field.addEventListener('change', updateProgress);
    }
  });

  // Load saved data
  const formFields = ['nome', 'email', 'curso', 'faculdade', 'semestre', 'numero', 'diasEstudo', 'metodoEstudo'];
  formFields.forEach(field => {
    const saved = localStorage.getItem(field);
    const element = document.getElementById(field);
    if (saved && element) {
      element.value = saved;
    }
  });

  // Form submission handler
  const form = document.getElementById('configForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Save all settings to database
      await saveSettings();
    });
  }

  // Reset button
  const resetButton = document.getElementById('resetForm');
  if (resetButton) {
    resetButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Tem certeza que deseja resetar todas as alterações?')) {
        form.reset();
        interests.clear();
        const interessesTags = document.getElementById('interessesTags');
        if (interessesTags) interessesTags.innerHTML = '';

        // Clear localStorage
        formFields.forEach(key => localStorage.removeItem(key));
        localStorage.removeItem('interests');

        updateProgress();
        alert('Formulário resetado!');
      }
    });
  }

  // Section animations
  setTimeout(() => {
    document.querySelectorAll('.config-section').forEach((section, index) => {
      setTimeout(() => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }, 100);

  updateProgress();

  // Make functions globally accessible
  window.saveSettings = saveSettings;
  window.loadSettings = loadSettings;
  window.showToast = showToast;
});