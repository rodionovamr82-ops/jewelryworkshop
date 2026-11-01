document.addEventListener("DOMContentLoaded", function () {

    /*
     * Блок со слайдами.
     * На главной странице он называется .hero,
     * на странице «Про майстерню» — .about-story.
     */
    const story = document.querySelector(".hero, .about-story");
    if (!story) return;

    const slides = story.querySelectorAll(".about-slide");
    const counter = story.querySelector(".about-counter .current");
    if (!slides.length) return;

    let currentSlide = 0;
    let isAnimating = false;
    let lastWheelTime = 0;
    let waitForPause = false;
    let autoplayBlocked = false;


    /*
     * Можно ли перейти на другой слайд в этом направлении?
     * Если нет (первый слайд и крутим вверх, последний и крутим вниз) —
     * страница продолжает прокручиваться как обычно.
     */
    function canChange(direction) {
        const next = currentSlide + direction;
        return next >= 0 && next < slides.length;
    }


    /*
     * Слайды переключаются только пока страница стоит в самом верху.
     * Если её уже прокрутили вниз — работает обычный scroll.
     *
     * Важно: блок .hero «прилипает» к верху экрана (position: sticky), поэтому
     * его getBoundingClientRect().top всё время равен 0, даже когда секция
     * уже накрывает видео. Проверяем именно прокрутку страницы.
     */
    function isInView() {
        return window.scrollY < 5;
    }


    /*
     * Запуск видео. Если браузер запретил автозапуск,
     * видео стартует при первом действии посетителя.
     */
    function playVideo(video, fromStart) {
        if (!video) return;
        if (fromStart) video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(function () {
                autoplayBlocked = true;
            });
        }
    }

    function resumeBlockedVideo() {
        if (!autoplayBlocked) return;
        autoplayBlocked = false;
        playVideo(slides[currentSlide].querySelector("video"), false);
    }

    ["pointerdown", "touchstart", "keydown", "wheel"].forEach(function (name) {
        window.addEventListener(name, resumeBlockedVideo, { passive: true });
    });


    /*
     * Подгружаем следующий ролик заранее,
     * чтобы при переключении он начинался без паузы.
     */
    function preloadVideo(index) {
        if (index < 0 || index >= slides.length) return;
        const video = slides[index].querySelector("video");
        if (video) video.preload = "auto";
    }


    function changeSlide(direction) {
        if (isAnimating || !canChange(direction)) return false;

        const nextSlide = currentSlide + direction;
        isAnimating = true;

        const current = slides[currentSlide];
        const next = slides[nextSlide];

        current.classList.remove("is-active");
        next.classList.add("is-active");

        /*
         * Видео текущего слайда останавливаем.
         */
        const currentVideo = current.querySelector("video");
        if (currentVideo) {
            currentVideo.pause();
        }

        /*
         * Видео нового слайда запускаем с начала.
         */
        playVideo(next.querySelector("video"), true);

        currentSlide = nextSlide;
        preloadVideo(currentSlide + 1);

        /*
         * Обновляем номер.
         */
        if (counter) {
            counter.textContent = String(currentSlide + 1).padStart(2, "0");
        }

        setTimeout(function () {
            isAnimating = false;
        }, 1000);

        return true;
    }


    /*
     * Первый ролик запускаем, второй подгружаем.
     */
    playVideo(slides[0].querySelector("video"), false);
    window.addEventListener("load", function () {
        preloadVideo(1);
    });


    /*
     * Слушаем колесо на всём окне (даже когда курсор над секцией, которая
     * накрыла видео). Если страница в этот момент прокручена, то жест
     * принадлежит обычной прокрутке: слайд переключится только после паузы,
     * иначе в конце одного жеста «вверх» слайд сменился бы лишний раз.
     */
    let wheelGap = Infinity;

    window.addEventListener("wheel", function () {
        const now = Date.now();
        wheelGap = now - lastWheelTime;
        lastWheelTime = now;
        if (!isInView()) waitForPause = true;
    }, { passive: true, capture: true });


    /*
     * MOUSE WHEEL
     */
    story.addEventListener("wheel", function (event) {
        if (!isInView()) return;
        if (Math.abs(event.deltaY) < 4) return;

        const direction = event.deltaY > 0 ? 1 : -1;

        /*
         * Первый/последний слайд — отдаём прокрутку странице.
         */
        if (!canChange(direction)) return;

        /*
         * Пока идёт смена слайда, страницу не прокручиваем.
         */
        event.preventDefault();

        const pause = wheelGap;

        if (isAnimating) return;

        /*
         * Инерция тачпада: события идут сплошным потоком ещё долго
         * после жеста. Пока в потоке не появится пауза, это хвост
         * прошлого жеста, и лишний слайд не переключаем.
         */
        if (waitForPause) {
            if (pause < 120) return;
            waitForPause = false;
        }

        if (changeSlide(direction)) {
            waitForPause = true;
        }
    }, { passive: false });


    /*
     * КЛАВИАТУРА
     */
    document.addEventListener("keydown", function (event) {
        if (!story.matches(":hover") || !isInView()) return;

        let direction = 0;
        if (event.key === "ArrowDown") direction = 1;
        if (event.key === "ArrowUp") direction = -1;
        if (!direction || !canChange(direction)) return;

        event.preventDefault();
        changeSlide(direction);
    });


    /*
     * TOUCH
     */
    let touchStartY = 0;
    let touchStartedInView = false;

    story.addEventListener("touchstart", function (event) {
        touchStartY = event.touches[0].clientY;
        touchStartedInView = isInView();
    }, { passive: true });

    /*
     * Пока палец ведёт по блоку и слайд может смениться,
     * не даём странице прокручиваться вместе с ним.
     */
    story.addEventListener("touchmove", function (event) {
        if (!touchStartedInView || !isInView()) return;

        const difference = touchStartY - event.touches[0].clientY;
        if (Math.abs(difference) < 10) return;

        if (canChange(difference > 0 ? 1 : -1)) {
            event.preventDefault();
        }
    }, { passive: false });

    story.addEventListener("touchend", function (event) {
        if (!touchStartedInView || !isInView()) return;

        const difference = touchStartY - event.changedTouches[0].clientY;
        if (Math.abs(difference) < 50) return;

        changeSlide(difference > 0 ? 1 : -1);
    }, { passive: true });

});


