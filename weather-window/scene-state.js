import {
    DEFAULT_LOCATION,
    getDefaultTemperatureUnit
} from './weather-data.js';
import {
    deriveOutdoorProfileKey,
    getOutdoorProfile,
    getSurroundingsProfile
} from './profiles.js';

const LUNAR_PHASES = [
    'new',
    'waxingCrescent',
    'firstQuarter',
    'waxingGibbous',
    'full',
    'waningGibbous',
    'lastQuarter',
    'waningCrescent'
];

const MOON_ART = {
    new: '   ..   \n .    . \n:      :\n .    . \n   ..   ',
    waxingCrescent: '   ..   \n .  ::: \n:   ::::\n .  ::: \n   ..   ',
    firstQuarter: '   ..   \n . ::::. \n:  :::::\n . ::::. \n   ..   ',
    waxingGibbous: '   ..   \n .::::: \n:::::::\n .::::: \n   ..   ',
    full: '   ..   \n .::::. \n:::::::\n .::::. \n   ..   ',
    waningGibbous: '   ..   \n :::::. \n:::::::\n :::::. \n   ..   ',
    lastQuarter: '   ..   \n .:::: \n:::::  \n .:::: \n   ..   ',
    waningCrescent: '   ..   \n :::  . \n::::   :\n :::  . \n   ..   '
};

export function createInitialState() {
    return {
        weatherScene: null,
        currentLocation: { ...DEFAULT_LOCATION },
        selectedOutdoorProfile: null,
        selectedSurroundingsProfile: 'minimalRoom',
        manualMoonPhase: 'auto',
        currentTemperatureUnit: 'C',
        currentCountryCode: DEFAULT_LOCATION.countryCode,
        devMode: false,
        theme: 'dark'
    };
}

function getLocalDate(utcOffsetSeconds = 0) {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + (utcOffsetSeconds * 1000));
}

function getMoonPhaseName(date) {
    const knownNewMoonDate = new Date('2024-01-11T11:57:00Z');
    const synodicMonth = 29.53058867;
    const daysSinceKnownNewMoon = (date - knownNewMoonDate) / (1000 * 60 * 60 * 24);
    const moonAge = ((daysSinceKnownNewMoon % synodicMonth) + synodicMonth) % synodicMonth;
    const index = Math.round((moonAge / synodicMonth) * (LUNAR_PHASES.length - 1));
    return LUNAR_PHASES[index];
}

function computeCelestialData(weather, manualMoonPhase = 'auto') {
    const localDate = getLocalDate(weather.utcOffsetSeconds);
    const hours = localDate.getHours() + (localDate.getMinutes() / 60);
    const sunProgress = (hours - 6) / 12;
    const sunVisible = sunProgress >= 0 && sunProgress <= 1 && weather.visibility > 250;
    const sunX = 10 + (sunProgress * 80);
    const sunY = 74 - (Math.sin(sunProgress * Math.PI) * 48);

    const moonPhase = manualMoonPhase === 'auto' ? getMoonPhaseName(localDate) : manualMoonPhase;
    const moonVisible = !sunVisible && weather.visibility > 250 && moonPhase !== 'new';
    const moonProgress = ((hours + 6) % 12) / 12;
    const moonX = 15 + (moonProgress * 70);
    const moonY = 72 - (Math.sin(moonProgress * Math.PI) * 42);

    return {
        localDate,
        isDay: sunVisible,
        periodLabel: sunVisible ? 'DAY' : 'NIGHT',
        sun: {
            visible: sunVisible,
            x: sunX,
            y: sunY
        },
        moon: {
            visible: moonVisible,
            x: moonX,
            y: moonY,
            phase: moonPhase,
            art: MOON_ART[moonPhase] || MOON_ART.full
        }
    };
}

function computeFogDensity(weather) {
    if (weather.main === 'Fog') {
        if (weather.visibility < 300) {
            return 0.9;
        }
        if (weather.visibility < 800) {
            return 0.7;
        }
        return 0.5;
    }

    if (weather.humidity > 85 && weather.visibility < 4000) {
        return 0.35;
    }

    return 0;
}

