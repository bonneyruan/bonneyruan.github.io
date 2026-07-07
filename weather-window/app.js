import {
    DEFAULT_LOCATION,
    createMockSceneFromWeatherKey,
    createSceneFromWeatherCode,
    fetchWeatherForCoords,
    geocodeLocation,
    getDefaultTemperatureUnit,
    getLocation
} from './weather-data.js';
import {
    getOutdoorProfileOptions,
    getSurroundingsProfileOptions
} from './profiles.js';
import {
    buildSceneModel,
    buildWeatherInfo,
    createInitialState
} from './scene-state.js';
import { renderScene } from './scene-renderer.js';
import { EffectManager } from './effects.js';

const state = createInitialState();
let refreshIntervalId = null;
let clockIntervalId = null;
let effectManager = null;

const elements = {
    body: document.body,
    container: document.querySelector('.container'),
    sceneStage: document.getElementById('sceneStage'),
    windowShell: document.getElementById('windowShell'),
    weatherWindow: document.getElementById('weatherWindow'),
    skyLayer: document.getElementById('skyLayer'),
    weatherDisplay: document.getElementById('weatherDisplay'),
    moonDisplay: document.getElementById('moonDisplay'),
    horizonLineLeft: document.getElementById('horizonLineLeft'),
    horizonLineRight: document.getElementById('horizonLineRight'),
    distantLayer: document.getElementById('distantLayer'),
    atmosphereLayer: document.getElementById('atmosphereLayer'),
    precipitationLayer: document.getElementById('precipitationLayer'),
    wildlifeLayer: document.getElementById('wildlifeLayer'),
    foregroundLayer: document.getElementById('foregroundLayer'),
    surroundingsTop: document.getElementById('surroundingsTop'),
    surroundingsLeft: document.getElementById('surroundingsLeft'),
    surroundingsRight: document.getElementById('surroundingsRight'),
    surroundingsBottom: document.getElementById('surroundingsBottom'),
    surroundingsLabel: document.getElementById('surroundingsLabel'),
    outdoorLabel: document.getElementById('outdoorLabel'),
    location: document.getElementById('location'),
    weatherInfo: document.getElementById('weatherInfo'),
    locationInputContainer: document.getElementById('locationInputContainer'),
    locationInput: document.getElementById('locationInput'),
    submitLocation: document.getElementById('submitLocation'),
    changeLocationBtn: document.getElementById('changeLocationBtn'),
    devToggleBtn: document.getElementById('devToggleBtn'),
    devToolsContainer: document.getElementById('devToolsContainer'),
    weatherCodeInput: document.getElementById('weatherCodeInput'),
    testWeatherCodeBtn: document.getElementById('testWeatherCodeBtn'),
    outdoorProfileSelect: document.getElementById('outdoorProfileSelect'),
    surroundingsProfileSelect: document.getElementById('surroundingsProfileSelect'),
    temperatureToggle: document.getElementById('temperatureToggle'),
    themeToggle: document.getElementById('themeToggle')
};

function populateSelect(select, options, selected) {
    select.innerHTML = '';
    options.forEach((option) => {
        const el = document.createElement('option');
        el.value = option.value;
        el.textContent = option.label;
        if (option.value === selected) {
            el.selected = true;
        }
        select.appendChild(el);
    });
}

function setTemperatureUnit(unit, persist = true) {
    state.currentTemperatureUnit = unit;
    elements.temperatureToggle.querySelectorAll('.temperature-option').forEach((option) => {
        option.classList.toggle('active', option.dataset.unit === unit);
    });

    if (persist) {
        localStorage.setItem('temperatureUnit', unit);
    }

    renderCurrentScene();
}

function setTheme(theme, persist = true) {
    state.theme = theme;
    elements.body.classList.toggle('light-mode', theme === 'light');
    elements.themeToggle.querySelectorAll('.theme-option').forEach((option) => {
        option.classList.toggle('active', option.dataset.theme === theme);
    });

    if (persist) {
        localStorage.setItem('theme', theme);
    }
}

function setDevMode(enabled, persist = true) {
    state.devMode = enabled;
    elements.container.classList.toggle('dev-mode-off', !enabled);
    elements.devToggleBtn.classList.toggle('active', enabled);
    elements.devToolsContainer.style.display = enabled ? 'flex' : 'none';

    if (persist) {
        localStorage.setItem('devMode', String(enabled));
    }

    renderCurrentScene();
}

function showLocationInput(show = true) {
    elements.locationInputContainer.style.display = show ? 'flex' : 'none';
    if (show) {
        elements.locationInput.focus();
    }
}

function renderCurrentScene() {
    const scene = buildSceneModel(state);
    renderScene(scene, elements);
    effectManager.update(scene);

    elements.location.textContent = scene.location.name || DEFAULT_LOCATION.name;
    elements.weatherInfo.textContent = buildWeatherInfo(
        scene,
        state.currentTemperatureUnit,
        state.devMode
    );

    elements.outdoorProfileSelect.value = scene.outdoorProfileKey;
    elements.surroundingsProfileSelect.value = scene.surroundingsProfileKey;

    document.querySelectorAll('.moon-phase-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.phase === state.manualMoonPhase);
    });

    document.querySelectorAll('.weather-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.weather === scene.weather.key);
    });
}

