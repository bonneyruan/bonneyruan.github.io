// Weather condition mappings
const weatherConditions = {
    rain: ['rain', 'drizzle', 'shower'],
    snow: ['snow', 'sleet', 'blizzard'],
    clouds: ['clouds', 'overcast'],
    fog: ['fog', 'mist', 'haze'],
    clear: ['clear', 'sunny'],
    thunderstorm: ['thunderstorm', 'storm'],
    wind: ['wind', 'windy']
};

// ASCII art for different weather conditions
const asciiArt = {
    clear: `    
          \\ .|. /
          :::::::::
          ──:::::::::::──
          ::::::::::
          ':::::::'
          / .|. \\
    `,
    moon: {
        new: `
       ....    
       '        '    
   :           :
    :           : 
   '          '
   '..___..'
      `, 
        waxingCrescent: `
      ....    
      .  .:::::.    
  :  .::::::::
   :  ::::::::: 
  '  :::::::'
   ' .::'' `,
        firstQuarter: `
      ....    
      .    ::::.    
  :     ::::::
   :     :::::: 
  '     :::::'
   ' ...:::' 
      `,
        waxingGibbous: `
      ....    
      .     '::.    
  :      ::::
   :       :::: 
  '     .:::'
   '':::'' `,
        full: `
      ....    
      .::::::::.    
  :::::::::::
   :::::::::::: 
  ':::::::::'
        '':::''      `,
        waningGibbous: `
      ....    
      .::'     .    
  ::::      :
   ::::       : 
  ':::.     '
   '':::'' `,
        lastQuarter: `
      ....    
      .::::    .    
  ::::::     :
   ::::::     : 
  ':::::     '
   ':::... ' 
      `,
        waningCrescent: `
      ....    
      .:::::.  .    
  ::::::::.  :
   :::::::::  : 
  ':::::::  '
   ''::. ' `
    },
    clouds: `
       .--.     .--.
     .(    ). .(    ).
    (  .--.  )(  .--.  )
     .(    ). .(    ).
       '--'     '--'
    `,
    rain: `
         .--.
       .(    ).
      (  .--.  )
       .(    ).
         '--'
    `,
    snow: `
         .--.
       .(    ).
      (  .--.  )
       .(    ).
         '--'
    `,
    thunderstorm: `
         .--.
       .(    ).
      (  .--.  )
       .(    ).
         '--'
    `,
    wind: `
    ────  ────
      ────  ────
    ────  ────
    `
};

// Window frame ASCII
const windowFrame = {
    top: '┌─────────────────────────────────────────────────────────┐',
    side: '│',
    bottom: '└─────────────────────────────────────────────────────────┘'
};

window.asciiArt = asciiArt;

const runtime = window.WeatherWindow || {};
const requiredRuntimeKeys = [
    'DEFAULT_LOCATION',
    'WEATHER_TYPE_TO_CODE',
    'getDefaultTemperatureUnit',
    'mapWeatherCode',
    'buildLegacyWeatherData',
    'normalizeWeather',
    'normalizeCountryName',
    'geocodeLocation',
    'getLocation',
    'getWeather',
    'DIMENSIONS',
    'getResponsiveWeatherProfile',
    'getSceneLayout',
    'sceneState',
    'getCurrentWeatherData',
    'setScenePreferences',
    'applyWeatherScene',
    'updateSceneTextAndInfo',
    'updateCelestial',
    'updateTemperatureDisplay',
    'syncEffectState',
    'clearEffectState',
    'registerWindReactiveElement',
    'updateWindReactiveScene',
    'orchestrateEffects',
    'showLocationInput',
    'hideLocationInput',
    'checkAPIKey',
    'displayWeather',
    'rerenderCurrentWeatherScene',
    'setWeatherType',
    'testWeatherCode',
    'setMoonPhase'
];
const missingRuntimeKeys = requiredRuntimeKeys.filter((key) => !(key in runtime));

if (missingRuntimeKeys.length > 0) {
    const startupDisplay = document.getElementById('weatherDisplay');
    if (startupDisplay) {
        startupDisplay.textContent = 'Error loading weather modules';
    }
    throw new Error(`Missing WeatherWindow runtime exports: ${missingRuntimeKeys.join(', ')}`);
}

const {
    DEFAULT_LOCATION,
    WEATHER_TYPE_TO_CODE,
    getDefaultTemperatureUnit,
    mapWeatherCode,
    buildLegacyWeatherData,
    normalizeWeather,
    normalizeCountryName,
    geocodeLocation,
    getLocation,
    getWeather,
    DIMENSIONS,
    getResponsiveWeatherProfile,
    getSceneLayout,
    sceneState,
    getCurrentWeatherData,
    setScenePreferences,
    applyWeatherScene,
    updateSceneTextAndInfo,
    updateCelestial,
    updateTemperatureDisplay,
    syncEffectState,
    clearEffectState,
    registerWindReactiveElement,
    updateWindReactiveScene,
    orchestrateEffects,
    showLocationInput,
    hideLocationInput,
    checkAPIKey,
    displayWeather,
    rerenderCurrentWeatherScene,
    setWeatherType,
    testWeatherCode,
    setMoonPhase
} = window.WeatherWindow;

function updateSceneLayoutMetrics() {
    const weatherWindow = document.getElementById('weatherWindow');
    const tree = document.getElementById('foregroundLayer');
    if (!weatherWindow || !tree) return;

    const layout = getSceneLayout();
    sceneState.layout = layout;

    weatherWindow.style.setProperty('--scene-horizon-offset-percent', layout.horizonOffsetPercentCss);
    weatherWindow.style.setProperty('--scene-tree-bottom', `${layout.treeBottomPx}px`);
    weatherWindow.style.setProperty('--scene-tree-scale', `${layout.treeScale}`);
    weatherWindow.style.setProperty('--scene-horizon-font-size', `${layout.horizonFontScale}rem`);
    weatherWindow.style.setProperty('--scene-mask-width', `${layout.maskWidthRem}rem`);
    weatherWindow.style.setProperty('--scene-mask-height', `${layout.maskHeightRem}rem`);
    weatherWindow.style.setProperty('--scene-sky-cutoff-percent', layout.horizonOffsetPercentCss);

    createHorizonLine();
    createSideBorders();
}

