const ProfileManager = {

    // Atualiza perfil na tela (função mais limpa)
    update(perfil) {
        const { elements } = AppState;

        // Username - mais específico que buscar todos h2
        if (elements.usernameEl) {
            console.log('Atualizando username de', elements.usernameEl.textContent, 'para', perfil.username);
            elements.usernameEl.textContent = perfil.username;
        } else {
            console.error('Username element não encontrado!');
        }

        // Localização
        if (elements.locationEl) {
            const locationText = this.formatLocation(perfil.cidade, perfil.estado);
            elements.locationEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${locationText}`;
        }

        // Biografia
        if (elements.bioEl) {
            console.log('Atualizando bio de', elements.bioEl.textContent, 'para', perfil.bio);
            elements.bioEl.textContent = perfil.bio;
        } else {
            console.error('Bio element não encontrado!');
        }

        // Habilidades
        this.updateSkills(perfil.habilidades);

        // Atualiza ID global
        AppState.currentProfileId = perfil.id;
        console.log('Perfil atualizado:', perfil.id);
        console.log('Elements disponíveis:', elements);
    },

    // Formata localização
    formatLocation(cidade, estado) {
        if (cidade && estado) {
            return `${cidade}, ${estado.toUpperCase()}`;
        }
        return cidade || 'Localização não informada';
    },

    // Atualiza habilidades de forma mais eficiente
    updateSkills(habilidades) {
        const { tagsContainer } = AppState.elements;
        if (!tagsContainer) return;

        // Limpa container
        tagsContainer.innerHTML = '';

        if (habilidades && habilidades.length > 0) {
            // Cria fragment para melhor performance
            const fragment = document.createDocumentFragment();

            habilidades.forEach(hab => {
                const span = document.createElement('span');
                span.textContent = `#${hab}`;
                fragment.appendChild(span);
            });

            tagsContainer.appendChild(fragment);
        } else {
            const span = document.createElement('span');
            span.textContent = 'Nenhuma habilidade cadastrada';
            tagsContainer.appendChild(span);
        }
    },

    // Busca próximo perfil (async/await limpo)
    async fetchNext() {
        if (AppState.isLoading) {
            console.log('Já está carregando...');
            return false;
        }

        AppState.isLoading = true;

        try {
            const response = await fetch('/pegar-proximo-perfil/', {
                method: 'GET',
                headers: {
                    'X-CSRFToken': window.APP_CONFIG.csrfToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success' && data.perfil) {
                this.update(data.perfil);
                ButtonManager.enable();
                NotificationSystem.show('Novo perfil carregado!', 'success', 1500);
                return true;
            }

            if (data.status === 'no_more_profiles') {
                NotificationSystem.show('Não há mais perfis para mostrar!', 'info');
                this.handleNoMoreProfiles();
                return false;
            }

        } catch (error) {
            console.error('Erro ao carregar próximo perfil:', error);
            NotificationSystem.show('Erro ao carregar próximo perfil', 'error');
            ButtonManager.enable();
        } finally {
            AppState.isLoading = false;
        }

        return false;
    },

    // Lida com fim dos perfis
    handleNoMoreProfiles() {
        ButtonManager.disable();
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    },

    // initializeCurrentProfile() {
    //     // Se já existe um perfil carregado, inicialize as habilidades
    //     if (window.APP_CONFIG?.currentProfileId) {
    //         // Busca as habilidades do perfil atual do DOM ou de alguma variável
    //         // Como não temos os dados, vamos pelo menos mostrar a mensagem padrão
    //         const { tagsContainer } = AppState.elements;
    //         if (tagsContainer && tagsContainer.children.length === 0) {
    //             const span = document.createElement('span');
    //             span.textContent = 'Nenhuma habilidade cadastrada';
    //             tagsContainer.appendChild(span);
    //         }
    //     }
    // },
};

