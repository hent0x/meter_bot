const tg = window.Telegram.WebApp;
tg.expand();

// Данные из config.py
const SHEETS = [
    "Пятерочка",
    "Дикси",
    "1-1 Склад",
    "Спортмастер",
    "Вкусвилл",
    "Чижик"
];

const METERS = {
    "gvs": { name: "🔥 Горячая вода", unit: "м³" },
    "hvs": { name: "💧 Холодная вода", unit: "м³" },
    "svet": { name: "⚡ Свет", unit: "кВт·ч" },
    "gaz": { name: "🔥 Газ", unit: "м³" }
};

const MAIN_SECTIONS = {
    "Пятерочка": "Пятерочка ОБЩИЙ (чернореченская 357)",
    "Дикси": "Сити общий (Дятловка 411)  (1597)",
    "1-1 Склад": "Склад 1200м2  (154)",
    "Спортмастер": "Спортмастер (413)",
    "Вкусвилл": "Вкусвилл все здание (Чернореченская 102)",
    "Чижик": "Чижик главный счетчик (новослободская 50)   (186)"
};

const TENANTS = {
    "Чижик": [
        { name: "ГУ Центр", section: "ГУ Центр", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "ИП Татур", section: "ИП Татур", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Чижик Магазин", section: "Чижик Магазин (Продторг)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Сервис новый", section: "Сервис новый (350 пристрой)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Масло (ИП Иванова)", section: "Масло (ИП Иванова)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Шиномонтаж", section: "Шиномонтаж (ООО Шериф)", meters: ["gvs", "hvs", "svet", "gaz"] },
    ],
    "Пятерочка": [
        { name: "Чайхана", section: "Чайхана (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Сервис", section: "Сервис (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Пятерочка магазин", section: "Пятерочка магазин", meters: ["gvs", "hvs", "svet", "gaz"] }
    ],
    "Дикси": [
        { name: "Мясо", section: "Мясо (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Кафе", section: "Кафе (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Кухня", section: "Кухня (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "ОЗОН", section: "ОЗОН (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "ШИНКА", section: "ШИНКА (Рафаилова)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Вода будка", section: "Вода будка (нал)", meters: ["gvs", "hvs", "svet", "gaz"] }
    ],
    "1-1 Склад": [],
    "Спортмастер": [],
    "Вкусвилл": [
        { name: "Вкусвилл", section: "Вкусвилл", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "общий озонL + вкусвил", section: "общий озонл + вкусвил", meters: ["gvs", "hvs", "svet", "gaz"] }
    ],
};

// UI Элементы
const mainContent = document.getElementById("main-content");
const screenTitle = document.getElementById("screen-title");
const backBtn = document.getElementById("back-btn");
const header = document.getElementById("header");

// Состояние
let currentTab = "readings"; // readings, tenants
let historyStack = [];

// Иконки брендов (для красоты)
function getBrandClass(name) {
    name = name.toLowerCase();
    if (name.includes("чижик")) return "brand-chizhik";
    if (name.includes("пятерочка")) return "brand-pyaterochka";
    if (name.includes("дикси")) return "brand-diksi";
    if (name.includes("склад")) return "brand-sklad";
    if (name.includes("спорт")) return "brand-sport";
    if (name.includes("вкусвилл")) return "brand-vkusvill";
    return "brand-tenant";
}

function getBrandInitial(name) {
    name = name.replace("1-1", "").trim();
    if (name.toLowerCase().includes("ип ")) return "ИП";
    if (name.toLowerCase().includes("ооо ")) return "ОО";
    return name.charAt(0).toUpperCase();
}

// ─── Роутер ────────────────────────────────────────────────────────────────
function navigateTo(renderFunc, title, params = {}, pushToHistory = true) {
    if (pushToHistory) {
        historyStack.push({ renderFunc, title, params });
    }

    // Прячем таб-бар, если мы глубже главного экрана
    const bottomNav = document.getElementById("bottom-nav");
    if (historyStack.length > 1) {
        bottomNav.style.display = "none";
        header.classList.remove("hidden");
        backBtn.classList.remove("hidden");
        screenTitle.classList.remove("centered");
    } else {
        bottomNav.style.display = "flex";
        header.classList.remove("hidden");
        backBtn.classList.add("hidden");
        screenTitle.classList.add("centered");
        tg.MainButton.hide();
    }

    screenTitle.innerText = title;
    mainContent.innerHTML = "";

    const screenEl = document.createElement("div");
    screenEl.className = "screen active";
    mainContent.appendChild(screenEl);

    renderFunc(screenEl, params);
}

backBtn.addEventListener("click", () => {
    if (historyStack.length > 1) {
        historyStack.pop();
        const prev = historyStack[historyStack.length - 1];
        navigateTo(prev.renderFunc, prev.title, prev.params, false);
    }
});

// Табы
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add("active");

        currentTab = targetBtn.dataset.tab;
        historyStack = [];

        if (currentTab === "readings") {
            navigateTo(renderObjectList, "Учёт показаний", { mode: 'readings' });
        } else {
            navigateTo(renderObjectList, "Учёт показаний", { mode: 'tenants' });
        }
    });
});

tg.onEvent('backButtonClicked', () => {
    backBtn.click();
});

// ─── Экраны ───────────────────────────────────────────────────────────────