function safeStorageGet(key) {
    try {
        return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (error) {
        return null;
    }
}

function safeStorageSet(key, value) {
    try {
        if (window.localStorage) {
            window.localStorage.setItem(key, value);
        }
    } catch (error) {
        // Ignore storage failures so local file mode still boots.
    }
}

window.resizeRerenderTimeout = null;

function getLocalTimeString(utcOffsetSeconds = null) {
    const now = new Date();

    if (utcOffsetSeconds !== null && utcOffsetSeconds !== undefined) {
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        const utcTime = utcHours + utcMinutes / 60;
        const utcOffsetHours = utcOffsetSeconds / 3600;
        const localTime = ((utcTime + utcOffsetHours) % 24 + 24) % 24;
        const localHours = Math.floor(localTime);
        const localMinutes = Math.floor((localTime - localHours) * 60);
        const displayHours = localHours === 0 ? 12 : localHours > 12 ? localHours - 12 : localHours;
        const ampm = localHours >= 12 ? 'PM' : 'AM';
        return `${displayHours}:${String(localMinutes).padStart(2, '0')} ${ampm}`;
    }

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

var animationInterval = null;
var rainInterval = null; // Separate interval for rain animation
var snowInterval = null; // Separate interval for snow animation
var fogInterval = null; // Separate interval for fog animation
var cloudInterval = null; // Separate interval for clouds when used with rain/snow
var windInterval = null; // Separate interval for wind animation
var lightningInterval = null; // Interval for lightning flashes
var hailInterval = null; // Interval for hail animation
var rimeInterval = null; // Interval for rime fog overlay
var treeAnimationInterval = null; // Interval for tree animation
let originalTreeLines = null; // Store original tree structure
var currentLocationCoords = null; // Store current location coordinates for sun calculations
var sunPositionInterval = null; // Interval for updating sun position
var moonPositionInterval = null; // Interval for updating moon position
var timeUpdateInterval = null; // Interval for updating time display every minute
var currentTemperatureUnit = 'C'; // 'C' for Celsius, 'F' for Fahrenheit
var currentCountryCode = null; // Store current country code for default unit

// Using Open-Meteo API (no API key required, free for non-commercial use)
// https://open-meteo.com


// Calculate sun position based on location and time
// If utcOffsetSeconds is provided, use it; otherwise fall back to browser timezone
function calculateSunPosition(lat, lon, utcOffsetSeconds = null) {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    // Calculate solar declination (angle of sun relative to equator)
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    
    // Get UTC time
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcTime = utcHours + utcMinutes / 60;
    
    // Calculate local time at the location
    let localTime;
    let standardMeridian;
    
    if (utcOffsetSeconds !== null && utcOffsetSeconds !== undefined) {
        // Use timezone offset from API (in seconds)
        const utcOffsetHours = utcOffsetSeconds / 3600; // Convert seconds to hours
        localTime = utcTime + utcOffsetHours;
        
        // Calculate standard meridian from UTC offset
        // UTC offset: positive = east of UTC, negative = west of UTC
        // Standard meridian = utcOffsetHours * 15
        // For UTC+3 (Moscow): standard meridian = 3 * 15 = 45°E ✓
        // For UTC-8 (PST): standard meridian = -8 * 15 = -120° (120°W) ✓
        standardMeridian = utcOffsetHours * 15;
        
    } else {
        // Fallback to browser timezone if API doesn't provide offset
        const timezoneOffsetMinutes = now.getTimezoneOffset();
        const timezoneOffsetHours = timezoneOffsetMinutes / 60;
        localTime = utcTime - timezoneOffsetHours; // Convert UTC to local
        standardMeridian = -timezoneOffsetHours * 15;
    }
    
    // Calculate longitude correction (difference from standard meridian)
    // Each degree of longitude = 4 minutes = 1/15 hour
    const longitudeCorrection = (lon - standardMeridian) / 15; // Hours
    
    // Local solar time = local clock time + longitude correction
    const solarTime = localTime + longitudeCorrection;
    
    
    // Calculate hour angle (how many hours from solar noon)
    const hourAngle = (solarTime - 12) * 15; // 15 degrees per hour
    
    // Convert to radians
    const latRad = lat * Math.PI / 180;
    const declRad = declination * Math.PI / 180;
    const hourRad = hourAngle * Math.PI / 180;
    
    // Calculate sun's altitude (elevation angle)
    const altitude = Math.asin(
        Math.sin(latRad) * Math.sin(declRad) +
        Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourRad)
    ) * 180 / Math.PI;
    
    // Calculate sun's azimuth (horizontal angle)
    // Azimuth: 0° = North, 90° = East, 180° = South, 270° = West
    // Standard formula for solar azimuth (measured clockwise from north)
    // Formula: azimuth = atan2(sin(hourAngle), cos(hourAngle) * sin(latitude) - tan(declination) * cos(latitude))
    let azimuth = Math.atan2(
        Math.sin(hourRad),
        Math.cos(hourRad) * Math.sin(latRad) - Math.tan(declRad) * Math.cos(latRad)
    ) * 180 / Math.PI;
    
    // The formula gives azimuth measured from north, clockwise
    // But we need to adjust for the standard convention where:
    // - Morning (negative hour angle): azimuth should be < 180° (east/south)
    // - Afternoon (positive hour angle): azimuth should be > 180° (south/west)
    // Add 180° to convert from the formula's convention to standard astronomical convention
    azimuth = azimuth + 180;
    
    // Normalize azimuth to 0-360
    let normalizedAzimuth = (azimuth + 360) % 360;
    
    
    // Calculate sunrise and sunset times
    const sunriseHourAngle = Math.acos(-Math.tan(latRad) * Math.tan(declRad)) * 180 / Math.PI;
    const sunriseSolarTime = 12 - sunriseHourAngle / 15;
    const sunsetSolarTime = 12 + sunriseHourAngle / 15;
    
    // Convert solar time to local time
    const sunriseLocal = sunriseSolarTime - longitudeCorrection;
    const sunsetLocal = sunsetSolarTime - longitudeCorrection;
    
    return {
        altitude: altitude, // -90 to 90 degrees (-90 = below horizon, 90 = directly overhead)
        azimuth: normalizedAzimuth, // 0-360 degrees (0=North, 90=East, 180=South, 270=West)
        sunrise: sunriseLocal,
        sunset: sunsetLocal,
        isDaytime: altitude > 0
    };
}

// Calculate moon position based on location and time
// If utcOffsetSeconds is provided, use it; otherwise fall back to browser timezone
function calculateMoonPosition(lat, lon, utcOffsetSeconds = null) {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    // Get UTC time
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcTime = utcHours + utcMinutes / 60;
    
    // Calculate local time at the location
    let localTime;
    
    if (utcOffsetSeconds !== null && utcOffsetSeconds !== undefined) {
        // Use timezone offset from API (in seconds)
        const utcOffsetHours = utcOffsetSeconds / 3600; // Convert seconds to hours
        localTime = utcTime + utcOffsetHours;
    } else {
        // Fallback to browser timezone if API doesn't provide offset
        const timezoneOffsetMinutes = now.getTimezoneOffset();
        const timezoneOffsetHours = timezoneOffsetMinutes / 60;
        localTime = utcTime - timezoneOffsetHours; // Convert UTC to local
    }
    
    // Calculate moon phase first (needed for moonrise timing)
    // Using a recent known new moon as reference for accurate calculation
    // February 17, 2026 was a new moon (adjusted to show correct phase for March 2026)
    const knownNewMoonDate = new Date(2026, 1, 17, 12, 0, 0); // February 17, 2026, 12:00 UTC
    const daysSinceKnownNewMoon = (now - knownNewMoonDate) / (1000 * 60 * 60 * 24);
    const moonPhase = (daysSinceKnownNewMoon % 29.53058867) / 29.53058867; // 0 to 1 (using precise lunar cycle)
    
    // Get sun position to determine sunrise/sunset times
    const sunPos = calculateSunPosition(lat, lon, utcOffsetSeconds);
    const sunriseTime = sunPos.sunrise;
    const sunsetTime = sunPos.sunset;
    
    // Moon rises at different times based on phase:
    // New moon (phase 0): rises at sunrise
    // First quarter (phase 0.25): rises at noon (~12 hours after sunrise)
    // Full moon (phase 0.5): rises at sunset (~12 hours after noon)
    // Last quarter (phase 0.75): rises at midnight (~12 hours after sunset)
    // Formula: moonrise = sunrise + (moonPhase * 24) hours
    let moonriseTime = sunriseTime + (moonPhase * 24);
    if (moonriseTime >= 24) moonriseTime -= 24; // Wrap around if > 24
    
    // Calculate hours since moonrise
    let hoursSinceMoonrise = localTime - moonriseTime;
    if (hoursSinceMoonrise < 0) hoursSinceMoonrise += 24; // Wrap around if before moonrise
    
    // Moon moves across sky similar to sun
    // Moon is at horizon at moonrise, overhead ~6 hours later, sets ~12 hours after rise
    // Calculate hour angle: moon is at horizon at moonrise (0°), overhead at +6h (90°), sets at +12h (180°)
    const moonHourAngle = (hoursSinceMoonrise - 6) * 15; // 15 degrees per hour
    
    // Moon's declination varies less than sun (±28.5 vs ±23.45)
    // Simplified: use a moderate declination
    const moonDeclination = 15 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
    
    // Convert to radians
    const latRad = lat * Math.PI / 180;
    const declRad = moonDeclination * Math.PI / 180;
    const hourRad = moonHourAngle * Math.PI / 180;
    
    // Calculate moon's altitude (elevation angle)
    const altitude = Math.asin(
        Math.sin(latRad) * Math.sin(declRad) +
        Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourRad)
    ) * 180 / Math.PI;
    
    // Calculate moon's azimuth (horizontal angle)
    // Moon always rises from the east (90°) and moves west (270°)
    // Similar to sun: 90° = East, 180° = South, 270° = West
    let azimuth;
    if (hoursSinceMoonrise < 12) {
        // Moon rising: east (90°) to west (270°)
        // First 6 hours: east to south (90° to 180°)
        // Next 6 hours: south to west (180° to 270°)
        if (hoursSinceMoonrise < 6) {
            azimuth = 90 + (hoursSinceMoonrise / 6) * 90; // 90° to 180°
        } else {
            azimuth = 180 + ((hoursSinceMoonrise - 6) / 6) * 90; // 180° to 270°
        }
    } else {
        // Moon setting: west (270°) to east (90°) via north
        // After 12 hours, moon continues west and wraps around
        const hoursPast12 = hoursSinceMoonrise - 12;
        if (hoursPast12 < 6) {
            azimuth = 270 + (hoursPast12 / 6) * 90; // 270° to 360° (0°)
        } else {
            azimuth = (hoursPast12 - 6) / 6 * 90; // 0° to 90°
        }
    }
    
    // Normalize azimuth to 0-360
    const normalizedAzimuth = (azimuth + 360) % 360;
    
    // Calculate moon phase name from calculated value
    let phaseName;
    if (moonPhase < 0.03 || moonPhase > 0.97) {
        phaseName = 'new';
    } else if (moonPhase < 0.22) {
        phaseName = 'waxingCrescent';
    } else if (moonPhase < 0.28) {
        phaseName = 'firstQuarter';
    } else if (moonPhase < 0.47) {
        phaseName = 'waxingGibbous';
    } else if (moonPhase < 0.53) {
        phaseName = 'full';
    } else if (moonPhase < 0.72) {
        phaseName = 'waningGibbous';
    } else if (moonPhase < 0.78) {
        phaseName = 'lastQuarter';
    } else {
        phaseName = 'waningCrescent';
    }
    
    return {
        altitude: altitude, // -90 to 90 degrees
        azimuth: normalizedAzimuth, // 0-360 degrees
        isVisible: altitude > -6, // Visible if above civil twilight
        phase: phaseName, // Moon phase name
        phaseValue: moonPhase // 0 to 1
    };
}

// Calculate if moon should be visible based on realistic factors
function shouldShowMoon(moonPos, sunPos) {
    // Must be above horizon (civil twilight threshold)
    if (moonPos.altitude < -6) return false;
    
    // New moon is invisible
    if (moonPos.phase === 'new') return false;
    
    // Keep the sky focused on one celestial body at a time:
    // if the sun is visible enough for us to render it, hide the moon.
    if (sunPos.altitude >= -6) return false;
    
    // During nighttime, all phases are visible (except new moon, already checked)
    return true;
}

// Position moon in the window based on its altitude and azimuth
function positionMoon(weatherData) {
    const display = document.getElementById('moonDisplay');
    if (!display) return;
    // Ensure moon display has moon class
    display.classList.add('moon');
    
    // Get location coordinates
    let lat, lon;
    if (currentLocationCoords) {
        lat = currentLocationCoords.lat;
        lon = currentLocationCoords.lon;
    } else if (weatherData && weatherData.coord) {
        lat = weatherData.coord.lat;
        lon = weatherData.coord.lon;
    } else if (currentLocation && currentLocation.lat && currentLocation.lon) {
        lat = currentLocation.lat;
        lon = currentLocation.lon;
    } else {
        lat = DEFAULT_LOCATION.lat;
        lon = DEFAULT_LOCATION.lon;
    }
    
    // Get UTC offset from weather data if available
    const utcOffsetSeconds = weatherData?.utc_offset_seconds ?? null;
    const moonPos = calculateMoonPosition(lat, lon, utcOffsetSeconds);
    
    // Get sun position to check visibility
    const sunPos = calculateSunPosition(lat, lon, utcOffsetSeconds);
    
    // Check if moon should be visible using realistic visibility calculation
    if (!shouldShowMoon(moonPos, sunPos)) {
        display.style.display = 'none';
        display.textContent = '';
        return;
    }
    
    // Show the moon
    display.style.display = 'block';
    
    // Get the appropriate moon phase ASCII art
    const moonPhaseArt = asciiArt.moon[moonPos.phase] || asciiArt.moon.full;
    display.textContent = moonPhaseArt;
    
    const sceneLayout = getSceneLayout();
    const horizonPosition = sceneLayout.horizonTopPercent;
    const minSkyTop = sceneLayout.skyTopPercent;
    const maxSkyTop = sceneLayout.skyBottomPercent;
    
    const maxAltitude = 90;
    
    // Note: Moon can be visible during daytime, especially:
    // - Last quarter moon (rises at midnight) is high in sky at dawn
    // - First quarter moon (rises at noon) is high in sky at dusk
    // - Full moon can be visible during the day
    // Removed safety check that was incorrectly hiding moon during daytime
    
    // Calculate vertical position
    let topPercent;
    if (moonPos.altitude < 0) {
        // Keep twilight moon tucked just above the horizon, never below the floor.
        topPercent = maxSkyTop;
        display.style.opacity = '0.4';
        display.style.filter = 'brightness(0.6)';
    } else {
        // Map altitude to position: altitude 0 = horizon (90%), altitude 90 = top (10%)
        const normalizedAltitude = Math.max(0, Math.min(maxAltitude, moonPos.altitude));
        const altitudeRange = maxAltitude - 0;
        const normalizedValue = normalizedAltitude / altitudeRange;
        
        // Apply a curve for natural arc
        const curvedValue = Math.pow(normalizedValue, 0.7);
        
        // Map to vertical position: horizon (90%) to top (10%)
        topPercent = horizonPosition - (curvedValue * 80);
        
        // Adjust opacity based on altitude
        if (moonPos.altitude < 5) {
            // Just above horizon
            display.style.opacity = '0.7';
            display.style.filter = 'brightness(0.8)';
        } else if (moonPos.altitude < 15) {
            // Low in sky
            display.style.opacity = '0.85';
            display.style.filter = 'brightness(0.9)';
        } else {
            // Higher in sky
            display.style.opacity = '0.9';
            display.style.filter = 'brightness(1)';
        }
    }

    topPercent = Math.max(minSkyTop, Math.min(maxSkyTop, topPercent));
    
    display.style.top = topPercent + '%';
    
    // Map azimuth to horizontal position (similar to sun)
    let leftPercent;
    
    if (moonPos.azimuth >= 90 && moonPos.azimuth <= 270) {
        // Moon is in the southern sky
        const azimuthRange = 270 - 90;
        const normalizedAzimuth = (moonPos.azimuth - 90) / azimuthRange;
        leftPercent = 10 + (normalizedAzimuth * 80);
    } else if (moonPos.azimuth < 90) {
        // Moon is in the northeast
        const normalizedAzimuth = moonPos.azimuth / 90;
        leftPercent = 5 + (normalizedAzimuth * 5);
    } else {
        // Moon is in the northwest
        const normalizedAzimuth = (moonPos.azimuth - 270) / 90;
        leftPercent = 90 + (normalizedAzimuth * 5);
    }
    
    display.style.left = leftPercent + '%';
    display.style.transform = 'translate(-50%, -50%)';
}

