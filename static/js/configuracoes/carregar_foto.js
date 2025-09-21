const PhotoManager = {
    init() {
        const uploadBtn = document.getElementById('uploadBtn');
        const removeBtn = document.getElementById('removePhotoBtn');
        const photoInput = document.getElementById('photoInput');

        uploadBtn.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', this.handleFileSelect.bind(this));
        removeBtn.addEventListener('click', this.removePhoto.bind(this));
    },

    async handleFileSelect(event) {
        const files = event.target.files;
        if (!files.length) return;

        for (let file of files) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limite
                alert('Arquivo muito grande. Máximo 5MB');
                continue;
            }
            
            await this.uploadPhoto(file);
        }
    },

    async uploadPhoto(file) {
        const formData = new FormData();
        formData.append('imagem', file);

        try {
            const response = await fetch('/upload-foto/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': window.APP_CONFIG.csrfToken
                },
                body: formData
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                // Atualizar carrossel com nova foto
                this.addPhotoToCarousel(result.photo_url, result.photo_id);
                NotificationSystem.show('Foto enviada com sucesso!', 'success');
            } else {
                NotificationSystem.show(result.error || 'Erro ao enviar foto', 'error');
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            NotificationSystem.show('Erro no upload da foto', 'error');
        }
    },

    async removePhoto(photoId) {
        if (!confirm('Remover esta foto?')) return;

        try {
            const response = await fetch(`/remove-photo/${photoId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': window.APP_CONFIG.csrfToken
                }
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                // Remover do carrossel
                this.removePhotoFromCarousel(photoId);
                NotificationSystem.show('Foto removida', 'success');
            }
        } catch (error) {
            NotificationSystem.show('Erro ao remover foto', 'error');
        }
    },

    addPhotoToCarousel(photoUrl, photoId) {
        // Código para adicionar ao carrossel existente
        const slider = document.querySelector('.slider .list');
        const newItem = document.createElement('div');
        newItem.className = 'item';
        newItem.dataset.photoId = photoId;
        newItem.innerHTML = `<img src="${photoUrl}" alt="">`;
        slider.appendChild(newItem);
    }
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    PhotoManager.init();
});