// === DOM Elements ===
const form = document.getElementById('forecast-form');
const cityInput = document.getElementById('city-input');
const fishSelect = document.getElementById('fish-type');
const statusMessage = document.getElementById('status-message');
const resultsSection = document.getElementById('results-section');

let selectedDays = 1;

// === Твой Vercel proxy URL ===
const VERCEL_PROXY = 'https://prognoz-klyova.vercel.app/api/weather';

// === Кнопки периода ===
document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDays = parseInt(btn.dataset.days);
    });
});

// === Рыбы ===
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

// === Fetch через твой Vercel proxy ===
async function fetchWithProxy(url) {
    const proxyUrl = `${VERCEL_PROXY}?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
    }
    
    return await response.json();
}

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
        // Шаг 1: Геокодинг
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;
        const geoData = await fetchWithProxy(geoUrl);
        
        if (!geoData.results || geoData.results.length === 0) {
            showStatus('❌ Город не найден', 'error');
            return;
        }
        
        const { latitude, longitude, name, country } = geoData.results[0];
        
        // Шаг 2: Погода
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m,pressure_msl,cloud_cover,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,pressure_msl_mean,wind_speed_10m_max&timezone=auto&forecast_days=${selectedDays}`;
        
        const weatherData = await fetchWithProxy(weatherUrl);
        
        // Шаг 3: Отображаем
        displayForecast({
            location: `${name}, ${country}`,
            weather: weatherData,
            fishType
        });
        
        showStatus('✅ Прогноз загружен!', 'success');
        
    } catch (error) {
        console.error('Ошибка:', error);
        showStatus('❌ Ошибка при загрузке. Попробуйте позже.', 'error');
    }
});

// === Иконки погоды ===
function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return code === 1 ? '🌤️' : code === 2 ? '⛅' : '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '🌨️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '🌤️';
}

