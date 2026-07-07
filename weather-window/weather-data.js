export const DEFAULT_LOCATION = {
    lat: 37.7749,
    lon: -122.4194,
    name: 'San Francisco, USA',
    countryCode: 'US'
};

const WEATHER_CODE_RULES = [
    { match: (code) => code === 0, main: 'Clear', key: 'clear', description: 'clear sky', precipitationType: 'none' },
    { match: (code) => code === 1, main: 'Clear', key: 'clear', description: 'mainly clear', precipitationType: 'none' },
    { match: (code) => code === 2, main: 'Clouds', key: 'clouds', description: 'partly cloudy', precipitationType: 'none' },
    { match: (code) => code === 3, main: 'Clouds', key: 'clouds', description: 'overcast', precipitationType: 'none' },
    { match: (code) => code >= 45 && code <= 48, main: 'Fog', key: 'fog', description: 'fog', precipitationType: 'none' },
    { match: (code) => code === 51, main: 'Rain', key: 'rain', description: 'light drizzle', precipitationType: 'drizzle' },
    { match: (code) => code === 53, main: 'Rain', key: 'rain', description: 'moderate drizzle', precipitationType: 'drizzle' },
    { match: (code) => code === 55, main: 'Rain', key: 'rain', description: 'dense drizzle', precipitationType: 'drizzle' },
    { match: (code) => code === 56 || code === 57, main: 'Rain', key: 'rain', description: 'freezing drizzle', precipitationType: 'freezingRain' },
    { match: (code) => code === 61, main: 'Rain', key: 'rain', description: 'slight rain', precipitationType: 'rain' },
    { match: (code) => code === 63, main: 'Rain', key: 'rain', description: 'moderate rain', precipitationType: 'rain' },
    { match: (code) => code === 65, main: 'Rain', key: 'rain', description: 'heavy rain', precipitationType: 'rain' },
    { match: (code) => code === 66 || code === 67, main: 'Rain', key: 'rain', description: 'freezing rain', precipitationType: 'freezingRain' },
    { match: (code) => code >= 71 && code <= 77, main: 'Snow', key: 'snow', description: 'snow', precipitationType: 'snow' },
    { match: (code) => code === 80, main: 'Rain', key: 'rain', description: 'slight rain shower', precipitationType: 'rain' },
    { match: (code) => code === 81, main: 'Rain', key: 'rain', description: 'moderate rain shower', precipitationType: 'rain' },
    { match: (code) => code === 82, main: 'Rain', key: 'rain', description: 'violent rain shower', precipitationType: 'rain' },
    { match: (code) => code >= 85 && code <= 86, main: 'Snow', key: 'snow', description: 'snow shower', precipitationType: 'snow' },
    { match: (code) => code === 95, main: 'Thunderstorm', key: 'thunderstorm', description: 'thunderstorm', precipitationType: 'rain' },
    { match: (code) => code === 96 || code === 97, main: 'Thunderstorm', key: 'thunderstorm', description: 'thunderstorm with hail', precipitationType: 'rain', hail: true },
    { match: (code) => code === 98, main: 'Thunderstorm', key: 'thunderstorm', description: 'thunderstorm with dust', precipitationType: 'rain' },
    { match: (code) => code === 99, main: 'Thunderstorm', key: 'thunderstorm', description: 'thunderstorm with heavy hail', precipitationType: 'rain', hail: true }
];

const COUNTRY_NORMALIZATION = {
    usa: 'US',
    'u.s.a': 'US',
    'u.s.a.': 'US',
    'united states': 'US',
    'united states of america': 'US',
    uk: 'GB',
    'u.k': 'GB',
    'u.k.': 'GB',
    'united kingdom': 'GB',
    'great britain': 'GB'
};