function renderObjectList(container, params) {
    const list = document.createElement("div");
    list.className = "list-container";

    SHEETS.forEach(sheet => {
        const item = document.createElement("button");
        item.className = "list-item";

        // Берем правильное имя главной секции для вкладки "Показания" и заголовков объектов в "Арендаторы"
        let sheetTitle = MAIN_SECTIONS[sheet] || sheet;

        item.innerHTML = `
            <div class="brand-icon ${getBrandClass(sheet)}">${getBrandInitial(sheetTitle)}</div>
            <div class="title">${sheetTitle}</div>
            <div class="chevron">›</div>
        `;

        item.onclick = () => {
            if (params.mode === 'readings') {
                navigateTo(renderMetersList, "Сведения: " + sheet, { sheet: sheet, tenantName: null });
            } else {
                navigateTo(renderTenantsList, sheetTitle + " — Арендаторы", { sheet: sheet });
            }
        };
        list.appendChild(item);
    });
    container.appendChild(list);
}

function renderMetersList(container, params) {
    const { sheet, tenantName } = params;

    const sectionLabel = document.createElement("div");
    sectionLabel.className = "section-label";
    sectionLabel.innerText = "СЧЁТЧИКИ";
    container.appendChild(sectionLabel);

    const list = document.createElement("div");
    list.className = "list-container";

    let meterKeys = [];
    if (tenantName) {
        const tenant = TENANTS[sheet].find(t => t.name === tenantName);
        meterKeys = tenant ? tenant.meters : [];
    } else {
        meterKeys = Object.keys(METERS); // По умолчанию все для объекта
    }

    meterKeys.forEach(key => {
        const meter = METERS[key];
        const item = document.createElement("button");
        item.className = "list-item";

        // Разделяем иконку и название, например "⚡ Свет"
        const parts = meter.name.split(" ");
        const emoji = parts[0];
        const namePart = parts.slice(1).join(" ");

        item.innerHTML = `
            <div class="icon">${emoji}</div>
            <div class="title">${namePart}</div>
            <div class="chevron">›</div>
        `;

        item.onclick = () => {
            navigateTo(renderInputMenu, `${tenantName || sheet} — ${namePart}`, {
                sheet: sheet,
                tenantName: tenantName,
                meterKey: key
            });
        };
        list.appendChild(item);
    });

    const addBtn = document.createElement("button");
    addBtn.className = "btn-secondary";
    addBtn.innerText = "+ Добавить счётчик";
    list.appendChild(addBtn);

    container.appendChild(list);
}

function renderTenantsList(container, params) {
    const { sheet } = params;
    const tenants = TENANTS[sheet] || [];

    const sectionLabel = document.createElement("div");
    sectionLabel.className = "section-label";
    sectionLabel.innerText = "АРЕНДАТОРЫ";
    container.appendChild(sectionLabel);

    const list = document.createElement("div");
    list.className = "list-container";

    if (tenants.length === 0) {
        const empty = document.createElement("div");
        empty.style.padding = "16px";
        empty.style.color = "var(--hint-color)";
        empty.innerText = "📭 Арендаторы пока не добавлены";
        list.appendChild(empty);
    } else {
        tenants.forEach(t => {
            const item = document.createElement("button");
            item.className = "list-item";

            item.innerHTML = `
                <div class="brand-icon brand-tenant">${getBrandInitial(t.name)}</div>
                <div class="title">${t.name}</div>
                <div class="chevron">›</div>
            `;

            item.onclick = () => {
                navigateTo(renderMetersList, "Сведения: " + t.name, { sheet: sheet, tenantName: t.name });
            };
            list.appendChild(item);
        });
    }

    const addBtn = document.createElement("button");
    addBtn.className = "btn-secondary";
    addBtn.innerText = "+ Добавить арендатора";
    list.appendChild(addBtn);

    container.appendChild(list);
}

function renderInputMenu(container, params) {
    const { sheet, tenantName, meterKey } = params;
    const meter = METERS[meterKey];

    const wrapper = document.createElement("div");
    wrapper.className = "input-container";

    const title = document.createElement("h2");
    title.className = "input-screen-title";
    title.innerText = "Внесите показания";

    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group";

    const input = document.createElement("input");
    input.type = "number";
    input.className = "input-field";
    input.placeholder = `Введите показания (${meter.unit})`;
    input.step = "any";

    // Декоративные кнопки
    const stepperWrapper = document.createElement("div");
    stepperWrapper.className = "stepper-btns";
    stepperWrapper.innerHTML = `
        <button class="stepper-btn">▲</button>
        <button class="stepper-btn">▼</button>
    `;

    const actionBtn = document.createElement("div");
    actionBtn.className = "action-icon";

    inputGroup.appendChild(input);
    inputGroup.appendChild(stepperWrapper);
    inputGroup.appendChild(actionBtn);

    wrapper.appendChild(title);
    wrapper.appendChild(inputGroup);

    container.appendChild(wrapper);

    // Telegram Main Button
    tg.MainButton.text = "Передать показания";
    tg.MainButton.color = "#000000";
    tg.MainButton.textColor = "#FFFFFF";

    input.addEventListener('input', () => {
        if (input.value.trim() !== '') {
            tg.MainButton.show();
        } else {
            tg.MainButton.hide();
        }
    });

    // Сохраняем обработчик, чтобы потом удалить (избегаем дублей)
    tg.offEvent('mainButtonClicked', _submitHandler);

    function _submitHandler() {
        const val = parseFloat(input.value.replace(",", "."));
        if (isNaN(val)) {
            tg.showAlert("Введите корректное число.");
            return;
        }

        const payload = {
            action: "submit_reading",
            sheet: sheet,
            tenantName: tenantName,  // null если режим "Показания"
            meterKey: meterKey,
            value: val,
            source: tenantName ? "tenants" : "readings"
        };

        tg.sendData(JSON.stringify(payload));
        // Разрешаем Telegram закрыть WebApp
        tg.close();
    }

    tg.onEvent('mainButtonClicked', _submitHandler);
}

// Запуск начального экрана
navigateTo(renderObjectList, "Учёт показаний", { mode: 'readings' });
