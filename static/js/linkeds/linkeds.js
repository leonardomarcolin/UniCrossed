// linkeds.js
// Enhanced script with search/filter functionality, animations, and better UX
// Manages dark/light mode, loads matches dynamically, and handles real-time filtering

// Global variables to store data from backend
let linkedMatches = [];
let studyGroups = [];
let groupsData = {};

// API Functions
async function fetchLinkedUsers() {
  try {
    const response = await fetch('/api/linkeds/');
    const data = await response.json();
    
    if (data.status === 'success') {
      linkedMatches = data.linkeds;
      return data.linkeds;
    } else {
      console.error('Error fetching linked users:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching linked users:', error);
    return [];
  }
}

async function fetchStudyGroups() {
  try {
    const response = await fetch('/api/grupos-estudo/');
    const data = await response.json();
    
    if (data.status === 'success') {
      studyGroups = data.groups;
      // Convert to groupsData format for compatibility with existing modal code
      groupsData = {};
      data.groups.forEach(group => {
        groupsData[group.name] = {
          id: group.id,
          name: group.name,
          subject: group.subject,
          description: group.description,
          meetings: group.meetings,
          location: group.location,
          members: group.members,
          meetingDays: group.meeting_days
        };
      });
      return data.groups;
    } else {
      console.error('Error fetching study groups:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching study groups:', error);
    return [];
  }
}


// Load light mode preference
function applyLightMode() {
  const lightMode = localStorage.getItem('modoClaro') === 'true';
  if (lightMode) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
}

// Create a linked card for single user
function createLinkedCard(user) {
  const card = document.createElement('div');
  card.classList.add('linked-card');

  const img = document.createElement('img');
  img.classList.add('profile-image');
  img.src = user.image;
  img.alt = `${user.name} profile picture`;
  card.appendChild(img);

  const nameEl = document.createElement('div');
  nameEl.classList.add('linked-name');
  nameEl.textContent = user.name;
  card.appendChild(nameEl);

  const infoEl = document.createElement('div');
  infoEl.classList.add('linked-info');
  infoEl.textContent = user.bio;
  card.appendChild(infoEl);

  const btnMsg = document.createElement('button');
  btnMsg.classList.add('btn-message');
  btnMsg.textContent = 'Mensagem';
  btnMsg.onclick = () => {
    alert(`Abrir chat com ${user.name} (funcionalidade futura).`);
  };
  card.appendChild(btnMsg);

  return card;
}

// Create a multi-linked card for groups
function createMultiLinkedCard(group) {
  const card = document.createElement('div');
  card.classList.add('linked-card');

  // Profile images row
  const imgRow = document.createElement('div');
  imgRow.classList.add('multi-profile-row');
  group.members.forEach(member => {
    const img = document.createElement('img');
    img.src = member.image;
    img.alt = member.name;
    img.title = member.name;
    imgRow.appendChild(img);
  });
  card.appendChild(imgRow);

  // Group name
  const groupName = document.createElement('div');
  groupName.classList.add('linked-name');
  groupName.textContent = group.groupName;
  card.appendChild(groupName);

  // Group bio
  const infoEl = document.createElement('div');
  infoEl.classList.add('linked-info');
  infoEl.textContent = group.bio;
  card.appendChild(infoEl);

  // Message button
  const btnMsg = document.createElement('button');
  btnMsg.classList.add('btn-message');
  btnMsg.textContent = 'Mensagem';
  btnMsg.onclick = () => {
    alert(`Abrir chat com o grupo "${group.groupName}" (funcionalidade futura).`);
  };
  card.appendChild(btnMsg);

  return card;
}

// Load and display data from backend
async function loadData() {
  try {
    // Fetch data from APIs
    await Promise.all([
      fetchLinkedUsers(),
      fetchStudyGroups()
    ]);
    
    console.log('Data loaded:', { linkedMatches, studyGroups });
    
    // Render the fetched data to the page
    renderLinkedUsers();
    renderStudyGroups();
    
    // Update search functionality with new elements
    searchSystem.cacheElements();
    
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Render linked users from API data
function renderLinkedUsers() {
  const linkedList = document.querySelector('.linked-list');
  const emptyState = document.getElementById('emptyLinkedsState');
  
  // Clear existing content (keep empty state)
  const existingItems = linkedList.querySelectorAll('.linked-item');
  existingItems.forEach(item => item.remove());
  
  if (linkedMatches.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
    
    linkedMatches.forEach(user => {
      const article = document.createElement('article');
      article.className = 'linked-item';
      article.setAttribute('data-name', user.name);
      article.setAttribute('data-course', user.course || 'Curso não informado');
      article.setAttribute('data-university', user.university || 'Universidade não informada');
      
      article.innerHTML = `
        <img src="${user.image}" alt="${user.name}" />
        <div class="linked-info">
          <h3>${user.name}</h3>
          <p>${user.course || 'Curso não informado'} - ${user.university || 'Universidade não informada'} | ${user.semester || 'Semestre não informado'}</p>
        </div>
        <div class="linked-actions">
          <button class="btn-chat" title="Abrir Chat"><i class="fa-solid fa-message"></i></button>
          <button class="btn-info" title="Ver Perfil"><i class="fa-solid fa-user"></i></button>
        </div>
      `;
      
      linkedList.appendChild(article);
    });
  }
}

// Render study groups from API data
function renderStudyGroups() {
  const groupsList = document.querySelector('.multi-linked-panel-list');
  const emptyState = document.getElementById('emptyGroupsState');
  
  // Clear existing content (keep empty state)
  const existingItems = groupsList.querySelectorAll('.multi-linked-panel');
  existingItems.forEach(item => item.remove());
  
  if (studyGroups.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
    
    studyGroups.forEach((group, index) => {
      const div = document.createElement('div');
      div.className = 'multi-linked-panel';
      div.setAttribute('data-group', group.name);
      div.setAttribute('data-members', group.member_count.toString());
      
      // Create avatars blob with member images (max 4)
      const avatarsHtml = group.members.slice(0, 4).map(member => 
        `<img src="${member.image}" alt="${member.name}" />`
      ).join('');
      
      const blobShapeClass = `blob-shape-${(index % 3) + 1}`;
      
      div.innerHTML = `
        <div class="avatars-blob ${blobShapeClass}">
          ${avatarsHtml}
        </div>
        <div class="group-details">
          <h2>${group.name}</h2>
          <p><strong>Membros:</strong> ${group.member_count} ativo${group.member_count !== 1 ? 's' : ''}</p>
          <p><strong>Reuniões:</strong> ${group.meetings || 'Não definido'}</p>
          <div class="btn-group">
            <button class="btn-chat"><i class="fa-solid fa-message"></i> Chat do Grupo</button>
            <button class="btn-info"><i class="fa-solid fa-info-circle"></i> Detalhes</button>
          </div>
        </div>
      `;
      
      groupsList.appendChild(div);
    });
  }
}

// Search and Filter System
class LinkSearch {
  constructor() {
    this.searchInput = document.getElementById('searchInput');
    this.clearButton = document.getElementById('clearSearch');
    this.courseFilter = document.getElementById('courseFilter');
    this.universityFilter = document.getElementById('universityFilter');
    this.resetButton = document.getElementById('resetFilters');
    
    this.linkedItems = [];
    this.groupItems = [];
    
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    // Search input events
    this.searchInput.addEventListener('input', (e) => {
      this.handleSearch();
      this.toggleClearButton(e.target.value.length > 0);
    });
    
    // Clear search button
    this.clearButton.addEventListener('click', () => {
      this.clearSearch();
    });
    
    // Filter dropdowns
    this.courseFilter.addEventListener('change', () => this.handleFilter());
    this.universityFilter.addEventListener('change', () => this.handleFilter());
    
    // Reset all filters
    this.resetButton.addEventListener('click', () => {
      this.resetAllFilters();
    });
    
    // Cache DOM elements
    this.cacheElements();
  }
  
  cacheElements() {
    this.linkedItems = Array.from(document.querySelectorAll('.linked-item'));
    this.groupItems = Array.from(document.querySelectorAll('.multi-linked-panel'));
  }
  
  toggleClearButton(show) {
    if (show) {
      this.clearButton.classList.add('show');
    } else {
      this.clearButton.classList.remove('show');
    }
  }
  
  clearSearch() {
    this.searchInput.value = '';
    this.toggleClearButton(false);
    this.handleSearch();
    this.searchInput.focus();
  }
  
  resetAllFilters() {
    this.searchInput.value = '';
    this.courseFilter.value = '';
    this.universityFilter.value = '';
    this.toggleClearButton(false);
    this.showAllItems();
    
    // Add visual feedback
    this.resetButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.resetButton.style.transform = 'scale(1)';
    }, 150);
  }
  
  handleSearch() {
    const query = this.searchInput.value.toLowerCase().trim();
    this.filterItems(query, this.courseFilter.value, this.universityFilter.value);
  }
  
  handleFilter() {
    const query = this.searchInput.value.toLowerCase().trim();
    this.filterItems(query, this.courseFilter.value, this.universityFilter.value);
  }
  
  filterItems(searchQuery, courseFilter, universityFilter) {
    let visibleLinkedCount = 0;
    let visibleGroupCount = 0;
    
    // Filter individual connections
    this.linkedItems.forEach(item => {
      const name = item.getAttribute('data-name').toLowerCase();
      const course = item.getAttribute('data-course').toLowerCase();
      const university = item.getAttribute('data-university').toLowerCase();
      
      const matchesSearch = !searchQuery || 
        name.includes(searchQuery) || 
        course.includes(searchQuery) || 
        university.includes(searchQuery);
        
      const matchesCourse = !courseFilter || course.includes(courseFilter.toLowerCase());
      const matchesUniversity = !universityFilter || university.includes(universityFilter.toLowerCase());
      
      if (matchesSearch && matchesCourse && matchesUniversity) {
        this.showItem(item);
        visibleLinkedCount++;
      } else {
        this.hideItem(item);
      }
    });
    
    // Filter study groups
    this.groupItems.forEach(item => {
      const groupName = item.getAttribute('data-group').toLowerCase();
      
      const matchesSearch = !searchQuery || groupName.includes(searchQuery);
      
      if (matchesSearch) {
        this.showItem(item);
        visibleGroupCount++;
      } else {
        this.hideItem(item);
      }
    });
    
    // Handle empty states
    this.handleEmptyStates(visibleLinkedCount, visibleGroupCount);
  }
  
  showItem(item) {
    item.classList.remove('hidden');
    item.style.animation = 'fadeIn 0.4s ease-out';
  }
  
  hideItem(item) {
    item.classList.add('hidden');
  }
  
  showAllItems() {
    [...this.linkedItems, ...this.groupItems].forEach(item => {
      this.showItem(item);
    });
    this.handleEmptyStates(this.linkedItems.length, this.groupItems.length);
  }
  
  handleEmptyStates(linkedCount, groupCount) {
    const emptyLinkedsState = document.getElementById('emptyLinkedsState');
    const emptyGroupsState = document.getElementById('emptyGroupsState');
    
    // Show/hide empty states
    if (linkedCount === 0) {
      emptyLinkedsState.style.display = 'flex';
    } else {
      emptyLinkedsState.style.display = 'none';
    }
    
    if (groupCount === 0) {
      emptyGroupsState.style.display = 'flex';
    } else {
      emptyGroupsState.style.display = 'none';
    }
  }
}

// Loading and Animation Manager
class AnimationManager {
  constructor() {
    this.loadingState = document.getElementById('loadingState');
    this.mainContent = document.querySelector('.main-content');
  }
  
  showLoading() {
    this.loadingState.style.display = 'flex';
    this.mainContent.style.opacity = '0.3';
  }
  
  hideLoading() {
    this.loadingState.style.display = 'none';
    this.mainContent.style.opacity = '1';
  }
  
  simulateLoading() {
    this.showLoading();
    
    // Simulate API call delay
    setTimeout(() => {
      this.hideLoading();
      this.animateItemsIn();
    }, 1500);
  }
  
  animateItemsIn() {
    const items = document.querySelectorAll('.linked-item, .multi-linked-panel');
    items.forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
      item.classList.add('animate-in');
    });
  }
}