const COUNTRY_CAPITALS = {
    russia: 'Moscow',
    'russian federation': 'Moscow',
    usa: 'Washington',
    'united states': 'Washington',
    uk: 'London',
    'united kingdom': 'London',
    france: 'Paris',
    germany: 'Berlin',
    italy: 'Rome',
    spain: 'Madrid',
    china: 'Beijing',
    japan: 'Tokyo',
    india: 'New Delhi',
    brazil: 'Brasilia',
    australia: 'Canberra',
    canada: 'Ottawa',
    mexico: 'Mexico City',
    'south korea': 'Seoul',
    indonesia: 'Jakarta',
    turkey: 'Ankara',
    'saudi arabia': 'Riyadh',
    argentina: 'Buenos Aires',
    'south africa': 'Cape Town',
    egypt: 'Cairo',
    poland: 'Warsaw',
    netherlands: 'Amsterdam',
    belgium: 'Brussels',
    sweden: 'Stockholm',
    norway: 'Oslo',
    denmark: 'Copenhagen',
    finland: 'Helsinki',
    greece: 'Athens',
    portugal: 'Lisbon',
    thailand: 'Bangkok',
    vietnam: 'Hanoi',
    philippines: 'Manila',
    malaysia: 'Kuala Lumpur',
    singapore: 'Singapore',
    'new zealand': 'Wellington',
    chile: 'Santiago',
    colombia: 'Bogota',
    peru: 'Lima',
    venezuela: 'Caracas'
};

export function mapWeatherCode(code) {
    const rule = WEATHER_CODE_RULES.find((entry) => entry.match(code));
    if (rule) {
        return rule;
    }

    return {
        main: 'Clear',
        key: 'clear',
        description: 'clear sky',
        precipitationType: 'none',
        hail: false
    };
}

export function getDefaultTemperatureUnit(countryCode) {
    return countryCode === 'US' ? 'F' : 'C';
}

function normalizeCountryName(locationName) {
    const parts = locationName.split(',').map((part) => part.trim());
    if (parts.length < 2) {
        return locationName;
    }

    const countryPart = parts[parts.length - 1].toLowerCase();
    if (COUNTRY_NORMALIZATION[countryPart]) {
        parts[parts.length - 1] = COUNTRY_NORMALIZATION[countryPart];
        return parts.join(', ');
    }

    return locationName;
}

function buildLocationName(result) {
    let name = result.name;

    if (result.admin1 && result.admin1 !== result.name) {
        name += `, ${result.admin1}`;
    }

    if (
        result.country &&
        result.country !== result.name &&
        result.country !== result.admin1 &&
        !name.includes(result.country)
    ) {
        name += `, ${result.country}`;
    }

    return name;
}

