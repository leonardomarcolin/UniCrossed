const ButtonManager = {
    disable() {
        const { buttons } = AppState.elements;
        Object.values(buttons).forEach(btn => {
            if (btn) btn.disabled = true;
        });
    },

    enable() {
        const { buttons } = AppState.elements;
        Object.values(buttons).forEach(btn => {
            if (btn) btn.disabled = false;
        });
    }
};