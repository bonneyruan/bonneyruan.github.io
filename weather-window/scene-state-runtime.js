(function initSceneStateRuntime(global) {
    const sceneState = {
        weather: null,
        layout: null,
        celestial: null,
        overrides: {
            manualWeatherType: null,
            manualMoonPhase: null
        },
        preferences: {
            temperatureUnit: 'C',
            theme: 'dark',
            devMode: false
        },
        renderMode: 'live'
    };

    function getCurrentWeatherData() {
        return sceneState.weather?.legacyWeatherData || null;
    }

    function setScenePreferences(patch = {}) {
        sceneState.preferences = {
            ...sceneState.preferences,
            ...patch
        };
    }

    function setSceneOverrides(patch = {}) {
        sceneState.overrides = {
            ...sceneState.overrides,
            ...patch
        };
    }

    function buildSceneCelestialState(normalizedWeather) {
        if (!normalizedWeather) {
            return {
                sunPos: null,
                moonPos: null,
                manualMoonPhase: sceneState.overrides.manualMoonPhase
            };
        }

        return {
            sunPos: global.calculateSunPosition(
                normalizedWeather.astronomy.lat,
                normalizedWeather.astronomy.lon,
                normalizedWeather.astronomy.utcOffsetSeconds
            ),
            moonPos: global.calculateMoonPosition(
                normalizedWeather.astronomy.lat,
                normalizedWeather.astronomy.lon,
                normalizedWeather.astronomy.utcOffsetSeconds
            ),
            manualMoonPhase: sceneState.overrides.manualMoonPhase
        };
    }

    function renderManualMoonPhase(phaseName) {
        const sunDisplay = document.getElementById('sunDisplay');
        const moonDisplay = document.getElementById('moonDisplay');
        if (!moonDisplay) return;

        const sceneLayout = sceneState.layout || global.WeatherWindow.getSceneLayout();
        const moonPhaseArt = global.asciiArt?.moon?.[phaseName] || global.asciiArt?.moon?.full || '';
        const topPercent = Math.max(sceneLayout.skyTopPercent + 12, Math.min(sceneLayout.skyBottomPercent - 14, 30));

        if (sunDisplay) {
            sunDisplay.classList.remove('sun');
            sunDisplay.style.display = 'none';
            sunDisplay.textContent = '';
        }

        moonDisplay.classList.add('moon');
        moonDisplay.style.display = 'block';
        moonDisplay.textContent = moonPhaseArt;
        moonDisplay.style.top = `${topPercent}%`;
        moonDisplay.style.left = '50%';
        moonDisplay.style.transform = 'translate(-50%, -50%)';
        moonDisplay.style.opacity = '0.9';
        moonDisplay.style.filter = 'brightness(1)';

    }

    function applyWeatherScene(rawWeatherData, options = {}) {
        const {
            manualWeatherType = null,
            manualMoonPhase = sceneState.overrides.manualMoonPhase,
            renderMode = manualMoonPhase ? 'manualMoonPhase' : manualWeatherType ? 'manualWeather' : 'live'
        } = options;

        setSceneOverrides({
            manualWeatherType,
            manualMoonPhase
        });

        sceneState.renderMode = renderMode;
        sceneState.layout = global.WeatherWindow.getSceneLayout();
        sceneState.weather = global.WeatherWindow.normalizeWeather(rawWeatherData, {
            manualWeatherType
        });
        sceneState.celestial = buildSceneCelestialState(sceneState.weather);

        global.WeatherWindow.updateSceneTextAndInfo(sceneState.weather);
        global.WeatherWindow.orchestrateEffects(sceneState.weather);
    }

    global.WeatherWindow = global.WeatherWindow || {};
    Object.assign(global.WeatherWindow, {
        sceneState,
        getCurrentWeatherData,
        setScenePreferences,
        setSceneOverrides,
        buildSceneCelestialState,
        renderManualMoonPhase,
        applyWeatherScene
    });
})(window);
