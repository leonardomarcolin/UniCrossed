const InteractionManager = {

    // Validacao comum para todas as interacoes
    validateInteraction() {
        if (!AppState.currentProfileId) {
            NotificationSystem.show('Não há mais nenhum perfil para interagir no momento!', 'warning');
            return false;
        }

        if (AppState.isLoading) {
            console.log('Aguarde a operação anterior...');
            return false;
        }

        return true;
    },

    // Funcao generica para enviar interacao
    async sendInteraction(type, data = {}) {
        if (!this.validateInteraction()) return;

        ButtonManager.disable();
        AppState.isLoading = true;

        // Efeitos visuais baseado no tipo
        const colors = {
            like: '#28a745',
            superlike: '#ffc107',
            dislike: '#dc3545'
        };

        if (window.createParticles) {
            createParticles(colors[type]);
        }

        try {
            const response = await fetch(`${type}/${AppState.currentProfileId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': window.APP_CONFIG.csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            return this.handleInteractionResponse(result, type);

        } catch (error) {
            console.error(`Erro no ${type}:`, error);
            NotificationSystem.show('Algo deu errado. Tente novamente.', 'error');
            ButtonManager.enable();
            return false;
        } finally {
            AppState.isLoading = false;
        }
    },

    // Processa resposta das interacoes
    handleInteractionResponse(data, type) {
        const messages = {
            like: 'Like enviado!',
            superlike: 'Superlike enviado!',
            dislike: 'Dislike enviado!'
        };

        if (data.status === 'success') {
            const message = data.matched ? 'Linked! Podem conversar agora!' : messages[type];
            const msgType = data.matched ? 'success' : 'info';

            NotificationSystem.show(message, msgType);

            // Carrega proximo perfil apos delay
            setTimeout(() => ProfileManager.fetchNext(), 800);
            return true;

        } else {
            const msgType = data.status === 'error' ? 'error' : 'info';
            NotificationSystem.show(data.message, msgType);
            ButtonManager.enable();
            return false;
        }
    },

    async like() {
        return this.sendInteraction('like');
    },

    async superlike() {
        if (!InteractionManager.validateInteraction()) return;

        const mensagem = prompt("Digite sua mensagem (mínimo 10 caracteres):");

        if (!mensagem || mensagem.trim().length < 10) {
            NotificationSystem.show('Mensagem muito curta! Mínimo 10 caracteres.', 'warning');
            return false;
        }

        if (mensagem.trim().length > 500) {
            NotificationSystem.show('Mensagem muito longa! Máximo 500 caracteres.', 'warning');
            return false;
        }

        return this.sendInteraction('superlike', { mensagem: mensagem.trim() });
    },

    async dislike() {
        return this.sendInteraction('dislike');
    }
};