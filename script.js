// DOM Elements
const form = document.getElementById('forecast-form');
const cityInput = document.getElementById('city-input');
const fishSelect = document.getElementById('fish-type');
const statusMessage = document.getElementById('status-message');
const resultsSection = document.getElementById('results-section');

// Переменная для выбранного периода
let selectedDays = 1;

// Обработчики кнопок периода
document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDays = parseInt(btn.dataset.days);
        console.log('Выбран период:', selectedDays, 'дней');
    });
});

// Fish preferences
const fishPreferences = {
    щука: { tempOptimal: 12, tempTolerance: 10, pressureOptimal: 755, description: "Хищник, активна в прохладной воде. Лучше клюёт при переменой облачности." },
    окунь: { tempOptimal: 15, tempTolerance: 8, pressureOptimal: 755, description: "Активен круглый год. Предпочитает тихую воду без сильного течения." },
    карп: { tempOptimal: 18, tempTolerance: 10, pressureOptimal: 755, description: "Активен в тёплой воде. Любит стабильное давление и тихую погоду." },
    плотва: { tempOptimal: 16, tempTolerance: 8, pressureOptimal: 750, description: "Неприхотлива. Клюёт почти всегда, кроме резких перепадов давления." },
    судак: { tempOptimal: 14, tempTolerance: 8, pressureOptimal: 755, description: "Сумеречный хищник. Активен на рассвете и закате." },
    карась: { tempOptimal: 18, tempTolerance: 10, pressureOptimal: 755, description: "Активен в тёплой воде. Чувствителен к перепадам давления." },
    лещ: { tempOptimal: 15, tempTolerance: 8, pressureOptimal: 750, description: "Чувствителен к давлению. Предпочитает тихую безветренную погоду." },
    сом: { tempOptimal: 20, tempTolerance: 12, pressureOptimal: 755, description: "Крупный хищник. Активен в тёплой воде, особенно ночью. Любит грозу." },
    форель: { tempOptimal: 10, tempTolerance: 6, pressureOptimal: 760, description: "Холодолюбивая рыба. Предпочитает чистую воду с высоким содержанием кислорода." },
    налим: { tempOptimal: 4, tempTolerance: 8, pressureOptimal: 765, description: "Зимняя рыба. Активен в холодной воде, летом почти не клюёт." },
    жерех: { tempOptimal: 16, tempTolerance: 8, pressureOptimal: 755, description: "Хищник, охотится на поверхности. Любит ветреную погоду." },
    голавль: { tempOptimal: 14, tempTolerance: 10, pressureOptimal: 755, description: "Всеядный. Активен утром и вечером, предпочитает перекаты." },
    язь: { tempOptimal: 12, tempTolerance: 10, pressureOptimal: 755, description: "Неприхотлив. Клюёт круглый год, особенно весной." },
    линь: { tempOptimal: 20, tempTolerance: 8, pressureOptimal: 750, description: "Донная рыба. Любит тёплую воду и илистое дно." },
    сазан: { tempOptimal: 22, tempTolerance: 10, pressureOptimal: 755, description: "Крупный и сильный. Активен в тёплой воде, предпочитает тихие заводи." }
};

// Form submit handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const city = cityInput.value.trim();
    const fishType = fishSelect.value;
    
    if (!city) {
        showStatus('Введите название города', 'error');
        return;
    }
    
    showStatus('🔍 Получаю прогноз...', 'success');
    
    try {
        console.log('🔍 Ищем город:', city);
        
        const coords = await getCoordinates(city);
        
        if (!coords) {
            console.warn('Город не найден, используем тестовые данные');
            await useDemoData(city, fishType);
            return;
        }
        
        console.log('📍 Координаты:', coords);
        
        const weather = await getWeatherData(coords.lat, coords.lon);
        
        if (!weather) {
            console.warn('Погода не получена, используем тестовые данные');
            await useDemoData(city, fishType);
            return;
        }
        
        console.log('🌤️ Погода:', weather);
        
        const moonPhase = calculateMoonPhase();
        const index = calculateFishingIndex(weather.current, moonPhase, fishType);
        
        displayResults(coords, weather, moonPhase, index, fishType);
        showStatus('✅ Прогноз успешно получен!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        console.log('🔄 Переключаемся на демо-режим');
        await useDemoData(cityInput.value.trim(), fishSelect.value);
    }
});

