const AppState = {
    get currentProfileId() {
        return window.APP_CONFIG?.currentProfileId || '';
    },

    set currentProfileId(value) {
        if (window.APP_CONFIG) {
            window.APP_CONFIG.currentProfileId = value;
        }
    },

    isLoading: false,

    // Seletores cachados (mais eficiente que buscar toda vez)
    elements: {
        usernameEl: null,
        locationEl: null,
        bioEl: null,
        tagsContainer: null,
        buttons: {
            like: null,
            superlike: null,
            dislike: null
        }
    },

    // Inicializa elementos
    init() {
        this.elements.usernameEl = document.querySelector('.userCardDetails h2');
        this.elements.locationEl = document.querySelector('.userCardLocation');
        this.elements.bioEl = document.querySelector('.userCardBio p');
        this.elements.tagsContainer = document.querySelector('.userCardTags');

        console.log('Username element:', this.elements.usernameEl);
        console.log('Location element:', this.elements.locationEl);
        console.log('Bio element:', this.elements.bioEl);
        console.log('Tags container:', this.elements.tagsContainer);

        this.elements.buttons.like = document.getElementById('likeBtn');
        this.elements.buttons.superlike = document.getElementById('superlikeBtn');
        this.elements.buttons.dislike = document.getElementById('dislikeBtn');
    }
};