// Position sun in the window based on its altitude and azimuth
function positionSun(weatherData) {
    const display = document.getElementById('sunDisplay');
    if (!display) return;
    // If sun class isn't set yet, set it now (allows immediate positioning)
    if (!display.classList.contains('sun')) {
        display.classList.add('sun');
    }
    
    // Get location coordinates
    let lat, lon;
    if (currentLocationCoords) {
        lat = currentLocationCoords.lat;
        lon = currentLocationCoords.lon;
    } else if (weatherData && weatherData.coord) {
        lat = weatherData.coord.lat;
        lon = weatherData.coord.lon;
    } else if (currentLocation && currentLocation.lat && currentLocation.lon) {
        lat = currentLocation.lat;
        lon = currentLocation.lon;
    } else {
        // Use default location
        lat = DEFAULT_LOCATION.lat;
        lon = DEFAULT_LOCATION.lon;
    }
    
    // Get UTC offset from weather data if available
    const utcOffsetSeconds = weatherData?.utc_offset_seconds ?? null;
    
    const sunPos = calculateSunPosition(lat, lon, utcOffsetSeconds);
    
    const sceneLayout = getSceneLayout();
    const horizonPosition = sceneLayout.horizonTopPercent;
    const minSkyTop = sceneLayout.skyTopPercent;
    const maxSkyTop = sceneLayout.skyBottomPercent;
    
    // Map sun altitude to vertical position relative to horizon
    // Altitude: -90 (below horizon) to 90 (overhead)
    // When altitude = 0, sun is at horizon (90% from top)
    // When altitude > 0, sun is above horizon (< 90% from top)
    // When altitude < 0, sun is below horizon (> 90% from top)
    
    const maxAltitude = 90;
    const civilTwilightAltitude = -6; // Civil twilight ends when sun is 6° below horizon
    
    // Hide sun completely when it's nighttime (below civil twilight)
    if (sunPos.altitude < civilTwilightAltitude) {
        // Sun is below horizon - hide it completely
        display.style.display = 'none';
        display.textContent = ''; // Clear the ASCII art
        return;
    }
    
    // Safety check: if altitude seems wrong (too high for current time), clamp it
    // This prevents the sun from appearing at the top when it should be setting
    // Use the location's local time, not browser time
    const now = new Date();
    let localHour;
    if (utcOffsetSeconds !== null && utcOffsetSeconds !== undefined) {
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        const utcTime = utcHours + utcMinutes / 60;
        const utcOffsetHours = utcOffsetSeconds / 3600;
        // Ensure localHour is always positive by adding 24 before modulo
        localHour = ((utcTime + utcOffsetHours) % 24 + 24) % 24;
    } else {
        localHour = now.getHours(); // Fallback to browser time
    }
    // Only hide if it's clearly nighttime (after 10pm or before 4am) AND sun is very high
    // This is a safety check, but we trust the altitude calculation more
    if ((localHour >= 22 || localHour < 4) && sunPos.altitude > 45) {
        // Likely a calculation error, hide the sun
        display.style.display = 'none';
        display.textContent = '';
        return;
    }
    
    // Show the sun
    display.style.display = 'block';
    
    // Make sure the ASCII art is displayed
    display.textContent = asciiArt.clear || '';
    
    // Calculate vertical position
    let topPercent;
    if (sunPos.altitude < 0) {
        // Keep twilight sun just above the horizon instead of letting it sink into the floor.
        topPercent = maxSkyTop;
        display.style.opacity = '0.3';
        display.style.filter = 'hue-rotate(30deg) brightness(0.4)'; // Very dim orange/red
    } else {
        // Map altitude to position: altitude 0 = horizon (90%), altitude 90 = top (10%)
        // Use a curve that makes the sun move faster near horizon
        const normalizedAltitude = Math.max(0, Math.min(maxAltitude, sunPos.altitude));
        
        // Create a more natural arc: sun moves faster near horizon
        // Use a power function to create the arc effect
        const altitudeRange = maxAltitude - 0;
        const normalizedValue = normalizedAltitude / altitudeRange;
        
        // Apply a curve: higher altitudes compress more (sun moves slower at top)
        const curvedValue = Math.pow(normalizedValue, 0.7);
        
        // Map to vertical position: horizon (90%) to top (10%)
        // Range is 80% (from 10% to 90%)
        topPercent = horizonPosition - (curvedValue * 80);
        
        // Adjust opacity and color based on altitude (dimmer at sunrise/sunset)
        if (sunPos.altitude < 0) {
            // Below horizon but visible (twilight)
            display.style.opacity = '0.2';
            display.style.filter = 'hue-rotate(30deg) brightness(0.5)'; // Orange/red tint
        } else if (sunPos.altitude < 5) {
            // Just above horizon - sunrise/sunset
            display.style.opacity = '0.7';
            display.style.filter = 'hue-rotate(25deg)'; // Orange tint
        } else if (sunPos.altitude < 15) {
            // Low in sky
            display.style.opacity = '0.85';
            display.style.filter = 'hue-rotate(10deg)'; // Slight orange tint
        } else if (sunPos.altitude > 60) {
            // High in sky - bright
            display.style.opacity = '1';
            display.style.filter = 'none';
        } else {
            // Mid altitude - normal brightness
            display.style.opacity = '0.95';
            display.style.filter = 'none';
        }
    }

    topPercent = Math.max(minSkyTop, Math.min(maxSkyTop, topPercent));
    
    display.style.top = topPercent + '%';
    
    // Map azimuth to horizontal position
    // Azimuth: 90° = East (sunrise, left), 180° = South (noon, center), 270° = West (sunset, right)
    // For a typical view: East (90°) = left (10%), South (180°) = center (50%), West (270°) = right (90%)
    let leftPercent;
    
    if (sunPos.azimuth >= 90 && sunPos.azimuth <= 270) {
        // Sun is in the southern sky (morning to evening)
        // Map 90° (East) to 10%, 180° (South) to 50%, 270° (West) to 90%
        const azimuthRange = 270 - 90; // 180 degrees
        const normalizedAzimuth = (sunPos.azimuth - 90) / azimuthRange; // 0 to 1
        leftPercent = 10 + (normalizedAzimuth * 80); // 10% to 90%
    } else if (sunPos.azimuth < 90) {
        // Sun is in the northeast (early morning)
        // Map to left side, gradually moving toward center
        const normalizedAzimuth = sunPos.azimuth / 90; // 0 to 1
        leftPercent = 10 + (normalizedAzimuth * 5); // 10% to 15% (was 5% to 10%)
    } else {
        // Sun is in the northwest (late evening)
        // Map to right side, gradually moving from center
        const normalizedAzimuth = (sunPos.azimuth - 270) / 90; // 0 to 1
        leftPercent = 85 + (normalizedAzimuth * 5); // 85% to 90% (was 90% to 95%)
    }
    
    // Clamp horizontal position to ensure sun stays fully visible
    // Account for sun's size (max-width 70%) and centering transform
    // With translate(-50%, -50%), we need at least 35% margin on each side
    // Use 15% to 85% to provide safe margins
    leftPercent = Math.max(15, Math.min(85, leftPercent));
    
    // Use transform to center the sun at the calculated position
    display.style.left = leftPercent + '%';
    display.style.transform = 'translate(-50%, -50%)';
}

// Determine weather type
function getWeatherType(weatherMain) {
    const main = weatherMain.toLowerCase();
    
    for (const [type, conditions] of Object.entries(weatherConditions)) {
        if (conditions.some(cond => main.includes(cond))) {
            return type;
        }
    }
    
    return 'clear'; // default
}

