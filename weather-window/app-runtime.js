(function initAppRuntime(global) {
    global.currentLocation = global.currentLocation || null;
    global.updateInterval = global.updateInterval || null;

    async function handleLocationSubmit() {
        const input = document.getElementById('locationInput');
        const locationName = input.value.trim();
        const display = document.getElementById('weatherDisplay');

        if (!locationName) {
            display.classList.remove('sun', 'moon');
            display.textContent = 'Please enter a location\nin the input field below';
            return;
        }

        display.classList.remove('sun', 'moon');
        display.textContent = 'Loading weather...';

        try {
            const geocoded = await global.WeatherWindow.geocodeLocation(locationName);
            const weatherData = await global.WeatherWindow.getWeather(geocoded.lat, geocoded.lon);

            if (geocoded.name) {
                weatherData.name = geocoded.name;
            }

            if (geocoded.countryCode) {
                global.currentCountryCode = geocoded.countryCode;
                if (!global.WeatherWindow.safeStorageGet('temperatureUnit')) {
                    const defaultUnit = global.WeatherWindow.getDefaultTemperatureUnit(geocoded.countryCode);
                    global.WeatherWindow.setTemperatureUnit(defaultUnit, false);
                }
            }

            global.currentLocation = { lat: geocoded.lat, lon: geocoded.lon };
            global.currentLocationCoords = { lat: geocoded.lat, lon: geocoded.lon };

            if (!weatherData.coord) {
                weatherData.coord = { lat: geocoded.lat, lon: geocoded.lon };
            }

            global.WeatherWindow.displayWeather(weatherData);
            global.WeatherWindow.hideLocationInput();

            if (global.updateInterval) clearInterval(global.updateInterval);
            if (global.timeUpdateInterval) clearInterval(global.timeUpdateInterval);
            global.updateInterval = setInterval(async () => {
                const refreshedWeather = await global.WeatherWindow.getWeather(global.currentLocation.lat, global.currentLocation.lon);
                global.WeatherWindow.displayWeather(refreshedWeather);
            }, 600000);
        } catch (error) {
            console.error('Error fetching weather for location:', error);

            let errorMessage = 'Error: Could not find location\n\n';
            if (error.message === 'LOCATION_NOT_FOUND') {
                errorMessage = 'Location Not Found\n\nTry:\n- "San Francisco"\n- "Los Angeles"\n- "New York, US"\n- "London, GB"';
            } else if (error.message.includes('API_ERROR')) {
                errorMessage = 'API Error\n\nPlease check:\n- Internet connection\n- Try again in a moment';
            } else {
                errorMessage += 'Please check:\n- Location spelling\n- Try "City" or "City, Country"';
            }

            display.classList.remove('sun', 'moon');
            display.textContent = errorMessage;
            document.getElementById('locationInputContainer').style.display = 'flex';
        }
    }

    async function init() {
        try {
            global.WeatherWindow.getOriginalTreeLines();

            global.WeatherWindow.registerWindReactiveElement('tree', (normalizedWeather) => {
                const windMotionLevel = normalizedWeather?.derived?.windMotionLevel ?? 'calm';
                if (windMotionLevel === 'storm') {
                    global.startTreeAnimation('storm');
                } else if (windMotionLevel === 'strong') {
                    global.startTreeAnimation('strong');
                } else if (windMotionLevel === 'gentle') {
                    global.startTreeAnimation('gentle');
                } else {
                    global.stopTreeAnimation();
                }
            });

            global.WeatherWindow.updateSceneLayoutMetrics();

            const submitButton = document.getElementById('submitLocation');
            const locationInput = document.getElementById('locationInput');
            const changeLocationBtn = document.getElementById('changeLocationBtn');

            submitButton.addEventListener('click', handleLocationSubmit);
            locationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLocationSubmit();
                }
            });
            changeLocationBtn.addEventListener('click', () => {
                global.WeatherWindow.showLocationInput();
            });

            document.querySelectorAll('.weather-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    global.WeatherWindow.setWeatherType(btn.dataset.weather);
                });
            });

            document.querySelectorAll('.moon-phase-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    global.WeatherWindow.setMoonPhase(btn.dataset.phase);
                });
            });

            const temperatureToggle = document.getElementById('temperatureToggle');
            if (temperatureToggle) {
                temperatureToggle.querySelectorAll('.temperature-option').forEach((option) => {
                    option.addEventListener('click', (e) => {
                        const unit = e.currentTarget.dataset.unit || option.dataset.unit;
                        if (unit && unit !== global.currentTemperatureUnit) {
                            global.WeatherWindow.setTemperatureUnit(unit, true);
                        }
                    });
                });
            }

            const savedUnit = global.WeatherWindow.safeStorageGet('temperatureUnit');
            if (savedUnit && (savedUnit === 'C' || savedUnit === 'F')) {
                global.WeatherWindow.setTemperatureUnit(savedUnit, false);
            } else {
                global.WeatherWindow.setTemperatureUnit('C', false);
            }

            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                const savedTheme = global.WeatherWindow.safeStorageGet('theme') || 'dark';
                const isLightMode = savedTheme === 'light';

                if (isLightMode) {
                    document.body.classList.add('light-mode');
                    themeToggle.querySelector('[data-theme="light"]').classList.add('active');
                } else {
                    document.body.classList.remove('light-mode');
                    themeToggle.querySelector('[data-theme="dark"]').classList.add('active');
                }
                global.WeatherWindow.setScenePreferences({ theme: savedTheme });

                themeToggle.querySelectorAll('.theme-option').forEach((option) => {
                    option.addEventListener('click', (e) => {
                        const theme = e.target.dataset.theme;
                        const isLight = theme === 'light';
                        themeToggle.querySelectorAll('.theme-option').forEach((opt) => opt.classList.remove('active'));
                        e.target.classList.add('active');

                        if (isLight) {
                            document.body.classList.add('light-mode');
                        } else {
                            document.body.classList.remove('light-mode');
                        }

                        global.WeatherWindow.setScenePreferences({ theme });
                        global.WeatherWindow.safeStorageSet('theme', theme);
                    });
                });
            }

            const devToggleBtn = document.getElementById('devToggleBtn');
            if (devToggleBtn) {
                const devModeOn = global.WeatherWindow.safeStorageGet('devMode') === 'true';
                const container = document.querySelector('.container');
                const devToolsContainer = document.getElementById('devToolsContainer');

                if (devModeOn) {
                    container.classList.remove('dev-mode-off');
                    devToggleBtn.classList.add('active');
                    if (devToolsContainer) devToolsContainer.style.display = 'flex';
                } else {
                    container.classList.add('dev-mode-off');
                    devToggleBtn.classList.remove('active');
                    if (devToolsContainer) devToolsContainer.style.display = 'none';
                }
                global.WeatherWindow.setScenePreferences({ devMode: devModeOn });

                devToggleBtn.addEventListener('click', () => {
                    const isCurrentlyOff = container.classList.contains('dev-mode-off');
                    if (isCurrentlyOff) {
                        container.classList.remove('dev-mode-off');
                        devToggleBtn.classList.add('active');
                        global.WeatherWindow.setScenePreferences({ devMode: true });
                        global.WeatherWindow.safeStorageSet('devMode', 'true');
                        if (devToolsContainer) devToolsContainer.style.display = 'flex';
                    } else {
                        container.classList.add('dev-mode-off');
                        devToggleBtn.classList.remove('active');
                        global.WeatherWindow.setScenePreferences({ devMode: false });
                        global.WeatherWindow.safeStorageSet('devMode', 'false');
                        if (devToolsContainer) devToolsContainer.style.display = 'none';
                    }

                    const currentWeatherData = global.WeatherWindow.getCurrentWeatherData();
                    if (currentWeatherData) {
                        global.WeatherWindow.updateTemperatureDisplay(currentWeatherData);
                    }
                });

                const weatherCodeInput = document.getElementById('weatherCodeInput');
                const testWeatherCodeBtn = document.getElementById('testWeatherCodeBtn');
                if (testWeatherCodeBtn && weatherCodeInput) {
                    const handleTestWeatherCode = () => {
                        const code = weatherCodeInput.value.trim();
                        if (code) {
                            global.WeatherWindow.testWeatherCode(code);
                        }
                    };
                    testWeatherCodeBtn.addEventListener('click', handleTestWeatherCode);
                    weatherCodeInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') handleTestWeatherCode();
                    });
                }
            }

            try {
                const location = await global.WeatherWindow.getLocation();
                global.currentLocation = location;

                if (!location.fromGeolocation) {
                    const weatherData = await global.WeatherWindow.getWeather(location.lat, location.lon);
                    weatherData.name = global.WeatherWindow.DEFAULT_LOCATION.name;
                    if (!global.WeatherWindow.safeStorageGet('temperatureUnit')) {
                        global.currentCountryCode = 'US';
                        global.WeatherWindow.setTemperatureUnit('F', false);
                    }
                    global.WeatherWindow.displayWeather(weatherData);
                } else {
                    try {
                        const reverseGeocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${location.lat}&longitude=${location.lon}&count=1&language=en&format=json`;
                        const reverseResponse = await fetch(reverseGeocodeUrl);
                        if (reverseResponse.ok) {
                            const reverseData = await reverseResponse.json();
                            if (reverseData.results && reverseData.results.length > 0) {
                                const countryCode = reverseData.results[0].country_code;
                                if (countryCode) {
                                    global.currentCountryCode = countryCode;
                                    if (!global.WeatherWindow.safeStorageGet('temperatureUnit')) {
                                        const defaultUnit = global.WeatherWindow.getDefaultTemperatureUnit(countryCode);
                                        global.WeatherWindow.setTemperatureUnit(defaultUnit, false);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Reverse geocoding error:', error);
                    }
                    const weatherData = await global.WeatherWindow.getWeather(location.lat, location.lon);
                    global.WeatherWindow.displayWeather(weatherData);
                }

                if (global.timeUpdateInterval) clearInterval(global.timeUpdateInterval);
                global.updateInterval = setInterval(async () => {
                    const weatherData = await global.WeatherWindow.getWeather(global.currentLocation.lat, global.currentLocation.lon);
                    if (!global.currentLocation.fromGeolocation && !global.WeatherWindow.checkAPIKey()) {
                        weatherData.name = global.WeatherWindow.DEFAULT_LOCATION.name;
                    }
                    global.WeatherWindow.displayWeather(weatherData);
                }, 600000);
            } catch (error) {
                console.log('Using default location (San Francisco)...');
                global.currentLocation = {
                    lat: global.WeatherWindow.DEFAULT_LOCATION.lat,
                    lon: global.WeatherWindow.DEFAULT_LOCATION.lon,
                    fromGeolocation: false
                };
                if (!global.WeatherWindow.safeStorageGet('temperatureUnit')) {
                    global.currentCountryCode = 'US';
                    global.WeatherWindow.setTemperatureUnit('F', false);
                }
                const weatherData = await global.WeatherWindow.getWeather(global.WeatherWindow.DEFAULT_LOCATION.lat, global.WeatherWindow.DEFAULT_LOCATION.lon);
                weatherData.name = global.WeatherWindow.DEFAULT_LOCATION.name;
                global.WeatherWindow.displayWeather(weatherData);

                if (global.timeUpdateInterval) clearInterval(global.timeUpdateInterval);
                global.updateInterval = setInterval(async () => {
                    const weatherData = await global.WeatherWindow.getWeather(global.WeatherWindow.DEFAULT_LOCATION.lat, global.WeatherWindow.DEFAULT_LOCATION.lon);
                    weatherData.name = global.WeatherWindow.DEFAULT_LOCATION.name;
                    global.WeatherWindow.displayWeather(weatherData);
                }, 600000);
            }

            global.addEventListener('resize', () => {
                global.WeatherWindow.updateSceneLayoutMetrics();
                if (global.resizeRerenderTimeout) {
                    clearTimeout(global.resizeRerenderTimeout);
                }
                global.resizeRerenderTimeout = setTimeout(() => {
                    global.WeatherWindow.rerenderCurrentWeatherScene();
                }, 120);
            });
        } catch (error) {
            console.error('Initialization error:', error);
            const display = document.getElementById('weatherDisplay');
            if (display) {
                display.classList.remove('sun', 'moon');
                display.textContent = 'Error loading weather';
            }
            global.WeatherWindow.showLocationInput();
        }
    }

    global.WeatherWindow = global.WeatherWindow || {};
    Object.assign(global.WeatherWindow, {
        handleLocationSubmit,
        init
    });

    init();
})(window);
