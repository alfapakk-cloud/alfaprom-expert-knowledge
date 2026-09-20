// АЛЬФАПРОМ — База экспертных знаний

let knowledgeBase = [];
let currentFilter = "Все";

const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const filterButtons = document.querySelectorAll(".filter");
const categories = document.querySelectorAll(".category");


// Поиск
searchInput.addEventListener("input", function () {
    renderResults();
});


// Фильтры
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


// Популярные разделы
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
            top: document.getElementById("resultsSection").offsetTop - 20,
            behavior: "smooth"
        });

    });

});


// Отображение результатов
function renderResults() {

    const query = searchInput.value
        .trim()
        .toLowerCase();

    let filtered = knowledgeBase;


    // Фильтр по разделу
    if (currentFilter !== "Все") {

        filtered = filtered.filter(item => {

            const product = (item["Продукт"] || "").toLowerCase();
            const equipment = (item["Оборудование"] || "").toLowerCase();
            const category = (item["Категория"] || "").toLowerCase();

            const filter = currentFilter.toLowerCase();

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


    // Пока база пустая
    if (filtered.length === 0) {

        results.innerHTML = `
            <div class="empty-state">
                <p>Ничего не найдено.</p>
                <p>Попробуйте изменить запрос или выбрать другой раздел.</p>
            </div>
        `;

        return;
    }


    // Карточки
    results.innerHTML = filtered.map(item => {

        return `
            <article class="knowledge-card">

                <div class="knowledge-product">
                    ${item["Продукт"] || "Экспертное знание"}
                </div>

                <h3>
                    ${item["Вопрос клиента"] || "Без названия"}
                </h3>

                <p>
                    ${item["Короткий ответ"] || ""}
                </p>

                <div class="knowledge-meta">

                    ${
                        item["Статус проверки"]
                            ? `<span>✓ ${item["Статус проверки"]}</span>`
                            : ""
                    }

                    ${
                        item["Достоверность"]
                            ? `<span>Достоверность: ${item["Достоверность"]}</span>`
                            : ""
                    }

                </div>

                <button
                    class="details-button"
                    type="button"
                    onclick="openKnowledge('${item["ID"] || ""}')"
                >
                    Подробнее →
                </button>

            </article>
        `;

    }).join("");

}


function openKnowledge(id) {

    const item = knowledgeBase.find(
        knowledge => knowledge["ID"] === id
    );

    if (!item) return;

    alert(
        item["Вопрос клиента"] +
        "\n\n" +
        item["Короткий ответ"]
    );

}


// Первый запуск
renderResults();