export async function geocodeLocation(locationName) {
    const normalizedSearch = locationName.toLowerCase().trim();
    const preferredSearch = COUNTRY_CAPITALS[normalizedSearch]
        ? `${COUNTRY_CAPITALS[normalizedSearch]}, ${locationName}`
        : locationName;

    const variations = [...new Set([
        preferredSearch,
        normalizeCountryName(preferredSearch),
        preferredSearch.split(',')[0].trim()
    ])];

    for (const searchName of variations) {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=en&format=json`;
        const response = await fetch(url);

        if (!response.ok) {
            continue;
        }

        const data = await response.json();
        if (data?.results?.length) {
            const result = data.results[0];
            return {
                lat: result.latitude,
                lon: result.longitude,
                name: buildLocationName(result),
                countryCode: result.country_code || null
            };
        }
    }

    throw new Error('LOCATION_NOT_FOUND');
}

export function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('GEOLOCATION_UNAVAILABLE'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    name: 'Current location',
                    fromGeolocation: true
                });
            },
            (error) => reject(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

function approximateVisibility(mappedWeather, humidity) {
    if (mappedWeather.main !== 'Fog') {
        return 10000;
    }

    if (humidity > 90) {
        return 200;
    }

    if (humidity > 80) {
        return 600;
    }

    return 1200;
}

function buildLocalTimeData(utcOffsetSeconds) {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + (utcOffsetSeconds * 1000));
}

export function normalizeWeatherData({
    lat,
    lon,
    locationName = '',
    countryCode = null,
    weatherCode = 0,
    temperatureC = 18,
    humidity = 60,
    windSpeed = 3,
    windDirection = 270,
    precipitation = 0,
    cloudCover = 0,
    timezone = null,
    utcOffsetSeconds = 0
}) {
    const mappedWeather = mapWeatherCode(weatherCode);
    const localTime = buildLocalTimeData(utcOffsetSeconds);
    const location = {
        name: locationName || DEFAULT_LOCATION.name,
        lat,
        lon,
        countryCode: countryCode || DEFAULT_LOCATION.countryCode,
        timezone,
        utcOffsetSeconds
    };

    return {
        location,
        weather: {
            code: weatherCode,
            main: mappedWeather.main,
            key: mappedWeather.key,
            description: mappedWeather.description,
            temperatureC,
            feelsLikeC: temperatureC,
            humidity,
            windSpeed,
            windDirection,
            cloudCover,
            precipitationAmount: precipitation,
            precipitationType: mappedWeather.precipitationType,
            visibility: approximateVisibility(mappedWeather, humidity),
            hasHail: Boolean(mappedWeather.hail),
            timezone,
            utcOffsetSeconds,
            localTime
        }
    };
}

export async function fetchWeatherForCoords({ lat, lon, locationName = '', countryCode = null }) {
    const timestamp = Date.now();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover&hourly=precipitation&timezone=auto&_=${timestamp}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('WEATHER_API_ERROR');
    }

    const data = await response.json();
    const current = data.current || {};
    const hourlyPrecip = data.hourly?.precipitation?.[0] ?? 0;
    const precipitation = Math.max(current.precipitation ?? 0, hourlyPrecip);

    return normalizeWeatherData({
        lat,
        lon,
        locationName,
        countryCode,
        weatherCode: current.weather_code ?? 0,
        temperatureC: current.temperature_2m ?? 18,
        humidity: current.relative_humidity_2m ?? 60,
        windSpeed: current.wind_speed_10m ?? 3,
        windDirection: current.wind_direction_10m ?? 270,
        precipitation,
        cloudCover: current.cloud_cover ?? 0,
        timezone: data.timezone ?? null,
        utcOffsetSeconds: data.utc_offset_seconds ?? Math.round(lon / 15) * 3600
    });
}

export function createMockSceneFromWeatherKey(weatherKey, location = DEFAULT_LOCATION) {
    const codeByKey = {
        clear: 0,
        clouds: 3,
        rain: 63,
        snow: 73,
        fog: 45,
        thunderstorm: 95,
        wind: 2
    };

    const code = codeByKey[weatherKey] ?? 0;
    const baseCloudCover = weatherKey === 'clear' ? 10 : weatherKey === 'clouds' ? 80 : 50;
    const precipitation = weatherKey === 'rain' ? 2.5 : weatherKey === 'snow' ? 1.2 : weatherKey === 'thunderstorm' ? 3.5 : 0;
    const windSpeed = weatherKey === 'wind' ? 12 : weatherKey === 'thunderstorm' ? 14 : weatherKey === 'rain' ? 7 : 3;

    const scene = normalizeWeatherData({
        lat: location.lat,
        lon: location.lon,
        locationName: location.name,
        countryCode: location.countryCode,
        weatherCode: code,
        temperatureC: weatherKey === 'snow' ? -2 : 18,
        humidity: weatherKey === 'fog' ? 95 : weatherKey === 'rain' ? 84 : 60,
        windSpeed,
        windDirection: weatherKey === 'wind' ? 135 : 270,
        precipitation,
        cloudCover: baseCloudCover,
        timezone: null,
        utcOffsetSeconds: Math.round(location.lon / 15) * 3600
    });

    if (weatherKey === 'wind') {
        scene.weather.key = 'wind';
        scene.weather.main = 'Clear';
        scene.weather.description = 'windy';
        scene.weather.precipitationType = 'none';
        scene.weather.precipitationAmount = 0;
    }

    return scene;
}

export function createSceneFromWeatherCode(code, location = DEFAULT_LOCATION) {
    const numericCode = Number.parseInt(code, 10);
    if (Number.isNaN(numericCode) || numericCode < 0 || numericCode > 99) {
        throw new Error('INVALID_WEATHER_CODE');
    }

    const mapped = mapWeatherCode(numericCode);
    const temperatureC = mapped.key === 'snow' ? -1 : 18;
    const cloudCover = mapped.key === 'clear' ? 5 : mapped.key === 'clouds' ? 85 : 65;
    const humidity = mapped.key === 'fog' ? 96 : mapped.key === 'rain' ? 88 : 62;
    const precipitation = mapped.precipitationType === 'snow' ? 1.5 : mapped.precipitationType === 'none' ? 0 : 2.2;

    return normalizeWeatherData({
        lat: location.lat,
        lon: location.lon,
        locationName: location.name,
        countryCode: location.countryCode,
        weatherCode: numericCode,
        temperatureC,
        humidity,
        windSpeed: mapped.main === 'Thunderstorm' ? 15 : mapped.key === 'clear' ? 3 : 7,
        windDirection: 245,
        precipitation,
        cloudCover,
        timezone: null,
        utcOffsetSeconds: Math.round(location.lon / 15) * 3600
    });
}
