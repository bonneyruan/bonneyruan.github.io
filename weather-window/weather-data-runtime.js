(function initWeatherDataRuntime(global) {
    const DEFAULT_LOCATION = {
        lat: 37.7749,
        lon: -122.4194,
        name: 'San Francisco, USA'
    };

    const WEATHER_CODE_CONFIG = {
        0: { main: 'Clear', description: 'clear sky', weatherType: 'clear', precipitationKind: 'none' },
        1: { main: 'Clear', description: 'mainly clear', weatherType: 'clear', precipitationKind: 'none' },
        2: { main: 'Clouds', description: 'partly cloudy', weatherType: 'clouds', precipitationKind: 'none' },
        3: { main: 'Clouds', description: 'overcast', weatherType: 'clouds', precipitationKind: 'none' },
        45: { main: 'Fog', description: 'fog', weatherType: 'fog', precipitationKind: 'none' },
        48: { main: 'Fog', description: 'depositing rime fog', weatherType: 'fog', precipitationKind: 'none', isRimeFog: true },
        51: { main: 'Rain', description: 'light drizzle', weatherType: 'rain', precipitationKind: 'rain', isDrizzle: true },
        53: { main: 'Rain', description: 'moderate drizzle', weatherType: 'rain', precipitationKind: 'rain', isDrizzle: true },
        55: { main: 'Rain', description: 'dense drizzle', weatherType: 'rain', precipitationKind: 'rain', isDrizzle: true },
        56: { main: 'Rain', description: 'light freezing drizzle', weatherType: 'rain', precipitationKind: 'rain', isDrizzle: true, isFreezing: true },
        57: { main: 'Rain', description: 'dense freezing drizzle', weatherType: 'rain', precipitationKind: 'rain', isDrizzle: true, isFreezing: true },
        61: { main: 'Rain', description: 'slight rain', weatherType: 'rain', precipitationKind: 'rain' },
        63: { main: 'Rain', description: 'moderate rain', weatherType: 'rain', precipitationKind: 'rain' },
        65: { main: 'Rain', description: 'heavy rain', weatherType: 'rain', precipitationKind: 'rain' },
        66: { main: 'Rain', description: 'light freezing rain', weatherType: 'rain', precipitationKind: 'rain', isFreezing: true },
        67: { main: 'Rain', description: 'heavy freezing rain', weatherType: 'rain', precipitationKind: 'rain', isFreezing: true },
        71: { main: 'Snow', description: 'slight snow', weatherType: 'snow', precipitationKind: 'snow' },
        73: { main: 'Snow', description: 'moderate snow', weatherType: 'snow', precipitationKind: 'snow' },
        75: { main: 'Snow', description: 'heavy snow', weatherType: 'snow', precipitationKind: 'snow' },
        77: { main: 'Snow', description: 'snow grains', weatherType: 'snow', precipitationKind: 'snow', isSnowGrains: true },
        80: { main: 'Rain', description: 'slight rain shower', weatherType: 'rain', precipitationKind: 'rain', isShower: true },
        81: { main: 'Rain', description: 'moderate rain shower', weatherType: 'rain', precipitationKind: 'rain', isShower: true },
        82: { main: 'Rain', description: 'violent rain shower', weatherType: 'rain', precipitationKind: 'rain', isShower: true },
        85: { main: 'Snow', description: 'slight snow shower', weatherType: 'snow', precipitationKind: 'snow', isShower: true },
        86: { main: 'Snow', description: 'heavy snow shower', weatherType: 'snow', precipitationKind: 'snow', isShower: true },
        95: { main: 'Thunderstorm', description: 'thunderstorm', weatherType: 'thunderstorm', precipitationKind: 'rain', isThunderstorm: true },
        96: { main: 'Thunderstorm', description: 'thunderstorm with slight hail', weatherType: 'thunderstorm', precipitationKind: 'rain', isThunderstorm: true, hasHail: true },
        99: { main: 'Thunderstorm', description: 'thunderstorm with heavy hail', weatherType: 'thunderstorm', precipitationKind: 'rain', isThunderstorm: true, hasHail: true }
    };

    const WEATHER_TYPE_TO_CODE = {
        clear: 0,
        clouds: 2,
        rain: 61,
        snow: 71,
        fog: 45,
        thunderstorm: 95,
        wind: 1
    };

    function mapWeatherCode(weatherCode) {
        const code = Number.isFinite(weatherCode) ? weatherCode : Number.parseInt(weatherCode, 10);
        const mapped = WEATHER_CODE_CONFIG[code];
        if (mapped) {
            return {
                weatherCode: code,
                main: mapped.main,
                description: mapped.description,
                weatherType: mapped.weatherType,
                precipitationKind: mapped.precipitationKind,
                isDrizzle: Boolean(mapped.isDrizzle),
                isFreezing: Boolean(mapped.isFreezing),
                isShower: Boolean(mapped.isShower),
                isThunderstorm: Boolean(mapped.isThunderstorm),
                hasHail: Boolean(mapped.hasHail),
                isSnowGrains: Boolean(mapped.isSnowGrains),
                isRimeFog: Boolean(mapped.isRimeFog)
            };
        }

        return {
            weatherCode: code,
            main: 'Clear',
            description: 'clear sky',
            weatherType: 'clear',
            precipitationKind: 'none',
            isDrizzle: false,
            isFreezing: false,
            isShower: false,
            isThunderstorm: false,
            hasHail: false,
            isSnowGrains: false,
            isRimeFog: false
        };
    }

    function getWindMotionLevel(windSpeed) {
        if (windSpeed >= 15) return 'storm';
        if (windSpeed >= 10) return 'strong';
        if (windSpeed >= 2) return 'gentle';
        return 'calm';
    }

    function getDefaultTemperatureUnit(countryCode) {
        const fahrenheitCountries = ['US', 'BS', 'BZ', 'KY', 'PW', 'FM', 'MH', 'LR'];
        if (countryCode && fahrenheitCountries.includes(countryCode.toUpperCase())) {
            return 'F';
        }
        return 'C';
    }

    function buildLegacyWeatherData(options = {}) {
        const {
            name = 'Test Location',
            lat = DEFAULT_LOCATION.lat,
            lon = DEFAULT_LOCATION.lon,
            countryCode = null,
            weatherCode = 0,
            temperature = 18,
            feelsLike = temperature,
            humidity = null,
            windSpeed = null,
            windDirection = 270,
            precipitation = null,
            cloudCover = null,
            visibility = null,
            timezone = null,
            utcOffsetSeconds = Math.round(lon / 15) * 3600
        } = options;

        const mapped = mapWeatherCode(weatherCode);
        const resolvedWindSpeed = windSpeed !== null ? windSpeed :
            mapped.isThunderstorm ? 15 :
            mapped.weatherType === 'rain' ? 6 :
            mapped.weatherType === 'snow' ? 5 :
            mapped.weatherType === 'fog' ? 1 :
            mapped.weatherType === 'clouds' ? 4 :
            2;

        const resolvedCloudCover = cloudCover !== null ? cloudCover :
            mapped.weatherType === 'fog' ? 100 :
            mapped.weatherType === 'clouds' ? (weatherCode === 3 ? 100 : 50) :
            mapped.weatherType === 'thunderstorm' ? 80 :
            mapped.weatherType === 'rain' || mapped.weatherType === 'snow' ? 60 :
            weatherCode === 1 ? 25 : 0;

        const resolvedHumidity = humidity !== null ? humidity : (mapped.weatherType === 'fog' ? 95 : 60);

        let precipitationAmount = precipitation;
        if (precipitationAmount === null) {
            if (mapped.isThunderstorm) {
                precipitationAmount = mapped.hasHail ? 5.0 : 4.0;
            } else if (mapped.precipitationKind === 'rain') {
                if (weatherCode === 51) precipitationAmount = 0.2;
                else if (weatherCode === 53) precipitationAmount = 0.45;
                else if (weatherCode === 55) precipitationAmount = 0.8;
                else if (weatherCode === 56) precipitationAmount = 0.25;
                else if (weatherCode === 57) precipitationAmount = 0.65;
                else if (weatherCode === 80) precipitationAmount = 1.4;
                else if (weatherCode === 81) precipitationAmount = 2.6;
                else if (weatherCode === 82) precipitationAmount = 4.2;
                else if (weatherCode === 61) precipitationAmount = 0.8;
                else if (weatherCode === 63) precipitationAmount = 1.8;
                else if (weatherCode === 65) precipitationAmount = 4.0;
                else if (weatherCode === 66) precipitationAmount = 1.0;
                else if (weatherCode === 67) precipitationAmount = 3.0;
                else precipitationAmount = mapped.isDrizzle ? 0.5 : mapped.isShower ? 2.5 : mapped.isFreezing ? 1.5 : 1.0;
            } else if (mapped.precipitationKind === 'snow') {
                precipitationAmount = mapped.isShower ? 1.0 : weatherCode === 75 ? 2.5 : weatherCode === 73 ? 1.5 : 0.8;
            } else {
                precipitationAmount = 0;
            }
        }

        const resolvedVisibility = visibility !== null ? visibility :
            mapped.weatherType === 'fog' ? (resolvedHumidity > 90 ? 500 : 1000) : undefined;

        const legacyWeatherData = {
            name,
            weather: [{ main: mapped.main, description: mapped.description }],
            weather_code: mapped.weatherCode,
            main: {
                temp: temperature,
                feels_like: feelsLike,
                humidity: resolvedHumidity
            },
            wind: {
                speed: resolvedWindSpeed,
                deg: windDirection
            },
            clouds: {
                all: resolvedCloudCover
            },
            rain: mapped.precipitationKind === 'rain' && precipitationAmount > 0 ? { '1h': precipitationAmount } : null,
            snow: mapped.precipitationKind === 'snow' && precipitationAmount > 0 ? { '1h': precipitationAmount } : null,
            visibility: resolvedVisibility,
            coord: { lat, lon },
            current: { precipitation: precipitationAmount > 0 ? precipitationAmount : 0 },
            timezone,
            utc_offset_seconds: utcOffsetSeconds
        };

        if (countryCode) {
            legacyWeatherData.country_code = countryCode;
        }

        return legacyWeatherData;
    }

    function normalizeWeather(rawWeatherData, context = {}) {
        const legacyWeatherData = rawWeatherData || buildLegacyWeatherData();
        const weatherCode = legacyWeatherData?.weather_code ?? context.weatherCode ?? 0;
        const mapped = mapWeatherCode(weatherCode);
        const lat = legacyWeatherData?.coord?.lat ?? context.lat ?? global.currentLocationCoords?.lat ?? global.currentLocation?.lat ?? DEFAULT_LOCATION.lat;
        const lon = legacyWeatherData?.coord?.lon ?? context.lon ?? global.currentLocationCoords?.lon ?? global.currentLocation?.lon ?? DEFAULT_LOCATION.lon;
        const temperatureC = legacyWeatherData?.main?.temp ?? 18;
        const feelsLikeC = legacyWeatherData?.main?.feels_like ?? temperatureC;
        const humidity = legacyWeatherData?.main?.humidity ?? 60;
        const visibility = legacyWeatherData?.visibility ?? (mapped.weatherType === 'fog' ? (humidity > 90 ? 200 : 1000) : 10000);
        const cloudCover = legacyWeatherData?.clouds?.all ?? 0;
        const windSpeed = legacyWeatherData?.wind?.speed ?? 0;
        const windDirection = legacyWeatherData?.wind?.deg ?? 0;
        const rainAmount = legacyWeatherData?.rain?.['1h'] ?? legacyWeatherData?.rain?.['3h'] ?? 0;
        const snowAmount = legacyWeatherData?.snow?.['1h'] ?? legacyWeatherData?.snow?.['3h'] ?? 0;
        const precipitationAmount = mapped.precipitationKind === 'snow'
            ? Math.max(snowAmount, legacyWeatherData?.current?.precipitation ?? 0)
            : Math.max(rainAmount, legacyWeatherData?.current?.precipitation ?? 0);
        const hasFogWeatherType = mapped.weatherType === 'fog' || legacyWeatherData?.weather?.[0]?.description?.toLowerCase().includes('fog');
        const showFog = hasFogWeatherType || (visibility < 1000 && humidity > 80);
        const showRain = mapped.precipitationKind === 'rain' && precipitationAmount > 0;
        const showSnow = mapped.precipitationKind === 'snow' && precipitationAmount > 0;
        const showThunderstorm = mapped.isThunderstorm && showRain;
        const showClouds = cloudCover > 0;
        const showCelestial = visibility >= 200;

        return {
            location: {
                name: legacyWeatherData?.name || context.name || DEFAULT_LOCATION.name,
                lat,
                lon,
                countryCode: legacyWeatherData?.country_code ?? context.countryCode ?? global.currentCountryCode ?? null,
                timezone: legacyWeatherData?.timezone ?? null,
                utcOffsetSeconds: legacyWeatherData?.utc_offset_seconds ?? null
            },
            current: {
                temperatureC,
                feelsLikeC,
                humidity,
                visibility,
                cloudCover,
                windSpeed,
                windDirection
            },
            condition: {
                weatherCode: mapped.weatherCode,
                main: mapped.main,
                description: legacyWeatherData?.weather?.[0]?.description ?? mapped.description,
                weatherType: context.manualWeatherType || mapped.weatherType,
                isRimeFog: mapped.isRimeFog
            },
            precipitation: {
                kind: mapped.precipitationKind,
                amount1h: precipitationAmount,
                isDrizzle: mapped.isDrizzle,
                isFreezing: mapped.isFreezing,
                isShower: mapped.isShower,
                isThunderstorm: mapped.isThunderstorm,
                hasHail: mapped.hasHail,
                isSnowGrains: mapped.isSnowGrains
            },
            astronomy: {
                lat,
                lon,
                utcOffsetSeconds: legacyWeatherData?.utc_offset_seconds ?? null
            },
            derived: {
                showRain,
                showSnow,
                showFog,
                showClouds,
                showCelestial,
                showThunderstorm,
                windMotionLevel: getWindMotionLevel(windSpeed)
            },
            legacyWeatherData
        };
    }

    global.WeatherWindow = global.WeatherWindow || {};
    Object.assign(global.WeatherWindow, {
        DEFAULT_LOCATION,
        WEATHER_TYPE_TO_CODE,
        getDefaultTemperatureUnit,
        mapWeatherCode,
        getWindMotionLevel,
        buildLegacyWeatherData,
        normalizeWeather
    });
})(window);
