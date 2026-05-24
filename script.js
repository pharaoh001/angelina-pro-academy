const form = document.getElementById("preorder-form");
const successBlock = document.getElementById("form-success");
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav");

// Mobile menu
burger?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("nav--open");
  burger.setAttribute("aria-expanded", String(isOpen));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("nav--open");
    burger?.setAttribute("aria-expanded", "false");
  });
});

function clearErrors() {
  form.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
  form.querySelector(".form__error")?.remove();
}

function showFormError(message) {
  const existing = form.querySelector(".form__error");
  if (existing) {
    existing.textContent = message;
    return;
  }

  const errorEl = document.createElement("p");
  errorEl.className = "form__error";
  errorEl.textContent = message;
  form.querySelector('button[type="submit"]').before(errorEl);
}

function markInvalid(field) {
  field.classList.add("error");
}

function validateForm(data) {
  let valid = true;

  if (!data.name.trim()) {
    markInvalid(form.name);
    valid = false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email)) {
    markInvalid(form.email);
    valid = false;
  }

  if (!data.phone.trim()) {
    markInvalid(form.phone);
    valid = false;
  }

  const age = Number(data.age);
  if (!data.age || age < 16 || age > 99) {
    markInvalid(form.age);
    valid = false;
  }

  if (!data.city.trim()) {
    markInvalid(form.city);
    valid = false;
  }

  if (!data.role) {
    markInvalid(form.role);
    valid = false;
  }

  if (!data.experience) {
    markInvalid(form.experience);
    valid = false;
  }

  if (!data.goal.trim()) {
    markInvalid(form.goal);
    valid = false;
  }

  if (!form.consent.checked) {
    markInvalid(form.consent);
    valid = false;
  }

  if (!form.privacy.checked) {
    markInvalid(form.privacy);
    valid = false;
  }

  return valid;
}

function submitViaGoogleScript(endpoint, data) {
  return new Promise((resolve, reject) => {
    const iframeName = "gas-form-frame";
    let iframe = document.querySelector(`iframe[name="${iframeName}"]`);

    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.hidden = true;
      document.body.appendChild(iframe);
    }

    const hiddenForm = document.createElement("form");
    hiddenForm.method = "POST";
    hiddenForm.action = endpoint;
    hiddenForm.target = iframeName;
    hiddenForm.style.display = "none";

    const payloadInput = document.createElement("input");
    payloadInput.type = "hidden";
    payloadInput.name = "payload";
    payloadInput.value = JSON.stringify(data);
    hiddenForm.appendChild(payloadInput);

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 4000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      hiddenForm.remove();
    }

    iframe.addEventListener("load", () => {
      cleanup();
      resolve();
    }, { once: true });

    document.body.appendChild(hiddenForm);
    hiddenForm.submit();
  });
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  data.consent = form.consent.checked ? "yes" : "no";
  data.privacy = form.privacy.checked ? "yes" : "no";

  if (!validateForm(data)) {
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const defaultBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Отправка...";

  try {
    const endpoint = window.FORM_ENDPOINT || "/api/submit";
    const useGoogleScript = Boolean(window.FORM_ENDPOINT);

    if (useGoogleScript) {
      await submitViaGoogleScript(endpoint, data);
    } else {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const raw = await response.text();
      let result = null;

      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          "Форма не подключена к серверу. Настройте Google Apps Script (см. GOOGLE-FORM-SETUP.md) и укажите URL в config.js"
        );
      }

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Не удалось отправить заявку");
      }
    }

    form.hidden = true;
    successBlock.hidden = false;
    successBlock.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    const message =
      error.message === "Failed to fetch"
        ? "Не удалось отправить заявку. Проверьте интернет или попробуйте позже."
        : error.message;

    showFormError(message);
    submitBtn.disabled = false;
    submitBtn.textContent = defaultBtnText;
  }
});

const REVIEWS = [
  {
    text: "Я месяцами сама искала блогеров для бренда косметики и постоянно попадала на накрутку. После курса научилась проверять аудиторию минут за пятнадцать — буквально. Таблица из модуля про отбор до сих пор у меня открыта каждый день.",
    name: "Дарья К.",
    meta: "маркетолог, Казань",
    initials: "ДК",
  },
  {
    text: "Запускал рекламу для магазина одежды через агентство — переплачивал, если честно. Понял, как искать блогеров сам и нормально договариваться. Первая интеграция окупилась, такого не ожидал.",
    name: "Кирилл М.",
    meta: "предприниматель, Москва",
    initials: "КМ",
  },
  {
    text: "Пришла с нуля, даже не знала, что писать блогеру в первом сообщении. Скрипты реально работают — ответили 4 из 7. Уже взяла первый проект на 25 тысяч, для меня это огромный шаг.",
    name: "Алина С.",
    meta: "начинающий менеджер, 23 года",
    initials: "АС",
  },
  {
    text: "Боялась, что будет очередной курс с теорией ради теории. А тут по шагам: что делать сегодня, завтра, послезавтра. Домашки иногда бесили, но именно они помогли не бросить на полпути.",
    name: "Ольга В.",
    meta: "SMM-специалист, Санкт-Петербург",
    initials: "ОВ",
  },
  {
    text: "Работал SMM-щиком, думал, и так всё знаю. Оказалось — нет. Особенно зашёл блок про переговоры: сэкономил клиенту 40 тысяч на одной кампании, просто потому что по-другому зашёл в диалог.",
    name: "Максим Р.",
    meta: "фрилансер, Новосибирск",
    initials: "МР",
  },
  {
    text: "Долго не решалась записаться — казалось дорого. Потом посчитала, сколько уже потратила на блогеров без результата, и всё встало на места. Плюс комьюнити: там реально подсказывают, а не просто «молодец».",
    name: "Вика Н.",
    meta: "владелица бренда украшений, Екатеринбург",
    initials: "ВН",
  },
  {
    text: "Мне было важно не абстрактное «ведите блогеров», а конкретика: бриф, сроки, отчёт клиенту. Взяла шаблоны с курса и сразу внедрила в агентство. Руководитель спросил, где я это всё нашла)",
    name: "Настя Л.",
    meta: "менеджер по рекламе, Краснодар",
    initials: "НЛ",
  },
];

function initReviewsCarousel() {
  const track = document.getElementById("reviews-track");
  const viewport = document.getElementById("reviews-viewport");
  const prevBtn = document.getElementById("reviews-prev");
  const nextBtn = document.getElementById("reviews-next");

  if (!track || !viewport || !prevBtn || !nextBtn) {
    return;
  }

  let current = 0;

  REVIEWS.forEach((review) => {
    const card = document.createElement("article");
    card.className = "review-card";
    card.innerHTML = `
      <p class="review-card__text">${review.text}</p>
      <footer class="review-card__author">
        <div class="review-card__avatar" aria-hidden="true">${review.initials}</div>
        <div>
          <p class="review-card__name">${review.name}</p>
          <p class="review-card__meta">${review.meta}</p>
        </div>
      </footer>
    `;
    track.appendChild(card);
  });

  const cards = [...track.children];

  function updateCarousel() {
    cards.forEach((card, index) => {
      card.classList.toggle("is-active", index === current);
    });

    const activeCard = cards[current];
    const offset = activeCard.offsetLeft + activeCard.offsetWidth / 2 - viewport.offsetWidth / 2;
    track.style.transform = `translateX(${-offset}px)`;
  }

  function goTo(index) {
    current = (index + REVIEWS.length) % REVIEWS.length;
    updateCarousel();
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));

  window.addEventListener("resize", updateCarousel);
  updateCarousel();
}

initReviewsCarousel();

