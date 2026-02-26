const tg = window.Telegram.WebApp;
tg.expand();

// ─── Конфигурация (синхронизирована с config.py) ──────────────────────────────
const SHEETS = ["Пятерочка", "Дикси", "1-1 Склад", "Спортмастер", "Вкусвилл", "Чижик"];

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
        { name: "Дикси", section: "Дикси", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Пиво", section: "Пиво", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Мясо", section: "Мясо (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Кафе", section: "Кафе (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Кухня", section: "Кухня (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "ОЗОН", section: "ОЗОН (нал)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "WB", section: "WB", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "КБ", section: "КБ", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "ШИНКА", section: "ШИНКА (Рафаилова)", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Вода будка", section: "Вода будка (нал)", meters: ["gvs", "hvs", "svet", "gaz"] }
    ],
    "1-1 Склад": [],
    "Спортмастер": [],
    "Вкусвилл": [
        { name: "Вкусвилл", section: "Вкусвилл", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "ОЗОН", section: "ОЗОН", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "общий озонL + вкусвил", section: "общий озонл + вкусвил", meters: ["gvs", "hvs", "svet", "gaz"] },
        { name: "Вода", section: "вода", meters: ["gvs", "hvs", "svet", "gaz"] }
    ],
};

// ─── UI ───────────────────────────────────────────────────────────────────────
const mainContent = document.getElementById("main-content");
const screenTitle = document.getElementById("screen-title");
const backBtn = document.getElementById("back-btn");
const header = document.getElementById("header");

let currentTab = "readings";
let historyStack = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Роутер ───────────────────────────────────────────────────────────────────
function navigateTo(renderFunc, title, params = {}, pushToHistory = true) {
    if (pushToHistory) historyStack.push({ renderFunc, title, params });

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

document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        currentTab = e.currentTarget.dataset.tab;
        historyStack = [];
        navigateTo(renderObjectList, "Учёт показаний", { mode: currentTab });
    });
});

tg.onEvent('backButtonClicked', () => backBtn.click());

// ─── Экран 1: список объектов ─────────────────────────────────────────────────
function renderObjectList(container, params) {
    const list = document.createElement("div");
    list.className = "list-container";

    SHEETS.forEach(sheet => {
        const item = document.createElement("button");
        item.className = "list-item";
        const sheetTitle = MAIN_SECTIONS[sheet] || sheet;

        item.innerHTML = `
            <div class="brand-icon ${getBrandClass(sheet)}">${getBrandInitial(sheetTitle)}</div>
            <div class="title">${sheetTitle}</div>
            <div class="chevron">›</div>
        `;
        item.onclick = () => {
            if (params.mode === 'readings') {
                navigateTo(renderMetersList, sheet + " — Счётчик", { sheet, tenantName: null });
            } else {
                navigateTo(renderTenantsList, sheetTitle + " — Арендаторы", { sheet });
            }
        };
        list.appendChild(item);
    });
    container.appendChild(list);
}

// ─── Экран 2a: список арендаторов ─────────────────────────────────────────────
function renderTenantsList(container, params) {
    const { sheet } = params;
    const tenants = TENANTS[sheet] || [];

    const lbl = document.createElement("div");
    lbl.className = "section-label";
    lbl.innerText = "АРЕНДАТОРЫ";
    container.appendChild(lbl);

    const list = document.createElement("div");
    list.className = "list-container";

    if (tenants.length === 0) {
        const empty = document.createElement("div");
        empty.style.cssText = "padding:16px;color:var(--hint-color)";
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
            item.onclick = () =>
                navigateTo(renderMetersList, t.name + " — Счётчик", { sheet, tenantName: t.name });
            list.appendChild(item);
        });
    }
    container.appendChild(list);
}

// ─── Экран 2b: список счётчиков ───────────────────────────────────────────────
function renderMetersList(container, params) {
    const { sheet, tenantName } = params;

    const lbl = document.createElement("div");
    lbl.className = "section-label";
    lbl.innerText = "СЧЁТЧИКИ";
    container.appendChild(lbl);

    const list = document.createElement("div");
    list.className = "list-container";

    let meterKeys = [];
    if (tenantName) {
        const tenant = (TENANTS[sheet] || []).find(t => t.name === tenantName);
        meterKeys = tenant ? tenant.meters : [];
    } else {
        meterKeys = Object.keys(METERS);
    }

    meterKeys.forEach(key => {
        const meter = METERS[key];
        const item = document.createElement("button");
        item.className = "list-item";
        const [emoji, ...rest] = meter.name.split(" ");
        item.innerHTML = `
            <div class="icon">${emoji}</div>
            <div class="title">${rest.join(" ")}</div>
            <div class="chevron">›</div>
        `;
        item.onclick = () =>
            navigateTo(renderPeriodInput, "Выберите период", { sheet, tenantName, meterKey: key });
        list.appendChild(item);
    });

    container.appendChild(list);
}