// Create rain animation (I-beams falling)
function createRainAnimation(weatherData = null, clearContainer = true) {
    const container = document.getElementById('weatherAnimation');
    if (clearContainer) {
        container.innerHTML = '';
    }
    const containerHeight = DIMENSIONS.getWindowHeight();
    const responsiveProfile = getResponsiveWeatherProfile('rain');
    
    // Get precipitation intensity from actual weather data
    // Open-Meteo provides precipitation in mm, check both 1h and 3h values
    // If no precipitation data is available, use 0 (no rain) instead of defaulting
    const rainVolume = weatherData?.rain?.['1h'] ?? weatherData?.rain?.['3h'] ?? 
                       (weatherData?.current?.precipitation ?? 0);
    
    // Check weather code for different rain types and intensity levels
    const weatherCode = weatherData?.weather_code;
    const isFreezing = weatherCode === 66 || weatherCode === 67 || 
                       weatherCode === 56 || weatherCode === 57;
    const isDrizzle = weatherCode === 51 || weatherCode === 53 || weatherCode === 55 || weatherCode === 56 || weatherCode === 57;
    const isFreezingDrizzle = weatherCode === 56 || weatherCode === 57;
    const isRainShower = weatherCode >= 80 && weatherCode <= 82;

    const rainProfile = {
        51: { baseIntensity: 0.08, densityScale: 0.3, speedMin: 0.95, speedMax: 1.2 },
        53: { baseIntensity: 0.22, densityScale: 0.62, speedMin: 0.8, speedMax: 1.08 },
        55: { baseIntensity: 0.48, densityScale: 1.08, speedMin: 0.64, speedMax: 0.9 },
        56: { baseIntensity: 0.11, densityScale: 0.35, speedMin: 0.9, speedMax: 1.15 },
        57: { baseIntensity: 0.36, densityScale: 0.9, speedMin: 0.7, speedMax: 0.96 },
        61: { baseIntensity: 0.38, densityScale: 0.9, speedMin: 0.55, speedMax: 0.9 },
        63: { baseIntensity: 0.68, densityScale: 1.15, speedMin: 0.45, speedMax: 0.76 },
        65: { baseIntensity: 1.0, densityScale: 1.45, speedMin: 0.32, speedMax: 0.58 },
        66: { baseIntensity: 0.42, densityScale: 0.95, speedMin: 0.52, speedMax: 0.86 },
        67: { baseIntensity: 0.9, densityScale: 1.25, speedMin: 0.38, speedMax: 0.64 },
        80: { baseIntensity: 0.42, densityScale: 0.95, speedMin: 0.55, speedMax: 0.88 },
        81: { baseIntensity: 0.72, densityScale: 1.22, speedMin: 0.42, speedMax: 0.72 },
        82: { baseIntensity: 1.18, densityScale: 1.65, speedMin: 0.28, speedMax: 0.52 }
    }[weatherCode] || { baseIntensity: 0.5, densityScale: 1.0, speedMin: 0.4, speedMax: 0.8 };
    
    // Determine base intensity from weather code (before precipitation adjustment)
    let codeIntensity = rainProfile.baseIntensity;
    if (isRainShower) {
        // Rain shower codes: 80=slight, 81=moderate, 82=violent
        if (weatherCode === 80) {
            codeIntensity = 0.4; // Slight rain shower
        } else if (weatherCode === 81) {
            codeIntensity = 0.7; // Moderate rain shower
        } else if (weatherCode === 82) {
            codeIntensity = 1.2; // Violent rain shower (more intense than regular heavy)
        }
    } else if (weatherCode >= 61 && weatherCode <= 67) {
        // Regular rain codes: 61=slight, 63=moderate, 65=heavy
        // Freezing rain: 66=light, 67=heavy
        if (weatherCode === 61 || weatherCode === 66) {
            codeIntensity = 0.4; // Slight/light rain
        } else if (weatherCode === 63) {
            codeIntensity = 0.7; // Moderate rain
        } else if (weatherCode === 65 || weatherCode === 67) {
            codeIntensity = 1.0; // Heavy rain
        }
    }
    
    // Combine code intensity with precipitation volume
    // Use the higher of the two to ensure code-based intensity is respected
    let volumeIntensity = 0;
    if (rainVolume > 0) {
        if (rainVolume < 0.5) {
            volumeIntensity = 0.2;
        } else if (rainVolume < 1) {
            volumeIntensity = 0.3;
        } else if (rainVolume < 5) {
            volumeIntensity = 0.6;
        } else {
            volumeIntensity = 1.0;
        }
    }
    
    // Use the maximum of code intensity and volume intensity, but weight code intensity more
    let intensity = Math.max(codeIntensity, volumeIntensity * 0.7 + codeIntensity * 0.3);
    
    // Calculate spawn interval and density from both code profile and precipitation amount.
    const densityIntensity = Math.max(0.05, intensity * rainProfile.densityScale * responsiveProfile.densityScale);
    const spawnInterval = isDrizzle
        ? Math.max(85, 260 - (densityIntensity * 140))
        : Math.max(30, 180 - (densityIntensity * 120));
    const dropsPerSpawn = isDrizzle
        ? Math.max(1, Math.floor(1 + densityIntensity * 3))
        : Math.max(1, Math.floor(1 + densityIntensity * 4));
    const initialDrops = isDrizzle
        ? Math.max(2, Math.floor(10 * densityIntensity))
        : Math.max(3, Math.floor(18 * densityIntensity));
    
    function createRainDrop() {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.fontSize = `${0.65 * responsiveProfile.fontScale}rem`;
        
        // Choose character based on rain type
        if (isFreezing) {
            if (isFreezingDrizzle) {
                drop.textContent = '·'; // Small dot for freezing drizzle (lighter)
                drop.classList.add('freezing-drizzle-drop'); // Separate class for styling
                drop.style.fontSize = `${0.5 * responsiveProfile.fontScale}rem`;
            } else {
                drop.textContent = '◊'; // White diamond for freezing rain
                drop.classList.add('freezing-drop');
            }
        } else if (isDrizzle) {
            drop.textContent = '·'; // Small dot for drizzle
            drop.classList.add('drizzle-drop');
            drop.style.fontSize = `${0.5 * responsiveProfile.fontScale}rem`;
        } else {
            drop.textContent = 'I'; // Regular rain
        }
        drop.style.left = Math.random() * 100 + '%';
        // Start from random position above the container
        const startY = DIMENSIONS.percentToY(
            responsiveProfile.spawnTopMin +
            Math.random() * (responsiveProfile.spawnTopMax - responsiveProfile.spawnTopMin)
        );
        drop.style.top = startY + 'px';
        
        // Calculate stop position: can hit horizon line (90% from top) to bottom (100% from top)
        // Horizon line is at bottom: 10%, which means its top edge is at containerHeight * 0.9
        // The line itself is 1px tall, so it occupies that space
        // Bottom is at 100% from top = containerHeight
        const horizonY = DIMENSIONS.getHorizonY(); // Get horizon Y position dynamically
        const bottomY = containerHeight; // 100% from top (bottom)
        // Allow rain to hit and cover the horizon line - start stopping well above the line
        // Range from well above horizon line (to cover it) to bottom
        const horizonOffset = DIMENSIONS.SPACING.HORIZON_OFFSET_PX; // Allow particles to reach above horizon to ensure they hit and cover the line
        const stopStart = Math.max(horizonY - horizonOffset, containerHeight * responsiveProfile.stopMin);
        const stopEnd = Math.max(stopStart + 1, containerHeight * responsiveProfile.stopMax);
        const stopY = stopStart + Math.random() * (stopEnd - stopStart);
        
        // Calculate distance to fall (from start position to stop position)
        const fallDistance = stopY - startY;
        
        // Random fall speed
        const duration = Math.random() * (rainProfile.speedMax - rainProfile.speedMin) + rainProfile.speedMin;
        drop.style.animationDuration = duration + 's';
        drop.style.animationDelay = '0s';
        drop.style.animationFillMode = 'forwards'; // Keep at end position
        
        // Use CSS custom property to set the end position
        drop.style.setProperty('--end-y', `${fallDistance}px`);
        drop.style.animation = `fall ${duration}s linear forwards`;
        container.appendChild(drop);
        
        // When animation completes, transform into a splash
        drop.addEventListener('animationend', () => {
            // Get the final Y position (the element is already positioned by the fall animation)
            const finalY = stopY - startY;
            
            // Use different impact effects for freezing vs normal rain
            let impactChar;
            if (isFreezing) {
                // Freezing rain impact: mix of sparkles (ice crystal formation) and glaze marks (ice coating)
                const useSparkle = Math.random() < 0.5; // 50/50 split
                if (useSparkle) {
                    // Ice crystal formation - sparkle
                    impactChar = Math.random() < 0.5 ? '✦' : '✧';
                } else {
                    // Ice glaze mark - horizontal line
                    impactChar = Math.random() < 0.5 ? '─' : '━';
                }
                drop.textContent = impactChar;
                drop.classList.add('ice-impact'); // New class for ice impact styling
            } else {
                // Drizzle has a softer, less puddly impact than regular rain.
                if (isDrizzle) {
                    impactChar = Math.random() < 0.75 ? '.' : '·';
                } else {
                    // Normal rain splash
                    impactChar = Math.random() < 0.5 ? '.' : '~';
                }
                drop.textContent = impactChar;
                drop.classList.add('rain-splash');
            }
            // Keep freezing classes for additional styling
            if (isFreezingDrizzle) {
                drop.classList.add('freezing-drizzle-drop');
            } else if (isFreezing) {
                drop.classList.add('freezing-drop');
            }
            
            // Set the end position for the splash animation
            drop.style.setProperty('--end-y', `${finalY}px`);
            
            // Play splash animation and remove after it completes
            drop.style.animation = 'splash 0.6s ease-out forwards';
            
            // Remove after splash animation completes
            setTimeout(() => drop.remove(), 600);
        });
    }
    
    // Only create rain animation if there's actual precipitation
    if (intensity > 0) {
        // Create initial raindrops spread out
        for (let i = 0; i < initialDrops; i++) {
            setTimeout(() => createRainDrop(), i * (isDrizzle ? Math.max(45, 130 - densityIntensity * 35) : Math.max(25, 70 - densityIntensity * 20)));
        }
        
        // Rain showers have bursty/intermittent pattern
        if (isRainShower) {
            let isBurstPhase = true; // Start with a burst
            let burstCount = 0;
            let phaseStartTime = Date.now();
            
            function createShowerPattern() {
                const now = Date.now();
                const timeInPhase = now - phaseStartTime;
                
                if (isBurstPhase) {
                    // Burst phase - heavy rain (2-3 seconds)
                    // Make burst intensity vary by shower type: 82 (violent) is more intense
                    let burstMultiplier = 1.5; // Default burst multiplier
                    if (weatherCode === 82) {
                        burstMultiplier = 2.0; // Violent shower - much heavier bursts
                    } else if (weatherCode === 81) {
                        burstMultiplier = 1.7; // Moderate shower - heavier bursts
                    } else {
                        burstMultiplier = 1.3; // Slight shower - lighter bursts
                    }
                    const burstIntensity = densityIntensity * burstMultiplier;
                    const burstDrops = Math.min(
                        responsiveProfile.maxActive,
                        Math.floor(1 + burstIntensity * 4)
                    );
                    for (let i = 0; i < burstDrops; i++) {
                        createRainDrop();
                    }
                    
                    // Switch to light phase after 2-3 seconds
                    if (timeInPhase > (2000 + Math.random() * 1000)) {
                        isBurstPhase = false;
                        phaseStartTime = now;
                    }
                } else {
                    // Light phase - occasional drops (3-4 seconds)
                    if (Math.random() < 0.2) { // 20% chance of a drop
                        createRainDrop();
                    }
                    
                    // Switch back to burst phase after 3-4 seconds
                    if (timeInPhase > (3000 + Math.random() * 1000)) {
                        isBurstPhase = true;
                        phaseStartTime = now;
                    }
                }
            }
            
            if (rainInterval) clearInterval(rainInterval);
            rainInterval = setInterval(createShowerPattern, 100); // Check frequently
        } else {
            // Regular rain - continuous pattern
            if (rainInterval) clearInterval(rainInterval);
            rainInterval = setInterval(() => {
                // Create multiple drops per interval based on intensity
                for (let i = 0; i < Math.min(dropsPerSpawn, responsiveProfile.maxActive); i++) {
                    createRainDrop();
                }
            }, spawnInterval);
        }
    } else {
        // No rain - clear any existing rain animation
        if (rainInterval) clearInterval(rainInterval);
        rainInterval = null;
    }
}

