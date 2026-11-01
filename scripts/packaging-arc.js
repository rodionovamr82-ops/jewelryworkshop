
document.addEventListener("DOMContentLoaded", () => {
    const scene = document.getElementById("arcScene");
    const track = document.getElementById("arcTrack");

    if (!scene || !track) return;

    const photos = Array.from(
        track.querySelectorAll(".arc-photo")
    );

    if (!photos.length) return;

    const total = photos.length;
    const step = (Math.PI * 2) / total;

    let activeIndex = 0;
    let rotation = 0;
    let resizeFrame = null;

    // Размещаем фотографии по кругу
    function renderCarousel() {
        const sceneWidth = scene.clientWidth;
        const sceneHeight = scene.clientHeight;

        if (!sceneWidth || !sceneHeight) return;

        const photoWidth = photos[0].offsetWidth;
        const photoHeight = photos[0].offsetHeight;

        // Радиус подстраивается под доступное место
        const radiusX = Math.max(
            0,
            Math.min(
                sceneWidth * 0.36,
                sceneWidth / 2 - photoWidth * 0.34
            )
        );

        const radiusZ = Math.min(
            photoHeight * 0.72,
            sceneWidth * 0.32
        );

        photos.forEach((photo, index) => {
            const angle = index * step - rotation;

            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            // Передняя фотография крупнее,
            // боковые и задняя — меньше
            const scale = 0.48 + ((cos + 1) / 2) * 0.48;

            // Центр круга — посередине сцены (раньше отсчёт шёл от левого края)
            const x = sceneWidth / 2 + sin * radiusX;

            // Небольшое смещение по вертикали помогает
            // различать фотографии в задней части круга
            const y =
                sceneHeight * 0.48 +
                (1 - cos) * sceneHeight * 0.065 +
                sin * sceneHeight * 0.025;

            const z = cos * radiusZ;

            photo.style.transform =
                `translate3d(${x}px, ${y}px, ${z}px) ` +
                `translate(-50%, -50%) scale(${scale})`;

            // Передние фотографии находятся поверх задних
            photo.style.zIndex = String(
                Math.round((cos + 1) * 100)
            );

            photo.classList.toggle(
                "is-active",
                index === activeIndex
            );

            photo.setAttribute(
                "aria-pressed",
                index === activeIndex ? "true" : "false"
            );
        });
    }

    // Поворачиваем карусель по часовой стрелке
    function selectPhoto(index) {
        if (index === activeIndex) return;

        // Сколько шагов нужно сделать вперёд по кругу
        const steps = (index - activeIndex + total) % total;

        rotation += steps * step;
        activeIndex = index;

        renderCarousel();
    }

    photos.forEach((photo, index) => {
        photo.setAttribute("role", "button");
        photo.setAttribute("tabindex", "0");
        photo.setAttribute("aria-label", `Показать фотографию ${index + 1}`);

        photo.addEventListener("click", () => {
            selectPhoto(index);
        });

        // Поддержка клавиатуры
        photo.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectPhoto(index);
            }
        });
    });

    // Пересчитываем круг при изменении размера окна
    window.addEventListener("resize", () => {
        cancelAnimationFrame(resizeFrame);

        resizeFrame = requestAnimationFrame(() => {
            renderCarousel();
        });
    });

    renderCarousel();
});
