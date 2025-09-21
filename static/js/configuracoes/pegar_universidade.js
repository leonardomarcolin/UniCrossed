// Enhanced Universities and Courses API Integration for Config Profile
class AcademicSearchManager {
  constructor() {
    this.universities = [];
    this.courses = [];
    this.currentSearchType = null;
    this.searchTimeout = null;
    this.init();
  }

  init() {
    console.log('🎓 Academic Search Manager loaded!');
    this.setupEventListeners();
    this.loadUniversities();
  }

  setupEventListeners() {
    // University input
    const universidadeInput = document.getElementById('instituicao');
    if (universidadeInput) {
      universidadeInput.addEventListener('click', () => {
        this.currentSearchType = 'university';
        this.showHelpMessage('universidadeDropdown', 'Digite pelo menos 5 caracteres para buscar universidades...');
      });

      universidadeInput.addEventListener('input', (e) => {
        this.currentSearchType = 'university';
        this.handleSearch(e.target.value, 'university');
      });

      universidadeInput.addEventListener('focus', (e) => {
        this.currentSearchType = 'university';
        if (e.target.value.length >= 5) {
          this.handleSearch(e.target.value, 'university');
        }
      });

      universidadeInput.addEventListener('keydown', (e) => {
        this.handleKeyboardNavigation(e, 'universidadeDropdown');
      });
    }

    // Course input
    const cursoInput = document.getElementById('curso');
    if (cursoInput) {
      cursoInput.addEventListener('click', () => {
        this.currentSearchType = 'course';
        this.showHelpMessage('cursoDropdown', 'Digite pelo menos 5 caracteres para buscar cursos...');
      });

      cursoInput.addEventListener('input', (e) => {
        this.currentSearchType = 'course';
        this.handleSearch(e.target.value, 'course');
      });

      cursoInput.addEventListener('focus', (e) => {
        this.currentSearchType = 'course';
        if (e.target.value.length >= 5) {
          this.handleSearch(e.target.value, 'course');
        }
      });

      cursoInput.addEventListener('keydown', (e) => {
        this.handleKeyboardNavigation(e, 'cursoDropdown');
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-item.vertical')) {
        this.hideAllDropdowns();
      }
    });
  }

  async loadUniversities() {
    try {
      const response = await fetch('http://localhost:3000/universidades');
      if (!response.ok) throw new Error('Erro na resposta da API');
      
      this.universities = await response.json();
      console.log('✅ Universities loaded:', this.universities.length);
    } catch (error) {
      console.error('❌ Error loading universities:', error);
    }
  }