/* Автоматична плавна зміна фотографій прикрас у центральному блоці */
document.addEventListener("DOMContentLoaded", function () {
    const showcase = document.querySelector(".rmr-jewelry-showcase");
    if (!showcase) return;

    const images = Array.from(showcase.querySelectorAll(".rmr-jewelry-image"));
    const name = showcase.querySelector(".rmr-showcase-name");
    const captions = ["Мистецтво в деталях", "Витонченість форми", "Сенс у кожній деталі", "Створено з майстерністю","Краса, народжена в майстерності", "Досконалість у кожній лінії"];
    if (images.length < 2) return;

    let activeIndex = 0;
    let timer = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Перевіряємо наявність кожного файлу, щоб помилковий шлях не ламав анімацію.
    images.forEach(function (img) {
        img.addEventListener("error", function () {
            img.classList.add("is-missing");
            img.style.display = "none";
        }, { once: true });
    });

    function showNext() {
        images[activeIndex].classList.remove("is-visible");
        activeIndex = (activeIndex + 1) % images.length;
        images[activeIndex].classList.add("is-visible");
        if (name) name.textContent = captions[activeIndex] || "Ювелірне мистецтво RMR";
    }

    function start() {
        if (!reducedMotion && !timer) timer = window.setInterval(showNext, 3800);
    }
    function stop() {
        if (timer) window.clearInterval(timer);
        timer = null;
    }

    // Не анімуємо зайве, коли вкладка неактивна.
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else start();
    });
    start();
});


/*
 * «ШТОРКА»: секция с фото поднимается на видео.
 * Считаем, насколько секция уже накрыла видео (от 0 до 1),
 * и кладём число в CSS-переменную --cover. По ней CSS немного сдвигает,
 * уменьшает и затемняет видео. Когда видео полностью закрыто,
 * ставим его на паузу, чтобы не нагружать устройство.
 */