// Create snow animation
function createSnowAnimation(weatherData = null, clearContainer = true) {
    const container = document.getElementById('weatherAnimation');
    if (clearContainer) {
        container.innerHTML = '';
    }
    const containerHeight = DIMENSIONS.getWindowHeight();
    const responsiveProfile = getResponsiveWeatherProfile('snow');
    
    // Get snow intensity from actual weather data
    // Open-Meteo provides precipitation in mm, check both 1h and 3h values
    // If no precipitation data is available, use 0 (no snow) instead of defaulting
    const snowVolume = weatherData?.snow?.['1h'] ?? weatherData?.snow?.['3h'] ?? 
                       (weatherData?.current?.precipitation ?? 0);
    
    // Get temperature to determine how long snow sticks around (colder = longer)
    // Temperature is in Celsius from the API
    const temperature = weatherData?.main?.temp ?? 0;
    
    // Check if this is a snow shower (codes 85-86)
    const weatherCode = weatherData?.weather_code;
    const isSnowShower = weatherCode >= 85 && weatherCode <= 86;
    const isSnowGrains = weatherCode === 77;
    
    // Determine base intensity from weather code (before precipitation adjustment)
    let codeIntensity = 0.5; // Default moderate
    if (isSnowShower) {
        // Snow shower codes: 85=slight, 86=heavy
        if (weatherCode === 85) {
            codeIntensity = 0.4; // Slight snow shower
        } else if (weatherCode === 86) {
            codeIntensity = 1.0; // Heavy snow shower
        }
    } else if (weatherCode >= 71 && weatherCode <= 77) {
        // Regular snow codes: 71=slight, 73=moderate, 75=heavy, 77=snow grains
        if (weatherCode === 71) {
            codeIntensity = 0.3; // Slight snow
        } else if (weatherCode === 73) {
            codeIntensity = 0.6; // Moderate snow
        } else if (weatherCode === 75) {
            codeIntensity = 1.0; // Heavy snow
        } else if (weatherCode === 77) {
            codeIntensity = 0.4; // Snow grains (lighter)
        }
    }
    
    // Combine code intensity with precipitation volume
    let volumeIntensity = 0;
    if (snowVolume > 0) {
        if (snowVolume < 0.5) {
            volumeIntensity = 0.2;
        } else if (snowVolume < 1) {
            volumeIntensity = 0.3;
        } else if (snowVolume < 5) {
            volumeIntensity = 0.6;
        } else {
            volumeIntensity = 1.0;
        }
    }
    
    // Use the maximum of code intensity and volume intensity, but weight code intensity more
    let intensity = Math.max(codeIntensity, volumeIntensity * 0.7 + codeIntensity * 0.3);
    
    // If snowVolume is 0 or undefined and code intensity is also 0, intensity stays 0 (no snow animation)
    if (intensity === 0 && (snowVolume === 0 || snowVolume === undefined)) {
        intensity = 0;
    }
    
    // Calculate spawn interval based on intensity (lower = more frequent)
    // Light: 300ms, Moderate: 200ms, Heavy: 100ms
    const spawnInterval = isSnowGrains
        ? Math.max(80, 200 - (intensity * 80 * responsiveProfile.densityScale))
        : Math.max(110, 320 - (intensity * 200 * responsiveProfile.densityScale));
    // Number of flakes per spawn (light: 1, moderate: 2-3, heavy: 3-4)
    const flakesPerSpawn = isSnowGrains
        ? Math.max(1, Math.floor(1 + intensity * 4 * responsiveProfile.densityScale))
        : Math.max(1, Math.floor(1 + intensity * 3 * responsiveProfile.densityScale));
    
    function createSnowflake() {
        const flake = document.createElement('div');
        flake.className = isSnowGrains ? 'snowflake snow-grain' : 'snowflake';
        flake.textContent = isSnowGrains ? (Math.random() < 0.5 ? '·' : '•') : '*';
        flake.style.fontSize = `${(isSnowGrains ? 0.45 : 0.65) * responsiveProfile.fontScale}rem`;
        flake.style.left = Math.random() * 100 + '%';
        // Start from random position above the container
        const startY = DIMENSIONS.percentToY(
            responsiveProfile.spawnTopMin +
            Math.random() * (responsiveProfile.spawnTopMax - responsiveProfile.spawnTopMin)
        );
        flake.style.top = startY + 'px';
        
        // Calculate stop position: can hit horizon line (90% from top) to bottom (100% from top)
        // Horizon line is at bottom: 10%, which means its top edge is at containerHeight * 0.9
        // The line itself is 1px tall, so it occupies that space
        // Bottom is at 100% from top = containerHeight
        const horizonY = DIMENSIONS.getHorizonY(); // Get horizon Y position dynamically
        const bottomY = containerHeight; // 100% from top (bottom)
        const horizonOffset = DIMENSIONS.SPACING.SNOW_HORIZON_OFFSET_PX; // Allow particles to reach above horizon to ensure they hit and cover the line
        
        // For snow, allow it to hit and cover the horizon line
        // Some snowflakes should specifically target the horizon line to accumulate
        let stopY;
        
        // 50% chance to specifically target the horizon line area for accumulation
        if (Math.random() < 0.5) {
            // Target horizon line area - allow particles to stop well above the line to cover it
            // Range from 30px above horizon to slightly below it (to cover the line)
            stopY = Math.max(horizonY - horizonOffset, containerHeight * responsiveProfile.stopMin) +
                Math.random() * ((horizonOffset + 5) * responsiveProfile.spreadScale); // Range around horizon
        } else {
            // Random position from well above horizon (to hit the line) to bottom
            const stopStart = Math.max(horizonY - horizonOffset, containerHeight * responsiveProfile.stopMin);
            const stopEnd = Math.max(stopStart + 1, containerHeight * responsiveProfile.stopMax);
            stopY = stopStart + Math.random() * (stopEnd - stopStart);
        }
        
        // Calculate distance to fall (from start position to stop position)
        const fallDistance = stopY - startY;
        const driftX = (isSnowGrains ? (Math.random() - 0.5) * 28 : (Math.random() - 0.5) * 100) * responsiveProfile.driftScale; // Snow grains drift less
        
        // Random fall speed (slower than rain)
        const duration = isSnowGrains ? (Math.random() * 1.2 + 1.5) : (Math.random() * 2 + 3); // Snow grains are finer/faster
        flake.style.animationDuration = duration + 's';
        flake.style.animationDelay = '0s';
        flake.style.animationFillMode = 'forwards'; // Keep at end position
        
        // Use CSS custom properties to set the end position
        flake.style.setProperty('--end-y', `${fallDistance}px`);
        flake.style.setProperty('--end-x', `${driftX}px`);
        flake.style.animation = `snowfall ${duration}s linear forwards`;
        container.appendChild(flake);
        
        // Calculate how long snow sticks around based on temperature
        // Colder temperatures = snow sticks longer
        // Formula: base duration increases as temperature decreases
        // At 0°C: base duration = 3 minutes
        // At -10°C: base duration = 5 minutes
        // At -20°C: base duration = 7 minutes
        // At 5°C: base duration = 1 minute (melts quickly)
        // Linear interpolation: duration = 3 + (0 - temp) * 0.2, clamped between 1-7 minutes
        const baseKeepDuration = isSnowGrains
            ? Math.max(8000, Math.min(35000, 18000 + (0 - temperature) * 1200))
            : Math.max(60000, Math.min(420000, 180000 + (0 - temperature) * 12000)); // 1-7 minutes
        
        // If snowflake is near horizon line, keep it even longer to accumulate on the floor
        const isNearHorizon = stopY >= (horizonY - horizonOffset) && stopY <= (horizonY + 5);
        const horizonMultiplier = isSnowGrains ? 1.0 : (isNearHorizon ? 2.0 : 1.0); // Snow grains accumulate much less
        const keepDuration = baseKeepDuration * horizonMultiplier;
        
        setTimeout(() => flake.remove(), (duration * 1000) + keepDuration);
    }
    
    // Only create snow animation if there's actual precipitation
    if (intensity > 0) {
        // Create initial snowflakes spread out
        const initialFlakes = Math.max(2, Math.floor((isSnowGrains ? 34 : 20) * intensity * responsiveProfile.densityScale));
        for (let i = 0; i < initialFlakes; i++) {
            setTimeout(() => createSnowflake(), i * (isSnowGrains ? 60 : 100));
        }
        
        // Snow showers have bursty/intermittent pattern
        if (isSnowShower) {
            let isBurstPhase = true; // Start with a burst
            let phaseStartTime = Date.now();
            
            function createShowerPattern() {
                const now = Date.now();
                const timeInPhase = now - phaseStartTime;
                
                if (isBurstPhase) {
                    // Burst phase - heavy snow (2-3 seconds)
                    // Make burst intensity vary by shower type: 86 (heavy) is more intense
                    let burstMultiplier = 1.5; // Default burst multiplier
                    if (weatherCode === 86) {
                        burstMultiplier = 2.0; // Heavy snow shower - much heavier bursts
                    } else {
                        burstMultiplier = 1.3; // Slight snow shower - lighter bursts
                    }
                    const burstIntensity = intensity * burstMultiplier;
                    const burstFlakes = Math.max(1, Math.floor(((isSnowGrains ? 2 : 1) + burstIntensity * (isSnowGrains ? 4 : 3)) * responsiveProfile.densityScale));
                    for (let i = 0; i < burstFlakes; i++) {
                        createSnowflake();
                    }
                    
                    // Switch to light phase after 2-3 seconds
                    if (timeInPhase > (2000 + Math.random() * 1000)) {
                        isBurstPhase = false;
                        phaseStartTime = now;
                    }
                } else {
                    // Light phase - occasional flakes (3-4 seconds)
                    if (Math.random() < 0.2) { // 20% chance of a flake
                        createSnowflake();
                    }
                    
                    // Switch back to burst phase after 3-4 seconds
                    if (timeInPhase > (3000 + Math.random() * 1000)) {
                        isBurstPhase = true;
                        phaseStartTime = now;
                    }
                }
            }
            
            if (snowInterval) clearInterval(snowInterval);
            snowInterval = setInterval(createShowerPattern, 150); // Check frequently
        } else {
            // Regular snow - continuous pattern
            // Use separate snowInterval so it doesn't get cleared by other animations
            if (snowInterval) clearInterval(snowInterval);
            snowInterval = setInterval(() => {
                // Create multiple flakes per interval based on intensity
                for (let i = 0; i < flakesPerSpawn; i++) {
                    createSnowflake();
                }
            }, spawnInterval);
        }
    } else {
        // No snow - clear any existing snow animation
        if (snowInterval) clearInterval(snowInterval);
        snowInterval = null;
    }
}

function createRimeFogEffect(weatherData = null, clearContainer = false) {
    const container = document.getElementById('weatherAnimation');
    if (!container) return;

    if (clearContainer) {
        container.innerHTML = '';
    }

    const horizonY = DIMENSIONS.getHorizonY();
    const windowHeight = DIMENSIONS.getWindowHeight();
    const responsiveProfile = getResponsiveWeatherProfile('rime');
    const baseTop = Math.max(horizonY - (18 * responsiveProfile.spreadScale), windowHeight * responsiveProfile.spawnTopMin);
    const rimeChars = ['::', '._', '._.', '.:', ':'];

    function createRimeMark() {
        const mark = document.createElement('div');
        mark.className = 'rime-mark';
        mark.textContent = rimeChars[Math.floor(Math.random() * rimeChars.length)];
        mark.style.fontSize = `${0.42 * responsiveProfile.fontScale}rem`;
        mark.style.left = 8 + Math.random() * 84 + '%';
        const lowerBandHeight = Math.max(12, windowHeight * (responsiveProfile.spawnTopMax - responsiveProfile.spawnTopMin));
        mark.style.top = `${baseTop + Math.random() * lowerBandHeight}px`;
        mark.style.opacity = (0.18 + Math.random() * 0.2).toFixed(2);
        mark.style.animationDuration = `${5 + Math.random() * 4}s`;
        mark.style.transform = `translateX(${(Math.random() - 0.5) * 8 * responsiveProfile.spreadScale}px)`;
        container.appendChild(mark);

        setTimeout(() => mark.remove(), 9000 + Math.random() * 4000);
    }

    for (let i = 0; i < Math.max(2, Math.floor(6 * responsiveProfile.densityScale)); i++) {
        setTimeout(createRimeMark, i * 220);
    }

    if (rimeInterval) clearInterval(rimeInterval);
    rimeInterval = setInterval(() => {
        const marksPerSpawn = Math.max(1, Math.min(responsiveProfile.maxActive, Math.floor((1 + Math.random() * 2) * responsiveProfile.densityScale)));
        for (let i = 0; i < marksPerSpawn; i++) {
            createRimeMark();
        }
    }, 2400);
}

