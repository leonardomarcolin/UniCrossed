document.querySelectorAll('.card').forEach(card => {
    const slider = card.querySelector('.slider .list');
    const items = card.querySelectorAll('.slider .list .item');
    const next = card.querySelector('.next');
    const prev = card.querySelector('.prev');
    const dots = card.querySelectorAll('.dots li');

    let active = 0;
    const lengthItems = items.length - 1;

    const reloadSlider = () => {
        slider.style.left = -items[active].offsetLeft + 'px';

        const currentDot = card.querySelector('.dots li.active');
        if (currentDot) currentDot.classList.remove('active');
        if (dots[active]) dots[active].classList.add('active');

        clearInterval(card._interval);
        card._interval = setInterval(() => next.click(), 3000);
    };

    next.addEventListener('click', () => {
        active = active + 1 <= lengthItems ? active + 1 : 0;
        reloadSlider();
    });

    prev.addEventListener('click', () => {
        active = active - 1 >= 0 ? active - 1 : lengthItems;
        reloadSlider();
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            active = i;
            reloadSlider();
        });
    });

    window.addEventListener('resize', () => reloadSlider());

    card._interval = setInterval(() => next.click(), 3000);

    reloadSlider();
});

document.querySelectorAll('.card img').forEach(img => {
    img.setAttribute('draggable', 'false');
});

document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("modoClaroToggle") === "true") {
        document.body.classList.add("light-mode");
    }
});
