(function initAppControlsRuntime(global) {
    function displayWeather(weatherData, manualWeatherType = null) {
        global.WeatherWindow.applyWeatherScene(weatherData, {
            manualWeatherType,
            manualMoonPhase: null,
            renderMode: manualWeatherType ? 'manualWeather' : 'live'
        });
    }

    function rerenderCurrentWeatherScene() {
        const currentWeatherData = global.WeatherWindow.getCurrentWeatherData();
        if (!currentWeatherData) return;

        global.WeatherWindow.applyWeatherScene(currentWeatherData, {
            manualWeatherType: global.WeatherWindow.sceneState.overrides.manualWeatherType,
            manualMoonPhase: global.WeatherWindow.sceneState.overrides.manualMoonPhase,
            renderMode: global.WeatherWindow.sceneState.renderMode
        });
    }

    function setWeatherType(weatherType, options = {}) {
        const weatherCode = global.WeatherWindow.WEATHER_TYPE_TO_CODE[weatherType] ?? 0;
        const defaultWindSpeed = weatherType === 'wind' ? 12 :
            weatherType === 'thunderstorm' ? 15 :
            weatherType === 'rain' ? 6 :
            weatherType === 'snow' ? 6 :
            weatherType === 'clouds' ? 4 :
            weatherType === 'fog' ? 1 :
            2;

        const mockWeatherData = global.WeatherWindow.buildLegacyWeatherData({
            name: 'San Francisco, USA',
            lat: global.WeatherWindow.DEFAULT_LOCATION.lat,
            lon: global.WeatherWindow.DEFAULT_LOCATION.lon,
            weatherCode,
            temperature: options.temperature ?? (weatherType === 'snow' ? -1 : 18),
            feelsLike: options.feelsLike ?? (weatherType === 'snow' ? -3 : 17),
            humidity: options.humidity ?? (weatherType === 'fog' ? 95 : 60),
            windSpeed: options.windSpeed ?? defaultWindSpeed,
            windDirection: options.windDirection ?? (weatherType === 'wind' ? 135 : 270),
            precipitation: options.precipitation ?? (
                weatherType === 'rain' ? 2.5 :
                weatherType === 'snow' ? 1.5 :
                weatherType === 'thunderstorm' ? 4.0 :
                0
            ),
            cloudCover: options.cloudCover ?? (
                weatherType === 'clouds' ? 80 :
                weatherType === 'rain' || weatherType === 'snow' || weatherType === 'thunderstorm' ? 60 :
                weatherType === 'fog' ? 100 :
                20
            )
        });

        if (weatherType === 'wind') {
            mockWeatherData.weather[0].description = 'windy';
        }

        global.WeatherWindow.applyWeatherScene(mockWeatherData, {
            manualWeatherType: weatherType,
            manualMoonPhase: null,
            renderMode: 'manualWeather'
        });
    }

    function testWeatherCode(weatherCode) {
        const code = parseInt(weatherCode, 10);
        if (isNaN(code) || code < 0 || code > 99) {
            alert('Please enter a valid weather code between 0 and 99');
            return;
        }

        const mockWeatherData = global.WeatherWindow.buildLegacyWeatherData({
            name: 'Test Location',
            lat: global.WeatherWindow.DEFAULT_LOCATION.lat,
            lon: global.WeatherWindow.DEFAULT_LOCATION.lon,
            weatherCode: code
        });

        global.WeatherWindow.applyWeatherScene(mockWeatherData, {
            manualWeatherType: null,
            manualMoonPhase: null,
            renderMode: 'weatherCodeTest'
        });
    }

    function setMoonPhase(phaseName) {
        const mockWeatherData = global.WeatherWindow.buildLegacyWeatherData({
            name: 'San Francisco, USA',
            lat: global.WeatherWindow.DEFAULT_LOCATION.lat,
            lon: global.WeatherWindow.DEFAULT_LOCATION.lon,
            weatherCode: 0,
            temperature: 18,
            feelsLike: 17,
            windSpeed: 2,
            windDirection: 270,
            cloudCover: 20
        });

        global.WeatherWindow.applyWeatherScene(mockWeatherData, {
            manualWeatherType: 'clear',
            manualMoonPhase: phaseName,
            renderMode: 'manualMoonPhase'
        });
    }

    global.WeatherWindow = global.WeatherWindow || {};
    Object.assign(global.WeatherWindow, {
        displayWeather,
        rerenderCurrentWeatherScene,
        setWeatherType,
        testWeatherCode,
        setMoonPhase
    });
})(window);
