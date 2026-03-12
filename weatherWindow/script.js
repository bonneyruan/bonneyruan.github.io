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

// Centralized dimension constants and utilities
const DIMENSIONS = {
    WINDOW: {
        DEFAULT_WIDTH: 600,
        DEFAULT_HEIGHT: 400,
        ASPECT_RATIO: 3/2
    },
    SPACING: {
        HORIZON_OFFSET_PERCENT: 0.1, // 10% from bottom
        HORIZON_OFFSET_PX: 25, // Pixel offset for particles
        SNOW_HORIZON_OFFSET_PX: 18, // Pixel offset for snow
        PARTICLE_START_OFFSET: 50, // Starting offset above container
        TREE_GAP: 10, // Gap for tree in horizon line
        FLOOR_MARGIN: 30 // Margin from floor for particles
    },
    // Get actual window dimensions dynamically
    getWindowWidth() {
        const container = document.getElementById('weatherAnimation');
        return container?.offsetWidth || this.WINDOW.DEFAULT_WIDTH;
    },
    getWindowHeight() {
        const container = document.getElementById('weatherAnimation');
        return container?.offsetHeight || this.WINDOW.DEFAULT_HEIGHT;
    },
    // Get responsive spacing values
    getHorizonOffset() {
        const height = this.getWindowHeight();
        return height * this.SPACING.HORIZON_OFFSET_PERCENT;
    },
    getHorizonY() {
        const height = this.getWindowHeight();
        return height * (1 - this.SPACING.HORIZON_OFFSET_PERCENT);
    },
    // Check if mobile
    isMobile() {
        return window.innerWidth < 768;
    },
    // Get scale factor for responsive sizing
    getScaleFactor() {
        const baseWidth = this.WINDOW.DEFAULT_WIDTH;
        const currentWidth = this.getWindowWidth();
        return Math.min(1, currentWidth / baseWidth);
    }
};

let animationInterval = null;
let rainInterval = null; // Separate interval for rain animation
let snowInterval = null; // Separate interval for snow animation
let fogInterval = null; // Separate interval for fog animation
let cloudInterval = null; // Separate interval for clouds when used with rain/snow
let windInterval = null; // Separate interval for wind animation
let lightningInterval = null; // Interval for lightning flashes
let hailInterval = null; // Interval for hail animation
let treeAnimationInterval = null; // Interval for tree animation
let originalTreeLines = null; // Store original tree structure
let currentLocationCoords = null; // Store current location coordinates for sun calculations
let sunPositionInterval = null; // Interval for updating sun position
let moonPositionInterval = null; // Interval for updating moon position
let timeUpdateInterval = null; // Interval for updating time display every minute
let currentTemperatureUnit = 'C'; // 'C' for Celsius, 'F' for Fahrenheit
let currentCountryCode = null; // Store current country code for default unit

// Using Open-Meteo API (no API key required, free for non-commercial use)
// https://open-meteo.com

// Default location (San Francisco, USA)
const DEFAULT_LOCATION = {
    lat: 37.7749,
    lon: -122.4194,
    name: 'San Francisco, USA'
};

// Normalize country name variations to standard formats
function normalizeCountryName(locationName) {
    // Common country name variations mapping
    const countryVariations = {
        'usa': 'US',
        'u.s.a': 'US',
        'u.s.a.': 'US',
        'united states': 'US',
        'united states of america': 'US',
        'uk': 'GB',
        'u.k': 'GB',
        'u.k.': 'GB',
        'united kingdom': 'GB',
        'great britain': 'GB'
    };
    
    // Check if location contains a country suffix
    const parts = locationName.split(',').map(part => part.trim());
    if (parts.length > 1) {
        const countryPart = parts[parts.length - 1].toLowerCase();
        if (countryVariations[countryPart]) {
            // Replace the country part with normalized version
            parts[parts.length - 1] = countryVariations[countryPart];
            return parts.join(', ');
        }
    }
    
    return locationName;
}

