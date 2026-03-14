(function initEffectsRuntime(global) {
    const effectState = {
        timers: {
            animationInterval: null,
            rainInterval: null,
            snowInterval: null,
            fogInterval: null,
            cloudInterval: null,
            windInterval: null,
            lightningInterval: null,
            hailInterval: null,
            rimeInterval: null,
            treeAnimationInterval: null,
            sunPositionInterval: null,
            moonPositionInterval: null,
            timeUpdateInterval: null
        }
    };

    const windReactiveElements = new Map();

    function syncEffectState() {
        effectState.timers.animationInterval = global.animationInterval;
        effectState.timers.rainInterval = global.rainInterval;
        effectState.timers.snowInterval = global.snowInterval;
        effectState.timers.fogInterval = global.fogInterval;
        effectState.timers.cloudInterval = global.cloudInterval;
        effectState.timers.windInterval = global.windInterval;
        effectState.timers.lightningInterval = global.lightningInterval;
        effectState.timers.hailInterval = global.hailInterval;
        effectState.timers.rimeInterval = global.rimeInterval;
        effectState.timers.treeAnimationInterval = global.treeAnimationInterval;
        effectState.timers.sunPositionInterval = global.sunPositionInterval;
        effectState.timers.moonPositionInterval = global.moonPositionInterval;
        effectState.timers.timeUpdateInterval = global.timeUpdateInterval;
    }

    function clearEffectState() {
        if (global.rainInterval) {
            clearInterval(global.rainInterval);
            global.rainInterval = null;
        }
        if (global.snowInterval) {
            clearInterval(global.snowInterval);
            global.snowInterval = null;
        }
        if (global.fogInterval) {
            clearInterval(global.fogInterval);
            global.fogInterval = null;
        }
        if (global.cloudInterval) {
            clearInterval(global.cloudInterval);
            global.cloudInterval = null;
        }
        if (global.windInterval) {
            clearInterval(global.windInterval);
            global.windInterval = null;
        }
        if (global.animationInterval) {
            clearInterval(global.animationInterval);
            global.animationInterval = null;
        }
        if (global.lightningInterval) {
            clearTimeout(global.lightningInterval);
            global.lightningInterval = null;
        }
        if (global.hailInterval) {
            clearInterval(global.hailInterval);
            global.hailInterval = null;
        }
        if (global.rimeInterval) {
            clearInterval(global.rimeInterval);
            global.rimeInterval = null;
        }
        if (global.sunPositionInterval) {
            clearInterval(global.sunPositionInterval);
            global.sunPositionInterval = null;
        }
        if (global.moonPositionInterval) {
            clearInterval(global.moonPositionInterval);
            global.moonPositionInterval = null;
        }
        global.stopTreeAnimation();

        const weatherAnimationContainer = document.getElementById('weatherAnimation');
        if (weatherAnimationContainer) {
            weatherAnimationContainer.innerHTML = '';
            weatherAnimationContainer.style.backgroundColor = 'transparent';
            weatherAnimationContainer.classList.remove('freezing-rain');
        }

        syncEffectState();
    }

    function registerWindReactiveElement(id, updater) {
        windReactiveElements.set(id, updater);
    }

    function updateWindReactiveScene(normalizedWeather) {
        windReactiveElements.forEach((updater) => updater(normalizedWeather));
        syncEffectState();
    }

    function orchestrateEffects(normalizedWeather) {
        const rawWeatherData = normalizedWeather.legacyWeatherData;
        const display = document.getElementById('weatherDisplay');
        const weatherType = normalizedWeather.condition.weatherType;
        const { sceneState } = global.WeatherWindow;
        const manualMoonPhase = sceneState.overrides.manualMoonPhase;
        const activeWeatherType = manualMoonPhase ? null : (sceneState.overrides.manualWeatherType || weatherType);

        clearEffectState();

        if (display) {
            display.textContent = '';
            display.innerHTML = '';
            display.style.display = 'block';
        }

        updateWindReactiveScene(normalizedWeather);

        document.querySelectorAll('.weather-btn').forEach((btn) => {
            btn.classList.remove('active');
            if (activeWeatherType && btn.dataset.weather === activeWeatherType) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.moon-phase-btn').forEach((btn) => {
            btn.classList.toggle('active', manualMoonPhase === btn.dataset.phase);
        });

        let hasAnyAnimation = false;

        if (normalizedWeather.derived.showRain && !normalizedWeather.derived.showThunderstorm) {
            global.createRainAnimation(rawWeatherData, !hasAnyAnimation);
            hasAnyAnimation = true;

            if (normalizedWeather.precipitation.isFreezing) {
                global.createFreezingRainEffect(rawWeatherData, false);
            }
        }

        if (normalizedWeather.derived.showThunderstorm) {
            global.createThunderstormAnimation(rawWeatherData, !hasAnyAnimation);
            hasAnyAnimation = true;

            if (normalizedWeather.precipitation.hasHail) {
                global.createHailAnimation(rawWeatherData, false);
            }
        }

        if (normalizedWeather.derived.showSnow) {
            global.createSnowAnimation(rawWeatherData, !hasAnyAnimation);
            hasAnyAnimation = true;
        }

        if (normalizedWeather.derived.showFog) {
            global.createFogAnimation(rawWeatherData, !hasAnyAnimation);
            hasAnyAnimation = true;

            if (normalizedWeather.condition.isRimeFog) {
                global.createRimeFogEffect(rawWeatherData, false);
            }
        }

        global.WeatherWindow.updateCelestial(normalizedWeather);

        if (normalizedWeather.derived.showClouds) {
            global.createCloudAnimation(rawWeatherData, !hasAnyAnimation);
            hasAnyAnimation = true;
        }

        if (!hasAnyAnimation && weatherType !== 'clear') {
            const artToShow = global.asciiArt?.[weatherType];
            if (artToShow && weatherType !== 'clouds') {
                display.textContent = artToShow;
            }
        }

        syncEffectState();
    }

    global.syncEffectState = syncEffectState;
    global.WeatherWindow = global.WeatherWindow || {};
    Object.assign(global.WeatherWindow, {
        effectState,
        syncEffectState,
        clearEffectState,
        registerWindReactiveElement,
        updateWindReactiveScene,
        orchestrateEffects
    });
})(window);