// Get coordinates
async function getCoordinates(city) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`,
            { method: 'GET', headers: { 'Accept': 'application/json' } }
        );
        
        if (!response.ok) throw new Error('Geo API error');
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return {
                name: data.results[0].name,
                country: data.results[0].country,
                lat: data.results[0].latitude,
                lon: data.results[0].longitude
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

// Get weather data
async function getWeatherData(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,pressure_msl,wind_speed_10m,cloud_cover&daily=temperature_2m_max,temperature_2m_min,pressure_msl_mean,wind_speed_10m_max,weathercode&timezone=auto&forecast_days=${selectedDays}`,
            { method: 'GET', headers: { 'Accept': 'application/json' } }
        );
        
        if (!response.ok) throw new Error('Weather API error');
        
        const data = await response.json();
        return {
            current: data.current,
            daily: data.daily
        };
    } catch (error) {
        console.error('Weather API error:', error);
        return null;
    }
}

// Demo data fallback
async function useDemoData(city, fishType) {
    console.log('📊 Используем демо-данные для:', city);
    showStatus('📱 ДЕМО РЕЖИМ (API недоступен)', 'success');
    
    const coords = { name: city, country: 'Россия (демо)', lat: 55.75, lon: 37.62 };
    
    const weather = {
        current: {
            temperature_2m: Math.floor(Math.random() * 25) + 5,
            pressure_msl: Math.floor(Math.random() * 30) + 990,
            wind_speed_10m: Math.floor(Math.random() * 10) + 2,
            cloud_cover: Math.floor(Math.random() * 80) + 10
        },
        daily: null
    };
    
    if (selectedDays > 1) {
        const daily = { time: [], temperature_2m_max: [], temperature_2m_min: [], pressure_msl_mean: [], wind_speed_10m_max: [] };
        for (let i = 0; i < selectedDays; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            daily.time.push(date.toISOString().split('T')[0]);
            daily.temperature_2m_max.push(Math.floor(Math.random() * 10) + 15);
            daily.temperature_2m_min.push(Math.floor(Math.random() * 10) + 5);
            daily.pressure_msl_mean.push(Math.floor(Math.random() * 30) + 990);
            daily.wind_speed_10m_max.push(Math.floor(Math.random() * 10) + 2);
        }
        weather.daily = daily;
    }
    
    const moonPhase = calculateMoonPhase();
    const index = calculateFishingIndex(weather.current, moonPhase, fishType);
    displayResults(coords, weather, moonPhase, index, fishType);
}

// Calculate moon phase
function calculateMoonPhase() {
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    const day = date.getDate();
    let c = 0, e = 0, jd = 0, b = 0;
    
    if (month < 3) { year--; month += 12; }
    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);
    
    const phase = jd;
    const illumination = Math.round((1 - Math.cos(2 * Math.PI * jd)) / 2 * 100);
    
    let phaseName = '';
    if (b >= 0 && b < 1) phaseName = 'Новолуние';
    else if (b < 3) phaseName = 'Растущий серп';
    else if (b >= 3 && b < 4) phaseName = 'Первая четверть';
    else if (b < 6) phaseName = 'Растущая луна';
    else if (b >= 6 && b < 7) phaseName = 'Полнолуние';
    else phaseName = 'Убывающая луна';
    
    return { phase, illumination, name: phaseName };
}

