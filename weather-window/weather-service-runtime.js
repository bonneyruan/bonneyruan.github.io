(function initWeatherServiceRuntime(global) {
    function normalizeCountryName(locationName) {
        const countryVariations = {
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

        const parts = locationName.split(',').map((part) => part.trim());
        if (parts.length > 1) {
            const countryPart = parts[parts.length - 1].toLowerCase();
            if (countryVariations[countryPart]) {
                parts[parts.length - 1] = countryVariations[countryPart];
                return parts.join(', ');
            }
        }

        return locationName;
    }

    async function geocodeLocation(locationName) {
        const countryCapitals = {
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
            brazil: 'Brasília',
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
            colombia: 'Bogotá',
            peru: 'Lima',
            venezuela: 'Caracas'
        };

        const normalizedSearch = locationName.toLowerCase().trim();
        if (countryCapitals[normalizedSearch]) {
            locationName = `${countryCapitals[normalizedSearch]}, ${locationName}`;
        }

        const searchVariations = [
            locationName,
            normalizeCountryName(locationName),
            locationName.split(',')[0].trim()
        ];
        const uniqueVariations = [...new Set(searchVariations)];

        for (const searchName of uniqueVariations) {
            try {
                const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=en&format=json`;
                const response = await fetch(url);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Geocoding API error:', response.status, errorText);
                    if (searchName === uniqueVariations[uniqueVariations.length - 1]) {
                        throw new Error(`API_ERROR_${response.status}`);
                    }
                    continue;
                }

                const data = await response.json();
                if (data && data.results && data.results.length > 0) {
                    const result = data.results[0];
                    const countryCode = result.country_code || null;

                    let resolvedLocationName = result.name;
                    if (result.admin1 && result.admin1 !== result.name) {
                        resolvedLocationName += `, ${result.admin1}`;
                    }
                    if (
                        result.country &&
                        result.country !== result.name &&
                        result.country !== result.admin1 &&
                        !resolvedLocationName.includes(result.country)
                    ) {
                        resolvedLocationName += `, ${result.country}`;
                    }

                    return {
                        lat: result.latitude,
                        lon: result.longitude,
                        name: resolvedLocationName,
                        countryCode
                    };
                }
            } catch (error) {
                if (searchName !== uniqueVariations[uniqueVariations.length - 1]) {
                    continue;
                }
                console.error('Geocoding error:', error);
                throw error;
            }
        }

        throw new Error('LOCATION_NOT_FOUND');
    }

    async function getLocation() {
        return new Promise((resolve) => {
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
                        resolve({
                            lat: global.WeatherWindow.DEFAULT_LOCATION.lat,
                            lon: global.WeatherWindow.DEFAULT_LOCATION.lon,
                            fromGeolocation: false
                        });
                    }
                );
            } else {
                resolve({
                    lat: global.WeatherWindow.DEFAULT_LOCATION.lat,
                    lon: global.WeatherWindow.DEFAULT_LOCATION.lon,
                    fromGeolocation: false
                });
            }
        });
    }

    async function getWeather(lat, lon) {
        try {
            const timestamp = Date.now();
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover&hourly=precipitation&timezone=auto&_=${timestamp}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Weather API error');
            }

            const data = await response.json();
            const timezone = data.timezone || null;
            let utcOffsetSeconds = data.utc_offset_seconds || null;

            if (utcOffsetSeconds === null || utcOffsetSeconds === undefined) {
                const estimatedOffsetHours = Math.round(lon / 15);
                utcOffsetSeconds = estimatedOffsetHours * 3600;
                console.warn('API did not provide utc_offset_seconds, estimating from longitude:', {
                    longitude: lon,
                    estimatedOffsetHours,
                    estimatedOffsetSeconds: utcOffsetSeconds
                });
            }

            const current = data.current;
            const weatherCode = current.weather_code;
            const mapped = global.WeatherWindow.mapWeatherCode(weatherCode);
            const currentPrecip = current.precipitation ?? 0;
            const hourlyPrecip = data.hourly && data.hourly.precipitation && data.hourly.precipitation[0]
                ? data.hourly.precipitation[0]
                : currentPrecip;
            const precipitation = Math.max(currentPrecip, hourlyPrecip);

            return global.WeatherWindow.buildLegacyWeatherData({
                name: '',
                lat,
                lon,
                weatherCode,
                temperature: current.temperature_2m,
                feelsLike: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                windSpeed: current.wind_speed_10m,
                windDirection: current.wind_direction_10m,
                precipitation,
                cloudCover: current.cloud_cover !== undefined && current.cloud_cover !== null
                    ? current.cloud_cover
                    : (weatherCode >= 1 && weatherCode <= 3 ? (weatherCode === 1 ? 25 : weatherCode === 2 ? 50 : 100) : 0),
                visibility: mapped.weatherType === 'fog' ? (current.relative_humidity_2m > 90 ? 200 : 1000) : undefined,
                timezone,
                utcOffsetSeconds
            });
        } catch (error) {
            console.error('Error fetching weather:', error);
            const mockWeathers = [
                { main: 'Rain', description: 'moderate rain' },
                { main: 'Clear', description: 'clear sky' },
                { main: 'Clouds', description: 'scattered clouds' },
                { main: 'Fog', description: 'fog' }
            ];
            const hour = new Date().getHours();
            let weatherType;
            if (hour >= 6 && hour < 12) {
                weatherType = mockWeathers[1];
            } else if (hour >= 12 && hour < 18) {
                weatherType = mockWeathers[2];
            } else {
                weatherType = mockWeathers[Math.floor(Math.random() * mockWeathers.length)];
            }

            const fallbackCode = weatherType.main === 'Rain' ? 63 : weatherType.main === 'Clouds' ? 2 : weatherType.main === 'Fog' ? 45 : 0;
            return global.WeatherWindow.buildLegacyWeatherData({
                name: global.WeatherWindow.DEFAULT_LOCATION.name,
                lat,
                lon,
                weatherCode: fallbackCode,
                temperature: 18,
                feelsLike: 17,
                windSpeed: 5,
                windDirection: 270
            });
        }
    }

    global.WeatherWindow = global.WeatherWindow || {};
    Object.assign(global.WeatherWindow, {
        normalizeCountryName,
        geocodeLocation,
        getLocation,
        getWeather
    });
})(window);
