(function initSceneRendererRuntime(global) {
    function celsiusToFahrenheit(celsius) {
        return (celsius * 9 / 5) + 32;
    }

    function fahrenheitToCelsius(fahrenheit) {
        return (fahrenheit - 32) * 5 / 9;
    }

    function updateTemperatureDisplay(weatherData) {
        const info = document.getElementById('weatherInfo');
        if (!info) return;

        const tempC = weatherData.main ? weatherData.main.temp : 18;
        const feelsLikeC = weatherData.main ? weatherData.main.feels_like : 17;
        const description = weatherData.weather ? weatherData.weather[0].description : 'clear sky';

        let temp;
        let feelsLike;
        let unit;
        if (global.currentTemperatureUnit === 'F') {
            temp = Math.round(celsiusToFahrenheit(tempC));
            feelsLike = Math.round(celsiusToFahrenheit(feelsLikeC));
            unit = '°F';
        } else {
            temp = Math.round(tempC);
            feelsLike = Math.round(feelsLikeC);
            unit = '°C';
        }

        const windSpeed = weatherData.wind ? weatherData.wind.speed : 0;
        const windDirection = weatherData.wind ? weatherData.wind.deg : 0;
        const rainVolume = weatherData.rain ? (weatherData.rain['1h'] ?? weatherData.rain['3h'] ?? 0) : 0;
        const snowVolume = weatherData.snow ? (weatherData.snow['1h'] ?? weatherData.snow['3h'] ?? 0) : 0;
        const humidity = weatherData.main ? weatherData.main.humidity : null;
        const cloudCover = weatherData.clouds ? weatherData.clouds.all : null;
        const visibility = weatherData.visibility ?? null;
        const utcOffsetSeconds = weatherData?.utc_offset_seconds ?? null;

        const localTimeStr = global.getLocalTimeString(utcOffsetSeconds);

        let lat;
        let lon;
        if (global.currentLocationCoords) {
            lat = global.currentLocationCoords.lat;
            lon = global.currentLocationCoords.lon;
        } else if (weatherData && weatherData.coord) {
            lat = weatherData.coord.lat;
            lon = weatherData.coord.lon;
        } else if (global.currentLocation && global.currentLocation.lat && global.currentLocation.lon) {
            lat = global.currentLocation.lat;
            lon = global.currentLocation.lon;
        } else {
            lat = global.WeatherWindow.DEFAULT_LOCATION.lat;
            lon = global.WeatherWindow.DEFAULT_LOCATION.lon;
        }

        const sunPos = global.calculateSunPosition(lat, lon, utcOffsetSeconds);
        const moonPos = global.calculateMoonPosition(lat, lon, utcOffsetSeconds);

        let infoText = `${description.toUpperCase()}\n`;
        infoText += `${localTimeStr}\n`;
        infoText += `Temperature: ${temp}${unit}\n`;
        infoText += `Feels like: ${feelsLike}${unit}\n`;

        const container = document.querySelector('.container');
        const isDevModeOff = container && container.classList.contains('dev-mode-off');

        if (!isDevModeOff && sunPos.altitude >= -6) {
            infoText += `Sun Altitude: ${sunPos.altitude.toFixed(1)}°\n`;
            infoText += `Sun Azimuth: ${sunPos.azimuth.toFixed(1)}°\n`;
        }

        if (!isDevModeOff && moonPos.altitude >= -6 && moonPos.phase !== 'new') {
            infoText += `Moon Altitude: ${moonPos.altitude.toFixed(1)}°\n`;
            infoText += `Moon Azimuth: ${moonPos.azimuth.toFixed(1)}°\n`;
            infoText += `Moon Phase: ${moonPos.phase}\n`;
        }

        if (windSpeed > 0) {
            infoText += `Wind Speed: ${windSpeed.toFixed(1)} m/s`;
            if (windDirection !== null && windDirection !== undefined) {
                const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
                const index = Math.round(windDirection / 22.5) % 16;
                infoText += ` (${directions[index]})`;
            }
            infoText += '\n';
        }

        if (rainVolume > 0) {
            infoText += `Rain: ${rainVolume.toFixed(2)} mm/h\n`;
        }
        if (snowVolume > 0) {
            infoText += `Snow: ${snowVolume.toFixed(2)} mm/h\n`;
        }

        if (humidity !== null && humidity !== undefined && humidity > 0) {
            const isRelevantToAnimations = humidity > 80;
            if (!isDevModeOff || isRelevantToAnimations) {
                infoText += `Humidity: ${humidity}%\n`;
            }
        }
        if (cloudCover !== null && cloudCover !== undefined && cloudCover > 0) {
            infoText += `Cloud Cover: ${cloudCover}%\n`;
        }
        if (visibility !== null && visibility !== undefined && visibility > 0) {
            const visibilityText = visibility >= 1000 ? `${(visibility / 1000).toFixed(1)} km` : `${visibility} m`;
            infoText += `Visibility: ${visibilityText}\n`;
        }

        info.textContent = infoText.trim();
    }

    function updateSceneTextAndInfo(normalizedWeather) {
        const rawWeatherData = normalizedWeather.legacyWeatherData;
        const location = document.getElementById('location');

        if (rawWeatherData.coord) {
            global.currentLocationCoords = {
                lat: rawWeatherData.coord.lat,
                lon: rawWeatherData.coord.lon
            };
        } else if (global.currentLocation && global.currentLocation.lat && global.currentLocation.lon) {
            global.currentLocationCoords = {
                lat: global.currentLocation.lat,
                lon: global.currentLocation.lon
            };
        }

        if (rawWeatherData.name) {
            location.textContent = `${rawWeatherData.name}`;
        }

        updateTemperatureDisplay(rawWeatherData);

        if (global.timeUpdateInterval) clearInterval(global.timeUpdateInterval);
        global.timeUpdateInterval = setInterval(() => {
            const currentWeatherData = global.WeatherWindow.getCurrentWeatherData();
            if (currentWeatherData) {
                updateTemperatureDisplay(currentWeatherData);
            }
        }, 60000);

        global.syncEffectState();
    }

    function updateCelestial(normalizedWeather) {
        const display = document.getElementById('sunDisplay');
        const moonDisplay = document.getElementById('moonDisplay');
        const rawWeatherData = normalizedWeather.legacyWeatherData;
        const { sceneState, getSceneLayout, buildSceneCelestialState, renderManualMoonPhase } = global.WeatherWindow;
        const manualMoonPhase = sceneState.overrides.manualMoonPhase;

        display.classList.remove('sun', 'moon');
        moonDisplay.classList.remove('moon');

        if (!normalizedWeather.derived.showCelestial && !manualMoonPhase) {
            display.style.display = 'none';
            display.textContent = '';
            moonDisplay.style.display = 'none';
            moonDisplay.textContent = '';
            global.syncEffectState();
            return;
        }

        sceneState.layout = getSceneLayout();
        sceneState.celestial = buildSceneCelestialState(normalizedWeather);

        const { sunPos, moonPos } = sceneState.celestial;

        if (manualMoonPhase) {
            renderManualMoonPhase(manualMoonPhase);
            global.syncEffectState();
            return;
        }

        if (sunPos.altitude >= -6) {
            display.classList.add('sun');
            display.style.display = 'block';
            global.positionSun(rawWeatherData);
            if (global.sunPositionInterval) clearInterval(global.sunPositionInterval);
            global.sunPositionInterval = setInterval(() => {
                global.positionSun(rawWeatherData);
            }, 60000);
        } else {
            display.classList.remove('sun');
            display.style.display = 'none';
            display.textContent = '';
            if (global.sunPositionInterval) clearInterval(global.sunPositionInterval);
            global.sunPositionInterval = null;
        }

        if (global.shouldShowMoon(moonPos, sunPos)) {
            moonDisplay.classList.add('moon');
            moonDisplay.style.display = 'block';
            global.positionMoon(rawWeatherData);
            if (global.moonPositionInterval) clearInterval(global.moonPositionInterval);
            global.moonPositionInterval = setInterval(() => {
                global.positionMoon(rawWeatherData);
            }, 60000);
        } else {
            moonDisplay.classList.remove('moon');
            moonDisplay.style.display = 'none';
            moonDisplay.textContent = '';
            if (global.moonPositionInterval) clearInterval(global.moonPositionInterval);
            global.moonPositionInterval = null;
        }

        global.syncEffectState();
    }

    global.WeatherWindow = global.WeatherWindow || {};
    Object.assign(global.WeatherWindow, {
        celsiusToFahrenheit,
        fahrenheitToCelsius,
        updateTemperatureDisplay,
        updateSceneTextAndInfo,
        updateCelestial
    });
})(window);
