// UniCrossed Profile Configuration Manager
class ProfileManager {
  constructor() {
    this.skills = new Set();
    this.profileCompletion = 0;
    this.init();
  }

  init() {
    console.log('🚀 UniCrossed Profile Manager loaded!');
    this.loadSavedData();
    this.setupProgressTracking();
    this.setupProfileUpload();
    this.setupPasswordSystem();
    this.setupSkillsSystem();
    this.setupFormValidation();
    this.setupFormSubmission();
    this.setupBioCounter();
    this.setupAvailabilitySelectors();
    this.setupPreviewModal();
  }

  


  // ===== LOAD SAVED DATA =====
  loadSavedData() {
    // Load profile picture
    const savedProfilePic = localStorage.getItem('profilePicture');
    if (savedProfilePic) {
      const profileImage = document.getElementById('profileImage');
      if (profileImage) {
        profileImage.src = savedProfilePic;
      }
    }

    // Load form fields
    const formFields = [
      'primeiroNome', 'sobrenome', 'email', 'telefone', 'bio', 'curso', 'instituicao', 'semestre'
    ];
    
    formFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      const savedValue = localStorage.getItem(fieldId);
      if (field && savedValue) {
        field.value = savedValue;
        // Update bio counter if it's the bio field
        if (fieldId === 'bio') {
          this.updateBioCounter();
        }
      }
    });

    // Load skills
    const savedSkills = localStorage.getItem('profileSkills');
    if (savedSkills) {
      const skillsList = savedSkills.split(',').filter(skill => skill.trim());
      skillsList.forEach(skill => {
        this.skills.add(skill.trim());
        this.createSkillTag(skill.trim());
      });
    }

    // Load availability preferences
    this.loadAvailabilityData();
  }

  loadAvailabilityData() {
    // Load selected days
    const savedDays = localStorage.getItem('selectedDays');
    if (savedDays) {
      const daysList = savedDays.split(',');
      daysList.forEach(day => {
        const dayInput = document.querySelector(`input[value="${day}"]`);
        if (dayInput) dayInput.checked = true;
      });
    }

    // Load selected times
    const savedTimes = localStorage.getItem('selectedTimes');
    if (savedTimes) {
      const timesList = savedTimes.split(',');
      timesList.forEach(time => {
        const timeInput = document.querySelector(`input[value="${time}"]`);
        if (timeInput) timeInput.checked = true;
      });
    }

    // Load study preferences
    const studyPrefs = ['estudoOnline', 'estudoPresencial', 'estudoGrupo'];
    studyPrefs.forEach(pref => {
      const saved = localStorage.getItem(pref);
      const checkbox = document.getElementById(pref);
      if (saved && checkbox) {
        checkbox.checked = saved === 'true';
      }
    });
  }

  // ===== PROGRESS TRACKING =====
  setupProgressTracking() {
    const requiredFields = ['primeiroNome', 'sobrenome', 'email', 'curso', 'instituicao', 'semestre'];
    const recommendedFields = ['bio', 'skills'];
    const optionalFields = ['telefone', 'novaSenha'];

    const updateProgress = () => {
      let filledRequired = 0;
      let filledRecommended = 0;
      let filledOptional = 0;

      // Check required fields
      requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && field.value.trim()) filledRequired++;
      });

      // Check recommended fields
      if (document.getElementById('bio') && document.getElementById('bio').value.trim()) {
        filledRecommended++;
      }
      if (this.skills.size > 0) {
        filledRecommended++;
      }

      // Check optional fields
      optionalFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && field.value.trim()) filledOptional++;
      });

      // Calculate progress: 60% required, 30% recommended, 10% optional
      const requiredProgress = (filledRequired / requiredFields.length) * 60;
      const recommendedProgress = (filledRecommended / recommendedFields.length) * 30;
      const optionalProgress = (filledOptional / optionalFields.length) * 10;
      const totalProgress = Math.round(requiredProgress + recommendedProgress + optionalProgress);

      this.updateProgressBar(totalProgress);
      this.profileCompletion = totalProgress;
    };

    // Add event listeners
    [...requiredFields, ...optionalFields].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', updateProgress);
        field.addEventListener('change', updateProgress);
      }
    });

    // Initial calculation
    updateProgress();
  }

  updateProgressBar(percentage) {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressTip = document.getElementById('progressTip');

    if (progressFill && progressPercentage) {
      progressFill.style.width = `${percentage}%`;
      progressPercentage.textContent = `${percentage}%`;

      // Update tip based on progress
      let tip = '';
      if (percentage < 30) {
        tip = 'Complete as informações básicas';
        progressFill.style.background = 'linear-gradient(90deg, #f44336, #e57373)';
      } else if (percentage < 60) {
        tip = 'Adicione uma bio interessante';
        progressFill.style.background = 'linear-gradient(90deg, #ff9800, #ffb74d)';
      } else if (percentage < 90) {
        tip = 'Quase lá! Adicione suas especialidades';
        progressFill.style.background = 'linear-gradient(90deg, #2196f3, #64b5f6)';
      } else {
        tip = 'Perfil completo! 🎉';
        progressFill.style.background = 'linear-gradient(90deg, #00b86b, #4ecdc4)';
      }

      if (progressTip) {
        progressTip.textContent = tip;
      }
    }
  }

  // ===== PROFILE UPLOAD =====
  setupProfileUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const profilePicture = document.getElementById('profilePicture');
    const profileImage = document.getElementById('profileImage');
    const profilePreview = document.getElementById('profilePreview');
    const removeBtn = document.getElementById('removePhotoBtn');

    if (!uploadBtn || !profilePicture || !profileImage) return;

    // Upload button click
    uploadBtn.addEventListener('click', () => profilePicture.click());
    
    // Profile preview click
    if (profilePreview) {
      profilePreview.addEventListener('click', () => profilePicture.click());
    }

    // File selection
    profilePicture.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file
      if (!this.validateImageFile(file)) return;

      // Process and preview image
      this.processImage(file, (imageData) => {
        profileImage.src = imageData;
        localStorage.setItem('profilePicture', imageData);
        this.showToast('Foto atualizada com sucesso!', 'success');
      });
    });

    // Remove photo
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja remover sua foto de perfil?')) {
          profileImage.src = '../img/pfp.jpg'; // Default image
          localStorage.removeItem('profilePicture');
          this.showToast('Foto removida', 'info');
        }
      });
    }

    // Drag and drop
    if (profilePreview) {
      profilePreview.addEventListener('dragover', (e) => {
        e.preventDefault();
        profilePreview.classList.add('dragover');
      });

      profilePreview.addEventListener('dragleave', () => {
        profilePreview.classList.remove('dragover');
      });

      profilePreview.addEventListener('drop', (e) => {
        e.preventDefault();
        profilePreview.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          if (this.validateImageFile(file)) {
            this.processImage(file, (imageData) => {
              profileImage.src = imageData;
              localStorage.setItem('profilePicture', imageData);
              this.showToast('Foto atualizada com sucesso!', 'success');
            });
          }
        }
      });
    }
  }

  validateImageFile(file) {
    // Check file type
    if (!file.type.startsWith('image/')) {
      this.showToast('Por favor, selecione apenas arquivos de imagem.', 'error');
      return false;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('A imagem deve ter no máximo 5MB.', 'error');
      return false;
    }

    return true;
  }

  processImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Create image element to resize
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize to max 300x300 while maintaining aspect ratio
        const maxSize = 300;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        const resizedImageData = canvas.toDataURL('image/jpeg', 0.8);
        callback(resizedImageData);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ===== PASSWORD SYSTEM =====
  setupPasswordSystem() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    const novaSenha = document.getElementById('novaSenha');
    const confirmarSenha = document.getElementById('confirmarSenha');

    // Password toggles
    passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const targetId = toggle.dataset.target;
        const targetInput = document.getElementById(targetId);
        
        if (targetInput) {
          const isPassword = targetInput.type === 'password';
          targetInput.type = isPassword ? 'text' : 'password';
          
          const icon = toggle.querySelector('i');
          icon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        }
      });
    });

    // Password strength checking
    if (novaSenha) {
      novaSenha.addEventListener('input', () => {
        this.checkPasswordStrength(novaSenha.value);
      });
    }

    // Confirm password validation
    if (confirmarSenha) {
      confirmarSenha.addEventListener('input', () => {
        this.validatePasswordConfirmation();
      });
    }
  }

  checkPasswordStrength(password) {
    const strengthBars = document.querySelectorAll('.strength-bar');
    const strengthText = document.getElementById('strengthText');
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordRequirements = document.getElementById('passwordRequirements');

    if (!password) {
      if (passwordStrength) passwordStrength.style.display = 'none';
      if (passwordRequirements) passwordRequirements.style.display = 'none';
      return;
    }

    if (passwordStrength) passwordStrength.style.display = 'block';
    if (passwordRequirements) passwordRequirements.style.display = 'block';

    // Check requirements
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password)
    };

    // Update requirement indicators
    Object.keys(requirements).forEach(req => {
      const element = document.getElementById(`req-${req}`);
      if (element) {
        const icon = element.querySelector('i');
        if (requirements[req]) {
          element.style.color = '#4caf50';
          icon.className = 'fa-solid fa-circle-check';
        } else {
          element.style.color = '#f44336';
          icon.className = 'fa-solid fa-circle-xmark';
        }
      }
    });

    // Calculate strength
    const strength = Object.values(requirements).filter(Boolean).length;
    
    // Reset all bars
    strengthBars.forEach(bar => {
      bar.className = 'strength-bar';
    });

    // Activate bars based on strength
    const strengthClasses = ['', 'active-weak', 'active-weak', 'active-fair', 'active-good', 'active-strong'];
    const strengthTexts = ['', 'Muito fraca', 'Fraca', 'Média', 'Boa', 'Muito forte'];

    for (let i = 0; i < Math.min(strength, 4); i++) {
      if (strengthBars[i]) {
        strengthBars[i].className = `strength-bar ${strengthClasses[strength]}`;
      }
    }

    if (strengthText) {
      strengthText.textContent = strengthTexts[strength] || 'Força da senha';
    }
  }

  validatePasswordConfirmation() {
    const novaSenha = document.getElementById('novaSenha');
    const confirmarSenha = document.getElementById('confirmarSenha');
    const errorElement = document.getElementById('confirmarSenhaError');

    if (!novaSenha || !confirmarSenha) return;

    if (confirmarSenha.value && confirmarSenha.value !== novaSenha.value) {
      this.showFieldError('confirmarSenha', 'As senhas não coincidem');
      return false;
    } else {
      this.clearFieldError('confirmarSenha');
      return true;
    }
  }

  // ===== SKILLS SYSTEM =====
  setupSkillsSystem() {
    const skillsInput = document.getElementById('skillsInput');
    const skillsTags = document.getElementById('skillsTags');
    const suggestions = document.querySelectorAll('.suggestion-tag');

    if (!skillsInput || !skillsTags) return;

    // Add skill function
    const addSkill = (skillText) => {
      if (!skillText.trim() || this.skills.has(skillText.trim())) return;
      
      this.skills.add(skillText.trim());
      this.createSkillTag(skillText.trim());
      this.updateSkillsValue();
      this.updateProgressTracking(); // Update progress when skills change
    };

    // Enter key to add skill
    skillsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        addSkill(skillsInput.value);
        skillsInput.value = '';
        return false;
      }
    });

    // Prevent form submission on enter
    skillsInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    // Suggestion clicks
    suggestions.forEach(suggestion => {
      suggestion.addEventListener('click', () => {
        const skillText = suggestion.dataset.tag;
        addSkill(skillText);
        
        // Visual feedback
        suggestion.style.opacity = '0.5';
        suggestion.style.transform = 'scale(0.95)';
        setTimeout(() => {
          suggestion.style.opacity = '1';
          suggestion.style.transform = 'scale(1)';
        }, 500);
      });
    });
  }

  createSkillTag(skillText) {
    const skillsTags = document.getElementById('skillsTags');
    if (!skillsTags) return;

    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `
      ${skillText}
      <button type="button" class="tag-remove" aria-label="Remover ${skillText}">
        <i class="fa-solid fa-times"></i>
      </button>
    `;

    // Remove tag functionality
    tag.querySelector('.tag-remove').addEventListener('click', () => {
      this.skills.delete(skillText);
      this.animateTagRemoval(tag);
      this.updateSkillsValue();
      this.updateProgressTracking();
    });

    skillsTags.appendChild(tag);
    this.animateTagAddition(tag);
  }

  updateSkillsValue() {
    const skillsArray = Array.from(this.skills);
    const hiddenInput = document.getElementById('skills');
    
    if (hiddenInput) {
      hiddenInput.value = skillsArray.join(', ');
    }
    
    localStorage.setItem('profileSkills', skillsArray.join(','));
  }

  animateTagAddition(tag) {
    tag.style.opacity = '0';
    tag.style.transform = 'scale(0.8)';
    setTimeout(() => {
      tag.style.transition = 'all 0.3s ease';
      tag.style.opacity = '1';
      tag.style.transform = 'scale(1)';
    }, 10);
  }

  animateTagRemoval(tag) {
    tag.style.transform = 'scale(0.8)';
    tag.style.opacity = '0';
    setTimeout(() => tag.remove(), 300);
  }

  // ===== BIO COUNTER =====
  setupBioCounter() {
    const bioTextarea = document.getElementById('bio');
    const bioCount = document.getElementById('bioCount');

    if (!bioTextarea || !bioCount) return;

    const updateCounter = () => {
      const count = bioTextarea.value.length;
      bioCount.textContent = count;
      
      // Color coding based on length
      if (count < 50) {
        bioCount.style.color = '#f44336'; // Red - too short
      } else if (count < 150) {
        bioCount.style.color = '#ff9800'; // Orange - could be longer
      } else {
        bioCount.style.color = '#4caf50'; // Green - good length
      }
    };

    bioTextarea.addEventListener('input', updateCounter);
    updateCounter(); // Initial call
  }

  updateBioCounter() {
    const bioTextarea = document.getElementById('bio');
    const bioCount = document.getElementById('bioCount');
    
    if (bioTextarea && bioCount) {
      bioCount.textContent = bioTextarea.value.length;
    }
  }

  // ===== AVAILABILITY SELECTORS =====
  setupAvailabilitySelectors() {
    // Days selector
    const dayInputs = document.querySelectorAll('input[name="dias[]"]');
    dayInputs.forEach(input => {
      input.addEventListener('change', () => {
        const selectedDays = Array.from(dayInputs)
          .filter(i => i.checked)
          .map(i => i.value);
        localStorage.setItem('selectedDays', selectedDays.join(','));
      });
    });

    // Time selector
    const timeInputs = document.querySelectorAll('input[name="horarios[]"]');
    timeInputs.forEach(input => {
      input.addEventListener('change', () => {
        const selectedTimes = Array.from(timeInputs)
          .filter(i => i.checked)
          .map(i => i.value);
        localStorage.setItem('selectedTimes', selectedTimes.join(','));
      });
    });

    // Study preferences
    const studyPrefs = ['estudoOnline', 'estudoPresencial', 'estudoGrupo'];
    studyPrefs.forEach(prefId => {
      const checkbox = document.getElementById(prefId);
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          localStorage.setItem(prefId, checkbox.checked.toString());
        });
      }
    });
  }

  // ===== FORM VALIDATION =====
  setupFormValidation() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    // Real-time validation
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input.id));
    });

    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.addEventListener('blur', () => {
        if (emailInput.value && !this.isValidEmail(emailInput.value)) {
          this.showFieldError('email', 'Por favor, insira um email válido');
        }
      });
    }

    // Phone validation
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        let value = phoneInput.value.replace(/\D/g, '');
        if (value.length >= 10) {
          if (value.length === 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
          } else if (value.length === 10) {
            value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
          }
          phoneInput.value = value;
        }
      });
    }
  }


  validateField(field) {
    const fieldId = field.id;
    let isValid = true;
    let errorMessage = '';

    // Required field check
    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      errorMessage = 'Este campo é obrigatório';
    }

    // Specific validations
    if (fieldId === 'email' && field.value.trim() && !this.isValidEmail(field.value)) {
      isValid = false;
      errorMessage = 'Por favor, insira um email válido';
    }

    if ((fieldId === 'primeiroNome' || fieldId === 'sobrenome') && field.value.trim() && field.value.trim().length < 2) {
      isValid = false;
      errorMessage = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (fieldId === 'semestre' && field.value && (field.value < 1 || field.value > 12)) {
      isValid = false;
      errorMessage = 'Semestre deve estar entre 1 e 12';
    }

    if (isValid) {
      this.clearFieldError(fieldId);
    } else {
      this.showFieldError(fieldId, errorMessage);
    }

    return isValid;
  }

  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) {
      field.classList.add('error');
    }
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) {
      field.classList.remove('error');
    }
    
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ===== PREVIEW MODAL =====
  setupPreviewModal() {
    const previewBtn = document.getElementById('previewProfile');
    const modal = document.getElementById('previewModal');
    const closeBtn = document.getElementById('closePreview');

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        this.generateProfilePreview();
        if (modal) {
          modal.style.display = 'flex';
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  }

  generateProfilePreview() {
    const previewContent = document.getElementById('previewContent');
    if (!previewContent) return;

    const primeiroNome = document.getElementById('primeiroNome')?.value || '';
    const sobrenome = document.getElementById('sobrenome')?.value || '';
    const nomeCompleto = primeiroNome && sobrenome ? `${primeiroNome} ${sobrenome}` : 'Nome não informado';
    const bio = document.getElementById('bio')?.value || 'Bio não informada';
    const curso = document.getElementById('curso')?.value || 'Curso não informado';
    const instituicao = document.getElementById('instituicao')?.value || 'Instituição não informada';
    const semestre = document.getElementById('semestre')?.value || '0';
    const profileImage = document.getElementById('profileImage')?.src || '../img/pfp.jpg';
    
    const skillsList = Array.from(this.skills);

    previewContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; margin: 0 auto 16px;">
          <img src="${profileImage}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <h3 style="color: var(--text-secondary); margin-bottom: 8px;">${nomeCompleto}</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">${curso} - ${instituicao}</p>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Semestre: ${semestre}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--primary-green); margin-bottom: 8px;">Bio:</h4>
        <p style="color: var(--text-primary); line-height: 1.5; font-style: ${bio === 'Bio não informada' ? 'italic' : 'normal'};">
          ${bio}
        </p>
      </div>

      ${skillsList.length > 0 ? `
        <div>
          <h4 style="color: var(--primary-green); margin-bottom: 12px;">Especialidades:</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${skillsList.map(skill => `
              <span style="
                background: linear-gradient(45deg, var(--primary-green), var(--primary-blue));
                color: white;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 0.8rem;
              ">${skill}</span>
            `).join('')}
          </div>
        </div>
      ` : '<p style="color: var(--text-muted); font-style: italic;">Nenhuma especialidade adicionada</p>'}
    `;
  }

  // ===== FORM SUBMISSION =====
  setupFormSubmission() {
    const form = document.getElementById('profileForm');
    const resetBtn = document.getElementById('resetForm');
    const saveBtn = document.getElementById('saveProfile');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmission();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetForm();
      });
    }

    // Auto-save on input changes
    if (form) {
      form.addEventListener('input', (e) => {
        if (e.target.type !== 'file' && e.target.id) {
          this.autoSaveField(e.target);
        }
      });

      form.addEventListener('change', (e) => {
        if (e.target.type !== 'file' && e.target.id) {
          this.autoSaveField(e.target);
        }
      });
    }
  }

  autoSaveField(field) {
    if (field.id && field.value !== undefined) {
      localStorage.setItem(field.id, field.value);
    }
  }

  async handleFormSubmission() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Validate form
    if (!this.validateForm()) {
      this.showToast('Por favor, corrija os erros antes de continuar', 'error');
      return;
    }

    // Show loading
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save all data
      this.saveAllData();
      
      // Success feedback
      this.showToast('Perfil salvo com sucesso! 🎉', 'success');
      
      // Show celebration if profile is complete
      if (this.profileCompletion >= 90) {
        setTimeout(() => {
          this.showToast('Seu perfil está completo! Agora outros estudantes podem te encontrar facilmente.', 'success', 6000);
        }, 1000);
      }
      
    } catch (error) {
      this.showToast('Erro ao salvar perfil. Tente novamente.', 'error');
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    }
  }

  validateForm() {
    const requiredFields = ['primeiroNome', 'sobrenome', 'email', 'curso', 'instituicao', 'semestre'];
    let isValid = true;

    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field || !this.validateField(field)) {
        isValid = false;
      }
    });

    // Validate password confirmation if new password is set
    const novaSenha = document.getElementById('novaSenha');
    if (novaSenha && novaSenha.value) {
      if (!this.validatePasswordConfirmation()) {
        isValid = false;
      }
    }

    return isValid;
  }

  saveAllData() {
    // Save all form data
    const form = document.getElementById('profileForm');
    if (form) {
      const formData = new FormData(form);
      for (let [key, value] of formData.entries()) {
        if (key !== 'profilePicture') { // Don't save file input
          localStorage.setItem(key, value);
        }
      }
    }

    // Save study preferences explicitly (they don't have name attributes)
    const studyPrefs = ['estudoOnline', 'estudoPresencial', 'estudoGrupo'];
    studyPrefs.forEach(prefId => {
      const checkbox = document.getElementById(prefId);
      if (checkbox) {
        localStorage.setItem(prefId, checkbox.checked.toString());
      }
    });

    // Save additional data
    localStorage.setItem('profileSkills', Array.from(this.skills).join(','));
    localStorage.setItem('profileCompletion', this.profileCompletion);
    localStorage.setItem('lastSaved', new Date().toISOString());
  }

  resetForm() {
    if (!confirm('Tem certeza que deseja resetar todas as alterações? Todos os dados salvos serão perdidos.')) {
      return;
    }

    // Reset form
    const form = document.getElementById('profileForm');
    if (form) {
      form.reset();
    }

    // Clear skills
    this.skills.clear();
    const skillsTags = document.getElementById('skillsTags');
    if (skillsTags) {
      skillsTags.innerHTML = '';
    }

    // Reset profile picture
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
      profileImage.src = '../img/pfp.jpg';
    }

    // Clear localStorage
    this.clearAllSavedData();

    // Reset progress
    this.updateProgressBar(0);

    // Reset bio counter
    const bioCount = document.getElementById('bioCount');
    if (bioCount) {
      bioCount.textContent = '0';
    }

    this.showToast('Formulário resetado! Todos os dados foram limpos.', 'info');
  }

  clearAllSavedData() {
    const keysToRemove = [
      'primeiroNome', 'sobrenome', 'email', 'telefone', 'bio', 'curso', 'instituicao', 'semestre',
      'senhaAtual', 'novaSenha', 'confirmarSenha', 'profileSkills', 'profilePicture',
      'selectedDays', 'selectedTimes', 'estudoOnline', 'estudoPresencial', 'estudoGrupo',
      'profileCompletion', 'lastSaved'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // ===== TOAST NOTIFICATIONS =====
  showToast(message, type = 'success', duration = 4000) {
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
  

}

function setAsProfile(fotoId) {
  fetch(`/set-profile-photo/${fotoId}/`, {
      method: 'POST',
      headers: {
          'X-CSRFToken': getCookie('csrftoken'),
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({'foto_id': fotoId})
  })
  .then(response => response.json())
  .then(data => {
      if (data.status === 'success') {
          // Atualiza a interface - remove "perfil" das outras fotos
          document.querySelectorAll('.foto-perfil-badge').forEach(badge => {
              badge.remove();
          });
          
          // Adiciona badge na foto escolhida
          const fotoElement = document.querySelector(`[data-foto-id="${fotoId}"]`);
          fotoElement.innerHTML += '<span class="foto-perfil-badge">Foto de Perfil</span>';
      }
  });
}


// Função para pegar o CSRF token
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ProfileManager();
    const form = document.getElementById('profileForm');
    
    if (form) {
        // Pre-populate checkboxes based on existing data
        const existingPreferences = {
            dia_semana: window.form_preferencias_dia_semana || [],
            horario: window.form_preferencias_horario || [],
            metodo_preferido: window.form_preferencias_metodo_preferido || []
        };
        
        // Check the appropriate checkboxes
        Object.keys(existingPreferences).forEach(fieldName => {
            const values = existingPreferences[fieldName];
            if (values && Array.isArray(values)) {
                values.forEach(value => {
                    const checkbox = document.querySelector(`input[name="${fieldName}"][value="${value}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
        });
    }
});

