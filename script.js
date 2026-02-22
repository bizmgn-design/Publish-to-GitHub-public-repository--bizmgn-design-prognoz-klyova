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
        console.log('✅ Выбран период:', selectedDays, 'дней');
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
    
    console.log(' Запрос прогноза для:', city, fishType);
    
    if (!city) {
        showStatus('⚠️ Введите название города', 'error');
        return;
    }
    
    showStatus('⏳ Загрузка прогноза...', 'success');
    
    try {
        // Шаг 1: Геокодинг
        console.log('📍 Геокодинг города:', city);
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;
        console.log('🔗 URL геокодинга:', geoUrl);
        
        const geoResponse = await fetch(geoUrl);
        
        if (!geoResponse.ok) {
            throw new Error(`Геокодинг: HTTP ${geoResponse.status}`);
        }
        
        const geoData = await geoResponse.json();
        console.log('📍 Данные геокодинга:', geoData);
        
        if (!geoData.results || geoData.results.length === 0) {
            showStatus('❌ Город не найден. Попробуйте другое название (например: Москва, Казань, Минск).', 'error');
            return;
        }
        
        const { latitude, longitude, name, country } = geoData.results[0];
        console.log('✅ Координаты:', latitude, longitude, name, country);
        
        // Шаг 2: Получаем данные погоды
        console.log('🌤️ Загрузка данных погоды...');
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,pressure_msl,cloud_cover,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,pressure_msl_mean,wind_speed_10m_max&timezone=auto&forecast_days=${selectedDays}`;
        console.log('🔗 URL погоды:', weatherUrl);
        
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
            throw new Error(`Погода: HTTP ${weatherResponse.status}`);
        }
        
        const weatherData = await weatherResponse.json();
        console.log('✅ Данные погоды получены:', weatherData);
        
        // Шаг 3: Отображаем результат
        console.log('📊 Отображение прогноза...');
        displayForecast({
            location: `${name}, ${country}`,
            latitude,
            longitude,
            weather: weatherData,
            fishType
        });
        
        showStatus('✅ Прогноз успешно загружен!', 'success');
        console.log('✅ Готово!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showStatus(`❌ Ошибка: ${error.message}. Проверьте интернет-соединение и попробуйте снова.`, 'error');
    }
});

// === Отображение прогноза ===
function displayForecast(data) {
    const { location, latitude, longitude, weather, fishType } = data;
    const current = weather.current;
    const hourly = weather.hourly;
    const daily = weather.daily;
    
    console.log('📊 Отображение данных для:', location);
    
    // Заголовок
    document.getElementById('location-title').textContent = `${getFishEmoji(fishType)} ${capitalize(fishType)} • ${location}`;
    document.getElementById('forecast-time').textContent = `${getLocalTime()} • прогноз на ${selectedDays} ${getDayDeclension(selectedDays)}`;
    
    // Погода сейчас
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
    console.log('🎣 Индекс клёва:', fishingIndex);
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
    
    const tempOptimal = fishData.tempOptimal;
    const tempDiff = temp - tempOptimal;
    
    const pressureOptimal = fishData.pressureOptimal;
    const pressureDiff = pressure - pressureOptimal;
    
    let recommendation = `<strong>🐟 ${fishData.description}</strong><br><br>`;
    
    if (Math.abs(tempDiff) <= 5) {
        recommendation += '✅ Температура воды благоприятная. ';
    } else if (tempDiff > 5) {
        recommendation += '🌡️ Вода теплее нормы. ';
    } else {
        recommendation += '❄️ Вода прохладнее нормы. ';
    }
    
    if (Math.abs(pressureDiff) <= 5) {
        recommendation += '✅ Давление в норме. ';
    } else if (pressureDiff > 5) {
        recommendation += '📈 Давление повышенное. ';
    } else {
        recommendation += '📉 Давление пониженное. ';
    }
    
    if (cloudcover > 70) {
        recommendation += '☁️ Пасмурно — рыба смелее. ';
    } else if (cloudcover < 30) {
        recommendation += '☀️ Ясно — ищите рыбу в тени. ';
    } else {
        recommendation += '⛅ Переменная облачность — хорошие условия. ';
    }
    
    recommendation += `🌙 Луна: ${moonPhase}.`;
    
    return recommendation;
}

// === Расчёт индекса клёва ===
function calculateFishingIndex(fishType, current, fishData) {
    let index = 50;
    
    const tempDiff = Math.abs(current.temperature_2m - fishData.tempOptimal);
    const pressureDiff = Math.abs(current.pressure_msl - fishData.pressureOptimal);
    
    if (tempDiff <= fishData.tempTolerance) {
        index += 20;
    } else if (tempDiff <= fishData.tempTolerance * 2) {
        index += 10;
    } else {
        index -= 20;
    }
    
    if (pressureDiff <= 5) {
        index += 20;
    } else if (pressureDiff <= 10) {
        index += 10;
    } else {
        index -= 20;
    }
    
    if (current.cloud_cover >= 40 && current.cloud_cover <= 70) {
        index += 10;
    } else if (current.cloud_cover > 80) {
        index += 5;
    }
    
    if (current.wind_speed_10m <= 5) {
        index += 10;
    } else if (current.wind_speed_10m <= 10) {
        index += 5;
    } else {
        index -= 10;
    }
    
    return Math.max(0, Math.min(100, index));
}

// === Отображение индекса клёва ===
function displayFishingIndex(index) {
    const indexElement = document.getElementById('fishing-index');
    const progressBar = document.getElementById('index-progress');
    const indexLabel = document.getElementById('index-label');
    
    indexElement.textContent = index;
    progressBar.style.width = `${index}%`;
    
    indexElement.classList.remove('excellent', 'good', 'medium', 'poor');
    indexLabel.classList.remove('excellent', 'good', 'medium', 'poor');
    
    if (index >= 76) {
        indexElement.classList.add('excellent');
        indexLabel.textContent = 'Отличный клёв';
        indexLabel.classList.add('excellent');
    } else if (index >= 51) {
        indexElement.classList.add('good');
        indexLabel.textContent = 'Хороший клёв';
        indexLabel.classList.add('good');
    } else if (index >= 26) {
        indexElement.classList.add('medium');
        indexLabel.textContent = 'Средний клёв';
        indexLabel.classList.add('medium');
    } else {
        indexElement.classList.add('poor');
        indexLabel.textContent = 'Плохой клёв';
        indexLabel.classList.add('poor');
    }
}

// === Прогноз на несколько дней ===
function displayMultiDayForecast(daily, fishType) {
    let multiDaySection = document.querySelector('.multi-day-forecast');
    
    if (!multiDaySection) {
        multiDaySection = document.createElement('div');
        multiDaySection.className = 'multi-day-forecast';
        resultsSection.appendChild(multiDaySection);
    }
    
    multiDaySection.innerHTML = `
        <h3>📅 Прогноз на ${selectedDays} ${getDayDeclension(selectedDays)}</h3>
        <div class="days-grid"></div>
    `;
    
    const daysGrid = multiDaySection.querySelector('.days-grid');
    
    for (let i = 0; i < selectedDays && i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : date.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' });
        
        const tempMax = Math.round(daily.temperature_2m_max[i]);
        const tempMin = Math.round(daily.temperature_2m_min[i]);
        const wind = Math.round(daily.wind_speed_10m_max[i]);
        const pressure = Math.round(daily.pressure_msl_mean[i]);
        
        const dayIndex = calculateDailyFishingIndex(fishType, tempMax, tempMin, pressure, wind);
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-index ${getIndexClass(dayIndex)}">${dayIndex}</div>
            <div class="day-temp">${tempMax}° / ${tempMin}°</div>
            <div class="day-wind">💨 ${wind} м/с</div>
        `;
        
        daysGrid.appendChild(dayCard);
    }
}