// Calculate fishing index
function calculateFishingIndex(weather, moonPhase, fishType) {
    let index = 50;
    const fish = fishPreferences[fishType] || fishPreferences['щука'];
    
    const tempDiff = Math.abs(weather.temperature_2m - fish.tempOptimal);
    if (tempDiff <= fish.tempTolerance) index += 20 - (tempDiff / fish.tempTolerance) * 20;
    else index -= 10;
    
    const pressureMmHg = weather.pressure_msl * 0.750062;
    const pressureDiff = Math.abs(pressureMmHg - fish.pressureOptimal);
    if (pressureDiff <= 10) index += 25 - (pressureDiff / 10) * 15;
    else index -= 10;
    
    index += Math.abs(0.5 - moonPhase.phase) * 20;
    
    if (weather.wind_speed_10m <= 5) index += 15;
    else if (weather.wind_speed_10m <= 10) index += 8;
    else if (weather.wind_speed_10m > 15) index -= 10;
    
    if (weather.cloud_cover >= 50 && weather.cloud_cover <= 90) index += 10;
    else if (weather.cloud_cover < 30) index += 5;
    
    const hour = new Date().getHours();
    if ((hour >= 5 && hour <= 9) || (hour >= 17 && hour <= 21)) index += 10;
    
    return Math.max(0, Math.min(100, Math.round(index)));
}

// Display results
function displayResults(location, weather, moonPhase, index, fishType) {
    document.getElementById('location-title').textContent = 
        `${getFishEmoji(fishType)} ${capitalize(fishType)} • ${location.name}, ${location.country}`;
    
    const now = new Date();
    document.getElementById('forecast-time').textContent = 
        `${formatDate(now)}, ${formatTime(now)} • прогноз на ${selectedDays} ${getDayWord(selectedDays)}`;
    
    document.getElementById('temperature').textContent = `${Math.round(weather.current.temperature_2m)}°C`;
    document.getElementById('pressure').textContent = `${Math.round(weather.current.pressure_msl * 0.750062)} мм рт.ст.`;
    document.getElementById('wind').textContent = `${weather.current.wind_speed_10m} м/с`;
    document.getElementById('cloudcover').textContent = `${weather.current.cloud_cover}%`;
    document.getElementById('local-time').textContent = formatTime(now);
    
    document.getElementById('moon-phase').textContent = moonPhase.name;
    document.getElementById('moon-illumination').textContent = `${moonPhase.illumination}%`;
    
    animateIndex(index);
    document.getElementById('recommendation').innerHTML = buildRecommendation(index, weather.current, moonPhase, fishType);
    
    // Если прогноз на несколько дней - покажем их
    if (weather.daily && selectedDays > 1) {
        showMultiDayForecast(weather.daily, fishType, moonPhase);
    }
    
    // Показать результаты
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('fade-in');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Animate index
function animateIndex(targetIndex) {
    const indexElement = document.getElementById('fishing-index');
    const progressElement = document.getElementById('index-progress');
    const labelElement = document.getElementById('index-label');
    
    indexElement.className = 'index-value';
    labelElement.className = 'index-label';
    
    if (targetIndex >= 70) { indexElement.classList.add('excellent'); labelElement.classList.add('excellent'); labelElement.textContent = 'Отличный клёв'; }
    else if (targetIndex >= 50) { indexElement.classList.add('good'); labelElement.classList.add('good'); labelElement.textContent = 'Хороший клёв'; }
    else if (targetIndex >= 30) { indexElement.classList.add('medium'); labelElement.classList.add('medium'); labelElement.textContent = 'Средний клёв'; }
    else { indexElement.classList.add('poor'); labelElement.classList.add('poor'); labelElement.textContent = 'Слабый клёв'; }
    
    let current = 0;
    const increment = targetIndex / 30;
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetIndex) { current = targetIndex; clearInterval(timer); }
        indexElement.textContent = Math.round(current);
    }, 30);
    setTimeout(() => { progressElement.style.width = `${targetIndex}%`; }, 100);
}

