// АЛЬФАПРОМ — База экспертных знаний

const API_URL = "https://script.google.com/macros/s/AKfycbykGLEHYtcSBbtbuKxsUxC6PZzzQWtiJ5q5Thl8jgi_PdNTTFvXjCYRxyWSHO1QQG-h/exec";

let knowledgeBase = [];
let currentFilter = "Все";

const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const filterButtons = document.querySelectorAll(".filter");
const categories = document.querySelectorAll(".category");


// ==============================
// Загрузка базы знаний
// ==============================

async function loadKnowledgeBase() {

    results.innerHTML = `
        <div class="empty-state">
            <p>Проверяем подключение к базе...</p>
        </div>
    `;

    try {

        const response = await fetch(API_URL, {
            method: "GET",
            redirect: "follow",
            cache: "no-store"
        });

        console.log("API status:", response.status);
        console.log("API URL:", response.url);
        console.log("API redirected:", response.redirected);
        console.log(
            "API content-type:",
            response.headers.get("content-type")
        );

        const rawText = await response.text();

        console.log(
            "API response:",
            rawText.substring(0, 1000)
        );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}. Ответ: ${rawText.substring(0, 300)}`
            );

        }

        let data;

        try {

            data = JSON.parse(rawText);

        } catch (parseError) {

            throw new Error(
                "Ответ API не является JSON: " +
                rawText.substring(0, 300)
            );

        }

        console.log("API data:", data);

        if (!data.success) {

            throw new Error(
                data.error || "API вернул success=false"
            );

        }

        knowledgeBase = data.data || [];

        console.log(
            "Загружено записей:",
            knowledgeBase.length
        );

        renderResults();

    } catch (error) {

        console.error("ОШИБКА API:", error);

        results.innerHTML = `
            <div class="empty-state">
                <p><strong>Ошибка подключения к базе.</strong></p>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;

    }

}


// ==============================
// Поиск
// ==============================

searchInput.addEventListener("input", function () {

    renderResults();

});


// ==============================
// Фильтры
// ==============================

filterButtons.forEach(button => {

    button.addEventListener("click", function () {

        currentFilter = this.dataset.filter;

        filterButtons.forEach(btn => {

            btn.classList.remove("active");

        });

        this.classList.add("active");

        renderResults();

    });

});


// ==============================
// Популярные разделы
// ==============================

categories.forEach(category => {

    category.addEventListener("click", function () {

        currentFilter = this.dataset.filter;

        filterButtons.forEach(btn => {

            btn.classList.toggle(
                "active",
                btn.dataset.filter === currentFilter
            );

        });

        renderResults();

        window.scrollTo({

            top:
                document.getElementById("resultsSection").offsetTop - 20,

            behavior: "smooth"

        });

    });

});


// ==============================
// Отображение результатов
// ==============================

function renderResults() {

    const query = searchInput.value
        .trim()
        .toLowerCase();

    let filtered = knowledgeBase;


    // Фильтр по разделу

    if (currentFilter !== "Все") {

        filtered = filtered.filter(item => {

            const product =
                (item["Продукт"] || "").toLowerCase();

            const equipment =
                (item["Оборудование"] || "").toLowerCase();

            const category =
                (item["Категория"] || "").toLowerCase();

            const filter =
                currentFilter.toLowerCase();

            return (
                product.includes(filter) ||
                equipment.includes(filter) ||
                category.includes(filter)
            );

        });

    }


    // Поиск

    if (query) {

        const words = query
            .split(/\s+/)
            .filter(Boolean);

        filtered = filtered.filter(item => {

            const text = Object.values(item)
                .join(" ")
                .toLowerCase();

            return words.every(word => text.includes(word));

        });

    }


    // Ничего не найдено

    if (filtered.length === 0) {

        results.innerHTML = `
            <div class="empty-state">
                <p><strong>Ничего не найдено.</strong></p>
                <p>
                    Попробуйте изменить запрос
                    или выбрать другой раздел.
                </p>
            </div>
        `;

        return;

    }


    // Карточки

    results.innerHTML = filtered.map(item => {

        return `

            <article class="knowledge-card">

                <div class="knowledge-product">
                    ${escapeHtml(
                        item["Продукт"] ||
                        "Экспертное знание"
                    )}
                </div>

                <h3>
                    ${escapeHtml(
                        item["Вопрос клиента"] ||
                        "Без названия"
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        item["Короткий ответ"] ||
                        ""
                    )}
                </p>

                <div class="knowledge-meta">

                    ${
                        item["Статус проверки"]
                            ? `
                                <span>
                                    ✓ ${escapeHtml(
                                        item["Статус проверки"]
                                    )}
                                </span>
                              `
                            : ""
                    }

                    ${
                        item["Достоверность"]
                            ? `
                                <span>
                                    Достоверность:
                                    ${escapeHtml(
                                        item["Достоверность"]
                                    )}
                                </span>
                              `
                            : ""
                    }

                </div>

                <button
                    class="details-button"
                    type="button"
                    onclick="openKnowledge('${escapeAttribute(
                        item["ID"] || ""
                    )}')"
                >
                    Подробнее →
                </button>

            </article>

        `;

    }).join("");

}


// ==============================
// Подробная информация
// ==============================

function openKnowledge(id) {

    const item = knowledgeBase.find(

        knowledge =>
            String(knowledge["ID"]) === String(id)

    );

    if (!item) return;


    let text = "";


    text +=
        (item["Вопрос клиента"] || "Без названия") +
        "\n\n";


    text +=
        "ОТВЕТ ЭКСПЕРТА\n\n";


    text +=
        (item["Короткий ответ"] || "") +
        "\n\n";


    if (item["Что уточнить"]) {

        text +=
            "ЧТО УТОЧНИТЬ\n\n";

        text +=
            item["Что уточнить"] +
            "\n\n";

    }


    if (item["Оборудование"]) {

        text +=
            "ОБОРУДОВАНИЕ\n\n";

        text +=
            item["Оборудование"] +
            "\n\n";

    }


    if (item["Достоверность"]) {

        text +=
            "ДОСТОВЕРНОСТЬ\n\n";

        text +=
            item["Достоверность"] +
            "\n\n";

    }


    if (item["Источник"]) {

        text +=
            "ИСТОЧНИК\n\n";

        text +=
            item["Источник"] +
            "\n\n";

    }


    if (item["Ссылка на источник"]) {

        text +=
            "ПЕРВОИСТОЧНИК\n\n";

        text +=
            item["Ссылка на источник"];

    }


    alert(text);

}


// ==============================
// Защита HTML
// ==============================

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return String(value)

        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");

}


// ==============================
// Запуск
// ==============================

loadKnowledgeBase();
