
const diamond = document.querySelector('.logo-diamond');
let angle = 0;
let speed = 0.5;
let targetSpeed = 0.2;
let lastTime = performance.now();

function animateDiamond(time) {
    if (!diamond) return;
    const delta = time - lastTime;
    lastTime = time;
    // Плавно меняем скорость
    speed += (targetSpeed - speed) * 0.03;
    // Вращение
    angle += speed * delta;
    diamond.style.transform =
        `rotateY(${angle}deg)`;
    // Сияние
    const glow =
        4 + Math.sin(angle * 0.03) * 3;
    diamond.style.filter =
        `brightness(${1 + Math.sin(angle * 0.03) * 0.15})
         drop-shadow(0 0 ${glow}px rgba(255,255,255,0.8))
         drop-shadow(0 0 ${glow * 1.5}px rgba(212,168,91,0.5))`;

    requestAnimationFrame(animateDiamond);
}

requestAnimationFrame(animateDiamond);


/* =================================
   НАВЕДЕНИЕ МЫШИ
================================= */

const logoBox = document.querySelector('.logo-box');
if (logoBox) {
logoBox.addEventListener('mouseenter', () => {
    // Ускоряем вращение
    targetSpeed = 0.5;
});

logoBox.addEventListener('mouseleave', () => {
    // Возвращаем нормальную скорость
    targetSpeed = 0.2;

});
}
