// User Profile Display Manager
class UserProfileManager {
  constructor() {
    this.isOwnProfile = true; // This would be determined by comparing user IDs in a real app
    this.init();
  }

  init() {
    console.log('🎭 User Profile Display loaded!');
    this.loadProfileData();
    this.setupEventListeners();
    this.setupActionButtons();
  }

  // ===== LOAD PROFILE DATA =====
  async loadProfileData() {
    try {
      // pega as informacoes da api
      const response = await fetch('/api/perfil-usuario/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        this.profileData = data.profile;
        this.loadBasicInfo();
        this.loadSkills();
        this.loadAvailability();
        this.loadAcademicInfo();
        this.loadStats();
      } else {
        throw new Error('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      this.showToast('Erro ao carregar dados do perfil', 'error');
    }
  }

  loadBasicInfo() {
    if (!this.profileData) return;

    const nomeCompleto = `${this.profileData.first_name} ${this.profileData.last_name}`.trim() || this.profileData.username;
    const bio = this.profileData.bio || 'Este usuário ainda não adicionou uma biografia.';

    // Update profile name
    const profileNameElement = document.getElementById('profileName');
    if (profileNameElement) {
      profileNameElement.textContent = nomeCompleto;
    }

    // Update bio
    const profileBioElement = document.getElementById('profileBio');
    if (profileBioElement) {
      profileBioElement.textContent = bio;
    }

    // Update profile picture
    const profileImageElement = document.getElementById('profileImage');
    if (profileImageElement && this.profileData.foto_perfil) {
      profileImageElement.src = this.profileData.foto_perfil;
    }

    // Update course and institution info
    const curso = this.profileData.curso || 'Curso não informado';
    const instituicao = this.profileData.universidade_nome || 'Instituição não informada';

    const courseInfoElement = document.getElementById('courseInfo');
    if (courseInfoElement) {
      courseInfoElement.innerHTML = `
        <i class="fa-solid fa-graduation-cap"></i>
        ${curso}
      `;
    }

    const institutionInfoElement = document.getElementById('institutionInfo');
    if (institutionInfoElement) {
      institutionInfoElement.innerHTML = `
        <i class="fa-solid fa-university"></i>
        ${instituicao}
      `;
    }
  }

  loadSkills() {
    if (!this.profileData) return;
    
    const skillsContainer = document.getElementById('skillsContainer');
    if (!skillsContainer) return;

    const skills = this.profileData.habilidades || [];
    
    if (skills.length > 0) {
      skillsContainer.innerHTML = skills
        .map(skill => `<span class="skill-tag">${skill}</span>`)
        .join('');
    } else {
      skillsContainer.innerHTML = '<p class="no-skills">Nenhuma especialidade informada.</p>';
    }
  }

  loadAvailability() {
    if (!this.profileData) return;
    
    const preferences = this.profileData.preferencias || {};
    
    // Load days
    const availableDaysElement = document.getElementById('availableDays');
    if (availableDaysElement) {
      const days = preferences.dias_disponiveis || [];
      if (days.length > 0) {
        const dayNames = {
          'segunda': 'Segunda',
          'terca': 'Terça',
          'quarta': 'Quarta',
          'quinta': 'Quinta',
          'sexta': 'Sexta',
          'sabado': 'Sábado',
          'domingo': 'Domingo'
        };

        availableDaysElement.innerHTML = days
          .map(day => `<span class="day-chip available">${dayNames[day] || day}</span>`)
          .join('');
      } else {
        availableDaysElement.innerHTML = '<span class="day-chip">Não informado</span>';
      }
    }

    // Load times
    const availableTimesElement = document.getElementById('availableTimes');
    if (availableTimesElement) {
      const times = preferences.horarios_preferidos || [];
      if (times.length > 0) {
        const timeNames = {
          'manha': 'Manhã (06h-12h)',
          'tarde': 'Tarde (12h-18h)',
          'noite': 'Noite (18h-00h)'
        };

        availableTimesElement.innerHTML = times
          .map(time => `<span class="time-chip available">${timeNames[time] || time}</span>`)
          .join('');
      } else {
        availableTimesElement.innerHTML = '<span class="time-chip">Não informado</span>';
      }
    }

    // Load study preferences
    const studyPreferencesElement = document.getElementById('studyPreferences');
    if (studyPreferencesElement) {
      const methods = preferences.metodos_preferidos || [];
      
      if (methods.length > 0) {
        const methodNames = {
          'online': 'Online',
          'presencial': 'Presencial', 
          'grupo': 'Grupos de Estudo'
        };
        
        studyPreferencesElement.innerHTML = methods
          .map(method => `<span class="preference-chip active">${methodNames[method] || method}</span>`)
          .join('');
      } else {
        studyPreferencesElement.innerHTML = '<span class="preference-chip">Não informado</span>';
      }
    }
  }

  loadAcademicInfo() {
    if (!this.profileData) return;
    
    const curso = this.profileData.curso || 'Não informado';
    const instituicao = this.profileData.universidade_nome || 'Não informado';
    const semestre = this.profileData.semestre || 'Não informado';

    const academicCourse = document.getElementById('academicCourse');
    if (academicCourse) {
      academicCourse.textContent = curso;
    }

    const academicInstitution = document.getElementById('academicInstitution');
    if (academicInstitution) {
      academicInstitution.textContent = instituicao;
    }

    const academicSemester = document.getElementById('academicSemester');
    if (academicSemester) {
      const semestreText = semestre !== 'Não informado' ? `${semestre}º semestre` : semestre;
      academicSemester.textContent = semestreText;
    }
  }

  loadStats() {
    // In a real app, these would come from the backend
    // For now, we'll use some sample data or localStorage
    const connections = localStorage.getItem('userConnections') || '15';
    const studyGroups = localStorage.getItem('userStudyGroups') || '3';
    const helpedStudents = localStorage.getItem('helpedStudents') || '42';

    const connectionsElement = document.getElementById('connectionsCount');
    if (connectionsElement) {
      connectionsElement.textContent = connections;
    }

    const studyGroupsElement = document.getElementById('studyGroupsCount');
    if (studyGroupsElement) {
      studyGroupsElement.textContent = studyGroups;
    }

    const helpedStudentsElement = document.getElementById('helpedStudentsCount');
    if (helpedStudentsElement) {
      helpedStudentsElement.textContent = helpedStudents;
    }
  }

  // ===== SETUP BUTTONS =====
  setupActionButtons() {
    const otherUserActions = document.getElementById('otherUserActions');
    const profileMenu = document.getElementById('profileMenu');
    const messageBtn = document.getElementById('messageBtn');
    const connectBtn = document.getElementById('connectBtn');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');

    if (this.isOwnProfile) {
      // This is the user's own profile - show floating menu, hide other actions
      if (otherUserActions) {
        otherUserActions.style.display = 'none';
      }
      if (profileMenu) {
        profileMenu.classList.add('show');
      }
      
      // Logout button is now handled by the form in HTML
      // No need to add event listener since it's a form submit
    } else {
      // This is someone else's profile - show action buttons, hide floating menu
      if (otherUserActions) {
        otherUserActions.style.display = 'flex';
      }
      if (profileMenu) {
        profileMenu.style.display = 'none';
      }

      if (messageBtn) {
        messageBtn.onclick = () => this.sendMessage();
      }

      if (connectBtn) {
        connectBtn.onclick = () => this.connectWithUser();
      }
    }
  }

  setupEventListeners() {
    // Profile picture click (for own profile, could allow changing)
    const profileImage = document.getElementById('profileImage');
    if (profileImage && this.isOwnProfile) {
      profileImage.addEventListener('click', () => {
        this.showToast('Para alterar sua foto, vá para "Editar Perfil"', 'info');
      });
      profileImage.style.cursor = 'pointer';
    }
  }

  // ===== ACTIONS =====
  goToEditProfile() {
    window.location.href = 'config-profile.html';
  }

  sendMessage() {
    this.showToast('Funcionalidade de mensagens em desenvolvimento!', 'info');
    // In a real app, this would open a chat or message modal
  }

  connectWithUser() {
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
      // Simulate connection request
      connectBtn.innerHTML = `
        <i class="fa-solid fa-clock"></i>
        Solicitação Enviada
      `;
      connectBtn.disabled = true;
      connectBtn.style.opacity = '0.7';
      
      this.showToast('Solicitação de conexão enviada!', 'success');
    }
  }

  // ===== LOGOUT FUNCTIONALITY =====
  // Logout is now handled by the form submission in HTML
  // No JavaScript popup or confirmation needed

  // ===== UTILITY FUNCTIONS =====
  showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

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
    `;

    toastContainer.appendChild(toast);

    // Show animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, duration);
  }

  // ===== PROFILE DETECTION =====
  static detectProfileOwnership() {
    // In a real app, this would check URL parameters or compare user IDs
    // For now, we'll assume it's always the user's own profile
    // You could implement logic like:
    // const urlParams = new URLSearchParams(window.location.search);
    // const profileUserId = urlParams.get('userId');
    // const currentUserId = localStorage.getItem('currentUserId');
    // return profileUserId === currentUserId || !profileUserId;
    
    return true; // Always own profile for this demo
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const userProfile = new UserProfileManager();
  
  // Set profile ownership based on context
  userProfile.isOwnProfile = UserProfileManager.detectProfileOwnership();
  userProfile.setupActionButtons(); // Re-setup buttons based on ownership
});
