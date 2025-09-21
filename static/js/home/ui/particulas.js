// funcao das particulas
function createParticles(color) {
    const container = document.querySelector('.content2');

    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.background = color;

        const size = Math.random() * 12 + 8;
        const skewX = Math.random() * 20 - 10;
        const skewY = Math.random() * 20 - 10;
        const rotate = Math.random() * 360 + 'deg';

        particle.style.width = `${size}px`;
        particle.style.height = `${size + 4}px`;
        particle.style.transform = `skew(${skewX}deg, ${skewY}deg) rotate(${rotate})`;
        
        const x = (Math.random() - 0.5) * 300 + 'px';
        const y = (Math.random() - 0.5) * 300 + 'px';
        particle.style.setProperty('--x', x);
        particle.style.setProperty('--y', y);

        if (color === '#28a745') {
            particle.style.left = 'calc(100% - 30px)';
            particle.style.top = 'calc(100% - 30px)';
        } else {
            particle.style.left = '30px';
            particle.style.top = 'calc(100% - 30px)';
        }

        container.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}
