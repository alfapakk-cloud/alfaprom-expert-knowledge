// АЛЬФАПРОМ — База экспертных знаний

const API_URL = "https://script.google.com/macros/s/AKfycbykGLEHYtcSBbtbuKxsUxC6PZzzQWtiJ5q5Thl8jgi_PdNTTFvXjCYRxyWSHO1QQG-h/exec";

const CACHE_KEY = "alfaprom_knowledge_base_v1";
const CACHE_TTL = 1000 * 60 * 60; // 1 час

let knowledgeBase = [];
let currentFilter = "Все";

const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const filterButtons = document.querySelectorAll(".filter");
const categories = document.querySelectorAll(".category");
const searchHint = document.querySelector(".search-hint");


// ========================================
// ПОДСКАЗКА ПОИСКА
// ========================================

if (searchHint) {

    searchHint.textContent =
        "введи либо свой вопрос❓ / либо клиента❓ / либо какой продукт🥩 / либо какое оборудование⚙️ / либо любое ключевое слово 💬";

}


// ========================================
// КЭШ
// ========================================

function getCachedKnowledgeBase() {

    try {

        const cached =
            localStorage.getItem(CACHE_KEY);

        if (!cached) {
            return null;
        }

        const parsed =
            JSON.parse(cached);

        if (
            !parsed ||
            !Array.isArray(parsed.data)
        ) {
            return null;
        }

        return parsed;

    } catch (error) {

        console.warn(
            "Не удалось прочитать кэш:",
            error
        );

        return null;
    }

}


function saveKnowledgeBaseToCache(data) {

    try {

        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                timestamp: Date.now(),
                data: data
            })
        );

    } catch (error) {

        console.warn(
            "Не удалось сохранить базу в кэш:",
            error
        );

    }

}


// ========================================
// Загрузка свежей базы
// ========================================

async function refreshKnowledgeBase() {

    try {

        const response = await fetch(API_URL, {
            method: "GET",
            redirect: "follow",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status
            );
        }

        const rawText =
            await response.text();

        const data =
            JSON.parse(rawText);

        if (!data.success) {
            throw new Error(
                data.error ||
                "API вернул ошибку"
            );
        }

        knowledgeBase =
            Array.isArray(data.data)
                ? data.data
                : [];

        console.log(
            "Загружено свежих записей:",
            knowledgeBase.length
        );

        saveKnowledgeBaseToCache(
            knowledgeBase
        );

        renderResults();

        return true;

    } catch (error) {

        console.error(
            "ОШИБКА API:",
            error
        );

        return false;
    }

}


// ========================================
// Загрузка базы
// ========================================

async function loadKnowledgeBase() {

    const cached =
        getCachedKnowledgeBase();


    // ------------------------------------
    // Если есть кэш — показываем сразу
    // ------------------------------------

    if (
        cached &&
        Array.isArray(cached.data)
    ) {

        knowledgeBase =
            cached.data;

        console.log(
            "База показана из кэша:",
            knowledgeBase.length
        );

        renderResults();


        // --------------------------------
        // Тихо обновляем в фоне
        // --------------------------------

        refreshKnowledgeBase()
            .then(success => {

                if (success) {

                    console.log(
                        "База обновлена в фоне"
                    );

                }

            });

        return;
    }


    // ------------------------------------
    // Если кэша нет — обычная загрузка
    // ------------------------------------

    results.innerHTML = `
        <div class="empty-state">
            <p>Загрузка базы знаний...</p>
        </div>
    `;

    const success =
        await refreshKnowledgeBase();


    if (!success) {

        results.innerHTML = `
            <div class="empty-state">
                <p><strong>Не удалось загрузить базу знаний.</strong></p>
                <p>Проверьте соединение и попробуйте обновить страницу.</p>
            </div>
        `;

    }

}


// ========================================
// Поиск
// ========================================

searchInput.addEventListener(
    "input",
    renderResults
);


// ========================================
// Фильтры
// ========================================

filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        function () {

            currentFilter =
                this.dataset.filter;

            filterButtons.forEach(btn => {

                btn.classList.toggle(
                    "active",
                    btn.dataset.filter === currentFilter
                );

            });

            renderResults();

        }
    );

});


// ========================================
// Популярные разделы
// ========================================

