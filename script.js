document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('.search-form');
    const cityInput = document.querySelector('input[type="search"]');
    const cityName = document.getElementById('cityName');
    const temperature = document.getElementById('temperature');
    const weatherCondition = document.getElementById('weatherCondition');
    const weatherIcon = document.getElementById('weatherIcon');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('windSpeed');
    const feelsLike = document.getElementById('feelsLike');
    const uvIndex = document.getElementById('uvIndex');
    const visibility = document.getElementById('visibility');
    const forecastContainer = document.getElementById('forecastContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const weatherChart = document.getElementById('weather-chart').getContext('2d');

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    const API_KEY = 'c103ef6ff2mshcfdb6f84288e32bp176c38jsne7e0176ded76';

    const weatherIcons = {
        'Sunny': '☀️',
        'Clear': '☀️',
        'Partly cloudy': '⛅',
        'Cloudy': '☁️',
        'Overcast': '☁️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Rain': '🌧️',
        'Drizzle': '🌧️',
        'Shower': '🌧️',
        'Thunder': '⛈️',
        'Snow': '❄️',
        'Sleet': '🌨️',
    };

    // Fallback data in case API fails
    const fallbackData = {
        current: {
            temp_c: 28,
            condition: { text: 'Sunny' },
            humidity: 65,
            wind_kph: 10,
            feelslike_c: 30,
            uv: 6,
            vis_km: 10
        },
        location: { name: 'Morbi' },
        forecast: {
            forecastday: [
                { date: '2025-06-15', day: { maxtemp_c: 29, mintemp_c: 24, condition: { text: 'Sunny' }, daily_chance_of_rain: 10, maxwind_kph: 12 } },
                { date: '2025-06-16', day: { maxtemp_c: 30, mintemp_c: 25, condition: { text: 'Partly cloudy' }, daily_chance_of_rain: 20, maxwind_kph: 15 } },
                { date: '2025-06-17', day: { maxtemp_c: 31, mintemp_c: 26, condition: { text: 'Cloudy' }, daily_chance_of_rain: 30, maxwind_kph: 18 } }
            ]
        }
    };

    let chartInstance = null;

    fetchWeatherData('Morbi');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (!city) return;
        fetchWeatherData(city);
        cityInput.value = '';
    });

    async function fetchWeatherData(city) {
        loadingSpinner.classList.add('active');
        try {
            const [currentWeather, forecast] = await Promise.all([
                fetchCurrentWeather(city),
                fetchForecast(city)
            ]);
            const sevenDayForecast = generateSevenDayForecast(currentWeather, forecast);
            updateCurrentWeather(currentWeather);
            updateForecast(sevenDayForecast);
            updateChart(sevenDayForecast);
        } catch (error) {
            console.error('Error fetching weather data:', error.message);
            alert(`Failed to fetch weather data: ${error.message}. Using fallback data instead. Please check your API key or try again later.`);
            const sevenDayForecast = generateSevenDayForecast(fallbackData, fallbackData);
            updateCurrentWeather(fallbackData);
            updateForecast(sevenDayForecast);
            updateChart(sevenDayForecast);
        } finally {
            loadingSpinner.classList.remove('active');
        }
    }

    async function fetchCurrentWeather(city) {
        const response = await fetch(
            `https://weatherapi-com.p.rapidapi.com/current.json?q=${encodeURIComponent(city)}`,
            {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com',
                    'x-rapidapi-key': API_KEY,
                },
            }
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        return await response.json();
    }

    async function fetchForecast(city) {
        const response = await fetch(
            `https://weatherapi-com.p.rapidapi.com/forecast.json?q=${encodeURIComponent(city)}&days=3`,
            {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com',
                    'x-rapidapi-key': API_KEY,
                },
            }
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        return await response.json();
    }

    function getWeatherIcon(condition) {
        return weatherIcons[condition] || '🌤️';
    }

    function generateSevenDayForecast(currentWeather, forecast) {
        const today = new Date('2025-06-14'); // Fixed date as per system prompt
        const sevenDays = [];
        
        // Simulate previous 3 days by adjusting today's temperature
        for (let i = -3; i < 0; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const temp = Math.round(currentWeather.current.temp_c + (i * 1.5));
            sevenDays.push({
                date: date,
                condition: currentWeather.current.condition.text,
                maxtemp_c: temp,
                mintemp_c: temp - 5,
                daily_chance_of_rain: currentWeather.current.humidity,
                maxwind_kph: currentWeather.current.wind_kph
            });
        }

        // Today
        sevenDays.push({
            date: today,
            condition: currentWeather.current.condition.text,
            maxtemp_c: currentWeather.current.temp_c,
            mintemp_c: currentWeather.current.temp_c - 5,
            daily_chance_of_rain: currentWeather.current.humidity,
            maxwind_kph: currentWeather.current.wind_kph
        });

        // Next 3 days from forecast
        forecast.forecast.forecastday.forEach(day => {
            const date = new Date(today);
            date.setDate(today.getDate() + (sevenDays.length - 3));
            sevenDays.push({
                date: date,
                condition: day.day.condition.text,
                maxtemp_c: day.day.maxtemp_c,
                mintemp_c: day.day.mintemp_c,
                daily_chance_of_rain: day.day.daily_chance_of_rain,
                maxwind_kph: day.day.maxwind_kph
            });
        });

        return sevenDays;
    }

    function updateCurrentWeather(data) {
        cityName.textContent = data.location.name;
        temperature.textContent = `${Math.round(data.current.temp_c)}°C`;
        weatherIcon.textContent = getWeatherIcon(data.current.condition.text);
        weatherCondition.textContent = data.current.condition.text;
        humidity.textContent = data.current.humidity;
        windSpeed.textContent = data.current.wind_kph;
        feelsLike.textContent = Math.round(data.current.feelslike_c);
        uvIndex.textContent = data.current.uv;
        visibility.textContent = data.current.vis_km;
    }

    function updateForecast(data) {
        forecastContainer.innerHTML = '';
        data.forEach((day, index) => {
            const dateStr = day.date.toLocaleDateString('en-US', { weekday: 'long' });
            const condition = day.condition;
            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerHTML = `
                <div>${dateStr}</div>
                <div>${condition} ${getWeatherIcon(condition)}</div>
                <div>${Math.round(day.maxtemp_c)}°/${Math.round(day.mintemp_c)}°</div>
                <div>${day.daily_chance_of_rain}%</div>
                <div>${day.maxwind_kph} km/h</div>
            `;
            row.style.animationDelay = `${index * 0.1}s`;
            row.addEventListener('click', () => {
                document.querySelectorAll('.table-row').forEach(item => item.classList.remove('selected'));
                row.classList.add('selected');
                alert(`Selected ${dateStr}: ${Math.round(day.maxtemp_c)}°C, ${condition}`);
            });
            forecastContainer.appendChild(row);
        });
    }

    function updateChart(data) {
        const labels = data.map(day => day.date.toLocaleDateString('en-US', { weekday: 'short' }));
        const temperatures = data.map(day => day.maxtemp_c);

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(weatherChart, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temperatures,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: labels.map((_, index) => index === 3 ? '#ffd700' : '#fff'),
                    pointBorderColor: labels.map((_, index) => index === 3 ? '#ffd700' : '#fff'),
                    pointRadius: labels.map((_, index) => index === 3 ? 6 : 4),
                }]
            },
            options: {
                layout: {
                    padding: {
                        top: 30 // Add padding to prevent label cutoff
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { 
                            color: '#fff',
                            display: false
                        },
                        grid: { 
                            display: false,
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: { 
                            color: '#fff',
                            font: { size: 14 }
                        },
                        grid: { 
                            display: false,
                            drawBorder: false
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    datalabels: {
                        display: true,
                        color: '#fff',
                        formatter: (value) => `${value}°`,
                        anchor: 'end',
                        align: 'top',
                        offset: 10,
                        font: { size: 14 },
                        clip: false // Ensure labels are not clipped
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }
});