/* RMR form validation — demonstration only; no data is sent or stored. */
(() => {
  "use strict";

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[+()\d\s.-]{7,25}$/;

  function getErrorNode(field) {
    const key = field.id || field.name;
    if (!key) return null;
    let node = field.parentElement.querySelector(`[data-rmr-error-for="${CSS.escape(key)}"]`);
    if (!node) {
      node = document.createElement("small");
      node.className = "rmr-field-error";
      node.dataset.rmrErrorFor = key;
      node.setAttribute("aria-live", "polite");
      field.insertAdjacentElement("afterend", node);
    }
    return node;
  }

  function messageFor(field) {
    const value = field.value.trim();
    if (field.required && !value) return field.dataset.requiredMessage || "Заповніть це поле.";
    if (!value) return "";
    if (field.type === "email" && !EMAIL_RE.test(value)) return "Введіть коректну електронну адресу.";
    if (field.name === "phone" && !PHONE_RE.test(value)) return "Перевірте формат номера телефону.";
    if (field.name === "phone" && value.replace(/\D/g, "").length < 7) return "Введіть коректний номер телефону.";
    if (field.name === "name" && value.length < 2) return "Введіть щонайменше 2 символи.";
    if (field.name === "message" && value.length < 5) return "Повідомлення має містити щонайменше 5 символів.";
    return "";
  }

  function validateField(field) {
    if (field.type === "hidden" || field.disabled) return true;
    const message = messageFor(field);
    const errorNode = getErrorNode(field);
    field.classList.toggle("rmr-invalid", Boolean(message));
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorNode) errorNode.textContent = message;
    return !message;
  }

  function clearFormErrors(form) {
    form.querySelectorAll(".rmr-invalid").forEach(field => {
      field.classList.remove("rmr-invalid");
      field.setAttribute("aria-invalid", "false");
    });
    form.querySelectorAll(".rmr-field-error").forEach(node => { node.textContent = ""; });
  }

  function showSuccess(type) {
    const modal = document.getElementById("rmrSuccessModal");
    const title = document.getElementById("rmrSuccessTitle");
    const copy = document.getElementById("rmrSuccessCopy");
    if (title && copy) {
      if (type === "order") {
        title.textContent = "Форму замовлення відправлено!";
        copy.textContent = "Дякуємо за інтерес до прикраси RMR. ";
      } else {
        title.textContent = "Дякуємо за звернення!";
        copy.textContent = "Форму успішно відправлено.";
      }
    }
    if (modal && window.bootstrap) bootstrap.Modal.getOrCreateInstance(modal).show();
    else window.alert(type === "order" ? "Форму замовлення відправлено." : "Форму заповнено.");
  }

  function setupForm(form) {
    const fields = Array.from(form.querySelectorAll("input, textarea, select"))
      .filter(field => field.type !== "hidden" && field.type !== "submit" && field.type !== "button");

    fields.forEach(field => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.classList.contains("rmr-invalid")) validateField(field);
      });
      field.addEventListener("change", () => {
        if (field.classList.contains("rmr-invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      let valid = true;
      fields.forEach(field => { if (!validateField(field)) valid = false; });
      const status = document.getElementById("formStatus");
      if (!valid) {
        if (status) {
          status.textContent = "Перевірте, будь ласка, поля, позначені повідомленнями про помилки.";
          status.dataset.state = "error";
        }
        const firstInvalid = form.querySelector(".rmr-invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      /*if (status) {
        status.textContent = "Форму успішно заповнено.";
        status.dataset.state = "success";
      }*/
      const type = form.dataset.rmrFormType || "contact";
      form.reset();
      clearFormErrors(form);
      if (type === "order") {
        const orderModalElement = document.getElementById("rmrOrderModal");
        if (orderModalElement && window.bootstrap) {
          orderModalElement.addEventListener("hidden.bs.modal", () => showSuccess(type), { once: true });
          bootstrap.Modal.getOrCreateInstance(orderModalElement).hide();
        } else {
          showSuccess(type);
        }
      } else {
        showSuccess(type);
      }
    });
  }

  function setupCatalogOrder() {
    const orderButton = document.getElementById("modalOrderButton");
    const productModalEl = document.getElementById("productModal");
    const orderModalEl = document.getElementById("rmrOrderModal");
    const orderForm = document.getElementById("rmrOrderForm");
    const productNameLabel = document.getElementById("rmrOrderProductName");
    const productNameInput = document.getElementById("rmrOrderProduct");
    if (!orderButton || !productModalEl || !orderModalEl || !window.bootstrap) return;

    const productModal = bootstrap.Modal.getOrCreateInstance(productModalEl);
    const orderModal = bootstrap.Modal.getOrCreateInstance(orderModalEl);

    orderButton.addEventListener("click", () => {
      const name = (orderButton.dataset.product || document.getElementById("modalProductTitle")?.textContent || "Прикраса RMR").trim();
      if (productNameLabel) productNameLabel.textContent = name;
      if (productNameInput) productNameInput.value = name;
      if (orderForm) clearFormErrors(orderForm);
      // Bootstrap модальні вікна не варто показувати одночасно: спершу закриваємо картку товару.
      productModalEl.addEventListener("hidden.bs.modal", function openOrderAfterProduct() {
        orderModal.show();
      }, { once: true });
      productModal.hide();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("form[data-rmr-form]").forEach(setupForm);
    setupCatalogOrder();
  });
})();