// === Отображение прогноза ===
function displayForecast(data) {
    const { location, weather, fishType } = data;
    const current = weather.current;
    const daily = weather.daily;
    
    const pressureMmHg = Math.round(current.pressure_msl * 0.750062);
    const tempCelsius = Math.round(current.temperature_2m);
    const windSpeed = Math.round(current.wind_speed_10m);
    const cloudCover = current.cloud_cover;
    const weatherIcon = getWeatherIcon(current.weather_code || 0);
    
    document.getElementById('location-title').textContent = `${getFishEmoji(fishType)} ${capitalize(fishType)} • ${location}`;
    document.getElementById('forecast-time').textContent = `${getLocalTime()} • прогноз на ${selectedDays} ${getDayDeclension(selectedDays)}`;
    
    document.getElementById('temperature').textContent = `${weatherIcon} ${tempCelsius}°C`;
    document.getElementById('pressure').textContent = `📉 ${pressureMmHg} мм рт.ст.`;
    document.getElementById('wind').textContent = `💨 ${windSpeed} м/с`;
    document.getElementById('cloudcover').textContent = `☁️ ${cloudCover}%`;
    
    const moon = getMoonPhase();
    document.getElementById('moon-phase').textContent = moon.phase;
    document.getElementById('moon-illumination').textContent = moon.illumination;
    
    const index = calculateIndex(fishType, {
        temperature_2m: tempCelsius,
        pressure_msl: pressureMmHg,
        cloud_cover: cloudCover,
        wind_speed_10m: windSpeed
    }, fishPreferences[fishType]);
    
    displayIndex(index);
    
    const rec = createRecommendation(fishType, tempCelsius, pressureMmHg, cloudCover, moon.phase);
    document.getElementById('recommendation').innerHTML = rec;
    
    document.getElementById('local-time').textContent = getLocalTime();
    
    if (selectedDays > 1) {
        displayMultiDay(daily, fishType, selectedDays);
    }
    
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('fade-in');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// === Рекомендации ===
function createRecommendation(fish, temp, pressure, cloud, moon) {
    const f = fishPreferences[fish];
    let r = `<strong>🐟 ${f.description}</strong><br><br>`;
    
    const tDiff = temp - f.tempOptimal;
    const pDiff = pressure - f.pressureOptimal;
    
    r += Math.abs(tDiff) <= 5 ? '✅ Температура благоприятная. ' : tDiff > 0 ? '🌡️ Вода теплее нормы. ' : '❄️ Вода прохладнее нормы. ';
    r += Math.abs(pDiff) <= 5 ? '✅ Давление в норме. ' : pDiff > 0 ? '📈 Давление повышенное. ' : '📉 Давление пониженное. ';
    r += cloud > 70 ? '☁️ Пасмурно — рыба смелее. ' : cloud < 30 ? '☀️ Ясно — ищите в тени. ' : '⛅ Переменная облачность. ';
    r += `🌙 Луна: ${moon}.`;
    
    return r;
}

// === Расчёт индекса ===
function calculateIndex(fish, current, f) {
    let i = 50;
    const tDiff = Math.abs(current.temperature_2m - f.tempOptimal);
    const pDiff = Math.abs(current.pressure_msl - f.pressureOptimal);
    
    if (tDiff <= f.tempTolerance) i += 20;
    else if (tDiff <= f.tempTolerance * 2) i += 10;
    else i -= 20;
    
    if (pDiff <= 5) i += 20;
    else if (pDiff <= 10) i += 10;
    else i -= 20;
    
    if (current.cloud_cover >= 40 && current.cloud_cover <= 70) i += 10;
    else if (current.cloud_cover > 80) i += 5;
    
    if (current.wind_speed_10m <= 5) i += 10;
    else if (current.wind_speed_10m <= 10) i += 5;
    else i -= 10;
    
    return Math.max(0, Math.min(100, i));
}

// === Отображение индекса ===
function displayIndex(index) {
    const el = document.getElementById('fishing-index');
    const bar = document.getElementById('index-progress');
    const label = document.getElementById('index-label');
    
    el.textContent = index;
    bar.style.width = `${index}%`;
    
    el.className = 'index-value';
    label.className = 'index-label';
    
    if (index >= 76) {
        el.classList.add('excellent');
        label.textContent = 'Отличный клёв';
        label.classList.add('excellent');
    } else if (index >= 51) {
        el.classList.add('good');
        label.textContent = 'Хороший клёв';
        label.classList.add('good');
    } else if (index >= 26) {
        el.classList.add('medium');
        label.textContent = 'Средний клёв';
        label.classList.add('medium');
    } else {
        el.classList.add('poor');
        label.textContent = 'Плохой клёв';
        label.classList.add('poor');
    }
}

// === Прогноз на несколько дней ===
function displayMultiDay(daily, fishType, maxDays) {
    let section = document.querySelector('.multi-day-forecast');
    
    if (!section) {
        section = document.createElement('div');
        section.className = 'multi-day-forecast';
        resultsSection.appendChild(section);
    }
    
    section.innerHTML = `<h3>📅 Прогноз на ${maxDays} ${getDayDeclension(maxDays)}</h3><div class="days-grid"></div>`;
    const grid = section.querySelector('.days-grid');
    
    for (let i = 0; i < maxDays && i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : date.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' });
        
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const pressureMmHg = Math.round(daily.pressure_msl_mean[i] * 0.750062);
        const wind = Math.round(daily.wind_speed_10m_max[i]);
        const weatherCode = daily.weather_code[i];
        const weatherIcon = getWeatherIcon(weatherCode);
        
        const index = calculateDailyIndex(fishType, maxTemp, minTemp, pressureMmHg, wind);
        
        const card = document.createElement('div');
        card.className = 'day-card';
        card.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-icon" style="font-size: 2rem; margin: 10px 0;">${weatherIcon}</div>
            <div class="day-index ${getIndexClass(index)}" style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">${index}</div>
            <div class="day-temp" style="margin: 5px 0;">${maxTemp}° / ${minTemp}°</div>
            <div class="day-wind" style="margin: 5px 0;">💨 ${wind} м/с</div>
            <div class="day-pressure" style="margin: 5px 0; color: #888; font-size: 0.9rem;">📉 ${pressureMmHg} мм</div>
        `;
        
        grid.appendChild(card);
    }
}

function calculateDailyIndex(fish, maxTemp, minTemp, pressure, wind) {
    const f = fishPreferences[fish];
    let i = 50;
    const avgTemp = (maxTemp + minTemp) / 2;
    const tempDiff = Math.abs(avgTemp - f.tempOptimal);
    const pressureDiff = Math.abs(pressure - f.pressureOptimal);
    
    if (tempDiff <= f.tempTolerance) i += 30;
    else if (tempDiff <= f.tempTolerance * 2) i += 15;
    else i -= 20;
    
    if (pressureDiff <= 5) i += 25;
    else if (pressureDiff <= 10) i += 10;
    else i -= 20;
    
    if (wind <= 5) i += 10;
    else if (wind <= 10) i += 5;
    else i -= 10;
    
    return Math.max(0, Math.min(100, i));
}

function getIndexClass(i) {
    if (i >= 76) return 'excellent';
    if (i >= 51) return 'good';
    if (i >= 26) return 'medium';
    return 'poor';
}

// === Вспомогательные функции ===
function showStatus(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = `status-message show ${type}`;
    setTimeout(() => statusMessage.classList.remove('show'), 5000);
}

function getFishEmoji(f) {
    const e = { щука:'🦈', окунь:'🐠', карп:'🐟', плотва:'🐠', судак:'🦈', карась:'🐠', лещ:'🐟', сом:'🐟', форель:'🐠', налим:'🦈', жерех:'🐟', голавль:'🐠', язь:'🐟', линь:'🐠', сазан:'🐟' };
    return e[f] || '🐟';
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function getLocalTime() {
    const n = new Date();
    const d = ['вс','пн','вт','ср','чт','пт','сб'];
    const m = ['янв.','февр.','март','апр.','май','июнь','июль','авг.','сент.','окт.','нояб.','дек.'];
    return `${d[n.getDay()]}, ${n.getDate()} ${m[n.getMonth()]}, ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

function getMoonPhase() {
    const n = new Date();
    let y = n.getFullYear(), mo = n.getMonth() + 1, d = n.getDate();
    if (mo < 3) { y--; mo += 12; }
    mo++;
    const jd = (365.25 * y) + (30.6 * mo) + d - 694039.09;
    const b = Math.round(((jd / 29.5305882) % 1) * 8) % 8;
    const phases = [
        {phase:'Новолуние', illumination:0}, {phase:'Растущий серп', illumination:25},
        {phase:'Первая четверть', illumination:50}, {phase:'Растущая', illumination:75},
        {phase:'Полнолуние', illumination:100}, {phase:'Убывающая', illumination:75},
        {phase:'Последняя четверть', illumination:50}, {phase:'Убывающий серп', illumination:25}
    ];
    return phases[b];
}

function getDayDeclension(d) {
    if (d === 1) return 'день';
    if (d >= 2 && d <= 4) return 'дня';
    return 'дней';
}

console.log('🎣 Прогноз клёва рыбы загружен! API: Open-Meteo + Vercel Proxy');