  handleSearch(searchTerm, searchType) {
    if (searchTerm.length < 5) {
      this.hideDropdown(searchType === 'university' ? 'universidadeDropdown' : 'cursoDropdown');
      return;
    }

    // Show loading state
    const dropdownId = searchType === 'university' ? 'universidadeDropdown' : 'cursoDropdown';
    this.showLoadingState(dropdownId);

    // Add a small delay to avoid too many API calls while typing
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if (searchType === 'university') {
        this.searchUniversities(searchTerm);
      } else if (searchType === 'course') {
        this.searchCourses(searchTerm);
      }
    }, 300);
  }

  searchUniversities(searchTerm) {
    const filtered = this.universities.filter(uni => 
      uni.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.estado.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.displayUniversityResults(filtered);
  }

  searchCourses(searchTerm) {
    // Extract all unique courses from universities
    const allCourses = new Set();
    this.universities.forEach(uni => {
      if (uni.cursos && Array.isArray(uni.cursos)) {
        uni.cursos.forEach(curso => {
          if (curso.toLowerCase().includes(searchTerm.toLowerCase())) {
            allCourses.add(curso);
          }
        });
      }
    });

    const filteredCourses = Array.from(allCourses).slice(0, 10); // Limit to 10 results
    this.displayCourseResults(filteredCourses);
  }

  displayUniversityResults(universities) {
    const dropdown = document.getElementById('universidadeDropdown');
    if (!dropdown) return;

    dropdown.innerHTML = '';
    
    if (universities.length === 0) {
      dropdown.innerHTML = '<div class="dropdown-item no-results">Nenhuma universidade encontrada</div>';
    } else {
      universities.slice(0, 8).forEach(uni => { // Limit to 8 results
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerHTML = `
          <div class="university-name">${uni.nome}</div>
          <div class="university-location">${uni.cidade}/${uni.estado}</div>
        `;
        item.onclick = () => this.selectUniversity(uni);
        dropdown.appendChild(item);
      });
    }

    this.showDropdown('universidadeDropdown');
  }

  displayCourseResults(courses) {
    const dropdown = document.getElementById('cursoDropdown');
    if (!dropdown) return;

    dropdown.innerHTML = '';
    
    if (courses.length === 0) {
      dropdown.innerHTML = '<div class="dropdown-item no-results">Nenhum curso encontrado</div>';
    } else {
      courses.forEach(curso => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerHTML = `
          <div class="university-name">${curso}</div>
        `;
        item.onclick = () => this.selectCourse(curso);
        dropdown.appendChild(item);
      });
    }

    this.showDropdown('cursoDropdown');
  }

  selectUniversity(university) {
    const input = document.getElementById('instituicao');
    if (input) {
      input.value = university.nome;
    }
    this.hideDropdown('universidadeDropdown');
  }

  selectCourse(course) {
    const input = document.getElementById('curso');
    if (input) {
      input.value = course;
    }
    this.hideDropdown('cursoDropdown');
  }

  showDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      dropdown.style.display = 'block';
    }
  }

  showHelpMessage(dropdownId, message) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      dropdown.innerHTML = `<div class="dropdown-item help-message">${message}</div>`;
      dropdown.style.display = 'block';
    }
  }

  showLoadingState(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      dropdown.innerHTML = `
        <div class="dropdown-item loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Buscando...
        </div>
      `;
      dropdown.style.display = 'block';
    }
  }

  handleKeyboardNavigation(e, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown || dropdown.style.display === 'none') return;

    const items = dropdown.querySelectorAll('.dropdown-item:not(.help-message):not(.no-results)');
    if (items.length === 0) return;

    let currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
    if (currentIndex === -1) currentIndex = 0;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        items[currentIndex]?.classList.remove('selected');
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex]?.classList.add('selected');
        break;
      case 'ArrowUp':
        e.preventDefault();
        items[currentIndex]?.classList.remove('selected');
        currentIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        items[currentIndex]?.classList.add('selected');
        break;
      case 'Enter':
        e.preventDefault();
        if (items[currentIndex]) {
          items[currentIndex].click();
        }
        break;
      case 'Escape':
        this.hideDropdown(dropdownId);
        break;
    }
  }

  hideDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  hideAllDropdowns() {
    this.hideDropdown('universidadeDropdown');
    this.hideDropdown('cursoDropdown');
  }
}

// Legacy function for backward compatibility
function buscarUniversidades(termo) {
  if (termo.length < 5) return;
  fetch(`http://localhost:3000/universidades?nome=${encodeURIComponent(termo)}`)
  .then(res => {
    if (!res.ok) throw new Error("Erro na resposta");
    return res.json();
  })
  .then(data => {
    mostrarResultados(data);
  })
  .catch(error => {
    console.error("Erro ao carregar universidades:", error);
  });
}

function selecionarUniversidade(universidade) {
  document.getElementById('instituicao').value = universidade.nome;
  document.getElementById('universidadeDropdown').style.display = 'none';
}

function mostrarResultados(universidades) {
  const dropdown = document.getElementById('universidadeDropdown');
  dropdown.innerHTML = '';
  
  universidades.forEach(univ => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.innerHTML = `
      <div class="university-name">${univ.nome}</div>
      <div class="university-location">${univ.cidade}/${univ.estado}</div>
    `;
    item.onclick = () => selecionarUniversidade(univ);
    dropdown.appendChild(item);
  });

  dropdown.style.display = 'block';
}

// Initialize the enhanced search manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AcademicSearchManager();
});