// Geocode location name to coordinates using Open-Meteo
async function geocodeLocation(locationName) {
    // Map of country names to their capital cities
    const countryCapitals = {
        'russia': 'Moscow',
        'russian federation': 'Moscow',
        'usa': 'Washington',
        'united states': 'Washington',
        'uk': 'London',
        'united kingdom': 'London',
        'france': 'Paris',
        'germany': 'Berlin',
        'italy': 'Rome',
        'spain': 'Madrid',
        'china': 'Beijing',
        'japan': 'Tokyo',
        'india': 'New Delhi',
        'brazil': 'Brasília',
        'australia': 'Canberra',
        'canada': 'Ottawa',
        'mexico': 'Mexico City',
        'south korea': 'Seoul',
        'indonesia': 'Jakarta',
        'turkey': 'Ankara',
        'saudi arabia': 'Riyadh',
        'argentina': 'Buenos Aires',
        'south africa': 'Cape Town',
        'egypt': 'Cairo',
        'poland': 'Warsaw',
        'netherlands': 'Amsterdam',
        'belgium': 'Brussels',
        'sweden': 'Stockholm',
        'norway': 'Oslo',
        'denmark': 'Copenhagen',
        'finland': 'Helsinki',
        'greece': 'Athens',
        'portugal': 'Lisbon',
        'thailand': 'Bangkok',
        'vietnam': 'Hanoi',
        'philippines': 'Manila',
        'malaysia': 'Kuala Lumpur',
        'singapore': 'Singapore',
        'new zealand': 'Wellington',
        'chile': 'Santiago',
        'colombia': 'Bogotá',
        'peru': 'Lima',
        'venezuela': 'Caracas'
    };
    
    // Check if the search is just a country name
    const normalizedSearch = locationName.toLowerCase().trim();
    if (countryCapitals[normalizedSearch]) {
        // If it's a country name, search for its capital instead
        locationName = countryCapitals[normalizedSearch] + ', ' + locationName;
    }
    
    // Try multiple variations of the location name
    const searchVariations = [
        locationName, // Original (or capital city if country name)
        normalizeCountryName(locationName), // Normalized country name
        locationName.split(',')[0].trim() // Just the city name
    ];
    
    // Remove duplicates
    const uniqueVariations = [...new Set(searchVariations)];
    
    for (const searchName of uniqueVariations) {
        try {
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=en&format=json`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Geocoding API error:', response.status, errorText);
                // Continue to next variation unless it's the last one
                if (searchName === uniqueVariations[uniqueVariations.length - 1]) {
                    throw new Error(`API_ERROR_${response.status}`);
                }
                continue;
            }
            
            const data = await response.json();
            
            if (data && data.results && data.results.length > 0) {
                const result = data.results[0];
                const countryCode = result.country_code || null;
                
                // Build location name, avoiding duplicates
                let locationName = result.name;
                
                // Add admin1 (state/province) if it exists and is different from name
                if (result.admin1 && result.admin1 !== result.name) {
                    locationName += `, ${result.admin1}`;
                }
                
                // Add country if it exists and is different from name and admin1
                if (result.country && 
                    result.country !== result.name && 
                    result.country !== result.admin1 &&
                    !locationName.includes(result.country)) {
                    locationName += `, ${result.country}`;
                }
                
                return {
                    lat: result.latitude,
                    lon: result.longitude,
                    name: locationName,
                    countryCode: countryCode
                };
            }
        } catch (error) {
            // If it's not the last variation, continue trying
            if (searchName !== uniqueVariations[uniqueVariations.length - 1]) {
                continue;
            }
            // If it's the last variation, throw the error
            console.error('Geocoding error:', error);
            throw error;
        }
    }
    
    // If all variations failed, throw location not found
    throw new Error('LOCATION_NOT_FOUND');
}

// Get user's location
async function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        fromGeolocation: true
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    // Use default location (San Francisco) instead of showing input
                    resolve({
                        lat: DEFAULT_LOCATION.lat,
                        lon: DEFAULT_LOCATION.lon,
                        fromGeolocation: false
                    });
                }
            );
        } else {
            // Use default location (San Francisco) if geolocation not supported
            resolve({
                lat: DEFAULT_LOCATION.lat,
                lon: DEFAULT_LOCATION.lon,
                fromGeolocation: false
            });
        }
    });
}

// Show location input field
function showLocationInput() {
    const inputContainer = document.getElementById('locationInputContainer');
    const changeBtn = document.getElementById('changeLocationBtn');
    inputContainer.style.display = 'block';
    changeBtn.style.display = 'none';
    
    // Focus on input
    setTimeout(() => {
        document.getElementById('locationInput').focus();
    }, 100);
}

// Hide location input field
function hideLocationInput() {
    const inputContainer = document.getElementById('locationInputContainer');
    const changeBtn = document.getElementById('changeLocationBtn');
    inputContainer.style.display = 'none';
    changeBtn.style.display = 'block';
}

// Fetch weather data using Open-Meteo API
async function getWeather(lat, lon) {
    try {
        // Using Open-Meteo API (free, no API key required)
        // https://open-meteo.com
        // Add timestamp to prevent caching and ensure fresh data
        const timestamp = Date.now();
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover&hourly=precipitation&timezone=auto&_=${timestamp}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Weather API error');
        }
        
        const data = await response.json();
        
        // Get timezone information from API response
        // Open-Meteo returns timezone and utc_offset_seconds
        const timezone = data.timezone || null;
        let utcOffsetSeconds = data.utc_offset_seconds || null;
        
        // If API doesn't provide offset, estimate from longitude
        // This is a rough approximation: each 15 degrees of longitude ≈ 1 hour
        if (utcOffsetSeconds === null || utcOffsetSeconds === undefined) {
            // Estimate timezone offset from longitude (rough approximation)
            // Moscow is ~37.6°E, UTC+3, so roughly lon/15 gives approximate offset
            const estimatedOffsetHours = Math.round(lon / 15);
            utcOffsetSeconds = estimatedOffsetHours * 3600;
            console.warn('API did not provide utc_offset_seconds, estimating from longitude:', {
                longitude: lon,
                estimatedOffsetHours: estimatedOffsetHours,
                estimatedOffsetSeconds: utcOffsetSeconds
            });
        }
        
        
        // Moon phase is calculated in calculateMoonPosition function
        // No API call needed - calculation is accurate
        
        // Map Open-Meteo response to expected format
        const current = data.current;
        
        // Map weather code to weather condition
        // Open-Meteo uses WMO weather codes: https://open-meteo.com/en/docs
        const weatherCode = current.weather_code;
        let weatherMain = 'Clear';
        let description = 'clear sky';
        
        if (weatherCode >= 0 && weatherCode <= 3) {
            // Map weather codes more accurately
            if (weatherCode === 0) {
                weatherMain = 'Clear';
                description = 'clear sky';
            } else if (weatherCode === 1) {
                weatherMain = 'Clear';
                description = 'mainly clear';
            } else if (weatherCode === 2) {
                weatherMain = 'Clouds';
                description = 'partly cloudy';
            } else {
                weatherMain = 'Clouds';
                description = 'overcast';
            }
        } else if (weatherCode >= 45 && weatherCode <= 48) {
            weatherMain = 'Fog';
            description = 'fog';
        } else if (weatherCode >= 51 && weatherCode <= 67) {
            weatherMain = 'Rain';
            // Drizzle codes (51-55)
            if (weatherCode === 51) {
                description = 'light drizzle';
            } else if (weatherCode === 52) {
                description = 'moderate drizzle';
            } else if (weatherCode === 53) {
                description = 'dense drizzle';
            } else if (weatherCode === 54) {
                description = 'light freezing drizzle';
            } else if (weatherCode === 55) {
                description = 'dense freezing drizzle';
            }
            // Freezing drizzle codes (56-57)
            else if (weatherCode === 56) {
                description = 'light freezing drizzle';
            } else if (weatherCode === 57) {
                description = 'dense freezing drizzle';
            }
            // Rain codes (61-65)
            else if (weatherCode === 61) {
                description = 'slight rain';
            } else if (weatherCode === 63) {
                description = 'moderate rain';
            } else if (weatherCode === 65) {
                description = 'heavy rain';
            }
            // Freezing rain codes (66-67)
            else if (weatherCode === 66) {
                description = 'light freezing rain';
            } else if (weatherCode === 67) {
                description = 'heavy freezing rain';
            } else {
                // Fallback for any unhandled codes in this range
                description = weatherCode <= 55 ? 'drizzle' : weatherCode <= 61 ? 'light rain' : weatherCode <= 65 ? 'moderate rain' : 'heavy rain';
            }
        } else if (weatherCode >= 71 && weatherCode <= 77) {
            weatherMain = 'Snow';
            if (weatherCode === 71) {
                description = 'slight snow';
            } else if (weatherCode === 73) {
                description = 'moderate snow';
            } else if (weatherCode === 75) {
                description = 'heavy snow';
            } else if (weatherCode === 77) {
                description = 'snow grains';
            } else {
                description = weatherCode <= 75 ? 'light snow' : 'moderate snow';
            }
        } else if (weatherCode >= 80 && weatherCode <= 82) {
            weatherMain = 'Rain';
            if (weatherCode === 80) {
                description = 'slight rain shower';
            } else if (weatherCode === 81) {
                description = 'moderate rain shower';
            } else if (weatherCode === 82) {
                description = 'violent rain shower';
            } else {
                description = 'rain shower';
            }
        } else if (weatherCode >= 85 && weatherCode <= 86) {
            weatherMain = 'Snow';
            if (weatherCode === 85) {
                description = 'slight snow shower';
            } else if (weatherCode === 86) {
                description = 'heavy snow shower';
            } else {
                description = 'snow shower';
            }
        } else if (weatherCode >= 95 && weatherCode <= 99) {
            weatherMain = 'Thunderstorm';
            if (weatherCode === 95) {
                description = 'thunderstorm';
            } else if (weatherCode === 96) {
                description = 'thunderstorm with slight hail';
            } else if (weatherCode === 97) {
                description = 'thunderstorm with moderate hail';
            } else if (weatherCode === 98) {
                description = 'thunderstorm with sandstorm';
            } else if (weatherCode === 99) {
                description = 'thunderstorm with heavy hail';
            } else {
                description = 'thunderstorm';
            }
        }
        
        // Get precipitation from current data (mm) - this is the actual current precipitation
        const currentPrecip = current.precipitation ?? 0;
        // Also check hourly data as fallback
        const hourlyPrecip = data.hourly && data.hourly.precipitation && data.hourly.precipitation[0] ? data.hourly.precipitation[0] : currentPrecip;
        // Use the higher value (current or hourly) to ensure we get actual precipitation
        const precipitation = Math.max(currentPrecip, hourlyPrecip);
        
        // Map to expected format
        return {
            name: '', // Will be set by geocoding
            coord: { lat: lat, lon: lon },
            weather: [{
                main: weatherMain,
                description: description
            }],
            weather_code: weatherCode, // Store original weather code for lightning calculations
            main: {
                temp: current.temperature_2m,
                feels_like: current.temperature_2m, // Open-Meteo doesn't provide feels_like, use temp
                humidity: current.relative_humidity_2m
            },
            wind: {
                speed: current.wind_speed_10m,
                deg: current.wind_direction_10m
            },
            // Only set rain/snow if there's actual precipitation and matching weather type
            rain: (weatherMain === 'Rain' || weatherMain === 'Thunderstorm') && precipitation > 0 ? { '1h': precipitation } : null,
            snow: weatherMain === 'Snow' && precipitation > 0 ? { '1h': precipitation } : null,
            // Also store current precipitation for direct access
            current: {
                precipitation: precipitation
            },
            visibility: weatherMain === 'Fog' ? (current.relative_humidity_2m > 90 ? 200 : 1000) : undefined,
            clouds: {
                // Use actual cloud cover from API if available, otherwise estimate from weather code
                all: current.cloud_cover !== undefined && current.cloud_cover !== null 
                    ? current.cloud_cover 
                    : (weatherCode >= 1 && weatherCode <= 3 ? (weatherCode === 1 ? 25 : weatherCode === 2 ? 50 : 100) : 0)
            },
            // Store timezone information for accurate sun/moon calculations
            timezone: timezone,
            utc_offset_seconds: utcOffsetSeconds
            // Moon phase is calculated in calculateMoonPosition function, not from API
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        // Return mock data for San Francisco (used when API fails)
        const mockWeathers = [
            { main: 'Rain', description: 'moderate rain' },
            { main: 'Clear', description: 'clear sky' },
            { main: 'Clouds', description: 'scattered clouds' },
            { main: 'Fog', description: 'fog' }
        ];
        // Use a consistent weather based on time of day for San Francisco
        const hour = new Date().getHours();
        let weatherType;
        if (hour >= 6 && hour < 12) {
            weatherType = mockWeathers[1]; // Clear morning
        } else if (hour >= 12 && hour < 18) {
            weatherType = mockWeathers[2]; // Clouds afternoon
        } else {
            weatherType = mockWeathers[Math.floor(Math.random() * mockWeathers.length)];
        }
        return {
            name: DEFAULT_LOCATION.name,
            coord: { lat: lat, lon: lon },
            weather: [weatherType],
            weather_code: 0, // Default clear sky code for mock data
            main: { temp: 18, feels_like: 17 },
            wind: { speed: 5, deg: 270 } // Default to West
        };
    }
}

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
    
    // During bright daylight (sun > 30° altitude), only show bright moon phases
    // Full moon and gibbous phases are bright enough to be visible even in bright daylight
    if (sunPos.altitude > 30) {
        const brightPhases = ['full', 'waxingGibbous', 'waningGibbous'];
        return brightPhases.includes(moonPos.phase);
    }
    
    // During moderate daylight (sun 10-30°), show quarter phases and brighter
    // Crescent moons are too dim to see in moderate daylight
    if (sunPos.altitude > 10) {
        const visiblePhases = ['full', 'waxingGibbous', 'waningGibbous', 'firstQuarter', 'lastQuarter'];
        return visiblePhases.includes(moonPos.phase);
    }
    
    // During low sun (dawn/dusk, sun < 10°) or nighttime, all phases are visible
    // Crescent moons are visible during twilight and night
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
    
    // Horizon line is at 90% from top (bottom: 10%)
    const horizonPosition = 90; // percentage from top
    
    const maxAltitude = 90;
    
    // Note: Moon can be visible during daytime, especially:
    // - Last quarter moon (rises at midnight) is high in sky at dawn
    // - First quarter moon (rises at noon) is high in sky at dusk
    // - Full moon can be visible during the day
    // Removed safety check that was incorrectly hiding moon during daytime
    
    // Calculate vertical position
    let topPercent;
    if (moonPos.altitude < 0) {
        // Moon is below horizon but in twilight
        topPercent = horizonPosition + 2;
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
    const display = document.getElementById('weatherDisplay');
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
    
    // Horizon line is at 90% from top (bottom: 10%)
    const horizonPosition = 90; // percentage from top
    
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
        // Sun is below horizon but in twilight (between 0° and -6°)
        // Position it just below the horizon line
        topPercent = horizonPosition + 2; // Just below horizon
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
    
    // Get precipitation intensity from actual weather data
    // Open-Meteo provides precipitation in mm, check both 1h and 3h values
    // If no precipitation data is available, use 0 (no rain) instead of defaulting
    const rainVolume = weatherData?.rain?.['1h'] ?? weatherData?.rain?.['3h'] ?? 
                       (weatherData?.current?.precipitation ?? 0);
    
    // Check weather code for different rain types and intensity levels
    const weatherCode = weatherData?.weather_code;
    const isFreezing = weatherCode === 66 || weatherCode === 67 || 
                       weatherCode === 56 || weatherCode === 57;
    const isDrizzle = weatherCode >= 51 && weatherCode <= 55;
    const isFreezingDrizzle = weatherCode === 56 || weatherCode === 57;
    const isRainShower = weatherCode >= 80 && weatherCode <= 82;
    
    // Determine base intensity from weather code (before precipitation adjustment)
    let codeIntensity = 0.5; // Default moderate
    if (isDrizzle) {
        // Drizzle codes: 51=light, 52=moderate, 53=dense
        if (weatherCode === 51) {
            codeIntensity = 0.2; // Light drizzle
        } else if (weatherCode === 52) {
            codeIntensity = 0.3; // Moderate drizzle
        } else if (weatherCode === 53) {
            codeIntensity = 0.4; // Dense drizzle
        } else {
            codeIntensity = 0.25; // Freezing drizzle variants (54-55)
        }
    } else if (isRainShower) {
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
    
    // Adjust intensity for drizzle (make it lighter overall)
    if (isDrizzle) {
        intensity = intensity * 0.6; // Drizzle is lighter
    }
    
    // Adjust intensity for freezing drizzle (lighter than freezing rain)
    if (isFreezingDrizzle) {
        intensity = intensity * 0.6; // Freezing drizzle is lighter than freezing rain
    }
    
    // Calculate spawn interval based on intensity (lower = more frequent)
    // Light: 150ms, Moderate: 80ms, Heavy: 40ms
    const spawnInterval = Math.max(40, 150 - (intensity * 110));
    // Number of drops per spawn (light: 1-2, moderate: 2-3, heavy: 3-5)
    const dropsPerSpawn = Math.floor(1 + intensity * 4);
    
    function createRainDrop() {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        
        // Choose character based on rain type
        if (isFreezing) {
            if (isFreezingDrizzle) {
                drop.textContent = '·'; // Small dot for freezing drizzle (lighter)
                drop.classList.add('freezing-drizzle-drop'); // Separate class for styling
            } else {
                drop.textContent = '◊'; // White diamond for freezing rain
                drop.classList.add('freezing-drop');
            }
        } else if (isDrizzle) {
            drop.textContent = '·'; // Small dot for drizzle
            drop.classList.add('drizzle-drop');
        } else {
            drop.textContent = 'I'; // Regular rain
        }
        drop.style.left = Math.random() * 100 + '%';
        // Start from random position above the container
        const startY = -(Math.random() * 100 + DIMENSIONS.SPACING.PARTICLE_START_OFFSET);
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
        const stopY = (horizonY - horizonOffset) + Math.random() * (bottomY - (horizonY - horizonOffset));
        
        // Calculate distance to fall (from start position to stop position)
        const fallDistance = stopY - startY;
        
        // Random fall speed
        const duration = Math.random() * 0.4 + 0.4; // 0.4 to 0.8 seconds
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
                // Normal rain splash
                impactChar = Math.random() < 0.5 ? '.' : '~';
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
        const initialDrops = Math.floor(30 * intensity);
        for (let i = 0; i < initialDrops; i++) {
            setTimeout(() => createRainDrop(), i * 50);
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
                    const burstIntensity = intensity * burstMultiplier;
                    const burstDrops = Math.floor(1 + burstIntensity * 4);
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
                for (let i = 0; i < dropsPerSpawn; i++) {
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
    const spawnInterval = Math.max(100, 300 - (intensity * 200));
    // Number of flakes per spawn (light: 1, moderate: 2-3, heavy: 3-4)
    const flakesPerSpawn = Math.floor(1 + intensity * 3);
    
    function createSnowflake() {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.textContent = '*';
        flake.style.left = Math.random() * 100 + '%';
        // Start from random position above the container
        const startY = -(Math.random() * 100 + 50); // -50 to -150px
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
            stopY = (horizonY - horizonOffset) + Math.random() * (horizonOffset + 5); // Range from 30px above to 5px below horizon
        } else {
            // Random position from well above horizon (to hit the line) to bottom
            stopY = (horizonY - horizonOffset) + Math.random() * (bottomY - (horizonY - horizonOffset));
        }
        
        // Calculate distance to fall (from start position to stop position)
        const fallDistance = stopY - startY;
        const driftX = (Math.random() - 0.5) * 100; // Random horizontal drift
        
        // Random fall speed (slower than rain)
        const duration = Math.random() * 2 + 3; // 3 to 5 seconds
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
        const baseKeepDuration = Math.max(60000, Math.min(420000, 180000 + (0 - temperature) * 12000)); // 1-7 minutes
        
        // If snowflake is near horizon line, keep it even longer to accumulate on the floor
        const isNearHorizon = stopY >= (horizonY - horizonOffset) && stopY <= (horizonY + 5);
        const horizonMultiplier = isNearHorizon ? 2.0 : 1.0; // Double duration if near horizon (floor accumulation)
        const keepDuration = baseKeepDuration * horizonMultiplier;
        
        setTimeout(() => flake.remove(), (duration * 1000) + keepDuration);
    }
    
    // Only create snow animation if there's actual precipitation
    if (intensity > 0) {
        // Create initial snowflakes spread out
        const initialFlakes = Math.floor(20 * intensity);
        for (let i = 0; i < initialFlakes; i++) {
            setTimeout(() => createSnowflake(), i * 100);
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
                    const burstFlakes = Math.floor(1 + burstIntensity * 3);
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

// Create cloud animation
function createCloudAnimation(weatherData = null, clearContainer = true) {
    // Ensure the main display never shows static cloud art
    // But don't clear if sun/moon are showing
    const display = document.getElementById('weatherDisplay');
    if (display) {
        // Only clear if sun/moon are not showing
        if (!display.classList.contains('sun') && !display.classList.contains('moon')) {
            display.textContent = '';
        }
    }
    
    const container = document.getElementById('weatherAnimation');
    if (clearContainer) {
        container.innerHTML = '';
    }
    const containerWidth = DIMENSIONS.getWindowWidth();
    
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
    const initialCloudCount = Math.max(1, Math.ceil(cloudiness * 2.5));
    
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
        cloud.style.top = Math.random() * 200 + 'px';
        
        // Random duration variation (80% to 120% of base)
        const duration = baseCloudDuration * (0.8 + Math.random() * 0.4);
        
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
            const startX = Math.random() * (containerWidth - 50);
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
    const cloudsPerSpawn = Math.max(1, Math.ceil(cloudiness * 1));
    
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
    const initialFogCount = Math.floor(fogDensity * 6) + 3;
    
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
            const maxWidth = 20 + Math.floor(Math.random() * 15); // 20-35 characters wide
            
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
        fog.style.top = Math.random() * 250 + 'px';
        
        // Lower opacity for more ethereal look (0.5 to 0.8) - increased for visibility
        const opacity = 0.5 + Math.random() * 0.3;
        fog.style.opacity = opacity.toString();
        
        // Random duration variation (80% to 120% of base)
        const duration = baseFogDuration * (0.8 + Math.random() * 0.4);
        fog.style.animationDuration = duration + 's';
        
        if (startFromOffScreen) {
            // Start from left side (off-screen)
            fog.style.animationDelay = '0s';
        } else {
            // Start at random position within the window
            const startX = Math.random() * (containerWidth - 50);
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
    
    // Start the first flash after a short delay
    scheduleNextFlash();
    
    // Keep both intervals running - rain continues, lightning flashes
    // Note: animationInterval is used by rain, lightning runs separately
}

// Create hail animation (overlays on top of rain/thunderstorm)
function createHailAnimation(weatherData = null, clearContainer = false) {
    const container = document.getElementById('weatherAnimation');
    // Don't clear container - hail overlays on existing animations
    
    const containerHeight = DIMENSIONS.getWindowHeight();
    
    // Get weather code to determine hail intensity
    const weatherCode = weatherData?.weather_code ?? 96;
    let hailIntensity = 0.5; // Default moderate
    
    if (weatherCode === 96) {
        hailIntensity = 0.4; // Slight hail
    } else if (weatherCode === 97) {
        hailIntensity = 0.6; // Moderate hail
    } else if (weatherCode === 99) {
        hailIntensity = 1.0; // Heavy hail
    }
    
    // Hail falls faster and is more sporadic than rain
    const spawnInterval = Math.max(80, 200 - (hailIntensity * 120)); // 80-200ms
    const particlesPerSpawn = Math.floor(1 + hailIntensity * 3); // 1-4 particles
    
    function createHailStone() {
        const hail = document.createElement('div');
        hail.className = 'hail-stone';
        hail.textContent = '•'; // Use bullet point for hail
        hail.style.left = Math.random() * 100 + '%';
        const startY = -(Math.random() * 100 + DIMENSIONS.SPACING.PARTICLE_START_OFFSET);
        hail.style.top = startY + 'px';
        
        const horizonY = DIMENSIONS.getHorizonY();
        const bottomY = containerHeight;
        const stopY = horizonY + Math.random() * (bottomY - horizonY);
        
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
    const initialHail = Math.floor(10 * hailIntensity);
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

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

// Convert Fahrenheit to Celsius
function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

// Get default temperature unit based on country code
function getDefaultTemperatureUnit(countryCode) {
    // Countries that use Fahrenheit
    const fahrenheitCountries = ['US', 'BS', 'BZ', 'KY', 'PW', 'FM', 'MH', 'LR'];
    
    if (countryCode && fahrenheitCountries.includes(countryCode.toUpperCase())) {
        return 'F';
    }
    return 'C'; // Default to Celsius for most countries
}

// Set temperature unit and update display
function setTemperatureUnit(unit, updateDisplay = true) {
    currentTemperatureUnit = unit;
    localStorage.setItem('temperatureUnit', unit);
    
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
    if (updateDisplay) {
        const display = document.getElementById('weatherDisplay');
        if (display && display.textContent && display.textContent.trim() !== '') {
            // Re-display weather with new unit
            const info = document.getElementById('weatherInfo');
            if (info && info.textContent) {
                // Extract temperature from info text and update
                const lines = info.textContent.split('\n');
                if (lines.length >= 3) {
                    const description = lines[0];
                    // Re-fetch and display with new unit
                    // We'll need to store the last weather data
                    if (lastWeatherData) {
                        updateTemperatureDisplay(lastWeatherData);
                    }
                }
            }
        }
    }
}

// Update temperature display in weather info
function updateTemperatureDisplay(weatherData) {
    const info = document.getElementById('weatherInfo');
    if (!info) return;
    
    const tempC = weatherData.main ? weatherData.main.temp : 18;
    const feelsLikeC = weatherData.main ? weatherData.main.feels_like : 17;
    const description = weatherData.weather ? weatherData.weather[0].description : 'clear sky';
    
    let temp, feelsLike, unit;
    if (currentTemperatureUnit === 'F') {
        temp = Math.round(celsiusToFahrenheit(tempC));
        feelsLike = Math.round(celsiusToFahrenheit(feelsLikeC));
        unit = '°F';
    } else {
        temp = Math.round(tempC);
        feelsLike = Math.round(feelsLikeC);
        unit = '°C';
    }
    
    // Get all variables that affect the display
    const windSpeed = weatherData.wind ? weatherData.wind.speed : 0;
    const windDirection = weatherData.wind ? weatherData.wind.deg : 0;
    const rainVolume = weatherData.rain ? (weatherData.rain['1h'] ?? weatherData.rain['3h'] ?? 0) : 0;
    const snowVolume = weatherData.snow ? (weatherData.snow['1h'] ?? weatherData.snow['3h'] ?? 0) : 0;
    const humidity = weatherData.main ? weatherData.main.humidity : null;
    const visibility = weatherData.visibility ? weatherData.visibility : null;
    const cloudCover = weatherData.clouds ? weatherData.clouds.all : null;
    
    // Calculate local time at the location
    const now = new Date();
    let localTimeStr = '';
    const utcOffsetSeconds = weatherData?.utc_offset_seconds ?? null;
    if (utcOffsetSeconds !== null && utcOffsetSeconds !== undefined) {
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        const utcTime = utcHours + utcMinutes / 60;
        const utcOffsetHours = utcOffsetSeconds / 3600;
        // Handle negative values correctly by wrapping around 24 hours
        const localTime = ((utcTime + utcOffsetHours) % 24 + 24) % 24;
        const localHours = Math.floor(localTime);
        const localMinutes = Math.floor((localTime - localHours) * 60);
        // Convert to 12-hour AM/PM format without seconds
        const displayHours = localHours === 0 ? 12 : localHours > 12 ? localHours - 12 : localHours;
        const ampm = localHours >= 12 ? 'PM' : 'AM';
        localTimeStr = `${displayHours}:${String(localMinutes).padStart(2, '0')} ${ampm}`;
    } else {
        // Fallback to browser time
        const hours = now.getHours();
        const minutes = now.getMinutes();
        // Convert to 12-hour AM/PM format without seconds
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        localTimeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }
    
    // Calculate sun and moon positions
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
    
    const sunPos = calculateSunPosition(lat, lon, utcOffsetSeconds);
    const moonPos = calculateMoonPosition(lat, lon, utcOffsetSeconds);
    
    // Build info text with all relevant variables - only show non-zero values
    let infoText = `${description.toUpperCase()}\n`;
    // Local time
    infoText += `${localTimeStr}\n`;
    infoText += `Temperature: ${temp}${unit}\n`;
    infoText += `Feels like: ${feelsLike}${unit}\n`;
    
    
    // Check if dev mode is off - if so, hide sun and moon info
    const container = document.querySelector('.container');
    const isDevModeOff = container && container.classList.contains('dev-mode-off');
    
    // Sun position (only show if dev mode is on and sun is visible or in twilight)
    if (!isDevModeOff && sunPos.altitude >= -6) {
        infoText += `Sun Altitude: ${sunPos.altitude.toFixed(1)}°\n`;
        infoText += `Sun Azimuth: ${sunPos.azimuth.toFixed(1)}°\n`;
    }
    
    // Moon position (only show if dev mode is on and moon is visible or in twilight)
    if (!isDevModeOff && moonPos.altitude >= -6 && moonPos.phase !== 'new') {
        infoText += `Moon Altitude: ${moonPos.altitude.toFixed(1)}°\n`;
        infoText += `Moon Azimuth: ${moonPos.azimuth.toFixed(1)}°\n`;
        infoText += `Moon Phase: ${moonPos.phase}\n`;
    }
    
    // Wind speed (affects tree animation) - only show if > 0
    if (windSpeed > 0) {
        infoText += `Wind Speed: ${windSpeed.toFixed(1)} m/s`;
        if (windDirection !== null && windDirection !== undefined) {
            // Convert degrees to direction
            const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            const index = Math.round(windDirection / 22.5) % 16;
            infoText += ` (${directions[index]})`;
        }
        infoText += '\n';
    }
    
    // Precipitation (affects rain/snow intensity) - only show if > 0
    if (rainVolume > 0) {
        infoText += `Rain: ${rainVolume.toFixed(2)} mm/h\n`;
    }
    if (snowVolume > 0) {
        infoText += `Snow: ${snowVolume.toFixed(2)} mm/h\n`;
    }
    
    // Additional info - only show if non-zero
    // Show humidity if dev mode is on OR if it's relevant to animations (humidity > 80% affects fog)
    if (humidity !== null && humidity !== undefined && humidity > 0) {
        const isRelevantToAnimations = humidity > 80; // High humidity affects fog density
        if (!isDevModeOff || isRelevantToAnimations) {
            infoText += `Humidity: ${humidity}%\n`;
        }
    }
    if (cloudCover !== null && cloudCover !== undefined && cloudCover > 0) {
        infoText += `Cloud Cover: ${cloudCover}%\n`;
    }
    if (visibility !== null && visibility !== undefined && visibility > 0) {
        // Convert meters to km if > 1000m
        const visibilityText = visibility >= 1000 ? `${(visibility / 1000).toFixed(1)} km` : `${visibility} m`;
        infoText += `Visibility: ${visibilityText}\n`;
    }
    
    info.textContent = infoText.trim();
}

let lastWeatherData = null; // Store last weather data for unit updates

// Display weather
function displayWeather(weatherData, manualWeatherType = null) {
    const display = document.getElementById('weatherDisplay');
    
    // IMMEDIATELY clear display to prevent any static art from showing
    // Do this FIRST, before determining weather type or anything else
    if (display) {
        display.textContent = '';
        // Also clear any potential cloud art immediately
        display.innerHTML = '';
    }
    
    const weatherType = manualWeatherType || getWeatherType(weatherData.weather[0].main);
    const info = document.getElementById('weatherInfo');
    const location = document.getElementById('location');
    
    // Store location coordinates for sun calculations
    if (weatherData.coord) {
        currentLocationCoords = {
            lat: weatherData.coord.lat,
            lon: weatherData.coord.lon
        };
    } else if (currentLocation && currentLocation.lat && currentLocation.lon) {
        currentLocationCoords = {
            lat: currentLocation.lat,
            lon: currentLocation.lon
        };
    }
    
    // Update location (ASCII art style)
    if (weatherData.name) {
        location.textContent = `${weatherData.name}`;
    }
    
    // Store weather data for unit updates
    lastWeatherData = weatherData;
    
    // Update weather info (ASCII art style) with selected unit
    updateTemperatureDisplay(weatherData);
    
    // Update time display every minute (without fetching weather data)
    if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    timeUpdateInterval = setInterval(() => {
        if (lastWeatherData) {
            updateTemperatureDisplay(lastWeatherData);
        }
    }, 60000); // Update every minute
    
    // Remove sun and moon classes if they exist first
    display.classList.remove('sun');
    display.classList.remove('moon');
    const moonDisplay = document.getElementById('moonDisplay');
    if (moonDisplay) {
        moonDisplay.classList.remove('moon');
    }
    
    // Check for weather conditions FIRST before setting any static art
    // This prevents static art from being set when animations will be used
    // All checks are based on actual weather data, not weather type strings
    const willHaveRain = weatherData.rain && (weatherData.rain['1h'] > 0 || weatherData.rain['3h'] > 0);
    const willHaveSnow = weatherData.snow && (weatherData.snow['1h'] > 0 || weatherData.snow['3h'] > 0);
    
    // Thunderstorm requires both rain data AND thunderstorm indicator
    const hasThunderstormIndicator = weatherData.weather?.[0]?.main === 'Thunderstorm' || 
                                     weatherData.weather?.[0]?.description?.toLowerCase().includes('thunder') ||
                                     weatherType === 'thunderstorm';
    const willHaveThunderstorm = willHaveRain && hasThunderstormIndicator;
    
    // Fog is determined by weather type OR both visibility and humidity conditions
    // Real fog requires both reduced visibility AND high humidity (or API explicitly reports fog)
    const hasFogWeatherType = weatherData.weather?.[0]?.main === 'Fog' || 
                              weatherData.weather?.[0]?.description?.toLowerCase().includes('fog');
    const hasLowVisibility = weatherData.visibility !== undefined && weatherData.visibility < 1000;
    const hasHighHumidity = weatherData.main?.humidity > 80;
    
    const willHaveFog = hasFogWeatherType || (hasLowVisibility && hasHighHumidity);
    
    const willHaveClouds = weatherData.clouds && weatherData.clouds.all > 0;
    
    // Wind animation shows when wind speed is significant (5+ m/s)
    const willHaveWind = weatherData.wind && weatherData.wind.speed >= 5;
    
    // Determine if we'll show sun/moon (show in all conditions unless visibility is very bad)
    // Only hide when visibility is very low (< 200m = very dense fog where you can't see sky objects)
    const hasBadVisibility = weatherData.visibility !== undefined && weatherData.visibility < 200;
    const willShowSunMoon = !hasBadVisibility;
    
    // Clear display to prevent static clouds or other static art from appearing
    // But preserve if sun/moon will be shown (they'll set their content after)
    if (!willShowSunMoon) {
        display.textContent = '';
        display.innerHTML = '';
    }
    
    // Never display static ASCII art if we'll have any animated weather
    // This includes clouds - if clouds will be shown, never set static art
    const willHaveAnimations = willHaveRain || willHaveSnow || willHaveThunderstorm || 
                               willHaveFog || willHaveClouds || willHaveWind;
    
    // NEVER set static art if we have any animated weather effects
    // These all use animations, not static ASCII art
    // Only set static art if there are no animations and it's a clear day
    if (!willHaveAnimations) {
        // Only show static art for clear weather (sun/moon are handled separately)
        // Never show static cloud art - clouds always use animations
        if (weatherType === 'clear') {
            // Clear weather - sun/moon will be shown separately, no static art needed
            display.textContent = '';
        } else {
            // For other weather types without animations, check if there's art available
            const artToShow = asciiArt[weatherType];
            if (artToShow && weatherType !== 'clouds') {
                display.textContent = artToShow;
            } else {
                display.textContent = '';
            }
        }
    } else {
        // For all animated weather types, keep display.textContent empty
        // But don't clear if sun/moon will be shown (they'll set their content after)
        if (!willShowSunMoon) {
            display.textContent = '';
        }
    }
    
    // Final safeguard: if clouds will be shown, ensure no static cloud art
    // But don't clear if sun/moon will be shown
    if (willHaveClouds && !willShowSunMoon) {
        display.textContent = '';
        display.innerHTML = '';
    }
    
    // Additional safeguard: never allow cloud art to be set, even accidentally
    // Monitor and clear if cloud art somehow gets set, but preserve sun/moon content
    const checkInterval = setInterval(() => {
        if (display && willHaveClouds && !willShowSunMoon) {
            // Don't clear if sun/moon are showing
            if (display.classList.contains('sun') || display.classList.contains('moon')) {
                return;
            }
            // Check both textContent and innerHTML for cloud art patterns
            const content = display.textContent || display.innerHTML || '';
            if (content.includes('.--.') || (content.includes('cloud') && !content.includes('moon'))) {
                // Cloud art detected, clear it immediately
                display.textContent = '';
                display.innerHTML = '';
            }
        }
        // Also protect sun/moon from being cleared - if they have the class but no content, restore them
        const sunDisplay = document.getElementById('weatherDisplay');
        const moonDisplay = document.getElementById('moonDisplay');
        if (sunDisplay && sunDisplay.classList.contains('sun')) {
            const content = sunDisplay.textContent || sunDisplay.innerHTML || '';
            if (!content || content.trim() === '') {
                positionSun(weatherData);
            }
        }
        if (moonDisplay && moonDisplay.classList.contains('moon')) {
            const content = moonDisplay.textContent || moonDisplay.innerHTML || '';
            if (!content || content.trim() === '') {
                positionMoon(weatherData);
            }
        }
    }, 50);
    
    // Stop monitoring after animations are set up (2 seconds to be safe)
    setTimeout(() => {
        clearInterval(checkInterval);
    }, 2000);
    
    // Clear previous animation intervals - each animation has its own interval
    if (rainInterval) {
        clearInterval(rainInterval);
        rainInterval = null;
    }
    if (snowInterval) {
        clearInterval(snowInterval);
        snowInterval = null;
    }
    if (fogInterval) {
        clearInterval(fogInterval);
        fogInterval = null;
    }
    if (cloudInterval) {
        clearInterval(cloudInterval);
        cloudInterval = null;
    }
    if (windInterval) {
        clearInterval(windInterval);
        windInterval = null;
    }
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    if (lightningInterval) {
        clearTimeout(lightningInterval);
        lightningInterval = null;
    }
    if (hailInterval) {
        clearInterval(hailInterval);
        hailInterval = null;
    }
    if (sunPositionInterval) {
        clearInterval(sunPositionInterval);
        sunPositionInterval = null;
    }
    if (moonPositionInterval) {
        clearInterval(moonPositionInterval);
        moonPositionInterval = null;
    }
    // Stop tree animation
    stopTreeAnimation();
    const weatherAnimationContainer = document.getElementById('weatherAnimation');
    weatherAnimationContainer.innerHTML = '';
    weatherAnimationContainer.style.backgroundColor = 'transparent';
    // Remove any effect classes
    weatherAnimationContainer.classList.remove('freezing-rain');
    
    // Update tree animation based on actual wind speed from weather data
    const treeBackground = document.querySelector('.tree-background');
    if (treeBackground) {
        // Stop any existing tree animation
        stopTreeAnimation();
        
        // Get actual wind speed from weather data (in m/s)
        const windSpeed = weatherData && weatherData.wind ? weatherData.wind.speed : 0;
        
        // Tree animation is based purely on wind speed, not weather type
        // Wind speed thresholds (in m/s):
        // 0-2 m/s: No animation (calm)
        // 2-5 m/s: Gentle rustle (light breeze)
        // 5-10 m/s: Gentle sway (moderate breeze)
        // 10-15 m/s: Strong sway (fresh breeze)
        // 15+ m/s: Storm sway (strong wind)
        if (windSpeed >= 15) {
            startTreeAnimation('storm');
        } else if (windSpeed >= 10) {
            startTreeAnimation('strong');
        } else if (windSpeed >= 5) {
            startTreeAnimation('gentle');
        } else if (windSpeed >= 2) {
            startTreeAnimation('gentle'); // Light rustle, but use gentle animation
        }
        // If windSpeed < 2, no animation (tree stays still)
    }
    
    // Update active button
    document.querySelectorAll('.weather-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.weather === weatherType) {
            btn.classList.add('active');
        }
    });
    
    // Clear moon phase button active states when weather changes
    document.querySelectorAll('.moon-phase-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Create animations based on ALL weather variables, not just primary weather type
    // This allows multiple weather effects to show simultaneously (e.g., fog + rain)
    
    // Get all weather conditions from the data (use the same variables we checked earlier)
    const hasRain = willHaveRain;
    const hasSnow = willHaveSnow;
    const hasThunderstorm = willHaveThunderstorm;
    const hasFog = willHaveFog;
    const hasClouds = willHaveClouds;
    const hasWind = willHaveWind;
    
    // If clouds are present, ensure display is clear (no static cloud art)
    // This should already be handled above, but double-check
    // But don't clear if sun/moon will be shown (they'll set their content after)
    if (hasClouds && !willShowSunMoon) {
        display.textContent = '';
    }
    
    // Track which animations are being shown to allow overlapping
    let hasAnyAnimation = false;
    
    // Get weather code for additional effect layering
    const weatherCode = weatherData?.weather_code;
    
    // Show rain animation if there's actual rain
    if (hasRain && !hasThunderstorm) {
        createRainAnimation(weatherData, !hasAnyAnimation);
        hasAnyAnimation = true;
        
        // Check for freezing rain codes (66-67) and add freezing effect
        if (weatherCode === 66 || weatherCode === 67) {
            createFreezingRainEffect(weatherData, false);
        }
    }
    
    // Show thunderstorm (includes rain + lightning)
    if (hasThunderstorm) {
        createThunderstormAnimation(weatherData, !hasAnyAnimation);
        hasAnyAnimation = true;
        
        // Check for hail in thunderstorm (codes 96, 97, 99) and layer hail on top
        if (weatherCode === 96 || weatherCode === 97 || weatherCode === 99) {
            createHailAnimation(weatherData, false); // Layer hail on top
        }
        
        // Check for sandstorm in thunderstorm (code 98)
        // Could add sandstorm effect here in the future
        // if (weatherCode === 98) {
        //     createSandstormEffect(weatherData, false);
        // }
    }
    
    // Show snow animation if there's actual snow
    if (hasSnow) {
        createSnowAnimation(weatherData, !hasAnyAnimation);
        hasAnyAnimation = true;
    }
    
    // Show fog animation if fog conditions exist (can overlap with other animations)
    if (hasFog) {
        createFogAnimation(weatherData, !hasAnyAnimation);
        hasAnyAnimation = true;
    }
    
    // Show sun/moon in all weather conditions unless visibility is very bad
    // This runs AFTER other weather checks so sun/moon can set their content last
    if (willShowSunMoon) {
        // Check if sun should be visible before showing it
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
        const sunPos = calculateSunPosition(lat, lon, utcOffsetSeconds);
        const moonPos = calculateMoonPosition(lat, lon, utcOffsetSeconds);
        
        const sunDisplay = document.getElementById('weatherDisplay');
        const moonDisplay = document.getElementById('moonDisplay');
        
        // Show sun independently if it's above the horizon (or in twilight)
        if (sunPos.altitude >= -6) {
            // Add sun class and ensure display is visible
            sunDisplay.classList.add('sun');
            sunDisplay.classList.remove('moon');
            sunDisplay.style.display = 'block';
            // Position sun based on time and location (this sets the textContent)
            positionSun(weatherData);
            // Update sun position periodically (every minute)
            if (sunPositionInterval) clearInterval(sunPositionInterval);
            sunPositionInterval = setInterval(() => {
                positionSun(weatherData);
            }, 60000); // Update every minute
        } else {
            // Sun is below horizon - hide it
            sunDisplay.classList.remove('sun');
            sunDisplay.style.display = 'none';
            sunDisplay.textContent = '';
            if (sunPositionInterval) clearInterval(sunPositionInterval);
            sunPositionInterval = null;
        }
        
        // Show moon independently if it should be visible based on realistic factors
        if (shouldShowMoon(moonPos, sunPos)) {
            // Show moon
            moonDisplay.classList.add('moon');
            moonDisplay.style.display = 'block';
            // Position moon immediately
            positionMoon(weatherData); // This sets the textContent
            // Update moon position periodically (every minute)
            if (moonPositionInterval) clearInterval(moonPositionInterval);
            moonPositionInterval = setInterval(() => {
                positionMoon(weatherData);
            }, 60000); // Update every minute
        } else {
            // Moon is not visible - hide it
            moonDisplay.classList.remove('moon');
            moonDisplay.style.display = 'none';
            moonDisplay.textContent = '';
            if (moonPositionInterval) clearInterval(moonPositionInterval);
            moonPositionInterval = null;
        }
    }
    
    // Show clouds if cloud cover > 0% - allow overlapping with all weather conditions
    // Clouds can coexist with fog, rain, snow, thunderstorm, etc.
    // Clouds are in a separate container (weatherAnimation), so they don't interfere with sun/moon
    if (hasClouds) {
        createCloudAnimation(weatherData, !hasAnyAnimation);
        hasAnyAnimation = true;
    }
    
    // Show wind animation if wind speed is significant (5+ m/s)
    // Wind animation is based on actual wind speed, not weather type
    // Wind can overlap with all other animations
    // DISABLED: Horizontal line wind animation removed
    // if (hasWind) {
    //     createWindAnimation(weatherData, !hasAnyAnimation);
    //     hasAnyAnimation = true;
    // }
}

// Manually set weather type
function setWeatherType(weatherType) {
    // Vary wind speed for different weather types
    let windSpeed = 3; // Default moderate wind
    
    if (weatherType === 'wind') {
        windSpeed = 12; // High wind
    } else if (weatherType === 'thunderstorm') {
        windSpeed = 15; // Very high wind for storms
    } else if (weatherType === 'rain' || weatherType === 'snow') {
        windSpeed = 6; // Moderate wind for rain/snow
    } else if (weatherType === 'clouds') {
        windSpeed = 4; // Light wind for clouds
    } else if (weatherType === 'clear') {
        windSpeed = 2; // Light wind for clear
    }
    
    const mockWeatherData = {
        name: 'San Francisco, USA',
        weather: [{ main: weatherType === 'thunderstorm' ? 'Thunderstorm' : weatherType.charAt(0).toUpperCase() + weatherType.slice(1), description: weatherType }],
        weather_code: weatherType === 'thunderstorm' ? 95 : weatherType === 'rain' ? 61 : weatherType === 'snow' ? 71 : weatherType === 'clouds' ? 2 : weatherType === 'fog' ? 45 : 0,
        main: { temp: 18, feels_like: 17 },
        wind: { 
            speed: windSpeed,
            deg: weatherType === 'wind' ? 135 : 270 // Southeast for wind, West for others
        },
        clouds: {
            all: weatherType === 'clouds' ? 80 : weatherType === 'rain' || weatherType === 'snow' || weatherType === 'thunderstorm' ? 60 : 20
        },
        rain: weatherType === 'rain' || weatherType === 'thunderstorm' ? { '1h': 2.5 } : null,
        snow: weatherType === 'snow' ? { '1h': 1.5 } : null
    };
    
    displayWeather(mockWeatherData, weatherType);
}

// Test weather code - generate mock weather data from a weather code
function testWeatherCode(weatherCode) {
    const code = parseInt(weatherCode);
    if (isNaN(code) || code < 0 || code > 99) {
        alert('Please enter a valid weather code between 0 and 99');
        return;
    }
    
    // Map weather code to weather condition (same logic as getWeather)
    let weatherMain = 'Clear';
    let description = 'clear sky';
    
    if (code >= 0 && code <= 3) {
        if (code === 0) {
            weatherMain = 'Clear';
            description = 'clear sky';
        } else if (code === 1) {
            weatherMain = 'Clear';
            description = 'mainly clear';
        } else if (code === 2) {
            weatherMain = 'Clouds';
            description = 'partly cloudy';
        } else {
            weatherMain = 'Clouds';
            description = 'overcast';
        }
    } else if (code >= 45 && code <= 48) {
        weatherMain = 'Fog';
        description = 'fog';
    } else if (code >= 51 && code <= 67) {
        weatherMain = 'Rain';
        if (code === 51) {
            description = 'light drizzle';
        } else if (code === 52) {
            description = 'moderate drizzle';
        } else if (code === 53) {
            description = 'dense drizzle';
        } else if (code === 54) {
            description = 'light freezing drizzle';
        } else if (code === 55) {
            description = 'dense freezing drizzle';
        } else if (code === 56) {
            description = 'light freezing drizzle';
        } else if (code === 57) {
            description = 'dense freezing drizzle';
        } else if (code === 61) {
            description = 'slight rain';
        } else if (code === 63) {
            description = 'moderate rain';
        } else if (code === 65) {
            description = 'heavy rain';
        } else if (code === 66) {
            description = 'light freezing rain';
        } else if (code === 67) {
            description = 'heavy freezing rain';
        } else {
            description = code <= 55 ? 'drizzle' : code <= 61 ? 'light rain' : code <= 65 ? 'moderate rain' : 'heavy rain';
        }
    } else if (code >= 71 && code <= 77) {
        weatherMain = 'Snow';
        if (code === 71) {
            description = 'slight snow';
        } else if (code === 73) {
            description = 'moderate snow';
        } else if (code === 75) {
            description = 'heavy snow';
        } else if (code === 77) {
            description = 'snow grains';
        } else {
            description = code <= 75 ? 'light snow' : 'moderate snow';
        }
    } else if (code >= 80 && code <= 82) {
        weatherMain = 'Rain';
        if (code === 80) {
            description = 'slight rain shower';
        } else if (code === 81) {
            description = 'moderate rain shower';
        } else if (code === 82) {
            description = 'violent rain shower';
        } else {
            description = 'rain shower';
        }
    } else if (code >= 85 && code <= 86) {
        weatherMain = 'Snow';
        if (code === 85) {
            description = 'slight snow shower';
        } else if (code === 86) {
            description = 'heavy snow shower';
        } else {
            description = 'snow shower';
        }
    } else if (code >= 95 && code <= 99) {
        weatherMain = 'Thunderstorm';
        if (code === 95) {
            description = 'thunderstorm';
        } else if (code === 96) {
            description = 'thunderstorm with slight hail';
        } else if (code === 97) {
            description = 'thunderstorm with moderate hail';
        } else if (code === 98) {
            description = 'thunderstorm with sandstorm';
        } else if (code === 99) {
            description = 'thunderstorm with heavy hail';
        } else {
            description = 'thunderstorm';
        }
    }
    
    // Determine appropriate values based on weather type
    let windSpeed = 3;
    let cloudCover = 20;
    let rain = null;
    let snow = null;
    
    if (code >= 95 && code <= 99) {
        // Thunderstorm
        windSpeed = 15;
        cloudCover = 80;
        rain = { '1h': 5.0 }; // Heavy rain for thunderstorms
    } else if (code >= 80 && code <= 82) {
        // Rain showers
        windSpeed = 8;
        cloudCover = 70;
        rain = { '1h': code === 82 ? 4.0 : code === 81 ? 2.5 : 1.5 };
    } else if (code >= 51 && code <= 67) {
        // Rain/Drizzle
        windSpeed = 6;
        cloudCover = 60;
        if (code <= 55) {
            rain = { '1h': 0.5 }; // Light drizzle
        } else if (code <= 57) {
            rain = { '1h': 0.8 }; // Freezing drizzle
        } else if (code <= 65) {
            rain = { '1h': code === 65 ? 3.0 : code === 63 ? 2.0 : 1.0 };
        } else {
            rain = { '1h': code === 67 ? 2.5 : 1.5 }; // Freezing rain
        }
    } else if (code >= 85 && code <= 86) {
        // Snow showers
        windSpeed = 7;
        cloudCover = 70;
        snow = { '1h': code === 86 ? 2.0 : 1.0 };
    } else if (code >= 71 && code <= 77) {
        // Snow
        windSpeed = 5;
        cloudCover = 60;
        snow = { '1h': code === 75 ? 2.5 : code === 73 ? 1.5 : 0.8 };
    } else if (code >= 45 && code <= 48) {
        // Fog
        windSpeed = 1;
        cloudCover = 100;
    } else if (code >= 2 && code <= 3) {
        // Clouds
        windSpeed = 4;
        cloudCover = code === 3 ? 100 : 50;
    } else {
        // Clear
        windSpeed = 2;
        cloudCover = code === 1 ? 25 : 0;
    }
    
    const mockWeatherData = {
        name: 'Test Location',
        weather: [{ main: weatherMain, description: description }],
        weather_code: code,
        main: { temp: 18, feels_like: 17, humidity: code >= 45 && code <= 48 ? 95 : 60 },
        wind: { speed: windSpeed, deg: 270 },
        clouds: { all: cloudCover },
        rain: rain,
        snow: snow,
        visibility: code >= 45 && code <= 48 ? 500 : undefined,
        coord: { lat: 37.7749, lon: -122.4194 }, // San Francisco coordinates
        current: { precipitation: rain ? rain['1h'] : (snow ? snow['1h'] : 0) }
    };
    
    displayWeather(mockWeatherData, null);
}

// Manually set moon phase
function setMoonPhase(phaseName) {
    const display = document.getElementById('moonDisplay');
    
    // Set weather to clear so we can see the moon
    const mockWeatherData = {
        name: 'San Francisco, USA',
        weather: [{ main: 'Clear', description: 'clear sky' }],
        main: { temp: 18, feels_like: 17 },
        wind: { speed: 2, deg: 270 },
        clouds: { all: 20 }
    };
    
    // Display clear weather first
    displayWeather(mockWeatherData, 'clear');
    
    // Wait a bit for the display to update, then show the moon
    setTimeout(() => {
        // Ensure moon display is visible
        display.classList.add('moon');
        display.style.display = 'block';
        
        // Get the moon phase ASCII art
        const moonPhaseArt = asciiArt.moon[phaseName];
        if (moonPhaseArt) {
            display.textContent = moonPhaseArt;
        }
        
        // Position moon in center of sky (visible position)
        display.style.top = '30%';
        display.style.left = '50%';
        display.style.transform = 'translate(-50%, -50%)';
        display.style.opacity = '0.9';
        display.style.filter = 'brightness(1)';
        
        // Clear any moon position intervals
        if (moonPositionInterval) {
            clearInterval(moonPositionInterval);
            moonPositionInterval = null;
        }
        
        // Update active button
        document.querySelectorAll('.moon-phase-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.phase === phaseName) {
                btn.classList.add('active');
            }
        });
        
        // Clear weather button active states when moon phase is selected
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }, 100);
}

// Create natural-looking horizon line with varied characters
function createHorizonLine() {
    const leftLine = document.getElementById('horizonLineLeft');
    const rightLine = document.getElementById('horizonLineRight');
    
    if (!leftLine || !rightLine) return;
    
    // Get the weather window container to calculate proper width
    const weatherWindow = document.getElementById('weatherWindow');
    const containerWidth = DIMENSIONS.getWindowWidth();
    
    // Calculate character count for each line (50% minus gap for tree)
    // Assuming ~10px per character (monospace font at 1rem)
    const lineWidth = (containerWidth / 2) - DIMENSIONS.SPACING.TREE_GAP; // Leave gap for tree
    const charsPerLine = Math.ceil(lineWidth / 10);
    
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

// Handle manual location submission
async function handleLocationSubmit() {
    const input = document.getElementById('locationInput');
    const locationName = input.value.trim();
    const display = document.getElementById('weatherDisplay');
    
    if (!locationName) {
        // Remove sun/moon classes to ensure centering
        display.classList.remove('sun', 'moon');
        display.textContent = 'Please enter a location\nin the input field below';
        return;
    }
    
    // Remove sun/moon classes to ensure centering
    display.classList.remove('sun', 'moon');
    display.textContent = 'Loading weather...';
    
    try {
        const geocoded = await geocodeLocation(locationName);
        const weatherData = await getWeather(geocoded.lat, geocoded.lon);
        
        // Update location name if geocoding returned a different name
        if (geocoded.name) {
            weatherData.name = geocoded.name;
        }
        
        // Store country code and set default unit if not already set
        if (geocoded.countryCode) {
            currentCountryCode = geocoded.countryCode;
            // Only set default if user hasn't manually changed the unit
            if (!localStorage.getItem('temperatureUnit')) {
                const defaultUnit = getDefaultTemperatureUnit(geocoded.countryCode);
                setTemperatureUnit(defaultUnit, false);
            }
        }
        
        // Store location coordinates immediately for sun/moon calculations
        currentLocation = { lat: geocoded.lat, lon: geocoded.lon };
        currentLocationCoords = { lat: geocoded.lat, lon: geocoded.lon };
        
        // Ensure weatherData has coord property
        if (!weatherData.coord) {
            weatherData.coord = { lat: geocoded.lat, lon: geocoded.lon };
        }
        
        displayWeather(weatherData);
        hideLocationInput();
        
        // Update weather every 10 minutes
        if (updateInterval) clearInterval(updateInterval);
        if (timeUpdateInterval) clearInterval(timeUpdateInterval);
        updateInterval = setInterval(async () => {
            const weatherData = await getWeather(currentLocation.lat, currentLocation.lon);
            displayWeather(weatherData);
        }, 600000);
    } catch (error) {
        console.error('Error fetching weather for location:', error);
        
        let errorMessage = 'Error: Could not find location\n\n';
        
        if (error.message === 'LOCATION_NOT_FOUND') {
            errorMessage = 'Location Not Found\n\n' +
                          'Try:\n' +
                          '- "San Francisco"\n' +
                          '- "Los Angeles"\n' +
                          '- "New York, US"\n' +
                          '- "London, GB"';
        } else if (error.message.includes('API_ERROR')) {
            errorMessage = 'API Error\n\n' +
                          'Please check:\n' +
                          '- API key is valid\n' +
                          '- Internet connection\n' +
                          '- Try again in a moment';
        } else {
            errorMessage += 'Please check:\n' +
                          '- Location spelling\n' +
                          '- Try "City" or "City, Country"';
        }
        
        // Remove sun/moon classes to ensure centering
        display.classList.remove('sun', 'moon');
        display.textContent = errorMessage;
        
        // Keep input visible so user can try again
        const inputContainer = document.getElementById('locationInputContainer');
        inputContainer.style.display = 'block';
    }
}

let currentLocation = null;
let updateInterval = null;

// Check if API is available (Open-Meteo doesn't require API key, so always return true)
function checkAPIKey() {
    return true; // Open-Meteo is always available, no API key needed
}

// Initialize
async function init() {
    try {
        // Store original tree structure
        getOriginalTreeLines();
        
        // Create side borders first
        createSideBorders();
        
        // Create natural horizon line
        createHorizonLine();
        
        // Note: Using default location (San Francisco) if API key not set
        
        // Set up manual location input handler
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
            showLocationInput();
        });
        
        // Set up weather type buttons
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const weatherType = btn.dataset.weather;
                setWeatherType(weatherType);
            });
        });
        
        // Set up moon phase buttons
        document.querySelectorAll('.moon-phase-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const phaseName = btn.dataset.phase;
                setMoonPhase(phaseName);
            });
        });
        
        // Set up temperature unit toggle
        const temperatureToggle = document.getElementById('temperatureToggle');
        if (temperatureToggle) {
            // Handle clicks on individual options
            const options = temperatureToggle.querySelectorAll('.temperature-option');
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    const unit = e.target.dataset.unit;
                    if (unit && unit !== currentTemperatureUnit) {
                        setTemperatureUnit(unit, true);
                    }
                });
            });
        }
        
        // Load saved temperature unit preference or set default
        const savedUnit = localStorage.getItem('temperatureUnit');
        if (savedUnit && (savedUnit === 'C' || savedUnit === 'F')) {
            setTemperatureUnit(savedUnit, false);
        } else {
            // Default to Celsius if no preference saved
            setTemperatureUnit('C', false);
        }
        
        // Set up theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // Load saved theme preference (default to dark mode)
            const savedTheme = localStorage.getItem('theme') || 'dark';
            const isLightMode = savedTheme === 'light';
            
            // Set initial state
            if (isLightMode) {
                document.body.classList.add('light-mode');
                themeToggle.querySelector('[data-theme="light"]').classList.add('active');
            } else {
                document.body.classList.remove('light-mode');
                themeToggle.querySelector('[data-theme="dark"]').classList.add('active');
            }
            
            // Handle clicks on individual options
            const options = themeToggle.querySelectorAll('.theme-option');
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    const theme = e.target.dataset.theme;
                    const isLight = theme === 'light';
                    
                    // Update active state
                    options.forEach(opt => opt.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // Update theme
                    if (isLight) {
                        document.body.classList.add('light-mode');
                    } else {
                        document.body.classList.remove('light-mode');
                    }
                    
                    localStorage.setItem('theme', theme);
                });
            });
        }
        
        // Set up dev toggle button
        const devToggleBtn = document.getElementById('devToggleBtn');
        if (devToggleBtn) {
            // Load saved dev mode state (default to off)
            const devModeOn = localStorage.getItem('devMode') === 'true';
            
            // Set initial state
            const container = document.querySelector('.container');
            const devToolsContainer = document.getElementById('devToolsContainer');
            
            if (devModeOn) {
                container.classList.remove('dev-mode-off');
                devToggleBtn.classList.add('active');
                if (devToolsContainer) {
                    devToolsContainer.style.display = 'flex';
                }
            } else {
                container.classList.add('dev-mode-off');
                devToggleBtn.classList.remove('active');
                if (devToolsContainer) {
                    devToolsContainer.style.display = 'none';
                }
            }
            
            // Toggle on click
            devToggleBtn.addEventListener('click', () => {
                const isCurrentlyOff = container.classList.contains('dev-mode-off');
                if (isCurrentlyOff) {
                    // Turn dev mode on
                    container.classList.remove('dev-mode-off');
                    devToggleBtn.classList.add('active');
                    localStorage.setItem('devMode', 'true');
                    if (devToolsContainer) {
                        devToolsContainer.style.display = 'flex';
                    }
                } else {
                    // Turn dev mode off
                    container.classList.add('dev-mode-off');
                    devToggleBtn.classList.remove('active');
                    localStorage.setItem('devMode', 'false');
                    if (devToolsContainer) {
                        devToolsContainer.style.display = 'none';
                    }
                }
                // Refresh display to update sun/moon info visibility
                if (lastWeatherData) {
                    updateTemperatureDisplay(lastWeatherData);
                }
            });
            
            // Set up dev tools (weather code input)
            const weatherCodeInput = document.getElementById('weatherCodeInput');
            const testWeatherCodeBtn = document.getElementById('testWeatherCodeBtn');
            
            // Handle test weather code button
            if (testWeatherCodeBtn && weatherCodeInput) {
                const handleTestWeatherCode = () => {
                    const code = weatherCodeInput.value.trim();
                    if (code) {
                        testWeatherCode(code);
                    }
                };
                
                testWeatherCodeBtn.addEventListener('click', handleTestWeatherCode);
                weatherCodeInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleTestWeatherCode();
                    }
                });
            }
        }
        
        // Get location (will use San Francisco as default if geolocation fails)
        try {
            const location = await getLocation();
            currentLocation = location;
            
            // If not from geolocation, use default name and set default unit for USA
            if (!location.fromGeolocation) {
                const weatherData = await getWeather(location.lat, location.lon);
                // Override with default location name
                weatherData.name = DEFAULT_LOCATION.name;
                // Set default unit for USA if no preference saved
                if (!localStorage.getItem('temperatureUnit')) {
                    currentCountryCode = 'US'; // San Francisco is in USA
                    setTemperatureUnit('F', false);
                }
                displayWeather(weatherData);
            } else {
                // For geolocation, try to get country code via reverse geocoding
                try {
                    const reverseGeocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${location.lat}&longitude=${location.lon}&count=1&language=en&format=json`;
                    const reverseResponse = await fetch(reverseGeocodeUrl);
                    if (reverseResponse.ok) {
                        const reverseData = await reverseResponse.json();
                        if (reverseData.results && reverseData.results.length > 0) {
                            const countryCode = reverseData.results[0].country_code;
                            if (countryCode) {
                                currentCountryCode = countryCode;
                                // Set default unit based on country if no preference saved
                                if (!localStorage.getItem('temperatureUnit')) {
                                    const defaultUnit = getDefaultTemperatureUnit(countryCode);
                                    setTemperatureUnit(defaultUnit, false);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                    // Continue without country code, default to Celsius
                }
                const weatherData = await getWeather(location.lat, location.lon);
                displayWeather(weatherData);
            }
            
            // Update weather every 10 minutes
            if (timeUpdateInterval) clearInterval(timeUpdateInterval);
            updateInterval = setInterval(async () => {
                const weatherData = await getWeather(currentLocation.lat, currentLocation.lon);
                // Preserve location name if using default
                if (!currentLocation.fromGeolocation && !checkAPIKey()) {
                    weatherData.name = DEFAULT_LOCATION.name;
                }
                displayWeather(weatherData);
            }, 600000);
        } catch (error) {
            // Fallback to San Francisco if everything fails
            console.log('Using default location (San Francisco)...');
            currentLocation = {
                lat: DEFAULT_LOCATION.lat,
                lon: DEFAULT_LOCATION.lon,
                fromGeolocation: false
            };
            // Set default unit for USA if no preference saved
            if (!localStorage.getItem('temperatureUnit')) {
                currentCountryCode = 'US'; // San Francisco is in USA
                setTemperatureUnit('F', false);
            }
            const weatherData = await getWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
            weatherData.name = DEFAULT_LOCATION.name;
            displayWeather(weatherData);
            
            if (timeUpdateInterval) clearInterval(timeUpdateInterval);
            updateInterval = setInterval(async () => {
                const weatherData = await getWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
                weatherData.name = DEFAULT_LOCATION.name;
                displayWeather(weatherData);
            }, 600000);
        }
    } catch (error) {
        console.error('Initialization error:', error);
        const display = document.getElementById('weatherDisplay');
        if (display) {
            display.classList.remove('sun', 'moon');
            display.textContent = 'Error loading weather';
        }
        showLocationInput();
    }
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

// Start the app
init();