async function applyWeatherScene(weatherScene, updateUnitDefault = false) {
    state.weatherScene = weatherScene;
    state.currentLocation = weatherScene.location;
    state.currentCountryCode = weatherScene.location.countryCode || DEFAULT_LOCATION.countryCode;

    if (updateUnitDefault && !localStorage.getItem('temperatureUnit')) {
        setTemperatureUnit(getDefaultTemperatureUnit(state.currentCountryCode), false);
    }

    renderCurrentScene();
}

async function loadWeatherForLocation(location) {
    const weatherScene = await fetchWeatherForCoords(location);
    await applyWeatherScene(weatherScene, true);
}

function startRefreshLoop() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
    }

    refreshIntervalId = setInterval(async () => {
        if (!state.currentLocation) {
            return;
        }

        try {
            await loadWeatherForLocation(state.currentLocation);
        } catch (error) {
            console.error('Weather refresh failed:', error);
        }
    }, 600000);
}

function startClockLoop() {
    if (clockIntervalId) {
        clearInterval(clockIntervalId);
    }

    clockIntervalId = setInterval(() => {
        renderCurrentScene();
    }, 60000);
}

async function handleLocationSubmit() {
    const locationName = elements.locationInput.value.trim();
    if (!locationName) {
        elements.weatherInfo.textContent = 'Please enter a location.';
        return;
    }

    elements.location.textContent = 'Finding location...';

    try {
        const geocoded = await geocodeLocation(locationName);
        showLocationInput(false);
        await loadWeatherForLocation(geocoded);
        startRefreshLoop();
    } catch (error) {
        console.error('Location lookup failed:', error);
        elements.weatherInfo.textContent = 'Location not found. Try "City, Country".';
    }
}

function bindUi() {
    populateSelect(elements.outdoorProfileSelect, getOutdoorProfileOptions(), state.selectedOutdoorProfile || 'forest');
    populateSelect(elements.surroundingsProfileSelect, getSurroundingsProfileOptions(), state.selectedSurroundingsProfile);

    elements.outdoorProfileSelect.addEventListener('change', (event) => {
        state.selectedOutdoorProfile = event.target.value;
        renderCurrentScene();
    });

    elements.surroundingsProfileSelect.addEventListener('change', (event) => {
        state.selectedSurroundingsProfile = event.target.value;
        renderCurrentScene();
    });

    elements.temperatureToggle.querySelectorAll('.temperature-option').forEach((option) => {
        option.addEventListener('click', () => {
            setTemperatureUnit(option.dataset.unit);
        });
    });

    elements.themeToggle.querySelectorAll('.theme-option').forEach((option) => {
        option.addEventListener('click', () => {
            setTheme(option.dataset.theme);
        });
    });

    elements.changeLocationBtn.addEventListener('click', () => showLocationInput(true));
    elements.submitLocation.addEventListener('click', handleLocationSubmit);
    elements.locationInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleLocationSubmit();
        }
    });

    elements.devToggleBtn.addEventListener('click', () => {
        setDevMode(!state.devMode);
    });

    document.querySelectorAll('.weather-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            const currentLocation = state.currentLocation || DEFAULT_LOCATION;
            const mockScene = createMockSceneFromWeatherKey(button.dataset.weather, currentLocation);
            await applyWeatherScene(mockScene);
        });
    });

    document.querySelectorAll('.moon-phase-btn').forEach((button) => {
        button.addEventListener('click', () => {
            state.manualMoonPhase = button.dataset.phase;
            renderCurrentScene();
        });
    });

    elements.testWeatherCodeBtn.addEventListener('click', async () => {
        const currentLocation = state.currentLocation || DEFAULT_LOCATION;
        try {
            const mockScene = createSceneFromWeatherCode(elements.weatherCodeInput.value, currentLocation);
            await applyWeatherScene(mockScene);
        } catch (error) {
            console.error(error);
            elements.weatherInfo.textContent = 'Enter a weather code from 0 to 99.';
        }
    });

    elements.weatherCodeInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            elements.testWeatherCodeBtn.click();
        }
    });

    window.addEventListener('resize', () => {
        renderCurrentScene();
    });
}

async function init() {
    effectManager = new EffectManager({
        skyLayer: elements.skyLayer,
        atmosphereLayer: elements.atmosphereLayer,
        precipitationLayer: elements.precipitationLayer,
        wildlifeLayer: elements.wildlifeLayer
    });

    bindUi();

    const savedUnit = localStorage.getItem('temperatureUnit');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedDevMode = localStorage.getItem('devMode') === 'true';

    setTheme(savedTheme, false);
    setDevMode(savedDevMode, false);
    setTemperatureUnit(savedUnit || state.currentTemperatureUnit, false);

    try {
        const detectedLocation = await getLocation();
        await loadWeatherForLocation(detectedLocation);
    } catch (error) {
        console.error('Geolocation failed, using default location:', error);
        await loadWeatherForLocation(DEFAULT_LOCATION);
    }

    startRefreshLoop();
    startClockLoop();
}

init().catch((error) => {
    console.error('App init failed:', error);
    elements.location.textContent = DEFAULT_LOCATION.name;
    elements.weatherInfo.textContent = 'Unable to load live weather. Developer buttons still work.';
    state.weatherScene = createMockSceneFromWeatherKey('clear', DEFAULT_LOCATION);
    renderCurrentScene();
});