// Create cloud animation
function createCloudAnimation(weatherData = null, clearContainer = true) {
    const display = document.getElementById('weatherDisplay');
    if (display) {
        display.textContent = '';
    }
    
    const container = document.getElementById('weatherAnimation');
    if (clearContainer) {
        container.innerHTML = '';
    }
    const containerWidth = DIMENSIONS.getWindowWidth();
    const containerHeight = DIMENSIONS.getWindowHeight();
    const responsiveProfile = getResponsiveWeatherProfile('cloud');
    
    // Get wind speed (default to 0 m/s if not available - will move very slowly)
    const windSpeed = weatherData?.wind?.speed ?? 0;
    
    // Calculate cloud movement duration based directly on wind speed
    // Cloud animation moves 1000px (from -200px to 800px)
    // Duration inversely proportional to wind speed with more dramatic contrast:
    // 0 m/s = 600 seconds (very slow, almost still)
    // 1 m/s = 500 seconds (barely moving)
    // 3 m/s = 400 seconds (gentle drift)
    // 5 m/s = 300 seconds (moderate movement)
    // 10 m/s = 150 seconds (noticeable movement)
    // 15 m/s = 100 seconds (fast movement)
    // 20+ m/s = 60 seconds (very fast movement)
    // Formula uses a gentler curve to make low wind speeds much slower
    // Base duration increased and multiplier reduced for slower overall movement
    const baseCloudDuration = Math.max(60, Math.min(600, 600 / (1 + windSpeed * 0.15)));
    
    // Determine cloudiness level (0-1) based on actual cloud cover percentage
    // Get cloud cover from weather data (0-100%)
    const cloudCoverPercent = weatherData?.clouds?.all ?? 0;
    // Convert percentage to 0-1 scale
    const cloudiness = cloudCoverPercent / 100;
    
    // If cloud cover is 0%, don't show any clouds
    if (cloudiness === 0) {
        if (clearContainer) {
            container.innerHTML = '';
        }
        return;
    }
    
    // Number of initial clouds based on cloud cover percentage
    // Scale: 0% = 0 clouds, 40% = 1 cloud, 80% = 2 clouds, 100% = 2-3 clouds (reduced by half)
    // Use ceiling to ensure we get at least 1 cloud for any cloudiness > 0
    const initialCloudCount = Math.max(1, Math.min(responsiveProfile.maxActive, Math.ceil(cloudiness * 2.5 * responsiveProfile.densityScale)));
    
    function createCloud(startFromOffScreen = false) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        // Create filled cloud ASCII art - use a design where interior is filled
        // Replace interior spaces with a character that will have background fill
        cloud.innerHTML = `
       .--.     .--.
     .(████). .(████).
    (██.--.██)(██.--.██)
     .(████). .(████).
       '--'     '--'
        `.replace(/█/g, '<span class="cloud-fill"> </span>');
        cloud.style.fontSize = `${0.65 * responsiveProfile.fontScale}rem`;
        const cloudTopPx = containerHeight * responsiveProfile.spawnTopMin;
        const cloudHeightPx = containerHeight * (responsiveProfile.spawnTopMax - responsiveProfile.spawnTopMin);
        cloud.style.top = `${cloudTopPx + Math.random() * cloudHeightPx}px`;
        
        // Random duration variation (80% to 120% of base)
        const duration = (baseCloudDuration / responsiveProfile.driftScale) * (0.8 + Math.random() * 0.4);
        
        // ALWAYS ensure animation is applied - set both duration and ensure animation property
        cloud.style.animationDuration = duration + 's';
        cloud.style.animationName = 'drift';
        cloud.style.animationTimingFunction = 'linear';
        cloud.style.animationFillMode = 'both';
        
        if (startFromOffScreen) {
            // Start from left side (off-screen) - animation will handle positioning
            // Animation starts at translateX(-200px), so cloud will be off-screen initially
            cloud.style.left = '0px';
            cloud.style.animationDelay = '0s';
        } else {
            // Start at random position within the window (already visible)
            // Animation goes from translateX(-200px) to translateX(800px)
            // Total range: 1000px (from -200 to +800)
            // To position cloud at startX pixels from left edge:
            // We need translateX value = startX - 0 = startX
            // Animation progress where translateX = startX:
            // startX = -200 + (progress * 1000)
            // progress = (startX + 200) / 1000
            const startX = Math.random() * Math.max(40, (containerWidth * responsiveProfile.spreadScale) - 50);
            cloud.style.left = '0px'; // Base position at left edge
            // Calculate animation progress (0 to 1) where cloud should appear
            const animationProgress = Math.max(0, Math.min(1, (startX + 200) / 1000));
            // Use negative delay to start animation partway through
            cloud.style.animationDelay = -(animationProgress * duration) + 's';
        }
        
        container.appendChild(cloud);
        
        // Force animation to start immediately by triggering a reflow
        // This ensures the negative delay takes effect right away
        void cloud.offsetHeight;
        
        // Remove after animation completes
        setTimeout(() => cloud.remove(), (duration + 5) * 1000);
    }
    
    // Create initial clouds already in the window
    // Stagger creation slightly to ensure all animations start properly
    for (let i = 0; i < initialCloudCount; i++) {
        setTimeout(() => {
            createCloud(false); // false = start in window
        }, i * 50); // Small delay between each cloud to ensure proper initialization
    }
    
    // Create new clouds that float in from the sides
    // Spawn rate should be proportional to cloud cover to maintain consistent density
    // Higher cloud cover = more frequent spawning and more clouds per spawn
    // Formula: interval = baseInterval / cloudiness, clamped to reasonable range
    // 100% = every 6 seconds, 50% = every 12 seconds, 25% = every 24 seconds
    const baseSpawnInterval = 6000; // Base interval for 100% cloud cover (6 seconds)
    const minInterval = 4000; // Minimum interval (4 seconds) for very high cloud cover
    const maxInterval = 30000; // Maximum interval (30 seconds) for very low cloud cover
    const newCloudInterval = cloudiness > 0 
        ? Math.max(minInterval, Math.min(maxInterval, baseSpawnInterval / cloudiness))
        : 999999;
    
    // Number of clouds to spawn per interval - proportional to cloud cover (reduced by half)
    // 100% = 1 cloud per spawn, 50% = 0.5 (rounds to 1), 25% = 0.25 (rounds to 1)
    // This helps maintain consistent density
    const cloudsPerSpawn = Math.max(1, Math.min(responsiveProfile.maxActive, Math.ceil(cloudiness * responsiveProfile.densityScale)));
    
    // Clear previous cloud interval if it exists
    if (cloudInterval) {
        clearInterval(cloudInterval);
    }
    
    // Only clear main animation interval if we're clearing the container (standalone clouds)
    // If called alongside rain/snow, keep the existing interval running
    if (clearContainer && animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    
    // Use a separate interval for clouds (only if cloudiness > 0)
    if (cloudiness > 0) {
        cloudInterval = setInterval(() => {
            // Spawn multiple clouds per interval based on cloud cover
            for (let i = 0; i < cloudsPerSpawn; i++) {
                // Stagger multiple clouds slightly so they don't all appear at once
                setTimeout(() => {
                    createCloud(true); // true = start from off-screen
                }, i * 200); // 200ms delay between each cloud in the batch
            }
        }, newCloudInterval);
    } else {
        // No clouds, clear any existing interval
        if (cloudInterval) {
            clearInterval(cloudInterval);
            cloudInterval = null;
        }
    }
    
    // Store in main interval only if clearing container (standalone clouds)
    if (clearContainer) {
        animationInterval = cloudInterval;
    }
}

// Create fog animation (wispy, less defined clouds)
function createFogAnimation(weatherData = null, clearContainer = true) {
    const container = document.getElementById('weatherAnimation');
    if (clearContainer) {
        container.innerHTML = '';
    }
    const containerWidth = container.offsetWidth || 600;
    const containerHeight = DIMENSIONS.getWindowHeight();
    const responsiveProfile = getResponsiveWeatherProfile('fog');
    
    // Get wind speed (fog moves very slowly)
    const windSpeed = weatherData?.wind?.speed ?? 0;
    // Fog moves much slower than clouds, with more dramatic contrast between low/high wind
    const baseDuration = 600; // Very slow base (slower than before)
    // Use gentler wind response - fog responds less to wind than clouds
    // At 0 m/s: multiplier = 1.0, duration = 600 seconds
    // At 5 m/s: multiplier = 0.7, duration = 420 seconds
    // At 10 m/s: multiplier = 0.4, duration = 240 seconds
    // At 20 m/s: multiplier = 0.2, duration = 120 seconds
    const windMultiplier = Math.max(0.2, 1.0 - (windSpeed / 12.5)); // Gentler response to wind
    const minDuration = 120; // Minimum 120 seconds (slower minimum)
    const maxDuration = 800; // Maximum 800 seconds (very slow)
    const baseFogDuration = Math.max(minDuration, Math.min(maxDuration, baseDuration * windMultiplier));
    
    // Determine fog density based on API weather data
    let fogDensity = 0.5; // Default moderate fog
    
    // Use visibility (in meters) - lower visibility = denser fog
    // OpenWeatherMap API provides visibility: 0-10000+ meters
    // Very low visibility (< 200m) = dense fog, high visibility (> 5000m) = light fog
    if (weatherData?.visibility !== undefined) {
        const visibility = weatherData.visibility; // in meters
        if (visibility < 200) {
            fogDensity = 0.95; // Very dense fog (visibility < 200m)
        } else if (visibility < 500) {
            fogDensity = 0.85; // Dense fog (200-500m)
        } else if (visibility < 1000) {
            fogDensity = 0.7; // Moderate fog (500-1000m)
        } else if (visibility < 2000) {
            fogDensity = 0.5; // Light fog (1000-2000m)
        } else {
            fogDensity = 0.3; // Very light fog (2000m+)
        }
    }
    
    // Also consider humidity - higher humidity can indicate denser fog
    // OpenWeatherMap API provides main.humidity: 0-100%
    if (weatherData?.main?.humidity !== undefined) {
        const humidity = weatherData.main.humidity; // 0-100%
        // Adjust density based on humidity (higher humidity = slightly denser fog)
        // Only adjust if humidity is very high (> 80%)
        if (humidity > 90) {
            fogDensity = Math.min(0.95, fogDensity + 0.1); // Increase density for very high humidity
        } else if (humidity > 80) {
            fogDensity = Math.min(0.9, fogDensity + 0.05); // Slight increase for high humidity
        }
    }
    
    // Fallback to description if visibility/humidity not available
    if (weatherData?.weather?.[0]?.description && (weatherData?.visibility === undefined)) {
        const desc = weatherData.weather[0].description.toLowerCase();
        if (desc.includes('dense') || desc.includes('thick') || desc.includes('heavy')) {
            fogDensity = 0.9; // Very dense fog
        } else if (desc.includes('light') || desc.includes('patchy')) {
            fogDensity = 0.3; // Light fog
        }
    }
    
    // Number of initial fog wisps based on density from API
    // Dense fog (0.9+) = 7-9 wisps, Moderate (0.5-0.7) = 5-7 wisps, Light (0.3) = 3-5 wisps
    const initialFogCount = Math.max(2, Math.min(responsiveProfile.maxActive, Math.floor((fogDensity * 6 + 3) * responsiveProfile.densityScale)));
    
    function createFogWisp(startFromOffScreen = false) {
        const fog = document.createElement('div');
        fog.className = 'fog-wisp';
        
        // Create wispy, less defined shapes - very scattered and ethereal
        // Use various wispy characters for a more misty appearance
        const wispyChars = ['~', '≈', '∿', '∼', '≋'];
        
        // Generate a random wispy pattern - organic, wider than tall, more scattered
        function generateWispyPattern() {
            const lines = [];
            // Fewer lines (2-4) for more horizontal emphasis, creating wider shapes
            const numLines = 2 + Math.floor(Math.random() * 3); // 2-4 lines (wider than tall)
            // Much wider horizontal spread (20-35 characters) for organic, elongated shapes
            const maxWidth = Math.max(10, Math.floor((20 + Math.random() * 15) * responsiveProfile.spreadScale)); // 20-35 characters wide
            
            for (let i = 0; i < numLines; i++) {
                let line = '';
                // More variable indentation for organic, irregular shapes
                const leadingSpaces = Math.floor(Math.random() * 8); // 0-7 spaces
                line = ' '.repeat(leadingSpaces);
                
                // Vary character count per line more organically
                // More characters in middle lines, fewer at edges for natural shape
                let numChars;
                if (i === 0 || i === numLines - 1) {
                    // Top and bottom lines: fewer characters (2-5)
                    numChars = 2 + Math.floor(Math.random() * 4);
                } else {
                    // Middle lines: more characters (4-8) for wider center
                    numChars = 4 + Math.floor(Math.random() * 5);
                }
                
                let currentPos = leadingSpaces;
                
                for (let j = 0; j < numChars; j++) {
                    // More variable spacing (1-6 spaces) for organic, irregular distribution
                    const spacing = 1 + Math.floor(Math.random() * 6);
                    line += ' '.repeat(spacing);
                    currentPos += spacing;
                    
                    // Add the wispy character
                    const char = wispyChars[Math.floor(Math.random() * wispyChars.length)];
                    line += char;
                    currentPos += 1;
                    
                    // Stop if we're getting too wide, but allow some overflow for organic look
                    if (currentPos >= maxWidth + 5) break;
                }
                
                // Add trailing spaces occasionally for more organic, irregular edges
                if (Math.random() > 0.7) {
                    const trailingSpaces = Math.floor(Math.random() * 4);
                    line += ' '.repeat(trailingSpaces);
                }
                
                lines.push(line);
            }
            return lines.join('\n');
        }
        
        const pattern = generateWispyPattern();
        
        fog.textContent = pattern;
        
        // Random vertical position (more spread out than clouds)
        fog.style.fontSize = `${0.65 * responsiveProfile.fontScale}rem`;
        const fogTopPx = containerHeight * responsiveProfile.spawnTopMin;
        const fogHeightPx = containerHeight * (responsiveProfile.spawnTopMax - responsiveProfile.spawnTopMin);
        fog.style.top = `${fogTopPx + Math.random() * fogHeightPx}px`;
        
        // Lower opacity for more ethereal look (0.5 to 0.8) - increased for visibility
        const opacity = 0.5 + Math.random() * 0.3;
        fog.style.opacity = opacity.toString();
        
        // Random duration variation (80% to 120% of base)
        const duration = (baseFogDuration / responsiveProfile.driftScale) * (0.8 + Math.random() * 0.4);
        fog.style.animationDuration = duration + 's';
        
        if (startFromOffScreen) {
            // Start from left side (off-screen)
            fog.style.animationDelay = '0s';
        } else {
            // Start at random position within the window
            const startX = Math.random() * Math.max(40, (containerWidth * responsiveProfile.spreadScale) - 50);
            const animationProgress = (startX + 300) / 1200; // 0 to 1
            fog.style.animationDelay = -(animationProgress * duration) + 's';
        }
        
        container.appendChild(fog);
        
        // Remove after animation completes
        setTimeout(() => fog.remove(), (duration + 5) * 1000);
    }
    
    // Create initial fog wisps already in the window
    for (let i = 0; i < initialFogCount; i++) {
        setTimeout(() => createFogWisp(false), i * 500); // Stagger initial creation
    }
    
    // Create new fog wisps that drift in from the sides
    // Frequency based on density from API: denser fog = more frequent spawning
    // Dense fog (0.9+) = 15-20s, Moderate (0.5-0.7) = 20-30s, Light (0.3) = 30-40s
    const newFogInterval = 30000 - (fogDensity * 15000); // 15-30 seconds between new wisps
    
    // Clear previous fog interval if it exists
    if (fogInterval) {
        clearInterval(fogInterval);
    }
    
    // Use a separate interval for fog so it doesn't interfere with other animations
    fogInterval = setInterval(() => {
        createFogWisp(true); // true = start from off-screen
    }, newFogInterval);
}