function getSkyMode(weather, celestial) {
    if (!celestial.isDay) {
        return 'night';
    }

    if (weather.cloudCover > 70 || weather.main === 'Thunderstorm') {
        return 'storm';
    }

    if (weather.cloudCover > 35) {
        return 'overcast';
    }

    return 'clear';
}

function buildActiveEffects(weather, celestial) {
    const effects = [];

    if (weather.cloudCover > 15) {
        effects.push('clouds');
    }
    if (weather.precipitationType === 'rain' || weather.precipitationType === 'drizzle' || weather.precipitationType === 'freezingRain') {
        effects.push('rain');
    }
    if (weather.precipitationType === 'snow') {
        effects.push('snow');
    }
    if (weather.main === 'Thunderstorm') {
        effects.push('thunderstorm');
    }
    if (weather.hasHail) {
        effects.push('hail');
    }
    if (computeFogDensity(weather) > 0) {
        effects.push('fog');
    }
    if (weather.windSpeed >= 9) {
        effects.push('wind');
    }
    if (weather.key === 'clear' && celestial.isDay && weather.cloudCover < 30) {
        effects.push('birds');
    }

    return effects;
}

export function formatTemperature(celsius, unit) {
    if (unit === 'F') {
        return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
}

export function buildWeatherInfo(scene, unit, devMode) {
    const { weather, celestial } = scene;
    const lines = [
        weather.description.toUpperCase(),
        `Temp: ${formatTemperature(weather.temperatureC, unit)}`,
        `Wind: ${weather.windSpeed.toFixed(1)} m/s`,
        `Cloud Cover: ${Math.round(weather.cloudCover)}%`
    ];

    if (weather.precipitationAmount > 0) {
        lines.push(`Precipitation: ${weather.precipitationAmount.toFixed(1)} mm/h`);
    }

    if (devMode || weather.humidity > 80) {
        lines.push(`Humidity: ${Math.round(weather.humidity)}%`);
    }

    if (devMode || weather.visibility < 10000) {
        const visibilityLabel = weather.visibility >= 1000
            ? `${(weather.visibility / 1000).toFixed(1)} km`
            : `${weather.visibility} m`;
        lines.push(`Visibility: ${visibilityLabel}`);
    }

    lines.push(`Sky: ${celestial.periodLabel}`);

    return lines.join('\n');
}

export function buildSceneModel(state) {
    const weatherScene = state.weatherScene;
    const baseScene = weatherScene || {
        location: { ...DEFAULT_LOCATION },
        weather: {
            code: 0,
            main: 'Clear',
            key: 'clear',
            description: 'clear sky',
            temperatureC: 18,
            humidity: 60,
            windSpeed: 3,
            windDirection: 270,
            cloudCover: 0,
            precipitationAmount: 0,
            precipitationType: 'none',
            visibility: 10000,
            hasHail: false,
            utcOffsetSeconds: Math.round(DEFAULT_LOCATION.lon / 15) * 3600
        }
    };

    const defaultOutdoorProfile = deriveOutdoorProfileKey(baseScene.location.name);
    const outdoorProfileKey = state.selectedOutdoorProfile || defaultOutdoorProfile;
    const surroundingsProfileKey = state.selectedSurroundingsProfile || 'minimalRoom';

    const celestial = computeCelestialData(baseScene.weather, state.manualMoonPhase);
    const fogDensity = computeFogDensity(baseScene.weather);

    return {
        location: baseScene.location,
        weather: baseScene.weather,
        outdoorProfileKey,
        surroundingsProfileKey,
        outdoorProfile: getOutdoorProfile(outdoorProfileKey),
        surroundingsProfile: getSurroundingsProfile(surroundingsProfileKey),
        celestial,
        fogDensity,
        skyMode: getSkyMode(baseScene.weather, celestial),
        activeEffects: buildActiveEffects(baseScene.weather, celestial),
        userPreferences: {
            unit: state.currentTemperatureUnit || getDefaultTemperatureUnit(baseScene.location.countryCode),
            theme: state.theme,
            devMode: state.devMode
        }
    };
}
