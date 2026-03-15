// script.js - Трекер перепродаж

document.addEventListener('DOMContentLoaded', function() {
    console.log('Resell Tracker loaded');
    
    // Элементы формы
    const itemNameInput = document.getElementById('item-name');
    const buyPriceInput = document.getElementById('buy-price');
    const sellPriceInput = document.getElementById('sell-price');
    const useTaxCheckbox = document.getElementById('use-tax');
    const addButton = document.getElementById('add-deal');
    const clearButton = document.getElementById('clear-history');
    
    // Элементы статистики
    const totalSpentEl = document.getElementById('total-spent');
    const totalRevenueEl = document.getElementById('total-revenue');
    const totalProfitEl = document.getElementById('total-profit');
    const dealsCountEl = document.getElementById('deals-count');
    
    // Таблица и пустое состояние
    const dealsList = document.getElementById('deals-list');
    const emptyState = document.getElementById('empty-state');
    
    // Массив для хранения сделок
    let deals = [];
    
    // ===== ЗАГРУЗКА СОХРАНЕННЫХ ДАННЫХ =====
    function loadDeals() {
        try {
            const saved = localStorage.getItem('stalcraft_resells');
            if (saved) {
                deals = JSON.parse(saved);
                console.log('Загружено сделок:', deals.length);
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            deals = [];
        }
        
        // Если нет сделок, добавляем демо-данные
        if (deals.length === 0) {
            addDemoData();
        }
        
        renderDeals();
        updateStats();
    }
    
    // ===== ДЕМО-ДАННЫЕ ДЛЯ ПРИМЕРА =====
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
            },
            {
                id: Date.now() - 259200000,
                name: 'Оружие "Вампир"',
                buyPrice: 85000,
                sellPrice: 98000,
                useTax: false,
                date: new Date(Date.now() - 259200000).toISOString()
            }
        ];
        
        deals = demoDeals;
        saveDeals();
    }
    
    // ===== СОХРАНЕНИЕ В LOCALSTORAGE =====
    function saveDeals() {
        try {
            localStorage.setItem('stalcraft_resells', JSON.stringify(deals));
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }
    
    // ===== РАСЧЕТ ПРИБЫЛИ =====
    function calculateProfit(buyPrice, sellPrice, useTax) {
        let revenue = sellPrice;
        if (useTax) {
            revenue = sellPrice * 0.95; // налог 5%
        }
        return revenue - buyPrice;
    }
    
    // ===== ДОБАВЛЕНИЕ НОВОЙ СДЕЛКИ =====
    function addDeal() {
        const name = itemNameInput.value.trim();
        const buyPrice = parseInt(buyPriceInput.value) || 0;
        const sellPrice = parseInt(sellPriceInput.value) || 0;
        const useTax = useTaxCheckbox.checked;
        
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
        
        deals.unshift(newDeal); // Добавляем в начало
        saveDeals();
        
        // Очищаем форму
        itemNameInput.value = '';
        buyPriceInput.value = '0';
        sellPriceInput.value = '0';
        
        // Обновляем интерфейс
        renderDeals();
        updateStats();
        
        // Показываем сообщение
        showNotification('Сделка добавлена!');
    }
    
    // ===== УДАЛЕНИЕ СДЕЛКИ =====
    function deleteDeal(id) {
        deals = deals.filter(deal => deal.id !== id);
        saveDeals();
        
        renderDeals();
        updateStats();
        
        showNotification('Сделка удалена');
    }
    
    // ===== ОЧИСТКА ВСЕЙ ИСТОРИИ =====
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
    
    // ===== ОТОБРАЖЕНИЕ СДЕЛОК =====
    function renderDeals() {
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
            const profitFormatted = formatMoney(profit, true);
            
            // Форматируем дату
            const date = new Date(deal.date);
            const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            
            html += `
                <tr>
                    <td>${deal.name}</td>
                    <td>${formatMoney(deal.buyPrice)}</td>
                    <td>${formatMoney(deal.sellPrice)}</td>
                    <td>${deal.useTax ? 'Да' : 'Нет'}</td>
                    <td class="${profitClass}">${profitFormatted}</td>
                    <td>
                        <button class="delete-btn" onclick="window.deleteDeal(${deal.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        dealsList.innerHTML = html;
    }
    
    // ===== ОБНОВЛЕНИЕ СТАТИСТИКИ =====
    function updateStats() {
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
        
        // Меняем цвет прибыли
        totalProfitEl.style.color = totalProfit >= 0 ? '#00ff9d' : '#ff4757';
    }
    
    // ===== ФОРМАТИРОВАНИЕ ДЕНЕГ =====
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
    
    // ===== УВЕДОМЛЕНИЯ =====
    function showNotification(text) {
        // Можно просто в консоль, но добавим визуальное уведомление
        console.log('🔔', text);
        
        // Создаем временное уведомление
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
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
    
    // ===== ОГРАНИЧЕНИЕ ВВОДА =====
    function setupInputLimits() {
        const inputs = [buyPriceInput, sellPriceInput];
        
        inputs.forEach(input => {
            if (!input) return;
            
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^\d]/g, '');
                
                if (this.value.length > 8) {
                    this.value = this.value.substring(0, 8);
                }
                
                if (this.value === '') this.value = '0';
            });
        });
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
    
    // Делаем функцию удаления глобальной
    window.deleteDeal = deleteDeal;
    
    // Назначаем обработчики
    addButton.addEventListener('click', addDeal);
    clearButton.addEventListener('click', clearAllDeals);
    
    // Enter для быстрого добавления
    [itemNameInput, buyPriceInput, sellPriceInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addDeal();
            }
        });
    });
    
    // Инициализация
    setupInputLimits();
    loadDeals();
});
