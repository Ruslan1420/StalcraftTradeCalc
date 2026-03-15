// script.js - ТОЛЬКО ТРЕКЕР (РАБОЧИЙ)

document.addEventListener('DOMContentLoaded', function() {
    console.log('Tracker loaded');

    // ===== ЭЛЕМЕНТЫ =====
    const itemNameInput = document.getElementById('item-name');
    const buyPriceInput = document.getElementById('buy-price');
    const sellPriceInput = document.getElementById('sell-price');
    const resellTaxCheckbox = document.getElementById('resell-tax');
    const addButton = document.getElementById('add-deal');
    const clearButton = document.getElementById('clear-history');

    const totalSpentEl = document.getElementById('total-spent');
    const totalRevenueEl = document.getElementById('total-revenue');
    const totalProfitEl = document.getElementById('total-profit');
    const dealsCountEl = document.getElementById('deals-count');

    const dealsList = document.getElementById('deals-list');
    const emptyState = document.getElementById('empty-state');

    let deals = [];

    // ===== ФУНКЦИЯ ДЛЯ ЧИСЕЛ =====
    function getNumber(value) {
        if (!value) return 0;
        const num = parseInt(value.toString().replace(/\D/g, ''));
        return isNaN(num) ? 0 : num;
    }

    // ===== ФОРМАТ ДЕНЕГ =====
    function formatMoney(amount, showSign = false) {
        if (isNaN(amount)) return '0 ₽';
        const rounded = Math.round(amount);
        const withSpaces = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        if (showSign && amount > 0) return '+' + withSpaces + ' ₽';
        return withSpaces + ' ₽';
    }

    // ===== ЗАГРУЗКА ИСТОРИИ =====
    function loadDeals() {
        const saved = localStorage.getItem('stalcraft_resells');
        if (saved) {
            deals = JSON.parse(saved);
        } else {
            deals = [
                { id: 1, name: 'Полено +15', buyPrice: 10100000, sellPrice: 12000000, useTax: true },
                { id: 2, name: 'Артефакт Капля', buyPrice: 45000, sellPrice: 65000, useTax: true }
            ];
            saveDeals();
        }
        renderDeals();
        updateStats();
    }

    function saveDeals() {
        localStorage.setItem('stalcraft_resells', JSON.stringify(deals));
    }

    // ===== РАСЧЕТ ПРИБЫЛИ =====
    function calculateProfit(buy, sell, tax) {
        let revenue = sell;
        if (tax) revenue = sell * 0.95;
        return revenue - buy;
    }

    // ===== ДОБАВЛЕНИЕ СДЕЛКИ =====
    function addDeal() {
        const name = itemNameInput?.value.trim();
        const buy = getNumber(buyPriceInput?.value);
        const sell = getNumber(sellPriceInput?.value);
        const tax = resellTaxCheckbox?.checked || false;

        if (!name) { alert('Введите название!'); return; }
        if (buy <= 0 || sell <= 0) { alert('Цены должны быть больше 0!'); return; }

        const newDeal = {
            id: Date.now(),
            name: name,
            buyPrice: buy,
            sellPrice: sell,
            useTax: tax
        };

        deals.unshift(newDeal);
        saveDeals();

        itemNameInput.value = '';
        buyPriceInput.value = '0';
        sellPriceInput.value = '0';

        renderDeals();
        updateStats();
        showNotification('Сделка добавлена!');
    }

    // ===== УДАЛЕНИЕ =====
    window.deleteDeal = function(id) {
        deals = deals.filter(d => d.id !== id);
        saveDeals();
        renderDeals();
        updateStats();
        showNotification('Сделка удалена');
    };

    // ===== ОЧИСТКА ВСЕГО =====
    function clearAllDeals() {
        if (deals.length === 0) return;
        if (confirm('Очистить всю историю?')) {
            deals = [];
            saveDeals();
            renderDeals();
            updateStats();
            showNotification('История очищена');
        }
    }

    // ===== ОТОБРАЖЕНИЕ ИСТОРИИ =====
    function renderDeals() {
        if (!dealsList || !emptyState) return;
        if (deals.length === 0) {
            dealsList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        let html = '';

        deals.forEach(deal => {
            const profit = calculateProfit(deal.buyPrice, deal.sellPrice, deal.useTax);
            const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';

            html += `<tr>
                <td>${deal.name}</td>
                <td>${formatMoney(deal.buyPrice)}</td>
                <td>${formatMoney(deal.sellPrice)}</td>
                <td>${deal.useTax ? 'Да' : 'Нет'}</td>
                <td class="${profitClass}">${formatMoney(profit, true)}</td>
                <td><button class="delete-btn" onclick="deleteDeal(${deal.id})"><i class="fas fa-times"></i></button></td>
            </tr>`;
        });

        dealsList.innerHTML = html;
    }

    // ===== ОБЩАЯ СТАТИСТИКА (ИСТОРИЯ) =====
    function updateStats() {
        if (!totalSpentEl || !totalRevenueEl || !totalProfitEl || !dealsCountEl) return;

        let spent = 0, revenue = 0;
        deals.forEach(deal => {
            spent += deal.buyPrice;
            let rev = deal.sellPrice;
            if (deal.useTax) rev = deal.sellPrice * 0.95;
            revenue += rev;
        });

        const profit = revenue - spent;

        totalSpentEl.textContent = formatMoney(spent);
        totalRevenueEl.textContent = formatMoney(revenue);
        totalProfitEl.textContent = formatMoney(profit, true);
        dealsCountEl.textContent = deals.length;
        totalProfitEl.style.color = profit >= 0 ? '#00ff9d' : '#ff4757';
    }

    // ===== ОКОШКИ ТЕКУЩЕЙ СДЕЛКИ (НЕ СВЯЗАНЫ С ИСТОРИЕЙ) =====
    function updateCurrentDeal() {
        const buy = getNumber(buyPriceInput?.value);
        const sell = getNumber(sellPriceInput?.value);
        const tax = resellTaxCheckbox?.checked || false;

        let revenue = sell;
        if (tax) revenue = sell * 0.95;
        const profit = revenue - buy;

        // Находим окошки (они уже есть в верстке)
        const costEl = document.querySelector('#resell-mode .result-item:first-child .result-value');
        const revenueEl = document.querySelector('#resell-mode .result-item:nth-child(2) .result-value');
        const profitEl = document.querySelector('#resell-mode .result-item.highlight .result-value');
        const countEl = document.querySelector('#resell-mode .result-item:last-child .result-value');

        if (costEl) costEl.textContent = formatMoney(buy);
        if (revenueEl) revenueEl.textContent = formatMoney(revenue);
        if (profitEl) {
            profitEl.textContent = formatMoney(profit, true);
            profitEl.style.color = profit >= 0 ? '#00ff9d' : '#ff4757';
        }
        if (countEl) countEl.textContent = '1';
    }

    // ===== УВЕДОМЛЕНИЯ =====
    function showNotification(text) {
        console.log('🔔', text);
        const notif = document.createElement('div');
        notif.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#00f3ff;color:#0a0e17;padding:12px 24px;border-radius:6px;font-weight:600;z-index:1000;animation:slideIn 0.3s ease;';
        notif.textContent = text;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }

    // ===== АНИМАЦИЯ =====
    const style = document.createElement('style');
    style.textContent = `@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
    document.head.appendChild(style);

    // ===== ОБРАБОТЧИКИ =====
    if (buyPriceInput) {
        buyPriceInput.addEventListener('input', function() {
            updateCurrentDeal();   // окошки
            updateStats();         // история (если нужно)
        });
    }
    if (sellPriceInput) {
        sellPriceInput.addEventListener('input', function() {
            updateCurrentDeal();
            updateStats();
        });
    }
    if (resellTaxCheckbox) {
        resellTaxCheckbox.addEventListener('change', function() {
            updateCurrentDeal();
            updateStats();
        });
    }

    if (addButton) addButton.addEventListener('click', addDeal);
    if (clearButton) clearButton.addEventListener('click', clearAllDeals);

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    loadDeals();
    updateStats();
    setTimeout(updateCurrentDeal, 100);

    // ===== УБИРАЕМ 0 ПРИ ФОКУСЕ =====
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('focus', function() {
            if (this.value === '0') this.value = '';
        });
        input.addEventListener('blur', function() {
            if (this.value === '') this.value = '0';
        });
    });
});
