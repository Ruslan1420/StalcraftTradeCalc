// script.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ

document.addEventListener('DOMContentLoaded', function() {
    console.log('Stalcraft Trade Tools loaded');
    
    // ===== ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ =====
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modePanels = {
        catalyst: document.getElementById('catalyst-mode'),
        resell: document.getElementById('resell-mode')
    };
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            
            modeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            Object.values(modePanels).forEach(panel => {
                panel.classList.remove('active');
            });
            modePanels[mode].classList.add('active');
            
            localStorage.setItem('stalcraft_mode', mode);
        });
    });
    
    const savedMode = localStorage.getItem('stalcraft_mode') || 'catalyst';
    const savedBtn = document.querySelector(`[data-mode="${savedMode}"]`);
    if (savedBtn) savedBtn.click();
    
    // ===== КАЛЬКУЛЯТОР КАТАЛИЗАТОРОВ =====
    
    const CRAFT = {
        SUGAR: { SLATS: 10, PLASMA: 1, DUST: 100, OUTPUT: 30 },
        CATALYST: { SUGAR: 15, DUST: 100, OUTPUT: 20 },
        ENERGY_PER_CRAFT: 1200
    };
    
    // Элементы калькулятора
    const slastInput = document.getElementById('input-slast');
    const dustInput = document.getElementById('input-dust');
    const plasmaInput = document.getElementById('input-plasma');
    const sugarInput = document.getElementById('input-sugar');
    
    const priceSlastInput = document.getElementById('price-slast');
    const priceDustInput = document.getElementById('price-dust');
    const pricePlasmaInput = document.getElementById('price-plasma');
    const priceEnergyInput = document.getElementById('price-energy');
    const priceCatalystInput = document.getElementById('price-catalyst');
    const priceSugarInput = document.getElementById('price-sugar');
    const useTaxCheckbox = document.getElementById('use-tax');
    
    const resultOutput = document.getElementById('result-output');
    const resultCost = document.getElementById('result-cost');
    const resultRevenue = document.getElementById('result-revenue');
    const resultProfit = document.getElementById('result-profit');
    
    // ===== ЭЛЕМЕНТЫ ТРЕКЕРА =====
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
    
    const dealCost = document.getElementById('deal-cost');
    const dealRevenue = document.getElementById('deal-revenue');
    const dealProfit = document.getElementById('deal-profit');
    const dealCount = document.getElementById('deal-count');
    
    let deals = [];
    
    // ===== ОБЩАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ЧИСЛА =====
    function getNumber(value) {
        if (!value) return 0;
        const num = parseInt(value.toString().replace(/\D/g, ''));
        return isNaN(num) ? 0 : num;
    }
    
    // ===== ФУНКЦИИ КАЛЬКУЛЯТОРА =====
    
    function calculateResourcesFromSugar(sugarAmount) {
        const sugar = sugarAmount || 0;
        const catalystCrafts = Math.floor(sugar / CRAFT.CATALYST.SUGAR);
        const neededSugar = catalystCrafts * CRAFT.CATALYST.SUGAR;
        const neededDustForCatalyst = catalystCrafts * CRAFT.CATALYST.DUST;
        
        const sugarCrafts = Math.ceil(neededSugar / CRAFT.SUGAR.OUTPUT);
        const neededSlatsForSugar = sugarCrafts * CRAFT.SUGAR.SLATS;
        const neededPlasmaForSugar = sugarCrafts * CRAFT.SUGAR.PLASMA;
        const neededDustForSugar = sugarCrafts * CRAFT.SUGAR.DUST;
        
        return {
            sugar: neededSugar,
            slast: neededSlatsForSugar,
            plasma: neededPlasmaForSugar,
            dust: neededDustForSugar + neededDustForCatalyst,
            catalystCrafts: catalystCrafts
        };
    }
    
    function calculateSugarFromResources(slast, dust, plasma) {
        const sugarFromSlats = Math.floor(slast / CRAFT.SUGAR.SLATS);
        const sugarFromPlasma = Math.floor(plasma / CRAFT.SUGAR.PLASMA);
        const sugarFromDust = Math.floor(dust / CRAFT.SUGAR.DUST);
        
        const maxSugarCrafts = Math.min(sugarFromSlats, sugarFromPlasma, sugarFromDust);
        const sugarProduced = maxSugarCrafts * CRAFT.SUGAR.OUTPUT;
        
        return {
            sugar: sugarProduced,
            usedSlats: maxSugarCrafts * CRAFT.SUGAR.SLATS,
            usedPlasma: maxSugarCrafts * CRAFT.SUGAR.PLASMA,
            usedDust: maxSugarCrafts * CRAFT.SUGAR.DUST
        };
    }
    
    function calculateCatalyst() {
        const slast = getNumber(slastInput?.value);
        const dust = getNumber(dustInput?.value);
        const plasma = getNumber(plasmaInput?.value);
        const sugar = getNumber(sugarInput?.value);
        
        const priceSlast = getNumber(priceSlastInput?.value) || 7800;
        const priceDust = getNumber(priceDustInput?.value) || 275;
        const pricePlasma = getNumber(pricePlasmaInput?.value) || 1500;
        const priceEnergy = parseFloat(priceEnergyInput?.value) || 1.2;
        const priceCatalyst = getNumber(priceCatalystInput?.value) || 4135;
        const useTax = useTaxCheckbox?.checked || false;
        
        const costOneSugarCraft = (
            CRAFT.SUGAR.SLATS * priceSlast + 
            CRAFT.SUGAR.PLASMA * pricePlasma + 
            CRAFT.SUGAR.DUST * priceDust + 
            CRAFT.ENERGY_PER_CRAFT * priceEnergy
        ) / CRAFT.SUGAR.OUTPUT;
        
        if (priceSugarInput) priceSugarInput.value = Math.round(costOneSugarCraft);
        
        let catalystsProduced = 0;
        let totalCost = 0;
        
        if (sugar > 0) {
            const catalystCrafts = Math.floor(sugar / CRAFT.CATALYST.SUGAR);
            const neededSugar = catalystCrafts * CRAFT.CATALYST.SUGAR;
            const neededDustForCatalyst = catalystCrafts * CRAFT.CATALYST.DUST;
            const sugarCrafts = Math.ceil(neededSugar / CRAFT.SUGAR.OUTPUT);
            
            catalystsProduced = catalystCrafts * CRAFT.CATALYST.OUTPUT;
            
            const totalEnergyUsed = (sugarCrafts + catalystCrafts) * CRAFT.ENERGY_PER_CRAFT;
            const totalEnergyCost = totalEnergyUsed * priceEnergy;
            
            totalCost = (
                sugarCrafts * CRAFT.SUGAR.SLATS * priceSlast +
                sugarCrafts * CRAFT.SUGAR.PLASMA * pricePlasma +
                (sugarCrafts * CRAFT.SUGAR.DUST + neededDustForCatalyst) * priceDust +
                totalEnergyCost
            );
        } else {
            const sugarFromSlats = Math.floor(slast / CRAFT.SUGAR.SLATS);
            const sugarFromPlasma = Math.floor(plasma / CRAFT.SUGAR.PLASMA);
            const sugarFromDust = Math.floor(dust / CRAFT.SUGAR.DUST);
            const maxSugarCrafts = Math.min(sugarFromSlats, sugarFromPlasma, sugarFromDust);
            const sugarProduced = maxSugarCrafts * CRAFT.SUGAR.OUTPUT;
            const remainingDust = dust - (maxSugarCrafts * CRAFT.SUGAR.DUST);
            
            const catalystFromSugar = Math.floor(sugarProduced / CRAFT.CATALYST.SUGAR);
            const catalystFromDust = Math.floor(remainingDust / CRAFT.CATALYST.DUST);
            const maxCatalystCrafts = Math.min(catalystFromSugar, catalystFromDust);
            
            catalystsProduced = maxCatalystCrafts * CRAFT.CATALYST.OUTPUT;
            
            const totalEnergyUsed = (maxSugarCrafts + maxCatalystCrafts) * CRAFT.ENERGY_PER_CRAFT;
            const totalEnergyCost = totalEnergyUsed * priceEnergy;
            
            totalCost = (
                maxSugarCrafts * CRAFT.SUGAR.SLATS * priceSlast +
                maxSugarCrafts * CRAFT.SUGAR.PLASMA * pricePlasma +
                (maxSugarCrafts * CRAFT.SUGAR.DUST + maxCatalystCrafts * CRAFT.CATALYST.DUST) * priceDust +
                totalEnergyCost
            );
        }
        
        let revenue = catalystsProduced * priceCatalyst;
        if (useTax) revenue = revenue * 0.95;
        const profit = revenue - totalCost;
        
        if (resultOutput) resultOutput.textContent = catalystsProduced.toLocaleString('ru-RU');
        if (resultCost) resultCost.textContent = formatMoney(totalCost);
        if (resultRevenue) resultRevenue.textContent = formatMoney(revenue);
        if (resultProfit) {
            resultProfit.textContent = formatMoney(profit);
            resultProfit.style.color = profit >= 0 ? '#00ff9d' : '#ff4757';
        }
        
        saveCalculatorData();
    }
    
    function saveCalculatorData() {
        try {
            const data = {
                slast: slastInput?.value,
                dust: dustInput?.value,
                plasma: plasmaInput?.value,
                sugar: sugarInput?.value,
                priceSlast: priceSlastInput?.value,
                priceDust: priceDustInput?.value,
                pricePlasma: pricePlasmaInput?.value,
                priceEnergy: priceEnergyInput?.value,
                priceCatalyst: priceCatalystInput?.value,
                useTax: useTaxCheckbox?.checked,
            };
            localStorage.setItem('stalcraft_calculator', JSON.stringify(data));
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }
    
    function loadCalculatorData() {
        try {
            const saved = localStorage.getItem('stalcraft_calculator');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.slast) slastInput.value = data.slast;
                if (data.dust) dustInput.value = data.dust;
                if (data.plasma) plasmaInput.value = data.plasma;
                if (data.sugar) sugarInput.value = data.sugar;
                if (data.priceSlast) priceSlastInput.value = data.priceSlast;
                if (data.priceDust) priceDustInput.value = data.priceDust;
                if (data.pricePlasma) pricePlasmaInput.value = data.pricePlasma;
                if (data.priceEnergy) priceEnergyInput.value = data.priceEnergy;
                if (data.priceCatalyst) priceCatalystInput.value = data.priceCatalyst;
                if (data.useTax !== undefined) useTaxCheckbox.checked = data.useTax;
                
                setTimeout(calculateCatalyst, 100);
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        }
    }
    
    // ===== ТРЕКЕР ПЕРЕПРОДАЖ =====
    
    function loadDeals() {
        try {
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
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            deals = [];
        }
        
        renderDeals();
        updateStats(); // ← ЭТОТ ВЫЗОВ УЖЕ ДОЛЖЕН БЫТЬ, ПРОВЕРЬТЕ
    }
    
    function saveDeals() {
        try {
            localStorage.setItem('stalcraft_resells', JSON.stringify(deals));
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }
    
    function calculateProfit(buyPrice, sellPrice, useTax) {
        let revenue = sellPrice;
        if (useTax) revenue = sellPrice * 0.95;
        return revenue - buyPrice;
    }
    
    function addDeal() {
        const name = itemNameInput?.value.trim();
        const buyPrice = getNumber(buyPriceInput?.value);
        const sellPrice = getNumber(sellPriceInput?.value);
        const useTax = resellTaxCheckbox?.checked || false;
        
        if (!name) {
            alert('Введите название предмета!');
            return;
        }
        
        if (buyPrice <= 0 || sellPrice <= 0) {
            alert('Цены должны быть больше 0!');
            return;
        }
        
        const newDeal = {
            id: Date.now(),
            name: name,
            buyPrice: buyPrice,
            sellPrice: sellPrice,
            useTax: useTax
        };
        
        deals.unshift(newDeal);
        saveDeals();
        
        itemNameInput.value = '';
        buyPriceInput.value = '0';
        sellPriceInput.value = '0';
        
        renderDeals();
        updateStats();
        updateDealInfo();
        showNotification('Сделка добавлена!');
    }
    
    window.deleteDeal = function(id) {
        deals = deals.filter(deal => deal.id !== id);
        saveDeals();
        renderDeals();
        updateStats();
        showNotification('Сделка удалена');
    };
    
    function clearAllDeals() {
        if (deals.length === 0) return;
        if (confirm('Вы уверены? Вся история будет удалена!')) {
            deals = [];
            saveDeals();
            renderDeals();
            updateStats();
            showNotification('История очищена');
        }
    }
    
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
    
    function updateStats() {
        if (!totalSpentEl || !totalRevenueEl || !totalProfitEl || !dealsCountEl) return;
        
        let totalSpent = 0;
        let totalRevenue = 0;
        
        deals.forEach(deal => {
            totalSpent += deal.buyPrice;
            let revenue = deal.sellPrice;
            if (deal.useTax) revenue = deal.sellPrice * 0.95;
            totalRevenue += revenue;
        });
        
        const totalProfit = totalRevenue - totalSpent;
        
        // Обновляем верхнюю статистику
        totalSpentEl.textContent = formatMoney(totalSpent);
        totalRevenueEl.textContent = formatMoney(totalRevenue);
        totalProfitEl.textContent = formatMoney(totalProfit, true);
        dealsCountEl.textContent = deals.length;
        totalProfitEl.style.color = totalProfit >= 0 ? '#00ff9d' : '#ff4757';
        
        // Обновляем итоговую строку внизу таблицы
        const totalSpentFooter = document.getElementById('total-spent-footer');
        const totalRevenueFooter = document.getElementById('total-revenue-footer');
        const totalProfitFooter = document.getElementById('total-profit-footer');
        
        if (totalSpentFooter) totalSpentFooter.textContent = formatMoney(totalSpent);
        if (totalRevenueFooter) totalRevenueFooter.textContent = formatMoney(totalRevenue);
        if (totalProfitFooter) {
            totalProfitFooter.textContent = formatMoney(totalProfit, true);
            totalProfitFooter.className = totalProfit >= 0 ? 'profit-positive' : 'profit-negative';
        }
    }
    
    // ===== ФУНКЦИИ ДЛЯ ОКОШЕК ТЕКУЩЕЙ СДЕЛКИ =====
    function updateDealInfo() {
        const buy = getNumber(buyPriceInput?.value);
        const sell = getNumber(sellPriceInput?.value);
        const tax = resellTaxCheckbox?.checked || false;
        
        let revenue = sell;
        if (tax) revenue = sell * 0.95;
        const profit = revenue - buy;
        
        if (dealCost) dealCost.textContent = formatMoney(buy);
        if (dealRevenue) dealRevenue.textContent = formatMoney(revenue);
        if (dealProfit) {
            dealProfit.textContent = formatMoney(profit, true);
            dealProfit.style.color = profit >= 0 ? '#00ff9d' : '#ff4757';
        }
        if (dealCount) dealCount.textContent = '1';
    }
    
    // ===== ОБЩИЕ ФУНКЦИИ =====
    
    function formatMoney(amount, showSign = false) {
        if (isNaN(amount)) return '0 ₽';
        
        const rounded = Math.round(amount);
        const withSpaces = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        
        if (showSign && amount > 0) {
            return '+' + withSpaces + ' ₽';
        }
        
        return withSpaces + ' ₽';
    }
    
    function showNotification(text) {
        console.log('🔔', text);
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary);
            color: var(--dark);
            padding: 12px 24px;
            border-radius: var(--radius-sm);
            font-family: var(--font-body);
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = text;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    // Анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // ===== ОБРАБОТЧИКИ КАЛЬКУЛЯТОРА =====
    
    const calcInputs = [
        slastInput, dustInput, plasmaInput, sugarInput,
        priceSlastInput, priceDustInput, pricePlasmaInput,
        priceCatalystInput, priceEnergyInput, useTaxCheckbox
    ];
    
    calcInputs.forEach(input => {
        if (!input) return;
        
        if (input.type === 'checkbox') {
            input.addEventListener('change', () => {
                calculateCatalyst();
                saveCalculatorData();
            });
        } else {
            input.addEventListener('input', () => {
                calculateCatalyst();
                saveCalculatorData();
            });
        }
    });
    
    // ===== ОБРАБОТЧИКИ ТРЕКЕРА =====
    
    if (buyPriceInput) {
        buyPriceInput.addEventListener('input', function() {
            updateDealInfo();
        });
    }
    
    if (sellPriceInput) {
        sellPriceInput.addEventListener('input', function() {
            updateDealInfo();
        });
    }
    
    if (resellTaxCheckbox) {
        resellTaxCheckbox.addEventListener('change', function() {
            updateDealInfo();
        });
    }
    
    if (addButton) addButton.addEventListener('click', addDeal);
    if (clearButton) clearButton.addEventListener('click', clearAllDeals);
    
    // ===== УБИРАЕМ 0 ПРИ ВВОДЕ =====
    function setupZeroClearing() {
        const numberInputs = [
            document.getElementById('buy-price'),
            document.getElementById('sell-price'),
            document.getElementById('price-catalyst'),
            document.getElementById('price-slast'),
            document.getElementById('price-dust'),
            document.getElementById('price-plasma'),
            document.getElementById('price-energy'),
            document.getElementById('input-slast'),
            document.getElementById('input-dust'),
            document.getElementById('input-plasma'),
            document.getElementById('input-sugar')
        ];
        
        numberInputs.forEach(input => {
            if (!input) return;
            
            input.addEventListener('focus', function() {
                if (this.value == 0 || this.value === '0') {
                    this.value = '';
                }
            });
            
            input.addEventListener('blur', function() {
                if (this.value === '') {
                    this.value = '0';
                }
            });
        });
    }
    
    // ===== ОБРАБОТЧИКИ ДЛЯ РЕСУРСОВ =====
    
    if (sugarInput) {
        sugarInput.addEventListener('input', function() {
            const sugarAmount = getNumber(this.value);
            if (sugarAmount > 0) {
                const resources = calculateResourcesFromSugar(sugarAmount);
                if (slastInput) slastInput.value = resources.slast;
                if (plasmaInput) plasmaInput.value = resources.plasma;
                if (dustInput) dustInput.value = resources.dust;
            }
            calculateCatalyst();
        });
    }
    
    if (slastInput) {
        slastInput.addEventListener('input', function() {
            const slast = getNumber(this.value);
            if (plasmaInput) plasmaInput.value = Math.floor(slast / 10);
            if (dustInput) dustInput.value = Math.floor(slast * 30);
            
            const dust = getNumber(dustInput?.value);
            const plasma = getNumber(plasmaInput?.value);
            
            const sugarData = calculateSugarFromResources(slast, dust, plasma);
            if (sugarInput) sugarInput.value = sugarData.sugar;
            
            calculateCatalyst();
        });
    }
    
    if (dustInput) {
        dustInput.addEventListener('input', function() {
            const dust = getNumber(this.value);
            if (slastInput) slastInput.value = Math.floor(dust / 30);
            if (plasmaInput) plasmaInput.value = Math.floor(dust / 300);
            
            const slast = getNumber(slastInput?.value);
            const plasma = getNumber(plasmaInput?.value);
            
            const sugarData = calculateSugarFromResources(slast, dust, plasma);
            if (sugarInput) sugarInput.value = sugarData.sugar;
            
            calculateCatalyst();
        });
    }
    
    if (plasmaInput) {
        plasmaInput.addEventListener('input', function() {
            const plasma = getNumber(this.value);
            if (slastInput) slastInput.value = plasma * 10;
            if (dustInput) dustInput.value = plasma * 300;
            
            const slast = getNumber(slastInput?.value);
            const dust = getNumber(dustInput?.value);
            
            const sugarData = calculateSugarFromResources(slast, dust, plasma);
            if (sugarInput) sugarInput.value = sugarData.sugar;
            
            calculateCatalyst();
        });
    }
    
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    loadCalculatorData();
    loadDeals();
    calculateCatalyst();
    updateStats();
    updateDealInfo();
    setupZeroClearing();

    // ===== ОБНОВЛЕНИЕ ИТОГОВ ПРИ ЗАГРУЗКЕ =====
window.addEventListener('load', function() {
    setTimeout(function() {
        if (deals && deals.length > 0) {
            updateStats();
        }
    }, 100);
});
    
});