categories.forEach(category => {

    category.addEventListener(
        "click",
        function () {

            currentFilter =
                this.dataset.filter;

            filterButtons.forEach(btn => {

                btn.classList.toggle(
                    "active",
                    btn.dataset.filter === currentFilter
                );

            });

            renderResults();

            const resultsSection =
                document.getElementById(
                    "resultsSection"
                );

            if (resultsSection) {

                window.scrollTo({
                    top:
                        resultsSection.offsetTop - 15,
                    behavior: "smooth"
                });

            }

        }
    );

});


// ========================================
// Достоверность
// ========================================

function getReliabilityScore(value) {

    const text =
        String(value || "")
            .toLowerCase();

    if (
        text.includes("высок") ||
        text.includes("🟢")
    ) {
        return 3;
    }

    if (
        text.includes("сред") ||
        text.includes("🟡")
    ) {
        return 2;
    }

    if (
        text.includes("низ") ||
        text.includes("🔴")
    ) {
        return 1;
    }

    return 0;
}


// ========================================
// Релевантность
// ========================================

function getSearchScore(item, words) {

    if (!words.length) {
        return 0;
    }

    const question =
        String(
            item["Вопрос клиента"] || ""
        ).toLowerCase();

    const answer =
        String(
            item["Короткий ответ"] || ""
        ).toLowerCase();

    const product =
        String(
            item["Продукт"] || ""
        ).toLowerCase();

    const equipment =
        String(
            item["Оборудование"] || ""
        ).toLowerCase();

    const category =
        String(
            item["Категория"] || ""
        ).toLowerCase();

    let score = 0;

    words.forEach(word => {

        if (question.includes(word)) {
            score += 10;
        }

        if (answer.includes(word)) {
            score += 5;
        }

        if (product.includes(word)) {
            score += 7;
        }

        if (equipment.includes(word)) {
            score += 7;
        }

        if (category.includes(word)) {
            score += 3;
        }

    });

    return score;
}


// ========================================
// Подсветка найденных слов
// ========================================

function highlightText(text, words) {

    const safeText =
        escapeHtml(text || "");

    if (!words.length) {
        return safeText;
    }

    let result = safeText;

    const sortedWords =
        [...words]
            .filter(word => word.length > 0)
            .sort(
                (a, b) =>
                    b.length - a.length
            );

    sortedWords.forEach(word => {

        const regex =
            new RegExp(
                escapeRegExp(
                    escapeHtml(word)
                ),
                "gi"
            );

        result =
            result.replace(
                regex,
                '<mark class="search-highlight">$&</mark>'
            );

    });

    return result;
}


// ========================================
// Отображение результатов
// ========================================

