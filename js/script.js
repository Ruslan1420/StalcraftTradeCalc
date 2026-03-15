// script.js - Объединенный калькулятор и трекер

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
            
            // Обновляем кнопки
            modeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Обновляем панели
            Object.values(modePanels).forEach(panel => {
                panel.classList.remove('active');
            });
            modePanels[mode].classList.add('active');
            
            // Сохраняем выбранный режим
            localStorage.setItem('stalcraft_mode', mode);
        });
    });
    
    // Загружаем последний использованный режим
    const savedMode = localStorage.getItem('stalcraft_mode') || 'catalyst';
    document.querySelector(`[data-mode="${savedMode}"]`).click();
    
    // ===== КАЛЬКУЛЯТОР КАТАЛИЗАТОРОВ (из вашего main.js) =====
    
    // Константы крафта
    const CRAFT = {
        SUGAR: {
            SLATS: 10,
            PLASMA: 1,
            DUST: 100,
            OUTPUT: 30
        },
        CATALYST: {
            SUGAR: 15,
            DUST: 100,
            OUTPUT: 20
        },
        ENERGY_PER_CRAFT: 1200
    };
    
    // Получение элементов калькулятора
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
    
    // Элементы вывода калькулятора
    const resultOutput = document.getElementById('result-output');
    const resultCost = document.getElementById('result-cost');
    const resultRevenue = document.getElementById('result-revenue');
    const resultProfit = document.getElementById('result-profit');
    
    // ===== ФУНКЦИИ КАЛЬКУЛЯТОРА =====
    
    function setupCalculatorLimits() {
        const inputs = [
            slastInput, dustInput, plasmaInput, sugarInput,
            priceSlastInput, priceDustInput, pricePlasmaInput,
            priceCatalystInput
        ];
        
        inputs.forEach(input => {
            if (!input) return;
            
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^\d]/g, '');
                
                if (this.value.length > 8) {
                    this.value = this.value.substring(0, 8);
                }
                
                calculateCatalyst();
                saveCalculatorData();
            });
        });
        
        if (priceEnergyInput) {
            priceEnergyInput.addEventListener('input', function() {
                let value = this.value.replace(',', '.');
                value = value.replace(/[^\d.]/g, '');
                
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                
                if (parts.length === 2) {
                    parts[1] = parts[1].slice(0, 2);
                    value = parts[0] + '.' + parts[1];
                }
                
                this.value = value;
                calculateCatalyst();
                saveCalculatorData();
            });
        }
    }
    
    function calculateResourcesFromSugar(sugarAmount) {
        const sugar = parseFloat(sugarAmount) || 0;
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
        const slast = parseFloat(slastInput?.value) || 0;
        const dust = parseFloat(dustInput?.value) || 0;
        const plasma = parseFloat(plasmaInput?.value) || 0;
        const sugar = parseFloat(sugarInput?.value) || 0;
        
        const priceSlast = parseFloat(priceSlastInput?.value) || 7800;
        const priceDust = parseFloat(priceDustInput?.value) || 275;
        const pricePlasma = parseFloat(pricePlasmaInput?.value) || 1500;
        const priceEnergy = parseFloat(priceEnergyInput?.value.replace(',', '.')) || 1.2;
        const priceCatalyst = parseFloat(priceCatalystInput?.value) || 4135;
        const useTax = useTaxCheckbox?.checked || false;
        
        // Расчет стоимости сахара
        const costOneSugarCraft = 
            (CRAFT.SUGAR.SLATS * priceSlast + 
             CRAFT.SUGAR.PLASMA * pricePlasma + 
             CRAFT.SUGAR.DUST * priceDust + 
             CRAFT.ENERGY_PER_CRAFT * priceEnergy) / CRAFT.SUGAR.OUTPUT;
        
        if (priceSugarInput) priceSugarInput.value = Math.round(costOneSugarCraft);
        
        let catalystsProduced = 0;
        let totalCost = 0;
        
        if (sugar > 0) {
            const catalystCrafts = Math.floor(sugar / CRAFT.CATALYST.SUGAR);
            const neededSugar = catalystCrafts * CRAFT.CATALYST.SUGAR;
            const neededDustForCatalyst = catalystCrafts * CRAFT.CATALYST.DUST;
            
            const sugarCrafts = Math.ceil(neededSugar / CRAFT.SUGAR.OUTPUT);
            const neededSlatsForSugar = sugarCrafts * CRAFT.SUGAR.SLATS;
            const neededPlasmaForSugar = sugarCrafts * CRAFT.SUGAR.PLASMA;
            const neededDustForSugar = sugarCrafts * CRAFT.SUGAR.DUST;
            
            catalystsProduced = catalystCrafts * CRAFT.CATALYST.OUTPUT;
            
            const totalEnergyUsed = (sugarCrafts + catalystCrafts) * CRAFT.ENERGY_PER_CRAFT;
            const totalEnergyCost = totalEnergyUsed * priceEnergy;
            
            const costSlats = neededSlatsForSugar * priceSlast;
            const costPlasma = neededPlasmaForSugar * pricePlasma;
            const costDust = (neededDustForSugar + neededDustForCatalyst) * priceDust;
            
            totalCost = costSlats + costPlasma + costDust + totalEnergyCost;
            
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
            
            const usedSlatsForSugar = maxSugarCrafts * CRAFT.SUGAR.SLATS;
            const usedPlasmaForSugar = maxSugarCrafts * CRAFT.SUGAR.PLASMA;
            const usedDustForSugar = maxSugarCrafts * CRAFT.SUGAR.DUST;
            const usedDustForCatalyst = maxCatalystCrafts * CRAFT.CATALYST.DUST;
            
            const costSlats = usedSlatsForSugar * priceSlast;
            const costPlasma = usedPlasmaForSugar * pricePlasma;
            const costDust = (usedDustForSugar + usedDustForCatalyst) * priceDust;
            
            totalCost = costSlats + costPlasma + costDust + totalEnergyCost;
        }
        
        let revenue = catalystsProduced * priceCatalyst;
        if (useTax) {
            revenue = revenue * 0.95;
        }
        
        const profit = revenue - totalCost;
        
        updateCatalystResults(catalystsProduced, totalCost, revenue, profit);
        saveCalculatorData();
    }
    
    function updateCatalystResults(catalysts, cost, revenue, profit) {
        if (resultOutput) resultOutput.textContent = catalysts.toLocaleString('ru-RU');
        if (resultCost) resultCost.textContent = formatMoney(cost);
        if (resultRevenue) resultRevenue.textContent = formatMoney(revenue);
        if (resultProfit) {
            resultProfit.textContent = formatMoney(profit);
            resultProfit.style.color = profit >= 0 ? '#00ff9d' : '#ff4757';
        }
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
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('stalcraft_calculator', JSON.stringify(data));
        } catch (error) {
            console.error('Ошибка сохранения калькулятора:', error);
        }
    }
    
    function loadCalculatorData() {
        try {
            const saved = localStorage.getItem('stalcraft_calculator');
            if (saved) {
                const data = JSON.parse(saved);
                
                if (data.slast !== undefined && slastInput) slastInput.value = data.slast;
                if (data.dust !== undefined && dustInput) dustInput.value = data.dust;
                if (data.plasma !== undefined && plasmaInput) plasmaInput.value = data.plasma;
                if (data.sugar !== undefined && sugarInput) sugarInput.value = data.sugar;
                if (data.priceSlast !== undefined && priceSlastInput) priceSlastInput.value = data.priceSlast;
                if (data.priceDust !== undefined && priceDustInput) priceDustInput.value = data.priceDust;
                if (data.pricePlasma !== undefined && pricePlasmaInput) pricePlasmaInput.value = data.pricePlasma;
                if (data.priceEnergy !== undefined && priceEnergyInput) priceEnergyInput.value = data.priceEnergy;
                if (data.priceCatalyst !== undefined && priceCatalystInput) priceCatalystInput.value = data.priceCatalyst;
                if (data.useTax !== undefined && useTaxCheckbox) useTaxCheckbox.checked = data.useTax;
                
                setTimeout(() => calculateCatalyst(), 100);
            }
        } catch (error) {
            console.error('Ошибка загрузки калькулятора:', error);
        }
    }
    
    // ===== ТРЕКЕР ПЕРЕПРОДАЖ =====
    
    // Элементы трекера
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
    
    // Массив для хранения сделок
    let deals = [];
    
    function loadDeals() {
        try {
            const saved = localStorage.getItem('stalcraft_resells');
            if (saved) {
                deals = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Ошибка загрузки сделок:', error);
            deals = [];
        }
        
        if (deals.length === 0) {
            addDemoData();
        }
        
        renderDeals();
        updateStats();
    }
    
    function addDemoData() {
        const demoDeals = [
            {
                id: Date.now() - 86400000,
                name: 'Артефакт "Капля"',
                buyPrice: 45000,
                sellPrice: 65000,
                useTax: true,
                date: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: Date.now() - 172800000,
                name: 'Броня "Скат-3М"',
                buyPrice: 120000,
                sellPrice: 155000,
                useTax: true,
                date: new Date(Date.now() - 172800000).toISOString()
            }
        ];
        
        deals = demoDeals;
        saveDeals();
    }
    
    function saveDeals() {
        try {
            localStorage.setItem('stalcraft_resells', JSON.stringify(deals));
        } catch (error) {
            console.error('Ошибка сохранения сделок:', error);
        }
    }
    
    function calculateResellProfit(buyPrice, sellPrice, useTax) {
        let revenue = sellPrice;
        if (useTax) {
            revenue = sellPrice * 0.95;
        }
        return revenue - buyPrice;
    }
    
    function addDeal() {
        const name = itemNameInput?.value.trim();
        const buyPrice = parseInt(buyPriceInput?.value) || 0;
        const sellPrice = parseInt(sellPriceInput?.value) || 0;
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
            useTax: useTax,
            date: new Date().toISOString()
        };
        
        deals.unshift(newDeal);
        saveDeals();
        
        if (itemNameInput) itemNameInput.value = '';
        if (buyPriceInput) buyPriceInput.value = '0';
        if (sellPriceInput) sellPriceInput.value = '0';
        
        renderDeals();
        updateStats();
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
            const profit = calculateResellProfit(deal.buyPrice, deal.sellPrice, deal.useTax);
            const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
            const profitFormatted = formatMoney(profit, true);
            
            html += `
                <tr>
                    <td>${deal.name}</td>
                    <td>${formatMoney(deal.buyPrice)}</td>
                    <td>${formatMoney(deal.sellPrice)}</td>
                    <td>${deal.useTax ? 'Да' : 'Нет'}</td>
                    <td class="${profitClass}">${profitFormatted}</td>
                    <td>
                        <button class="delete-btn" onclick="deleteDeal(${deal.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `;
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
            if (deal.useTax) {
                revenue = deal.sellPrice * 0.95;
            }
            totalRevenue += revenue;
        });
        
        const totalProfit = totalRevenue - totalSpent;
        
        totalSpentEl.textContent = formatMoney(totalSpent);
        totalRevenueEl.textContent = formatMoney(totalRevenue);
        totalProfitEl.textContent = formatMoney(totalProfit, true);
        dealsCountEl.textContent = deals.length;
        
        totalProfitEl.style.color = totalProfit >= 0 ? '#00ff9d' : '#ff4757';
    }
    
    // ===== ОБЩИЕ ФУНКЦИИ =====
    
    function formatMoney(amount, showSign = false) {
        if (isNaN(amount)) return '0 ₽';
        
        let formatted;
        if (Math.abs(amount) >= 1000) {
            formatted = Math.round(amount).toLocaleString('ru-RU');
        } else {
            formatted = amount.toFixed(0);
        }
        
        if (showSign && amount > 0) {
            return '+' + formatted + ' ₽';
        }
        
        return formatted + ' ₽';
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
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }
    
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    
    // Добавляем анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Назначаем обработчики для трекера
    if (addButton) addButton.addEventListener('click', addDeal);
    if (clearButton) clearButton.addEventListener('click', clearAllDeals);
    
    // Enter для быстрого добавления
    [itemNameInput, buyPriceInput, sellPriceInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addDeal();
                }
            });
        }
    });
    
    // Назначаем обработчики для калькулятора
    if (sugarInput) {
        sugarInput.addEventListener('input', function() {
            const sugarAmount = parseFloat(this.value) || 0;
            
            if (sugarAmount > 0) {
                const resources = calculateResourcesFromSugar(sugarAmount);
                if (slastInput) slastInput.value = resources.slast;
                if (plasmaInput) plasmaInput.value = resources.plasma;
                if (dustInput) dustInput.value = resources.dust;
            }
            
            calculateCatalyst();
            saveCalculatorData();
        });
    }
    
    if (slastInput) {
        slastInput.addEventListener('input', function() {
            const slast = parseFloat(this.value) || 0;
            if (plasmaInput) plasmaInput.value = Math.floor(slast / 10);
            if (dustInput) dustInput.value = Math.floor(slast * 30);
            
            const dust = parseFloat(dustInput?.value) || 0;
            const plasma = parseFloat(plasmaInput?.value) || 0;
            
            const sugarData = calculateSugarFromResources(slast, dust, plasma);
            if (sugarInput) sugarInput.value = sugarData.sugar;
            
            calculateCatalyst();
            saveCalculatorData();
        });
    }
    
    if (dustInput) {
        dustInput.addEventListener('input', function() {
            const dust = parseFloat(this.value) || 0;
            if (slastInput) slastInput.value = Math.floor(dust / 30);
            if (plasmaInput) plasmaInput.value = Math.floor(dust / 300);
            
            const slast = parseFloat(slastInput?.value) || 0;
            const plasma = parseFloat(plasmaInput?.value) || 0;
            
            const sugarData = calculateSugarFromResources(slast, dust, plasma);
            if (sugarInput) sugarInput.value = sugarData.sugar;
            
            calculateCatalyst();
            saveCalculatorData();
        });
    }
    
    if (plasmaInput) {
        plasmaInput.addEventListener('input', function() {
            const plasma = parseFloat(this.value) || 0;
            if (slastInput) slastInput.value = plasma * 10;
            if (dustInput) dustInput.value = plasma * 300;
            
            const slast = parseFloat(slastInput?.value) || 0;
            const dust = parseFloat(dustInput?.value) || 0;
            
            const sugarData = calculateSugarFromResources(slast, dust, plasma);
            if (sugarInput) sugarInput.value = sugarData.sugar;
            
            calculateCatalyst();
            saveCalculatorData();
        });
    }
    
    // Обработчики цен
    [priceSlastInput, priceDustInput, pricePlasmaInput, priceCatalystInput, useTaxCheckbox].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                calculateCatalyst();
                saveCalculatorData();
            });
            if (input.type === 'checkbox') {
                input.addEventListener('change', () => {
                    calculateCatalyst();
                    saveCalculatorData();
                });
            }
        }
    });
    
    // Инициализация всего
    setupCalculatorLimits();
    loadCalculatorData();
    loadDeals();
});