// === Расчёт индекса для дня ===
function calculateDailyFishingIndex(fishType, tempMax, tempMin, pressure, wind) {
    const fishData = fishPreferences[fishType];
    let index = 50;
    
    const tempAvg = (tempMax + tempMin) / 2;
    const tempDiff = Math.abs(tempAvg - fishData.tempOptimal);
    const pressureDiff = Math.abs(pressure - fishData.pressureOptimal);
    
    if (tempDiff <= fishData.tempTolerance) index += 25;
    else if (tempDiff <= fishData.tempTolerance * 2) index += 10;
    else index -= 20;
    
    if (pressureDiff <= 5) index += 25;
    else if (pressureDiff <= 10) index += 10;
    else index -= 20;
    
    if (wind <= 5) index += 10;
    else if (wind <= 10) index += 5;
    else index -= 10;
    
    return Math.max(0, Math.min(100, index));
}

// === Вспомогательные функции ===
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 5000);
}

function getFishEmoji(fishType) {
    const emojis = {
        щука: '🦈', окунь: '🐠', карп: '🐟', плотва: '🐠',
        судак: '🦈', карась: '🐠', лещ: '🐟', сом: '🐟',
        форель: '🐠', налим: '🦈', жерех: '🐟', голавль: '🐠',
        язь: '🐟', линь: '🐠', сазан: '🐟'
    };
    return emojis[fishType] || '🐟';
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
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    let c = e = jd = b = 0;
    if (month < 3) {
        year--;
        month += 12;
    }
    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);
    
    if (b >= 8) b = 0;
    
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

// === Инициализация ===
console.log('🎣 Прогноз клёва рыбы загружен! Готов к работе.');