// Build recommendation
function buildRecommendation(index, weather, moonPhase, fishType) {
    const fish = fishPreferences[fishType];
    let phrases = [];
    
    if (index >= 70) phrases.push(`Отличные условия для ловли ${fishType}!`);
    else if (index >= 50) phrases.push(`Хорошие условия, можно планировать рыбалку.`);
    else phrases.push(`Клёв слабый, но шанс есть.`);
    
    const tempDiff = weather.temperature_2m - fish.tempOptimal;
    if (Math.abs(tempDiff) <= 5) phrases.push('Температура оптимальная.');
    else if (tempDiff > 5) phrases.push('Вода теплее нормы.');
    else phrases.push('Вода прохладнее нормы.');
    
    const pressureMmHg = Math.round(weather.pressure_msl * 0.750062);
    if (pressureMmHg >= 750 && pressureMmHg <= 765) phrases.push('Давление в норме.');
    else if (pressureMmHg < 750) phrases.push('Давление падает — рыба активнее.');
    else phrases.push('Давление повышенное.');
    
    if (weather.wind_speed_10m > 10) phrases.push('Сильный ветер — ищите закрытые места.');
    if (weather.cloud_cover > 80) phrases.push('Пасмурно — рыба смелее.');
    phrases.push(`Луна: ${moonPhase.name}.`);
    
    return phrases.join(' ');
}

// Helpers
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
    setTimeout(() => statusMessage.classList.remove('show'), 3000);
}

function getFishEmoji(fish) {
    const emojis = { щука: '🦈', окунь: '🐠', карп: '🐟', плотва: '🐠', судак: '🦈', карась: '🐠', лещ: '🐟' };
    return emojis[fish] || '🐟';
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
function formatDate(date) { return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }); }
function formatTime(date) { return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); }

// Show multi-day forecast
function showMultiDayForecast(daily, fishType, moonPhase) {
    const forecastDaysHTML = `
        <div class="multi-day-forecast" style="margin-top: 30px;">
            <h3 style="color: #4CAF50; margin-bottom: 20px;">📅 Прогноз на ${daily.time.length} дней</h3>
            <div class="days-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${daily.time.map((date, i) => {
                    const dayWeather = {
                        temperature_2m: (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2,
                        pressure_msl: daily.pressure_msl_mean[i],
                        wind_speed_10m: daily.wind_speed_10m_max[i],
                        cloud_cover: 50
                    };
                    const dayIndex = calculateFishingIndex(dayWeather, moonPhase, fishType);
                    const dayDate = new Date(date);
                    return `
                        <div class="day-card" style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; text-align: center; border: 2px solid ${getIndexColor(dayIndex)};">
                            <div style="font-weight: bold; margin-bottom: 10px; color: #fff;">${formatDayName(dayDate)}</div>
                            <div style="font-size: 24px; font-weight: bold; color: ${getIndexColor(dayIndex)}; margin: 10px 0;">${dayIndex}</div>
                            <div style="color: #888; font-size: 0.9rem;">🌡️ ${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</div>
                            <div style="color: #888; font-size: 0.85rem; margin-top: 5px;">💨 ${daily.wind_speed_10m_max[i]} м/с</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    const existingForecast = document.querySelector('.multi-day-forecast');
    if (existingForecast) existingForecast.remove();
    resultsSection.insertAdjacentHTML('beforeend', forecastDaysHTML);
}

function getDayWord(days) {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
}

function formatDayName(date) {
    const today = new Date();
    const d = new Date(date);
    if (d.toDateString() === today.toDateString()) return 'Сегодня';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return 'Завтра';
    return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getIndexColor(index) {
    if (index >= 70) return '#00ff88';
    if (index >= 50) return '#4CAF50';
    if (index >= 30) return '#ff9800';
    return '#f44336';
}