// Create wind animation
function createWindAnimation(weatherData = null, clearContainer = true) {
    const container = document.getElementById('weatherAnimation');
    if (clearContainer) {
        container.innerHTML = '';
    }
    const containerWidth = container.offsetWidth || 600;
    const containerHeight = container.offsetHeight || 400;
    
    // Get wind direction (degrees, 0-360) - direction wind is coming FROM
    // Default to 270° (West) if not available
    const windDeg = weatherData?.wind?.deg ?? 270;
    // Get wind speed (m/s) - default to 5 m/s if not available
    const windSpeed = weatherData?.wind?.speed ?? 5;
    
    // Convert wind direction to radians (wind is coming FROM this direction)
    // We need to reverse it to show where particles are going TO
    const windDirectionRad = ((windDeg + 180) % 360) * (Math.PI / 180);
    
    // Calculate base movement vector (where particles are going)
    let baseMoveX = Math.cos(windDirectionRad);
    let baseMoveY = Math.sin(windDirectionRad);
    
    // Create a gentler angle by making the movement more diagonal
    // This keeps particles visible longer as they cross the window
    // Reduce the steepness of vertical movement and enhance horizontal component
    const angleReduction = 0.5; // Reduce vertical component by 50% to make it gentler
    
    // Make the angle gentler - reduce steep vertical/horizontal components
    let moveX = baseMoveX;
    let moveY = baseMoveY * angleReduction; // Reduce vertical steepness
    
    // Add a slight horizontal bias to ensure diagonal movement
    // This makes particles travel more across the window
    if (Math.abs(moveX) < 0.3) {
        // If mostly vertical, add horizontal component
        moveX = moveX + (moveX >= 0 ? 0.4 : -0.4);
    }
    
    // Normalize the vector to maintain consistent speed
    const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
    if (magnitude > 0.01) {
        moveX = moveX / magnitude;
        moveY = moveY / magnitude;
    }
    
    // Ensure we don't go too steeply downward (to avoid floor)
    if (moveY > 0.4) {
        moveY = 0.4; // Cap downward movement at gentle angle
        // Re-normalize
        const newMagnitude = Math.sqrt(moveX * moveX + moveY * moveY);
        if (newMagnitude > 0.01) {
            moveX = moveX / newMagnitude;
            moveY = moveY / newMagnitude;
        }
    }
    
    // Note: We allow downward movement but will clamp end positions to avoid the floor
    
    // Calculate distance particles should travel - longer distance for gentler angles
    // Particles should cross the entire window diagonally, staying visible longer
    const travelDistance = Math.sqrt(containerWidth * containerWidth + containerHeight * containerHeight) + 300;
    
    // Adjust animation speed based on wind speed
    // Higher wind speed = faster animation (shorter duration)
    // Slower overall with more dramatic contrast between low/high wind
    // Base duration: 6 seconds for 5 m/s wind (slower than before)
    // Scale: 2s for 20+ m/s, 12s for 1 m/s (more dramatic difference)
    const baseDuration = 6.0; // Slower base duration
    const speedMultiplier = Math.max(0.33, Math.min(6.0, 6.0 / Math.max(windSpeed, 0.5))); // More dramatic scaling
    const baseAnimationDuration = baseDuration * speedMultiplier;
    
    function createWindParticle() {
        const particle = document.createElement('div');
        particle.className = 'wind-particle';
        particle.textContent = '─';
        
        // Determine starting position along the appropriate edge based on wind direction
        // NEVER start from bottom (floor) - adjust wind from South to start from sides or top
        // Wind coming FROM North (0°) means particles go TO South (start at top)
        // Wind coming FROM East (90°) means particles go TO West (start at right)
        let startX, startY;
        
        if (windDeg >= 315 || windDeg < 45) {
            // Wind from North (0°) or Northwest/Northeast - start at top
            startX = Math.random() * containerWidth;
            startY = -50; // Start above window
        } else if (windDeg >= 45 && windDeg < 135) {
            // Wind from East (90°) - start at right
            startX = containerWidth + 50; // Start to the right of window
            // Start in upper portion to avoid floor
            startY = Math.random() * (containerHeight * 0.9); // Top 90% of window
        } else if (windDeg >= 135 && windDeg < 225) {
            // Wind from South (180°) - DON'T start at bottom (floor)
            // Instead, start from left or right side, or top
            // Prefer starting from sides for more natural look
            if (Math.random() > 0.5) {
                // Start from left side
                startX = -50;
                startY = Math.random() * (containerHeight * 0.9); // Upper 90% of window
            } else {
                // Start from right side
                startX = containerWidth + 50;
                startY = Math.random() * (containerHeight * 0.9); // Upper 90% of window
            }
        } else {
            // Wind from West (270°) - start at left
            startX = -50; // Start to the left of window
            // Start in upper portion to avoid floor
            startY = Math.random() * (containerHeight * 0.9); // Top 90% of window
        }
        
        // Calculate end position based on direction
        let endX = startX + (moveX * travelDistance);
        let endY = startY + (moveY * travelDistance);
        
        // Clamp end position to never go below the floor (bottom of window)
        // Keep particles well above the floor (at least 30px from bottom)
        const floorLevel = containerHeight - 30;
        if (endY > floorLevel) {
            // Adjust end position to stay above floor
            // Calculate how much Y movement we can allow
            const allowedYMovement = Math.max(0, floorLevel - startY);
            if (allowedYMovement > 0 && Math.abs(moveY) > 0.01) {
                // Scale the movement proportionally
                const scaleFactor = allowedYMovement / (endY - startY);
                endX = startX + (moveX * travelDistance * scaleFactor);
                endY = floorLevel;
            } else {
                // If we can't move down at all, make it purely horizontal
                endX = startX + (moveX * travelDistance);
                endY = startY; // Keep at same height
            }
        }
        
        // Also ensure starting position is above floor
        if (startY > floorLevel) {
            startY = floorLevel - 10; // Adjust start to be above floor
        }
        
        // Set starting position
        particle.style.setProperty('--start-x', `${startX}px`);
        particle.style.setProperty('--start-y', `${startY}px`);
        
        // Set end position
        particle.style.setProperty('--end-x', `${endX}px`);
        particle.style.setProperty('--end-y', `${endY}px`);
        
        // Vary animation duration slightly for natural movement
        const duration = baseAnimationDuration * (0.8 + Math.random() * 0.4);
        particle.style.animationDuration = duration + 's';
        particle.style.animationDelay = Math.random() * 0.3 + 's';
        
        container.appendChild(particle);
        
        setTimeout(() => particle.remove(), (duration + 0.5) * 1000);
    }
    
    // Create initial particles spread out
    const initialParticleCount = Math.floor(15 + windSpeed * 2); // More particles for stronger wind
    for (let i = 0; i < initialParticleCount; i++) {
        setTimeout(() => createWindParticle(), i * 100);
    }
    
    // Use separate windInterval so it doesn't interfere with other animations
    if (windInterval) clearInterval(windInterval);
    // Spawn rate based on wind speed - stronger wind = more frequent particles
    const spawnInterval = Math.max(150, 400 - (windSpeed * 15));
    windInterval = setInterval(() => {
        const particlesPerSpawn = Math.floor(1 + windSpeed / 5); // 1-4 particles based on speed
        for (let i = 0; i < particlesPerSpawn; i++) {
            createWindParticle();
        }
    }, spawnInterval);
}

// Create thunderstorm animation
function createThunderstormAnimation(weatherData = null, clearContainer = true) {
    const container = document.getElementById('weatherAnimation');
    if (clearContainer) {
        container.innerHTML = '';
    }
    
    // Rain + lightning flashes (thunderstorms usually have heavy rain)
    createRainAnimation(weatherData, false); // Don't clear container, we already did or want overlapping
    
    // Calculate lightning frequency based on weather data
    // Get rain intensity (same calculation as rain animation)
    const rainVolume = weatherData?.rain?.['1h'] ?? weatherData?.rain?.['3h'] ?? 
                       (weatherData?.current?.precipitation ?? 0);
    
    let rainIntensity = 0;
    if (rainVolume > 0) {
        if (rainVolume < 0.5) {
            rainIntensity = 0.2;
        } else if (rainVolume < 1) {
            rainIntensity = 0.3;
        } else if (rainVolume < 5) {
            rainIntensity = 0.6;
        } else {
            rainIntensity = 1.0;
        }
    }
    
    // Get wind speed (stronger storms = more lightning)
    const windSpeed = weatherData?.wind?.speed ?? 0;
    const windIntensity = Math.min(windSpeed / 20, 1); // Normalize to 0-1 (20 m/s = max)
    
    // Get weather code to determine storm severity
    // Weather codes 95-99 = thunderstorms
    // 95 = thunderstorm
    // 96-99 = thunderstorm with hail (more intense)
    const weatherCode = weatherData?.weather_code ?? 95; // Default to 95 if not available
    const isSevereThunderstorm = weatherCode >= 96; // Hail = more intense
    const codeSeverity = isSevereThunderstorm ? 1.0 : (weatherCode === 95 ? 0.8 : 0.6);
    
    // Combine rain, wind, and weather code intensity for overall storm intensity
    const stormIntensity = Math.max(rainIntensity, windIntensity * 0.7, codeSeverity * 0.8);
    
    // Base lightning frequency on storm intensity
    // More intense storms = more frequent lightning
    // Light storm: 12-32 seconds between flashes
    // Moderate storm: 8-20 seconds
    // Heavy storm: 4-12 seconds
    const minInterval = 12000 - (stormIntensity * 8000); // 12000ms to 4000ms
    const maxInterval = 32000 - (stormIntensity * 12000); // 32000ms to 20000ms
    
    function flashLightning() {
        // Vary flash duration - some quick, some longer
        // Quick flashes: 50-100ms, Longer flashes: 100-200ms
        const flashDuration = Math.random() < 0.7 ? 
            Math.random() * 50 + 50 :  // 70% chance: quick flash (50-100ms)
            Math.random() * 100 + 100; // 30% chance: longer flash (100-200ms)
        
        // Vary flash intensity slightly (brightness)
        const brightness = Math.random() * 0.2 + 0.8; // 80-100% brightness
        const flashColor = `rgba(255, 255, 255, ${brightness})`;
        
        container.style.setProperty('background-color', flashColor, 'important');
        
        setTimeout(() => {
            container.style.setProperty('background-color', 'transparent', 'important');
            
            // Occasionally do a double flash (10% chance) - lightning can flash multiple times
            // More likely in severe storms
            const doubleFlashChance = isSevereThunderstorm ? 0.15 : 0.1;
            if (Math.random() < doubleFlashChance && stormIntensity > 0.5) {
                setTimeout(() => {
                    const secondFlashDuration = Math.random() * 50 + 30; // Quick second flash
                    container.style.setProperty('background-color', flashColor, 'important');
                    setTimeout(() => {
                        container.style.setProperty('background-color', 'transparent', 'important');
                    }, secondFlashDuration);
                }, Math.random() * 200 + 100); // 100-300ms after first flash
            }
        }, flashDuration);
    }
    
    // Schedule next lightning flash with random interval
    function scheduleNextFlash() {
        const nextInterval = Math.random() * (maxInterval - minInterval) + minInterval;
        
        if (lightningInterval) clearTimeout(lightningInterval);
        lightningInterval = setTimeout(() => {
            flashLightning();
            scheduleNextFlash(); // Schedule the next one
        }, nextInterval);
    }
    
    // Ensure the storm feels alive quickly with one early flash in the first few seconds.
    const firstFlashDelay = Math.random() * 2200 + 600; // 0.6s to 2.8s
    if (lightningInterval) clearTimeout(lightningInterval);
    lightningInterval = setTimeout(() => {
        flashLightning();
        scheduleNextFlash();
    }, firstFlashDelay);
    
    // Keep both intervals running - rain continues, lightning flashes
    // Note: animationInterval is used by rain, lightning runs separately
}