// Enhanced Button Interactions
class ButtonInteractions {
  constructor() {
    this.initializeChatButtons();
    this.initializeInfoButtons();
    this.initializeEmptyStateButtons();
  }
  
  initializeChatButtons() {
    const chatButtons = document.querySelectorAll('.btn-chat');
    chatButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.handleChatClick(e);
      });
    });
  }
  
  initializeInfoButtons() {
    const infoButtons = document.querySelectorAll('.btn-info');
    infoButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.handleInfoClick(e);
      });
    });
  }
  
  initializeEmptyStateButtons() {
    const createGroupBtn = document.querySelector('.btn-create-group');
    const findPartnersBtn = document.querySelector('.btn-find-partners');
    
    if (createGroupBtn) {
      createGroupBtn.addEventListener('click', () => {
        this.handleCreateGroup();
      });
    }
    
    if (findPartnersBtn) {
      findPartnersBtn.addEventListener('click', () => {
        this.handleFindPartners();
      });
    }
  }
  
  handleChatClick(e) {
    const button = e.currentTarget;
    const item = button.closest('.linked-item, .multi-linked-panel');
    
    // Add click animation
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 150);
    
    if (item.classList.contains('linked-item')) {
      const name = item.getAttribute('data-name');
      const course = item.getAttribute('data-course');
      const university = item.getAttribute('data-university');
      
      this.showToast(`Abrindo chat com ${name}...`, 'success');
      
      // Navigate to Direct messaging page with user information
      setTimeout(() => {
        const params = new URLSearchParams({
          user: name,
          course: course,
          university: university
        });
        window.location.href = `../Direct/public/index.html?${params.toString()}`;
      }, 800);
    } else {
      const groupName = item.getAttribute('data-group');
      this.showToast(`Abrindo chat do grupo "${groupName}"...`, 'success');
      // Group chat functionality remains the same for now
    }
  }
  
  handleInfoClick(e) {
    const button = e.currentTarget;
    const item = button.closest('.linked-item, .multi-linked-panel');
    
    // Add click animation
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 150);
    
    if (item.classList.contains('linked-item')) {
      const name = item.getAttribute('data-name');
      const course = item.getAttribute('data-course');
      const university = item.getAttribute('data-university');
      
      this.showToast(`Visualizando perfil de ${name}...`, 'info');
      
      // Navigate to profile page with user information
      setTimeout(() => {
        const params = new URLSearchParams({
          user: name,
          course: course,
          university: university
        });
        window.location.href = `../confi/user-profile.html?${params.toString()}`;
      }, 800);
    } else {
      const groupName = item.getAttribute('data-group');
      // Open group details modal instead of showing toast
      groupDetailsModal.openModal(groupName);
    }
  }
  
  handleCreateGroup() {
    this.showToast('Redirecionando para criação de grupo...', 'success');
    // Here you would navigate to create group page
  }
  
  handleFindPartners() {
    this.showToast('Procurando novos parceiros de estudo...', 'success');
    // Here you would navigate to discovery page
  }
  
  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${
        type === 'success' ? 'fa-check-circle' : 
        type === 'error' ? 'fa-exclamation-circle' : 
        'fa-info-circle'
      }"></i>
      <span>${message}</span>
    `;
    
    // Add toast styles
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#4bbd7a' : type === 'error' ? '#ff6b6b' : '#70d38f',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: '10000',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.9rem',
      fontWeight: '600',
      animation: 'slideInRight 0.3s ease-out'
    });
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}

// Group Details Modal Manager
class GroupDetailsModal {
  constructor() {
    this.modal = document.getElementById('groupDetailsModal');
    this.closeBtn = document.getElementById('closeGroupModal');
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    this.currentGroupData = null;
    
    this.monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    // Close modal events
    this.closeBtn.addEventListener('click', () => {
      this.closeModal();
    });
    
    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'flex') {
        this.closeModal();
      }
    });
    
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.renderCalendar();
    });
    
    // Action buttons
    document.getElementById('reportGroupBtn').addEventListener('click', () => {
      this.handleReportGroup();
    });
    
    document.getElementById('groupDirectBtn').addEventListener('click', () => {
      this.handleGroupDirect();
    });
    
    document.getElementById('leaveGroupBtn').addEventListener('click', () => {
      this.handleLeaveGroup();
    });
  }
  
  openModal(groupKey) {
    const groupData = groupsData[groupKey];
    if (!groupData) {
      console.error('Group data not found for:', groupKey);
      return;
    }
    
    this.currentGroupData = groupData;
    this.populateModalData(groupData);
    this.renderCalendar();
    
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  closeModal() {
    this.modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    this.currentGroupData = null;
  }
  
  populateModalData(groupData) {
    // Update modal title
    document.getElementById('groupModalTitle').textContent = groupData.name;
    
    // Update group information
    document.getElementById('groupSubject').textContent = groupData.subject;
    document.getElementById('groupDescription').textContent = groupData.description;
    document.getElementById('groupMeetings').textContent = groupData.meetings;
    document.getElementById('groupLocation').textContent = groupData.location;
    
    // Populate members list
    const membersList = document.getElementById('groupMembersList');
    membersList.innerHTML = '';
    
    groupData.members.forEach((member, index) => {
      const memberElement = document.createElement('div');
      memberElement.className = 'member-item';
      memberElement.style.animationDelay = `${index * 0.1}s`;
      
      const statusClass = member.status === 'online' ? 'online' : member.status === 'away' ? 'away' : 'offline';
      const statusIndicatorClass = member.status === 'online' ? '#70d38f' : member.status === 'away' ? '#ffa500' : '#8a9ba8';
      
      memberElement.innerHTML = `
        <img src="${member.image}" alt="${member.name}" />
        <div class="member-info">
          <h4>${member.name}</h4>
          <p>${member.course}</p>
        </div>
        <div class="member-status">
          <div class="status-indicator" style="background: ${statusIndicatorClass};"></div>
          <span>${member.status === 'online' ? 'Online' : member.status === 'away' ? 'Ausente' : 'Offline'}</span>
        </div>
      `;
      
      membersList.appendChild(memberElement);
    });
  }
  
  renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const currentMonthSpan = document.getElementById('currentMonth');
    
    // Update month display
    currentMonthSpan.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
    
    // Clear previous calendar
    grid.innerHTML = '';
    
    // Wrap the calendar grid in a container if it doesn't exist
    let container = grid.parentElement;
    if (!container.classList.contains('calendar-container')) {
      container = document.createElement('div');
      container.className = 'calendar-container';
      const parent = grid.parentElement;
      parent.insertBefore(container, grid);
      container.appendChild(grid);
    }
    
    // Add day headers
    const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayHeaders.forEach(day => {
      const headerElement = document.createElement('div');
      headerElement.className = 'calendar-day-header';
      headerElement.textContent = day;
      headerElement.style.cssText = `
        font-weight: 600;
        color: #b89cff;
        text-align: center;
        padding: 8px 4px;
        font-size: 0.8rem;
      `;
      grid.appendChild(headerElement);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const today = new Date();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      const emptyElement = document.createElement('div');
      emptyElement.className = 'calendar-day other-month';
      grid.appendChild(emptyElement);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day;
      
      // Check if today
      if (this.currentYear === today.getFullYear() && 
          this.currentMonth === today.getMonth() && 
          day === today.getDate()) {
        dayElement.classList.add('today');
      }
      
      // Check if meeting day
      if (this.currentGroupData && this.currentGroupData.meetingDays) {
        const currentDate = new Date(this.currentYear, this.currentMonth, day);
        const dayOfWeek = currentDate.getDay();
        
        if (this.currentGroupData.meetingDays.includes(dayOfWeek)) {
          dayElement.classList.add('meeting-day');
          dayElement.title = 'Dia de reunião do grupo';
        }
      }
      
      grid.appendChild(dayElement);
    }
  }
  
  handleReportGroup() {
    if (!this.currentGroupData) return;
    
    const confirmation = confirm(`Tem certeza que deseja reportar o grupo "${this.currentGroupData.name}"?\n\nEsta ação notificará os moderadores sobre possível comportamento inadequado.`);
    
    if (confirmation) {
      // Here you would typically send a report to the backend
      this.showActionToast('Grupo reportado com sucesso. Nossa equipe irá analisar.', 'success');
      this.closeModal();
    }
  }
  
  handleGroupDirect() {
    if (!this.currentGroupData) return;
    
    this.showActionToast(`Redirecionando para o chat do grupo "${this.currentGroupData.name}"...`, 'success');
    // Here you would typically navigate to the group chat
    setTimeout(() => {
      this.closeModal();
    }, 1500);
  }
  
  handleLeaveGroup() {
    if (!this.currentGroupData) return;
    
    const confirmation = confirm(`Tem certeza que deseja sair do grupo "${this.currentGroupData.name}"?\n\nVocê perderá acesso a todas as conversas e materiais compartilhados.`);
    
    if (confirmation) {
      // Here you would typically remove user from group in backend
      this.showActionToast('Você saiu do grupo com sucesso.', 'info');
      this.closeModal();
      
      // Optional: Remove group from UI
      setTimeout(() => {
        const groupElement = document.querySelector(`[data-group="${Object.keys(groupsData).find(key => groupsData[key] === this.currentGroupData)}"]`);
        if (groupElement) {
          groupElement.style.animation = 'fadeOut 0.3s ease-in';
          setTimeout(() => {
            groupElement.remove();
          }, 300);
        }
      }, 1000);
    }
  }
  
  showActionToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${
        type === 'success' ? 'fa-check-circle' : 
        type === 'error' ? 'fa-exclamation-circle' : 
        'fa-info-circle'
      }"></i>
      <span>${message}</span>
    `;
    
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#4bbd7a' : type === 'error' ? '#ff6b6b' : '#70d38f',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: '10001',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.9rem',
      fontWeight: '600',
      animation: 'slideInRight 0.3s ease-out'
    });
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }
}

// Initialize everything
let searchSystem, animationManager, buttonInteractions, groupDetailsModal;

// Initialization
window.onload = async () => {
  applyLightMode();
  
  // Initialize managers
  animationManager = new AnimationManager();
  searchSystem = new LinkSearch();
  buttonInteractions = new ButtonInteractions();
  groupDetailsModal = new GroupDetailsModal();
  
  // Show loading state
  animationManager.showLoading();
  
  try {
    // Load data from backend APIs - this will take the actual time needed
    await loadData();
    
    // Hide loading and animate items once data is loaded
    animationManager.hideLoading();
    animationManager.animateItemsIn();
    
    console.log('🚀 Linkeds inicializaram corretamente!');
    console.log('📊 Dados carregados:', { linkedCount: linkedMatches.length, groupsCount: studyGroups.length });
  } catch (error) {
    console.error('❌ Erro ao inicializar o sistema:', error);
    animationManager.hideLoading();
  }
};