// ─── Экран 3: ввод периода ────────────────────────────────────────────────────
function renderPeriodInput(container, params) {
    const { sheet, tenantName, meterKey } = params;
    const meter = METERS[meterKey];
    const display = tenantName || (MAIN_SECTIONS[sheet] || sheet);

    const wrapper = document.createElement("div");
    wrapper.className = "input-container";

    wrapper.innerHTML = `
        <div class="info-card">
            <div class="info-row">📋 <span>${display}</span></div>
            <div class="info-row">🔩 <span>${meter.name}</span></div>
        </div>
        <h2 class="input-screen-title">📅 Выберите период</h2>
        <p class="input-hint">Введите номер месяца (от 01 до 12)</p>
    `;

    const input = document.createElement("input");
    input.type = "number";
    input.className = "input-field";
    input.placeholder = "Например: 05";
    input.min = "1";
    input.max = "12";
    input.step = "1";

    const btn = document.createElement("button");
    btn.className = "btn-primary";
    btn.innerText = "Далее →";
    btn.disabled = true;
    btn.style.marginTop = "16px";

    input.addEventListener("input", () => {
        const v = parseInt(input.value, 10);
        btn.disabled = !(v >= 1 && v <= 12);
    });

    btn.onclick = () => {
        const v = parseInt(input.value, 10);
        if (isNaN(v) || v < 1 || v > 12) {
            tg.showAlert("Введите номер месяца от 01 до 12");
            return;
        }
        const year = new Date().getFullYear();
        const period = `${String(v).padStart(2, "0")}.${year}`;
        navigateTo(renderValueInput, "Введите показания", { sheet, tenantName, meterKey, period });
    };

    wrapper.appendChild(input);
    wrapper.appendChild(btn);
    container.appendChild(wrapper);

    setTimeout(() => input.focus(), 100);
}

// ─── Экран 4: ввод показаний ──────────────────────────────────────────────────
function renderValueInput(container, params) {
    const { sheet, tenantName, meterKey, period } = params;
    const meter = METERS[meterKey];
    const display = tenantName || (MAIN_SECTIONS[sheet] || sheet);

    const wrapper = document.createElement("div");
    wrapper.className = "input-container";

    wrapper.innerHTML = `
        <div class="info-card">
            <div class="info-row">📋 <span>${display}</span></div>
            <div class="info-row">🔩 <span>${meter.name}</span></div>
            <div class="info-row">📅 <span>Период: <b>${period}</b></span></div>
        </div>
        <h2 class="input-screen-title">🔴 Внесите показания</h2>
        <p class="input-hint">Введите значение (${meter.unit})</p>
    `;

    const input = document.createElement("input");
    input.type = "number";
    input.className = "input-field";
    input.placeholder = `Показания в ${meter.unit}`;
    input.step = "any";

    const btn = document.createElement("button");
    btn.className = "btn-primary";
    btn.innerText = "Далее →";
    btn.disabled = true;
    btn.style.marginTop = "16px";

    input.addEventListener("input", () => {
        btn.disabled = input.value.trim() === "";
    });

    btn.onclick = () => {
        const val = parseFloat(input.value.replace(",", "."));
        if (isNaN(val)) {
            tg.showAlert("Введите корректное числовое значение.");
            return;
        }
        navigateTo(renderConfirm, "Подтверждение", { sheet, tenantName, meterKey, period, value: val });
    };

    wrapper.appendChild(input);
    wrapper.appendChild(btn);
    container.appendChild(wrapper);

    setTimeout(() => input.focus(), 100);
}

// ─── Экран 5: подтверждение ───────────────────────────────────────────────────
function renderConfirm(container, params) {
    const { sheet, tenantName, meterKey, period, value } = params;
    const meter = METERS[meterKey];
    const display = tenantName || (MAIN_SECTIONS[sheet] || sheet);

    const wrapper = document.createElement("div");
    wrapper.className = "input-container";

    wrapper.innerHTML = `
        <h2 class="input-screen-title">❓ Вы уверены?</h2>
        <div class="confirm-card">
            <div class="confirm-row"><span class="confirm-label">📋 Объект / Арендатор</span><span class="confirm-value">${display}</span></div>
            <div class="confirm-row"><span class="confirm-label">🔩 Счётчик</span><span class="confirm-value">${meter.name}</span></div>
            <div class="confirm-row"><span class="confirm-label">📅 Период</span><span class="confirm-value">${period}</span></div>
            <div class="confirm-row highlight"><span class="confirm-label">✏️ Значение</span><span class="confirm-value"><b>${value} ${meter.unit}</b></span></div>
        </div>
    `;

    const btnRow = document.createElement("div");
    btnRow.className = "confirm-btn-row";

    const yesBtn = document.createElement("button");
    yesBtn.className = "btn-yes";
    yesBtn.innerText = "✅ Да";

    const noBtn = document.createElement("button");
    noBtn.className = "btn-no";
    noBtn.innerText = "❌ Нет";

    noBtn.onclick = () => {
        historyStack = [];
        navigateTo(renderObjectList, "Учёт показаний", { mode: currentTab });
    };

    yesBtn.onclick = () => {
        yesBtn.disabled = true;
        noBtn.disabled = true;
        yesBtn.innerText = "⏳ Сохраняем...";

        const payload = {
            action: "submit_reading",
            sheet: sheet,
            tenantName: tenantName || null,
            meterKey: meterKey,
            value: value,
            period: period,
            source: tenantName ? "tenants" : "readings"
        };

        tg.sendData(JSON.stringify(payload));
    };

    btnRow.appendChild(noBtn);
    btnRow.appendChild(yesBtn);
    wrapper.appendChild(btnRow);
    container.appendChild(wrapper);
}

// ─── Старт ────────────────────────────────────────────────────────────────────
navigateTo(renderObjectList, "Учёт показаний", { mode: 'readings' });
