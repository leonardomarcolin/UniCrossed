const NotificationSystem = {
    show(message, type = 'success', duration = 3000) {
        // Remove notificações antigas se houver muitas
        const existingNotifications = document.querySelectorAll('.notification');
        if (existingNotifications.length > 2) {
            existingNotifications[0].remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Adiciona ícones baseado no tipo
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        if (icons[type]) {
            notification.textContent = `${icons[type]} ${message}`;
        }

        document.body.appendChild(notification);

        // Auto-remove com animação
        setTimeout(() => {
            notification.classList.add('notification-fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
};