function renderResults() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();

    const words =
        query
            ? query
                .split(/\s+/)
                .filter(Boolean)
            : [];

    let filtered =
        [...knowledgeBase];


    // ------------------------------------
    // Фильтр раздела
    // ------------------------------------

    if (currentFilter !== "Все") {

        const filter =
            currentFilter.toLowerCase();

        filtered =
            filtered.filter(item => {

                const product =
                    String(
                        item["Продукт"] || ""
                    ).toLowerCase();

                const equipment =
                    String(
                        item["Оборудование"] || ""
                    ).toLowerCase();

                const category =
                    String(
                        item["Категория"] || ""
                    ).toLowerCase();

                return (
                    product.includes(filter) ||
                    equipment.includes(filter) ||
                    category.includes(filter)
                );

            });

    }


    // ------------------------------------
    // Поиск
    // ------------------------------------

    if (words.length) {

        filtered =
            filtered.filter(item => {

                const text =
                    Object.values(item)
                        .join(" ")
                        .toLowerCase();

                return words.every(word =>
                    text.includes(word)
                );

            });

    }


    // ------------------------------------
    // Сортировка
    // ------------------------------------

    filtered.sort((a, b) => {

        const reliabilityA =
            getReliabilityScore(
                a["Достоверность"]
            );

        const reliabilityB =
            getReliabilityScore(
                b["Достоверность"]
            );

        if (
            reliabilityA !==
            reliabilityB
        ) {

            return (
                reliabilityB -
                reliabilityA
            );

        }

        return (
            getSearchScore(b, words) -
            getSearchScore(a, words)
        );

    });


    // ------------------------------------
    // Ничего не найдено
    // ------------------------------------

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


    // ------------------------------------
    // Карточки
    // ------------------------------------

    results.innerHTML =
        filtered.map(item => {

            const product =
                String(
                    item["Продукт"] || ""
                );

            const equipment =
                String(
                    item["Оборудование"] || ""
                );

            const category =
                String(
                    item["Категория"] || ""
                );

            const reliability =
                String(
                    item["Достоверность"] || ""
                );

            const status =
                String(
                    item["Статус проверки"] || ""
                );

            const source =
                String(
                    item["Источник"] || ""
                );

            const sourceUrl =
                String(
                    item["Ссылка на источник"] || ""
                );

            const question =
                String(
                    item["Вопрос клиента"] ||
                    "Без названия"
                );

            const answer =
                String(
                    item["Короткий ответ"] || ""
                );

            const id =
                String(
                    item["ID"] || ""
                );


            return `
                <article class="knowledge-card">

                    <div class="knowledge-tags">

                        ${
                            product
                                ? `
                                    <span class="knowledge-product">
                                        ${highlightText(
                                            product,
                                            words
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            equipment
                                ? `
                                    <span class="knowledge-equipment">
                                        ⚙️ ${highlightText(
                                            equipment,
                                            words
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            category
                                ? `
                                    <span class="knowledge-category">
                                        ${highlightText(
                                            category,
                                            words
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    <h3>
                        ${highlightText(
                            question,
                            words
                        )}
                    </h3>


                    <div class="answer-label">
                        ОТВЕТ ЭКСПЕРТА
                    </div>


                    <p class="knowledge-answer">
                        ${highlightText(
                            answer,
                            words
                        )}
                    </p>


                    <div class="knowledge-meta">

                        ${
                            reliability
                                ? `
                                    <span>
                                        ${escapeHtml(
                                            reliability
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            status
                                ? `
                                    <span>
                                        ✓ ${escapeHtml(
                                            status
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    ${
                        source
                            ? `
                                <div class="knowledge-source">

                                    <span class="source-label">
                                        Источник:
                                    </span>

                                    ${
                                        sourceUrl
                                            ? `
                                                <a
                                                    href="${escapeAttribute(
                                                        sourceUrl
                                                    )}"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    ${escapeHtml(
                                                        source
                                                    )}
                                                </a>
                                              `
                                            : `
                                                <span>
                                                    ${escapeHtml(
                                                        source
                                                    )}
                                                </span>
                                              `
                                    }

                                </div>
                              `
                            : ""
                    }


                    <button
                        class="details-button"
                        type="button"
                        data-id="${escapeAttribute(id)}"
                    >
                        Подробнее →
                    </button>

                </article>
            `;

        }).join("");


    // ------------------------------------
    // Кнопки "Подробнее"
    // ------------------------------------

    document
        .querySelectorAll(".details-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    openKnowledge(
                        this.dataset.id
                    );

                }
            );

        });

}


// ========================================
// Подробнее
// ========================================

function openKnowledge(id) {

    const item =
        knowledgeBase.find(
            knowledge =>
                String(
                    knowledge["ID"]
                ) === String(id)
        );

    if (!item) {
        return;
    }

    let text = "";


    text +=
        (
            item["Вопрос клиента"] ||
            "Без названия"
        ) +
        "\n\n";


    text +=
        "ОТВЕТ ЭКСПЕРТА\n\n" +
        (
            item["Короткий ответ"] ||
            ""
        ) +
        "\n\n";


    if (item["Продукт"]) {

        text +=
            "ПРОДУКТ\n\n" +
            item["Продукт"] +
            "\n\n";

    }


    if (item["Оборудование"]) {

        text +=
            "ОБОРУДОВАНИЕ\n\n" +
            item["Оборудование"] +
            "\n\n";

    }


    if (item["Категория"]) {

        text +=
            "КАТЕГОРИЯ\n\n" +
            item["Категория"] +
            "\n\n";

    }


    if (item["Что уточнить"]) {

        text +=
            "ЧТО УТОЧНИТЬ\n\n" +
            item["Что уточнить"] +
            "\n\n";

    }


    if (item["Достоверность"]) {

        text +=
            "ДОСТОВЕРНОСТЬ\n\n" +
            item["Достоверность"] +
            "\n\n";

    }


    if (item["Источник"]) {

        text +=
            "ИСТОЧНИК\n\n" +
            item["Источник"] +
            "\n\n";

    }


    if (item["Ссылка на источник"]) {

        text +=
            "ПЕРВОИСТОЧНИК\n\n" +
            item["Ссылка на источник"];

    }


    alert(text);
}


// ========================================
// Защита HTML
// ========================================

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


function escapeRegExp(value) {

    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

}


// ========================================
// Запуск
// ========================================

loadKnowledgeBase();
