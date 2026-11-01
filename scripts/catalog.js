
document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       ФИЛЬТР КАТАЛОГА
    ========================================= */

    const filterButtons = document.querySelectorAll(".filter-btn");
    const products = document.querySelectorAll(".product-card");
    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const filter = this.dataset.filter;
            filterButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });
            this.classList.add("active");
            products.forEach(function (product) {
                const category = product.dataset.category;
                if (filter === "all" || category === filter) {
                    product.classList.remove("hidden");
                    product.style.opacity = "0";
                    product.style.transform = "translateY(15px)";
                    requestAnimationFrame(function () {
                        product.style.opacity = "1";
                        product.style.transform = "translateY(0)";
                    });
                } else {
                    product.classList.add("hidden");
                }
            });
        });
    });


    /* =========================================
       BOOTSTRAP MODAL
    ========================================= */
    const modalElement = document.getElementById("productModal");
    if (!modalElement || typeof bootstrap === "undefined") {
        console.error("Bootstrap Modal не найден.");
        return;
    }
    const productModal = new bootstrap.Modal(modalElement);
    const modalImage = document.getElementById("modalProductImage");
    const modalTitle = document.getElementById("modalProductTitle");
    const modalDescription = document.getElementById("modalProductDescription");
    const modalPrice = document.getElementById("modalProductPrice");
    const modalCategory = document.getElementById("modalProductCategory");
    const orderButton = document.getElementById("modalOrderButton");


    /* Открытие карточки */
    products.forEach(function (product) {
        product.addEventListener("click", function () {
            const image = product.querySelector(".product-image img");
            if (!image) return;
            modalImage.src = image.src;
            modalImage.alt = image.alt;
            modalTitle.textContent = product.dataset.title || "Прикраса RMR";
            modalDescription.textContent =
                product.dataset.description || "Авторська прикраса ручної роботи.";
            modalPrice.textContent = product.dataset.price || "Ціна за запитом";
            modalCategory.textContent =
                product.dataset.categoryName || "КОЛЕКЦІЯ RMR";
            orderButton.dataset.product = modalTitle.textContent;
            productModal.show();
        });

    });

    /* Кнопка «Замовити прикрасу» обробляється у scripts/forms.js */



});
