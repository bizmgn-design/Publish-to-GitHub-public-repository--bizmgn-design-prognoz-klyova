// === DOM Elements ===
const form = document.getElementById('forecast-form');
const cityInput = document.getElementById('city-input');
const fishSelect = document.getElementById('fish-type');
const statusMessage = document.getElementById('status-message');
const resultsSection = document.getElementById('results-section');

// === Переменная для выбранного периода ===
let selectedDays = 1;

// === Обработчики кнопок периода ===
document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDays = parseInt(btn.dataset.days);
    });
});

// === Предпочтения рыб (15 видов) ===
const fishPreferences = {
    щука: { tempOptimal: 12, tempTolerance: 10, pressureOptimal: 755, description: "Хищник, активна в прохладной воде. Лучше клюёт при переменной облачности." },
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

// === Обработка формы ===
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const city = cityInput.value.trim();
    const fishType = fishSelect.value;
    
    if (!city) {
        showStatus('⚠️ Введите название города', 'error');
        return;
    }
    
    showStatus('⏳ Загрузка прогноза...', 'success');
    
    try {
        // Геокодинг через CORS proxy
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;
        const geoResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(geoUrl)}`);
        
        if (!geoResponse.ok) throw new Error('Не удалось получить координаты города');
        
        const geoData = await geoResponse.json();
        const geoResult = JSON.parse(geoData.contents);
        
        if (!geoResult.results || geoResult.results.length === 0) {
            showStatus('❌ Город не найден. Попробуйте: Москва, Санкт-Петербург, Казань', 'error');
            return;
        }
        
        const { latitude, longitude, name, country } = geoResult.results[0];
        
        // Погода через CORS proxy
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,pressure_msl,cloud_cover,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,pressure_msl_mean,wind_speed_10m_max&timezone=auto&forecast_days=${selectedDays}`;
        
        const weatherResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(weatherUrl)}`);
        
        if (!weatherResponse.ok) throw new Error('Не удалось получить данные погоды');
        
        const weatherData = await weatherResponse.json();
        const weather = JSON.parse(weatherData.contents);
        
        // Отображаем результат
        displayForecast({
            location: `${name}, ${country}`,
            weather: weather,
            fishType
        });
        
        showStatus('✅ Прогноз успешно загружен!', 'success');
        
    } catch (error) {
        console.error('Ошибка:', error);
        showStatus('❌ Ошибка при загрузке. Проверьте интернет и попробуйте снова.', 'error');
    }
});

// === Отображение прогноза ===
function displayForecast(data) {
    const { location, weather, fishType } = data;
    const current = weather.current;
    const daily = weather.daily;
    
    // Заголовок
    document.getElementById('location-title').textContent = `${getFishEmoji(fishType)} ${capitalize(fishType)} • ${location}`;
    document.getElementById('forecast-time').textContent = `${getLocalTime()} • прогноз на ${selectedDays} ${getDayDeclension(selectedDays)}`;
    
    // Погода
    document.getElementById('temperature').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('pressure').textContent = `${Math.round(current.pressure_msl)} мм рт.ст.`;
    document.getElementById('wind').textContent = `${Math.round(current.wind_speed_10m)} м/с`;
    document.getElementById('cloudcover').textContent = `${current.cloud_cover}%`;
    
    // Луна
    const moonPhase = getMoonPhase();
    document.getElementById('moon-phase').textContent = moonPhase.phase;
    document.getElementById('moon-illumination').textContent = moonPhase.illumination;
    
    // Индекс клёва
    const fishingIndex = calculateFishingIndex(fishType, current, fishPreferences[fishType]);
    displayFishingIndex(fishingIndex);
    
    // Рекомендации
    const recommendation = createRecommendation(fishType, current.temperature_2m, current.pressure_msl, current.cloud_cover, moonPhase.phase);
    document.getElementById('recommendation').innerHTML = recommendation;
    
    // Местное время
    document.getElementById('local-time').textContent = getLocalTime();
    
    // Прогноз на несколько дней
    if (selectedDays > 1) {
        displayMultiDayForecast(daily, fishType);
    }
    
    // Показываем секцию
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('fade-in');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// === Создание рекомендаций ===
function createRecommendation(fishType, temp, pressure, cloudcover, moonPhase) {
    const fishData = fishPreferences[fishType];
    const tempDiff = temp - fishData.tempOptimal;
    const pressureDiff = pressure - fishData.pressureOptimal;
    
    let rec = `<strong>🐟 ${fishData.description}</strong><br><br>`;
    
    if (Math.abs(tempDiff) <= 5) rec += '✅ Температура благоприятная. ';
    else if (tempDiff > 5) rec += '🌡️ Вода теплее нормы. ';
    else rec += '❄️ Вода прохладнее нормы. ';
    
    if (Math.abs(pressureDiff) <= 5) rec += '✅ Давление в норме. ';
    else if (pressureDiff > 5) rec += '📈 Давление повышенное. ';
    else rec += '📉 Давление пониженное. ';
    
    if (cloudcover > 70) rec += '☁️ Пасмурно — рыба смелее. ';
    else if (cloudcover < 30) rec += '☀️ Ясно — ищите в тени. ';
    else rec += '⛅ Переменная облачность. ';
    
    rec += `🌙 Луна: ${moonPhase}.`;
    return rec;
}

// === Расчёт индекса клёва ===
function calculateFishingIndex(fishType, current, fishData) {
    let index = 50;
    const tempDiff = Math.abs(current.temperature_2m - fishData.tempOptimal);
    const pressureDiff = Math.abs(current.pressure_msl - fishData.pressureOptimal);
    
    if (tempDiff <= fishData.tempTolerance) index += 20;
    else if (tempDiff <= fishData.tempTolerance * 2) index += 10;
    else index -= 20;
    
    if (pressureDiff <= 5) index += 20;
    else if (pressureDiff <= 10) index += 10;
    else index -= 20;
    
    if (current.cloud_cover >= 40 && current.cloud_cover <= 70) index += 10;
    else if (current.cloud_cover > 80) index += 5;
    
    if (current.wind_speed_10m <= 5) index += 10;
    else if (current.wind_speed_10m <= 10) index += 5;
    else index -= 10;
    
    return Math.max(0, Math.min(100, index));
}

// === Отображение индекса ===
function displayFishingIndex(index) {
    const indexEl = document.getElementById('fishing-index');
    const progress = document.getElementById('index-progress');
    const label = document.getElementById('index-label');
    
    indexEl.textContent = index;
    progress.style.width = `${index}%`;
    
    indexEl.classList.remove('excellent', 'good', 'medium', 'poor');
    label.classList.remove('excellent', 'good', 'medium', 'poor');
    
    if (index >= 76) {
        indexEl.classList.add('excellent');
        label.textContent = 'Отличный клёв';
        label.classList.add('excellent');
    } else if (index >= 51) {
        indexEl.classList.add('good');
        label.textContent = 'Хороший клёв';
        label.classList.add('good');
    } else if (index >= 26) {
        indexEl.classList.add('medium');
        label.textContent = 'Средний клёв';
        label.classList.add('medium');
    } else {
        indexEl.classList.add('poor');
        label.textContent = 'Плохой клёв';
        label.classList.add('poor');
    }
}

// === Прогноз на несколько дней ===
function displayMultiDayForecast(daily, fishType) {
    let section = document.querySelector('.multi-day-forecast');
    
    if (!section) {
        section = document.createElement('div');
        section.className = 'multi-day-forecast';
        resultsSection.appendChild(section);
    }
    
    section.innerHTML = `<h3>📅 Прогноз на ${selectedDays} ${getDayDeclension(selectedDays)}</h3><div class="days-grid"></div>`;
    
    const grid = section.querySelector('.days-grid');
    
    for (let i = 0; i < selectedDays && i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : date.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' });
        
        const tempMax = Math.round(daily.temperature_2m_max[i]);
        const tempMin = Math.round(daily.temperature_2m_min[i]);
        const wind = Math.round(daily.wind_speed_10m_max[i]);
        
        const dayIndex = calculateDailyIndex(fishType, tempMax, tempMin, wind);
        
        const card = document.createElement('div');
        card.className = 'day-card';
        card.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-index ${getIndexClass(dayIndex)}">${dayIndex}</div>
            <div class="day-temp">${tempMax}° / ${tempMin}°</div>
            <div class="day-wind">💨 ${wind} м/с</div>
        `;
        
        grid.appendChild(card);
    }
}

