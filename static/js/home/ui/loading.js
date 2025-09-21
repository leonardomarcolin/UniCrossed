class LoadingScreen {
    constructor() {
        this.overlay = document.getElementById('loadingOverlay');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.loadingSteps = [
            { text: 'Inicializando UniCrossed...', progress: 20 },
            { text: 'Carregando perfis de usuários...', progress: 40 },
            { text: 'Conectando à rede de estudos...', progress: 60 },
            { text: 'Preparando sua experiência...', progress: 80 },
            { text: 'Pronto para conectar!', progress: 100 }
        ];
        this.currentStep = 0;
        this.isComplete = false;
    }

    updateProgress(progress, text) {
        if (this.progressFill && this.progressText) {
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = text;
        }
    }

    nextStep() {
        if (this.currentStep < this.loadingSteps.length) {
            const step = this.loadingSteps[this.currentStep];
            this.updateProgress(step.progress, step.text);
            this.currentStep++;

            if (this.currentStep >= this.loadingSteps.length) {
                this.complete();
            } else {
                // Random delay between steps to make it feel more natural
                const delay = Math.random() * 800 + 400; // 400-1200ms
                setTimeout(() => this.nextStep(), delay);
            }
        }
    }

    complete() {
        if (this.isComplete) return;
        this.isComplete = true;

        // Wait a moment to show 100% completion
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.classList.add('loaded');

                // Remove the loading screen from DOM after transition
                setTimeout(() => {
                    if (this.overlay && this.overlay.parentNode) {
                        this.overlay.remove();
                    }
                }, 800);
            }
        }, 600);
    }

    start() {
        // Start loading after a brief moment
        setTimeout(() => {
            this.nextStep();
        }, 800);
    }
}


// tela de carregamento
let loadingScreen = null;

// Start loading screen immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadingScreen = new LoadingScreen();
        loadingScreen.start();
    });
} else {
    loadingScreen = new LoadingScreen();
    loadingScreen.start();
}

// Also handle when all resources are fully loaded
window.addEventListener('load', () => {
    // Give it a moment to show the loading, then complete
    setTimeout(() => {
        if (loadingScreen && !loadingScreen.isComplete) {
            loadingScreen.complete();
        }
    }, 1200);
});


function like() {
    return InteractionManager.like();
}

function superlike() {
    return InteractionManager.superlike();
}

function dislike() {
    return InteractionManager.dislike();
}

// Inicializa quando o DOM carrega
document.addEventListener('DOMContentLoaded', function () {
    AppState.init();

    if (window.APP_CONFIG?.initialProfile) {
        ProfileManager.update(window.APP_CONFIG.initialProfile);
    } else {
        // Garante que pelo menos as habilidades tenham uma mensagem
        ProfileManager.updateSkills([]);
    }
    // ProfileManager.initializeCurrentProfile();

    // Adiciona listeners de teclado (funcionalidade extra)
    document.addEventListener('keydown', function (event) {
        if (AppState.isLoading) return;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                dislike();
                break;
            case 'ArrowRight':
                event.preventDefault();
                like();
                break;
            case 'ArrowUp':
                event.preventDefault();
                superlike();
                break;
        }
    });

    console.log('App inicializado com sucesso!');
});