// Create hail animation (overlays on top of rain/thunderstorm)
function createHailAnimation(weatherData = null, clearContainer = false) {
    const container = document.getElementById('weatherAnimation');
    // Don't clear container - hail overlays on existing animations
    
    const containerHeight = DIMENSIONS.getWindowHeight();
    const responsiveProfile = getResponsiveWeatherProfile('hail');
    
    // Get weather code to determine hail intensity
    const weatherCode = weatherData?.weather_code ?? 96;
    let hailIntensity = 0.5; // Default moderate
    
    if (weatherCode === 96) {
        hailIntensity = 0.4; // Slight hail
    } else if (weatherCode === 99) {
        hailIntensity = 1.0; // Heavy hail
    }
    
    // Hail falls faster and is more sporadic than rain
    const spawnInterval = Math.max(90, 220 - (hailIntensity * 120 * responsiveProfile.densityScale)); // 90-220ms
    const particlesPerSpawn = Math.max(1, Math.min(responsiveProfile.maxActive, Math.floor(1 + hailIntensity * 3 * responsiveProfile.densityScale))); // 1-4 particles
    
    function createHailStone() {
        const hail = document.createElement('div');
        hail.className = 'hail-stone';
        hail.textContent = '•'; // Use bullet point for hail
        hail.style.fontSize = `${0.8 * responsiveProfile.fontScale}rem`;
        hail.style.left = Math.random() * 100 + '%';
        const startY = DIMENSIONS.percentToY(
            responsiveProfile.spawnTopMin +
            Math.random() * (responsiveProfile.spawnTopMax - responsiveProfile.spawnTopMin)
        );
        hail.style.top = startY + 'px';
        
        const horizonY = DIMENSIONS.getHorizonY();
        const stopStart = Math.max(horizonY, containerHeight * responsiveProfile.stopMin);
        const stopEnd = Math.max(stopStart + 1, containerHeight * responsiveProfile.stopMax);
        const stopY = stopStart + Math.random() * (stopEnd - stopStart);
        
        hail.style.setProperty('--start-y', `${startY}px`);
        hail.style.setProperty('--stop-y', `${stopY}px`);
        
        // Hail falls faster than rain
        const fallDuration = (0.3 + Math.random() * 0.2) * (1 - hailIntensity * 0.3); // 0.2-0.5s, faster for heavy hail
        
        hail.style.animation = `hailFall ${fallDuration}s linear forwards`;
        hail.style.animationDelay = Math.random() * 0.1 + 's';
        
        container.appendChild(hail);
        
        // Remove after animation
        setTimeout(() => hail.remove(), fallDuration * 1000 + 100);
    }
    
    // Create initial hail stones
    const initialHail = Math.max(2, Math.floor(10 * hailIntensity * responsiveProfile.densityScale));
    for (let i = 0; i < initialHail; i++) {
        setTimeout(() => createHailStone(), i * 50);
    }
    
    // Continue spawning hail
    if (hailInterval) clearInterval(hailInterval);
    hailInterval = setInterval(() => {
        for (let i = 0; i < particlesPerSpawn; i++) {
            createHailStone();
        }
    }, spawnInterval);
}

// Create freezing rain effect (visual indicator for freezing conditions)
function createFreezingRainEffect(weatherData = null, clearContainer = false) {
    const container = document.getElementById('weatherAnimation');
    
    // Freezing rain creates a subtle visual indicator
    // Add a class that CSS can style for freezing conditions
    container.classList.add('freezing-rain');
    
    // Could add ice particle animations here in the future
    // For now, the visual distinction comes from the class
}

// Set temperature unit and update display
function setTemperatureUnit(unit, updateDisplay = true) {
    currentTemperatureUnit = unit;
    setScenePreferences({ temperatureUnit: unit });
    safeStorageSet('temperatureUnit', unit);
    
    // Update toggle visual state
    const options = document.querySelectorAll('.temperature-option');
    options.forEach(option => {
        if (option.dataset.unit === unit) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Update display if weather data is available
    const currentWeatherData = getCurrentWeatherData();
    if (updateDisplay && currentWeatherData) {
        updateTemperatureDisplay(currentWeatherData);
    }
}

// Create natural-looking horizon line with varied characters
function createHorizonLine() {
    const leftLine = document.getElementById('horizonLineLeft');
    const rightLine = document.getElementById('horizonLineRight');
    
    if (!leftLine || !rightLine) return;
    
    // Get the weather window container to calculate proper width
    const sceneLayout = getSceneLayout();
    const containerWidth = sceneLayout.width;
    
    // Calculate character count for each line (50% minus gap for tree)
    // Assuming ~10px per character (monospace font at 1rem)
    const lineWidth = (containerWidth / 2) - DIMENSIONS.SPACING.TREE_GAP; // Leave gap for tree
    const charsPerLine = Math.max(8, Math.ceil(lineWidth / sceneLayout.charWidthPx));
    
    // Generate left horizon line with natural variation
    let leftText = '';
    for (let i = 0; i < charsPerLine; i++) {
        // Use random characters for natural variation
        // Weight towards regular dash characters with occasional variations
        const rand = Math.random();
        let char;
        if (rand < 0.7) {
            char = '─'; // Most common
        } else if (rand < 0.85) {
            char = '_'; // Occasional underscore
        } else {
            char = '·'; // Occasional dot for texture
        }
        leftText += char;
    }
    leftLine.textContent = leftText;
    
    // Generate right horizon line with natural variation
    let rightText = '';
    for (let i = 0; i < charsPerLine; i++) {
        // Use random characters for natural variation
        const rand = Math.random();
        let char;
        if (rand < 0.7) {
            char = '─'; // Most common
        } else if (rand < 0.85) {
            char = '_'; // Occasional underscore
        } else {
            char = '·'; // Occasional dot for texture
        }
        rightText += char;
    }
    rightLine.textContent = rightText;
}

// Create side borders
function createSideBorders() {
    const windowHeight = DIMENSIONS.getWindowHeight(); // Get dynamic window height
    const lineHeight = 1.2; // Match CSS line-height
    const fontSize = 16; // Match CSS font-size (1rem = 16px)
    const lines = Math.floor(windowHeight / (fontSize * lineHeight));
    
    const leftBorder = document.getElementById('frameLeft');
    const rightBorder = document.getElementById('frameRight');
    
    let borderText = '';
    for (let i = 0; i < lines; i++) {
        borderText += '│\n';
    }
    
    leftBorder.textContent = borderText;
    rightBorder.textContent = borderText;
}

// Tree animation functions
function getOriginalTreeLines() {
    if (!originalTreeLines) {
        const treePre = document.querySelector('.tree-background pre');
        if (treePre) {
            // Store HTML lines to preserve spans
            const htmlContent = treePre.innerHTML;
            originalTreeLines = htmlContent.split('\n').filter(line => line.trim());
        }
    }
    return originalTreeLines;
}

function shiftTreeLine(line, offset) {
    if (!line || line.trim() === '') return line;
    
    // Find the parentheses in the line (accounting for HTML tags)
    // Use a regex to find the opening and closing parentheses, ignoring HTML tags
    const leftParenMatch = line.match(/\(/);
    const rightParenMatch = line.match(/\)/);
    
    if (!leftParenMatch || !rightParenMatch) {
        // If it's the trunk (|||), shift it
        const trunkStart = line.indexOf('|');
        if (trunkStart !== -1) {
            const beforeTrunk = line.substring(0, trunkStart);
            const trunk = line.substring(trunkStart);
            const newOffset = Math.max(0, trunkStart + offset);
            return ' '.repeat(newOffset) + trunk;
        }
        return line;
    }
    
    const leftParen = leftParenMatch.index;
    const rightParen = rightParenMatch.index;
    
    // Calculate new positions
    const beforeLeft = line.substring(0, leftParen);
    const between = line.substring(leftParen + 1, rightParen);
    const afterRight = line.substring(rightParen + 1);
    
    // Shift the parentheses
    const newLeftPos = Math.max(0, leftParen + offset);
    
    // Reconstruct the line, preserving HTML spans in the between section
    return ' '.repeat(newLeftPos) + '(' + between + ')' + afterRight;
}

function animateTree(intensity = 'gentle') {
    const treePre = document.querySelector('.tree-background pre');
    if (!treePre) return;
    
    const originalLines = getOriginalTreeLines();
    if (!originalLines) return;
    
    let time = 0;
    const speed = intensity === 'storm' ? 0.12 : intensity === 'strong' ? 0.08 : 0.04;
    const maxOffset = intensity === 'storm' ? 1.5 : intensity === 'strong' ? 0.8 : 0.3;
    
    function update() {
        time += speed;
        
        // Create swaying motion (sine wave)
        const baseOffset = Math.sin(time) * maxOffset;
        
        // Apply different offsets to different rows for more natural sway
        const animatedLines = originalLines.map((line, index) => {
            // Top rows sway more, bottom rows (trunk) sway less
            const rowFactor = index < originalLines.length - 3 ? 
                (1 - (index / originalLines.length) * 0.5) : 0.15;
            const offset = Math.round(baseOffset * rowFactor);
            return shiftTreeLine(line, offset);
        });
        
        treePre.innerHTML = animatedLines.join('\n');
    }
    
    // Clear any existing tree animation
    if (treeAnimationInterval) {
        clearInterval(treeAnimationInterval);
    }
    
    // Update at 60fps for smooth animation
    treeAnimationInterval = setInterval(update, 16);
    update(); // Initial update
}

function stopTreeAnimation() {
    if (treeAnimationInterval) {
        clearInterval(treeAnimationInterval);
        treeAnimationInterval = null;
    }
    
    // Restore original tree
    const treePre = document.querySelector('.tree-background pre');
    if (treePre && originalTreeLines) {
        treePre.innerHTML = originalTreeLines.join('\n');
    }
}

function startTreeAnimation(intensity) {
    stopTreeAnimation(); // Stop any existing animation first
    animateTree(intensity);
}

Object.assign(window, {
    createRainAnimation,
    createSnowAnimation,
    createCloudAnimation,
    createFogAnimation,
    createThunderstormAnimation,
    createHailAnimation,
    createFreezingRainEffect,
    createRimeFogEffect,
    stopTreeAnimation,
    startTreeAnimation,
    positionSun,
    positionMoon,
    shouldShowMoon,
    calculateSunPosition,
    calculateMoonPosition,
    getLocalTimeString
});

window.WeatherWindow = window.WeatherWindow || {};
Object.assign(window.WeatherWindow, {
    safeStorageGet,
    safeStorageSet,
    setTemperatureUnit,
    updateSceneLayoutMetrics,
    getOriginalTreeLines
});