function calculateDailyIndex(fishType, tempMax, tempMin, wind) {
    const fishData = fishPreferences[fishType];
    let index = 50;
    const tempAvg = (tempMax + tempMin) / 2;
    const tempDiff = Math.abs(tempAvg - fishData.tempOptimal);
    
    if (tempDiff <= fishData.tempTolerance) index += 30;
    else if (tempDiff <= fishData.tempTolerance * 2) index += 15;
    else index -= 20;
    
    if (wind <= 5) index += 15;
    else if (wind <= 10) index += 5;
    else index -= 10;
    
    return Math.max(0, Math.min(100, index));
}

// === Вспомогательные функции ===
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
    setTimeout(() => statusMessage.classList.remove('show'), 5000);
}

function getFishEmoji(fish) {
    const emojis = {
        щука: '🦈', окунь: '🐠', карп: '🐟', плотва: '🐠',
        судак: '🦈', карась: '🐠', лещ: '🐟', сом: '🐟',
        форель: '🐠', налим: '🦈', жерех: '🐟', голавль: '🐠',
        язь: '🐟', линь: '🐠', сазан: '🐟'
    };
    return emojis[fish] || '🐟';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getLocalTime() {
    const now = new Date();
    const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const months = ['янв.', 'февр.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getMoonPhase() {
    const now = new Date();
    const year = now.getFullYear();
    let month = now.getMonth() + 1;
    const day = now.getDate();
    
    if (month < 3) { year--; month += 12; }
    month++;
    
    const c = 365.25 * year;
    const e = 30.6 * month;
    const jd = c + e + day - 694039.09;
    const cycle = jd / 29.5305882;
    const b = Math.round((cycle - Math.floor(cycle)) * 8) % 8;
    
    const phases = [
        { phase: 'Новолуние', illumination: 0 },
        { phase: 'Растущий серп', illumination: 25 },
        { phase: 'Первая четверть', illumination: 50 },
        { phase: 'Растущая луна', illumination: 75 },
        { phase: 'Полнолуние', illumination: 100 },
        { phase: 'Убывающая луна', illumination: 75 },
        { phase: 'Последняя четверть', illumination: 50 },
        { phase: 'Убывающий серп', illumination: 25 }
    ];
    
    return phases[b];
}

function getIndexClass(index) {
    if (index >= 76) return 'excellent';
    if (index >= 51) return 'good';
    if (index >= 26) return 'medium';
    return 'poor';
}

function getDayDeclension(days) {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
}

console.log('🎣 Прогноз клёва рыбы загружен!');