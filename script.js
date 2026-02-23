// === DOM Elements ===
const form = document.getElementById('forecast-form');
const cityInput = document.getElementById('city-input');
const fishSelect = document.getElementById('fish-type');
const statusMessage = document.getElementById('status-message');
const resultsSection = document.getElementById('results-section');

let selectedDays = 1;

// === API ключ OpenWeather ===
const API_KEY = '088682cd6fe0244781f86dff5f5eacb3';

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
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ru&cnt=${selectedDays * 8}`;
        
        const response = await fetch(weatherUrl);
        
        if (!response.ok) {
            throw new Error(`Ошибка API: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.list || data.list.length === 0) {
            showStatus('❌ Город не найден', 'error');
            return;
        }
        
        displayForecast({
            location: `${data.city.name}, ${data.city.country}`,
            weather: data,
            fishType
        });
        
        showStatus('✅ Прогноз загружен!', 'success');
        
    } catch (error) {
        console.error('Ошибка:', error);
        showStatus('❌ Ошибка при загрузке. Проверьте название города.', 'error');
    }
});

// === Получение иконки погоды ===
function getWeatherIcon(iconCode, description) {
    // OpenWeather иконки: https://openweathermap.org/weather-conditions
    const iconMap = {
        '01d': '☀️', '01n': '🌙',  // Ясно
        '02d': '⛅', '02n': '☁️',  // Переменная облачность
        '03d': '☁️', '03n': '☁️',  // Облачно
        '04d': '☁️', '04n': '☁️',  // Пасмурно
        '09d': '🌧️', '09n': '🌧️',  // Дождь
        '10d': '🌦️', '10n': '🌧️',  // Дождь с грозой
        '11d': '⛈️', '11n': '⛈️',  // Гроза
        '13d': '🌨️', '13n': '🌨️',  // Снег
        '50d': '🌫️', '50n': '🌫️'   // Туман
    };
    
    return iconMap[iconCode] || '🌤️';
}

// === Отображение прогноза ===
function displayForecast(data) {
    const { location, weather, fishType } = data;
    const current = weather.list[0];
    
    const pressureMmHg = Math.round(current.press * 0.750062);
    const tempCelsius = Math.round(current.main.temp);
    const windSpeed = Math.round(current.wind.speed);
    const cloudCover = current.clouds.all;
    
    // Получаем иконку погоды
    const weatherIcon = getWeatherIcon(current.weather[0].icon, current.weather[0].description);
    
    // Заголовок
    document.getElementById('location-title').textContent = `${getFishEmoji(fishType)} ${capitalize(fishType)} • ${location}`;
    document.getElementById('forecast-time').textContent = `${getLocalTime()} • прогноз на ${selectedDays} ${getDayDeclension(selectedDays)}`;
    
    // Погода с иконками
    const tempEl = document.getElementById('temperature');
    tempEl.textContent = `${weatherIcon} ${tempCelsius}°C`;
    
    document.getElementById('pressure').textContent = `📉 ${pressureMmHg} мм рт.ст.`;
    document.getElementById('wind').textContent = `💨 ${windSpeed} м/с`;
    document.getElementById('cloudcover').textContent = `☁️ ${cloudCover}%`;
    
    // Луна
    const moon = getMoonPhase();
    document.getElementById('moon-phase').textContent = moon.phase;
    document.getElementById('moon-illumination').textContent = moon.illumination;
    
    // Индекс клёва
    const index = calculateIndex(fishType, {
        temperature_2m: tempCelsius,
        pressure_msl: pressureMmHg,
        cloud_cover: cloudCover,
        wind_speed_10m: windSpeed
    }, fishPreferences[fishType]);
    
    displayIndex(index);
    
    // Рекомендации
    const rec = createRecommendation(fishType, tempCelsius, pressureMmHg, cloudCover, moon.phase);
    document.getElementById('recommendation').innerHTML = rec;
    
    // Местное время
    document.getElementById('local-time').textContent = getLocalTime();
    
    // Прогноз на несколько дней
    if (selectedDays > 1) {
        displayMultiDay(weather.list, fishType);
    }
    
    // Показываем секцию
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
function displayMultiDay(list, fishType) {
    let section = document.querySelector('.multi-day-forecast');
    
    if (!section) {
        section = document.createElement('div');
        section.className = 'multi-day-forecast';
        resultsSection.appendChild(section);
    }
    
    section.innerHTML = `<h3>📅 Прогноз на ${selectedDays} ${getDayDeclension(selectedDays)}</h3><div class="days-grid"></div>`;
    const grid = section.querySelector('.days-grid');
    
    const days = {};
    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString('ru');
        
        if (!days[dateStr]) {
            days[dateStr] = {
                date: date,
                temps: [],
                pressures: [],
                winds: [],
                icons: []
            };
        }
        
        days[dateStr].temps.push(item.main.temp);
        days[dateStr].pressures.push(item.press * 0.750062);
        days[dateStr].winds.push(item.wind.speed);
        days[dateStr].icons.push(item.weather[0].icon);
    });
    
    let count = 0;
    for (const dateStr in days) {
        if (count >= selectedDays) break;
        
        const day = days[dateStr];
        const maxTemp = Math.max(...day.temps);
        const minTemp = Math.min(...day.temps);
        const avgPressure = day.pressures.reduce((a, b) => a + b, 0) / day.pressures.length;
        const maxWind = Math.max(...day.winds);
        const mainIcon = day.icons[0]; // Берём первую иконку дня
        
        const dayName = count === 0 ? 'Сегодня' : count === 1 ? 'Завтра' : day.date.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' });
        
        const index = calculateDailyIndex(fishType, maxTemp, minTemp, avgPressure, maxWind);
        const weatherIcon = getWeatherIcon(mainIcon);
        
        const card = document.createElement('div');
        card.className = 'day-card';
        card.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-icon">${weatherIcon}</div>
            <div class="day-index ${getIndexClass(index)}">${index}</div>
            <div class="day-temp">${Math.round(maxTemp)}° / ${Math.round(minTemp)}°</div>
            <div class="day-wind">💨 ${Math.round(maxWind)} м/с</div>
        `;
        
        grid.appendChild(card);
        count++;
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

console.log('🎣 Прогноз клёва рыбы загружен! API: OpenWeather + Иконки ☀️');