document.addEventListener("DOMContentLoaded", function () {
    const stage = document.querySelector(".rmr-video-stage");
    const hero = stage ? stage.querySelector(".hero") : null;
    if (!stage || !hero) return;

    let ticking = false;
    let pausedByCover = false;

    function update() {
        ticking = false;

        /* Путь, который проходит страница, пока .hero стоит на месте */
        const range = stage.offsetHeight - hero.offsetHeight;
        if (range <= 0) return;

        const progress = Math.min(Math.max(window.scrollY / range, 0), 1);
        stage.style.setProperty("--cover", progress.toFixed(3));

        const video = hero.querySelector(".about-slide.is-active video");
        if (!video) return;

        if (progress >= 0.995 && !video.paused) {
            video.pause();
            pausedByCover = true;
        } else if (progress < 0.995 && pausedByCover) {
            pausedByCover = false;
            const playPromise = video.play();
            if (playPromise !== undefined) playPromise.catch(function () {});
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
});


/*
 * ПЛАВНЫЙ ПЕРЕХОД ШТОРКИ
 *
 * Без этого блока шторка ездит строго вместе с колесом мыши, то есть рывками.
 * Здесь она поднимается сама, плавно, с разгоном и торможением:
 *   - на последнем слайде колесо или свайп вниз → шторка плавно закрывает видео;
 *   - колесо или свайп вверх, пока шторка наверху → плавно опускается обратно.
 * Если шторка уже пройдена (страница ниже), работает обычная прокрутка.
 */
document.addEventListener("DOMContentLoaded", function () {

    /* ---------- НАСТРОЙКИ ---------- */

    // true  — шторка поднимается сама, плавно
    // false — шторка едет строго вместе с колесом мыши (как было раньше)
    const CURTAIN_AUTO = true;

    // Длительность перехода в миллисекундах (1000 = 1 секунда).
    // Больше число — медленнее и «дороже» выглядит.
    const CURTAIN_DURATION = 1300;

    /* -------------------------------- */

    const stage = document.querySelector(".rmr-video-stage");
    const hero = stage ? stage.querySelector(".hero") : null;
    if (!CURTAIN_AUTO || !stage || !hero) return;

    // Людям, которые отключили анимацию в системе, оставляем обычную прокрутку
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const slides = hero.querySelectorAll(".about-slide");

    let animating = false;      // шторка сейчас едет
    let lastWheelTime = 0;
    let waitForPause = false;   // после перехода пропускаем «хвост» инерции тачпада
    let gesture = { last: false };   // состояние на момент начала жеста колеса
    let touch = { y: 0, scrollY: 0, last: false };


    /* Путь шторки в пикселях: сколько прокручивается, пока видео стоит на месте */
    function getRange() {
        return stage.offsetHeight - hero.offsetHeight;
    }

    function onLastSlide() {
        return slides.length > 0 && slides[slides.length - 1].classList.contains("is-active");
    }

    /* Мгновенная установка прокрутки (даже если в CSS включён scroll-behavior: smooth) */
    function jumpTo(y) {
        try {
            window.scrollTo({ top: y, left: 0, behavior: "instant" });
        } catch (error) {
            window.scrollTo(0, y);
        }
    }

    /* Разгон и торможение: медленно → быстро → медленно */
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animateTo(target) {
        const start = window.scrollY;
        const distance = target - start;
        if (Math.abs(distance) < 1) return;

        animating = true;
        const startTime = performance.now();

        // Если шторка уже частично поднята, остаток проходит пропорционально быстрее
        const duration = Math.max(500, CURTAIN_DURATION * Math.abs(distance) / getRange());

        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            jumpTo(start + distance * easeInOutCubic(progress));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                jumpTo(target);
                animating = false;
                waitForPause = true;
            }
        }
        window.requestAnimationFrame(step);
    }


    /*
     * Куда должна поехать шторка при прокрутке в этом направлении?
     * Возвращает позицию (в пикселях) или null, если шторка тут ни при чём
     * и нужна обычная прокрутка.
     * onLast и y передаются из момента начала жеста, чтобы смена слайда
     * в этом же жесте не открыла шторку сразу.
     */
    function curtainTarget(direction, y, onLast) {
        const range = getRange();

        if (direction === 1) {
            if (y < 5) return onLast ? range : null;   // наверху: только с последнего слайда
            if (y < range - 2) return range;           // шторка посередине: доводим до конца
            return null;                               // шторка пройдена: обычная прокрутка
        }

        if (y > 2 && y <= range + 2) return 0;         // шторка наверху: опускаем обратно
        return null;
    }


    /* ---------- КОЛЕСО МЫШИ И ТАЧПАД ---------- */
    window.addEventListener("wheel", function (event) {
        const now = Date.now();
        const pause = now - lastWheelTime;
        lastWheelTime = now;

        // Пока шторка едет, страницу не прокручиваем
        if (animating) {
            event.preventDefault();
            return;
        }

        // Новый жест (была пауза): запоминаем, на каком слайде он начался
        if (pause >= 120) {
            gesture = { last: onLastSlide() };
        }

        // Хвост инерции тачпада после прошлого перехода пропускаем
        if (waitForPause) {
            if (pause < 120) {
                event.preventDefault();
                return;
            }
            waitForPause = false;
        }

        if (Math.abs(event.deltaY) < 4) return;

        const direction = event.deltaY > 0 ? 1 : -1;
        const target = curtainTarget(direction, window.scrollY, gesture.last);
        if (target === null) return;

        event.preventDefault();
        animateTo(target);
    }, { passive: false, capture: true });


    /* ---------- ТЕЛЕФОН: СВАЙП ---------- */
    window.addEventListener("touchstart", function (event) {
        touch = {
            y: event.touches[0].clientY,
            scrollY: window.scrollY,
            last: onLastSlide()
        };
    }, { passive: true, capture: true });

    window.addEventListener("touchmove", function (event) {
        if (animating) {
            event.preventDefault();
            return;
        }

        const difference = touch.y - event.touches[0].clientY;
        if (Math.abs(difference) < 10) return;

        const direction = difference > 0 ? 1 : -1;
        if (curtainTarget(direction, touch.scrollY, touch.last) !== null) {
            event.preventDefault();     // не даём странице ехать вместе с пальцем
        }
    }, { passive: false, capture: true });

    window.addEventListener("touchend", function (event) {
        if (animating) return;

        const difference = touch.y - event.changedTouches[0].clientY;
        if (Math.abs(difference) < 40) return;

        const target = curtainTarget(difference > 0 ? 1 : -1, touch.scrollY, touch.last);
        if (target !== null) animateTo(target);
    }, { passive: true, capture: true });

});