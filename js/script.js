// ===== ОКОШКИ ТЕКУЩЕЙ СДЕЛКИ (БЕЗ СВЯЗИ С ИСТОРИЕЙ) =====
function updateDealInfo() {
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

// Добавляем обработчики (не трогая старые)
if (buyPriceInput) buyPriceInput.addEventListener('input', updateDealInfo);
if (sellPriceInput) sellPriceInput.addEventListener('input', updateDealInfo);
if (resellTaxCheckbox) resellTaxCheckbox.addEventListener('change', updateDealInfo);

// Запускаем сразу
setTimeout(updateDealInfo, 100);
