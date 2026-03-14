(function () {
    const DEFAULT_LOCATION = {
        lat: 37.7749,
        lon: -122.4194,
        name: 'San Francisco, USA',
        countryCode: 'US'
    };

    const storage = {
        getItem(key) {
            try {
                return window.localStorage.getItem(key);
            } catch (error) {
                return null;
            }
        },
        setItem(key, value) {
            try {
                window.localStorage.setItem(key, value);
            } catch (error) {
                // Ignore storage failures so the app still boots from local files.
            }
        }
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

    const OUTDOOR_PROFILES = {
        forest: {
            label: 'Forest',
            distantArt: () => [
                '      /\\        /\\           /\\      ',
                '  /\\ /  \\  /\\  /  \\   /\\    /  \\     ',
                ' /  V    \\/  \\/    \\_/  \\__/    \\    '
            ],
            foregroundArt: (scene) => [
                '      (%%%%)          (%%%%)           ',
                '     (%%%%%%)        (%%%%%%)          ',
                '   ___||__||___________||__||___       ',
                scene.weather.precipitationType === 'snow'
                    ? '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^'
                    : '""""""""""""""""""""""""""""""""""""""""'
            ]
        },
        coastal: {
            label: 'Coastal',
            distantArt: () => [
                '           __                    __    ',
                '      ____/  \\____        ______/  \\__ ',
                '  ~~~/            \\~~~~~~/            \\'
            ],
            foregroundArt: () => [
                '      _/\\_                    _/\\_     ',
                '   ~~/~~~~\\~~~~~~~~~~~~~~~~~~/~~~~\\~~~ ',
                '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ '
            ]
        },
        mountain: {
            label: 'Mountain',
            distantArt: () => [
                '            /\\               /\\        ',
                '    /\\     /  \\      /\\     /  \\  /\\   ',
                '   /  \\___/    \\____/  \\___/    \\/  \\  '
            ],
            foregroundArt: (scene) => [
                '      ||                 ||            ',
                '   ___||_________________||____        ',
                scene.weather.precipitationType === 'snow'
                    ? '___________..__..___________..__.._____'
                    : '___________/  /_____________/  /_______'
            ]
        },
        plains: {
            label: 'Plains',
            distantArt: () => [
                '                                      ',
                '      __         __         __        ',
                '_____/  \\_______/  \\_______/  \\_______'
            ],
            foregroundArt: () => [
                '  ,,    ,,   ,,    ,,   ,,    ,,      ',
                '  ||    ||   ||    ||   ||    ||      ',
                '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^'
            ]
        },
        desert: {
            label: 'Desert',
            distantArt: () => [
                '           __        ___               ',
                '      ____/  \\______/   \\____          ',
                '_____/                        \\________'
            ],
            foregroundArt: () => [
                '           _ _                          ',
                '      _   | | |      _                 ',
                '_____/ \\__|_|_|_____/ \\________________'
            ]
        },
        urban: {
            label: 'Urban',
            distantArt: () => [
                '   |-|   ||||    |-|     |||     ||    ',
                ' __| |___||||____| |____||||_____| |__ ',
                ' |  _  | || |  |  _  |  || |  |  _  |  '
            ],
            foregroundArt: () => [
                '====================================== ',
                '  []     []     []      []      []     ',
                '====================================== '
            ]
        },
        tropical: {
            label: 'Tropical',
            distantArt: () => [
                '     _\\/_               _\\/_           ',
                '      /\\      __        /\\      __     ',
                '_____/  \\____/  \\______/  \\____/  \\____'
            ],
            foregroundArt: () => [
                '       \\\\                 //           ',
                '   _\\  \\\\_           _//  /_          ',
                '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
            ]
        }
    };

    const SURROUNDINGS_PROFILES = {
        neutral: {
            label: 'Neutral',
            top: '                                          ',
            left: '    \n    \n    \n    \n    \n    \n    ',
            right: '    \n    \n    \n    \n    \n    \n    ',
            bottom: '                                          '
        },
        minimalRoom: {
            label: 'Minimal Room',
            top: '   .----------------------------------.   ',
            left: '   |\\\n   ||\n   ||\n   ||\n   ||\n   ||\n   |/',
            right: '\\|   \n||   \n||   \n||   \n||   \n||   \n/|   ',
            bottom: '   |____book____lamp____plant_________|   '
        },
        house: {
            label: 'House',
            top: '   .== curtain rail ==.     .== framed art ==.   ',
            left: '  /|\n / |\n/  |\n|  |\n|  |\n|  |\n|__|',
            right: '|__|\n|  |\n|  |\n|  |\n|  |\n|  \\\n|\\  \\',
            bottom: '   [ chair ]______ [ radiator ] ______[ rug ]   '
        },
        cafe: {
            label: 'Cafe',
            top: '   .- menu board -.      .- hanging light -.   ',
            left: '  ( )\n _| |_\n|_   _|\n  | |\n  | |\n _| |_\n(_____',
            right: '_____)\n _| |_\n  | |\n  | |\n|_   _|\n _| |_\n( )',
            bottom: '   [ cup ]___[ table edge ]___[ pastry case ]   '
        }
    };

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

    function mapWeatherCode(code) {
        return WEATHER_CODE_RULES.find((entry) => entry.match(code)) || {
            main: 'Clear',
            key: 'clear',
            description: 'clear sky',
            precipitationType: 'none',
            hail: false
        };
    }

    function getDefaultTemperatureUnit(countryCode) {
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

    async function geocodeLocation(locationName) {
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
            if (data && data.results && data.results.length > 0) {
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

    function getLocation() {
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

    function normalizeWeatherData(input) {
        const mappedWeather = mapWeatherCode(input.weatherCode || 0);
        const utcOffsetSeconds = input.utcOffsetSeconds || 0;
        return {
            location: {
                name: input.locationName || DEFAULT_LOCATION.name,
                lat: input.lat,
                lon: input.lon,
                countryCode: input.countryCode || DEFAULT_LOCATION.countryCode,
                timezone: input.timezone || null,
                utcOffsetSeconds: utcOffsetSeconds
            },
            weather: {
                code: input.weatherCode || 0,
                main: mappedWeather.main,
                key: mappedWeather.key,
                description: mappedWeather.description,
                temperatureC: input.temperatureC == null ? 18 : input.temperatureC,
                feelsLikeC: input.temperatureC == null ? 18 : input.temperatureC,
                humidity: input.humidity == null ? 60 : input.humidity,
                windSpeed: input.windSpeed == null ? 3 : input.windSpeed,
                windDirection: input.windDirection == null ? 270 : input.windDirection,
                cloudCover: input.cloudCover == null ? 0 : input.cloudCover,
                precipitationAmount: input.precipitation == null ? 0 : input.precipitation,
                precipitationType: mappedWeather.precipitationType,
                visibility: approximateVisibility(mappedWeather, input.humidity == null ? 60 : input.humidity),
                hasHail: Boolean(mappedWeather.hail),
                timezone: input.timezone || null,
                utcOffsetSeconds: utcOffsetSeconds,
                localTime: buildLocalTimeData(utcOffsetSeconds)
            }
        };
    }

    async function fetchWeatherForCoords(location) {
        const timestamp = Date.now();
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover&hourly=precipitation&timezone=auto&_=${timestamp}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('WEATHER_API_ERROR');
        }

        const data = await response.json();
        const current = data.current || {};
        const hourlyPrecip = data.hourly && data.hourly.precipitation ? data.hourly.precipitation[0] || 0 : 0;
        const precipitation = Math.max(current.precipitation || 0, hourlyPrecip);

        return normalizeWeatherData({
            lat: location.lat,
            lon: location.lon,
            locationName: location.name,
            countryCode: location.countryCode,
            weatherCode: current.weather_code || 0,
            temperatureC: current.temperature_2m == null ? 18 : current.temperature_2m,
            humidity: current.relative_humidity_2m == null ? 60 : current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m == null ? 3 : current.wind_speed_10m,
            windDirection: current.wind_direction_10m == null ? 270 : current.wind_direction_10m,
            precipitation: precipitation,
            cloudCover: current.cloud_cover == null ? 0 : current.cloud_cover,
            timezone: data.timezone || null,
            utcOffsetSeconds: data.utc_offset_seconds == null ? Math.round(location.lon / 15) * 3600 : data.utc_offset_seconds
        });
    }

    function createMockSceneFromWeatherKey(weatherKey, location) {
        const codeByKey = {
            clear: 0,
            clouds: 3,
            rain: 63,
            snow: 73,
            fog: 45,
            thunderstorm: 95,
            wind: 2
        };

        const scene = normalizeWeatherData({
            lat: location.lat,
            lon: location.lon,
            locationName: location.name,
            countryCode: location.countryCode,
            weatherCode: codeByKey[weatherKey] || 0,
            temperatureC: weatherKey === 'snow' ? -2 : 18,
            humidity: weatherKey === 'fog' ? 95 : weatherKey === 'rain' ? 84 : 60,
            windSpeed: weatherKey === 'wind' ? 12 : weatherKey === 'thunderstorm' ? 14 : weatherKey === 'rain' ? 7 : 3,
            windDirection: weatherKey === 'wind' ? 135 : 270,
            precipitation: weatherKey === 'rain' ? 2.5 : weatherKey === 'snow' ? 1.2 : weatherKey === 'thunderstorm' ? 3.5 : 0,
            cloudCover: weatherKey === 'clear' ? 10 : weatherKey === 'clouds' ? 80 : 50,
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

    function createSceneFromWeatherCode(code, location) {
        const numericCode = Number.parseInt(code, 10);
        if (Number.isNaN(numericCode) || numericCode < 0 || numericCode > 99) {
            throw new Error('INVALID_WEATHER_CODE');
        }

        const mapped = mapWeatherCode(numericCode);
        return normalizeWeatherData({
            lat: location.lat,
            lon: location.lon,
            locationName: location.name,
            countryCode: location.countryCode,
            weatherCode: numericCode,
            temperatureC: mapped.key === 'snow' ? -1 : 18,
            humidity: mapped.key === 'fog' ? 96 : mapped.key === 'rain' ? 88 : 62,
            windSpeed: mapped.main === 'Thunderstorm' ? 15 : mapped.key === 'clear' ? 3 : 7,
            windDirection: 245,
            precipitation: mapped.precipitationType === 'snow' ? 1.5 : mapped.precipitationType === 'none' ? 0 : 2.2,
            cloudCover: mapped.key === 'clear' ? 5 : mapped.key === 'clouds' ? 85 : 65,
            utcOffsetSeconds: Math.round(location.lon / 15) * 3600
        });
    }

    function deriveOutdoorProfileKey(locationName) {
        const normalized = (locationName || '').toLowerCase();
        if (/(beach|bay|coast|ocean|sea)/.test(normalized)) return 'coastal';
        if (/(mountain|alps|andes|rocky|himalaya)/.test(normalized)) return 'mountain';
        if (/(desert|sahara|arizona|nevada)/.test(normalized)) return 'desert';
        if (/(tokyo|new york|london|paris|city|downtown|seoul)/.test(normalized)) return 'urban';
        if (/(hawaii|bali|tropical|rainforest|miami)/.test(normalized)) return 'tropical';
        if (/(prairie|plains|field|farm|kansas)/.test(normalized)) return 'plains';
        return 'forest';
    }

    function getLocalDate(utcOffsetSeconds) {
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utcTime + ((utcOffsetSeconds || 0) * 1000));
    }

    function getMoonPhaseName(date) {
        const knownNewMoonDate = new Date('2024-01-11T11:57:00Z');
        const synodicMonth = 29.53058867;
        const daysSinceKnownNewMoon = (date - knownNewMoonDate) / (1000 * 60 * 60 * 24);
        const moonAge = ((daysSinceKnownNewMoon % synodicMonth) + synodicMonth) % synodicMonth;
        const index = Math.round((moonAge / synodicMonth) * (LUNAR_PHASES.length - 1));
        return LUNAR_PHASES[index];
    }

    function computeCelestialData(weather, manualMoonPhase) {
        const localDate = getLocalDate(weather.utcOffsetSeconds);
        const hours = localDate.getHours() + (localDate.getMinutes() / 60);
        const sunProgress = (hours - 6) / 12;
        const sunVisible = sunProgress >= 0 && sunProgress <= 1 && weather.visibility > 250;
        const sunX = 10 + (sunProgress * 80);
        const sunY = 74 - (Math.sin(sunProgress * Math.PI) * 48);
        const moonPhase = manualMoonPhase === 'auto' ? getMoonPhaseName(localDate) : manualMoonPhase;
        const moonVisible = !sunVisible && weather.visibility > 250 && moonPhase !== 'new';
        const moonProgress = ((hours + 6) % 12) / 12;

        return {
            localDate: localDate,
            isDay: sunVisible,
            periodLabel: sunVisible ? 'DAY' : 'NIGHT',
            sun: { visible: sunVisible, x: sunX, y: sunY },
            moon: {
                visible: moonVisible,
                x: 15 + (moonProgress * 70),
                y: 72 - (Math.sin(moonProgress * Math.PI) * 42),
                phase: moonPhase,
                art: MOON_ART[moonPhase] || MOON_ART.full
            }
        };
    }

    function computeFogDensity(weather) {
        if (weather.main === 'Fog') {
            if (weather.visibility < 300) return 0.9;
            if (weather.visibility < 800) return 0.7;
            return 0.5;
        }
        if (weather.humidity > 85 && weather.visibility < 4000) {
            return 0.35;
        }
        return 0;
    }

    function getSkyMode(weather, celestial) {
        if (!celestial.isDay) return 'night';
        if (weather.cloudCover > 70 || weather.main === 'Thunderstorm') return 'storm';
        if (weather.cloudCover > 35) return 'overcast';
        return 'clear';
    }

    function buildActiveEffects(weather, celestial) {
        const effects = [];
        if (weather.cloudCover > 15) effects.push('clouds');
        if (weather.precipitationType === 'rain' || weather.precipitationType === 'drizzle' || weather.precipitationType === 'freezingRain') effects.push('rain');
        if (weather.precipitationType === 'snow') effects.push('snow');
        if (weather.main === 'Thunderstorm') effects.push('thunderstorm');
        if (weather.hasHail) effects.push('hail');
        if (computeFogDensity(weather) > 0) effects.push('fog');
        if (weather.windSpeed >= 9) effects.push('wind');
        if (weather.key === 'clear' && celestial.isDay && weather.cloudCover < 30) effects.push('birds');
        return effects;
    }

    function formatTemperature(celsius, unit) {
        return unit === 'F' ? `${Math.round((celsius * 9) / 5 + 32)}°F` : `${Math.round(celsius)}°C`;
    }

    function buildWeatherInfo(scene, unit, devMode) {
        const weather = scene.weather;
        const lines = [
            weather.description.toUpperCase(),
            `Temp: ${formatTemperature(weather.temperatureC, unit)}`,
            `Wind: ${weather.windSpeed.toFixed(1)} m/s`,
            `Cloud Cover: ${Math.round(weather.cloudCover)}%`
        ];

        if (weather.precipitationAmount > 0) lines.push(`Precipitation: ${weather.precipitationAmount.toFixed(1)} mm/h`);
        if (devMode || weather.humidity > 80) lines.push(`Humidity: ${Math.round(weather.humidity)}%`);
        if (devMode || weather.visibility < 10000) {
            lines.push(`Visibility: ${weather.visibility >= 1000 ? `${(weather.visibility / 1000).toFixed(1)} km` : `${weather.visibility} m`}`);
        }
        lines.push(`Sky: ${scene.celestial.periodLabel}`);
        return lines.join('\n');
    }

    function createInitialState() {
        return {
            weatherScene: null,
            currentLocation: Object.assign({}, DEFAULT_LOCATION),
            selectedOutdoorProfile: null,
            selectedSurroundingsProfile: 'minimalRoom',
            manualMoonPhase: 'auto',
            currentTemperatureUnit: 'C',
            currentCountryCode: DEFAULT_LOCATION.countryCode,
            devMode: false,
            theme: 'dark'
        };
    }

    function buildSceneModel(state) {
        const baseScene = state.weatherScene || {
            location: Object.assign({}, DEFAULT_LOCATION),
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

        const outdoorProfileKey = state.selectedOutdoorProfile || deriveOutdoorProfileKey(baseScene.location.name);
        const surroundingsProfileKey = state.selectedSurroundingsProfile || 'minimalRoom';
        const celestial = computeCelestialData(baseScene.weather, state.manualMoonPhase);

        return {
            location: baseScene.location,
            weather: baseScene.weather,
            outdoorProfileKey: outdoorProfileKey,
            surroundingsProfileKey: surroundingsProfileKey,
            outdoorProfile: OUTDOOR_PROFILES[outdoorProfileKey] || OUTDOOR_PROFILES.forest,
            surroundingsProfile: SURROUNDINGS_PROFILES[surroundingsProfileKey] || SURROUNDINGS_PROFILES.minimalRoom,
            celestial: celestial,
            fogDensity: computeFogDensity(baseScene.weather),
            skyMode: getSkyMode(baseScene.weather, celestial),
            activeEffects: buildActiveEffects(baseScene.weather, celestial),
            userPreferences: {
                unit: state.currentTemperatureUnit,
                theme: state.theme,
                devMode: state.devMode
            }
        };
    }

    function ensurePre(container) {
        let pre = container.querySelector('pre');
        if (!pre) {
            pre = document.createElement('pre');
            container.appendChild(pre);
        }
        return pre;
    }

    function repeatChars(width, charSet) {
        const charsPerLine = Math.max(10, Math.floor(width / 10));
        let output = '';
        for (let index = 0; index < charsPerLine; index += 1) {
            output += charSet[index % charSet.length];
        }
        return output;
    }

    function renderScene(scene, elements) {
        elements.skyLayer.dataset.skyMode = scene.skyMode;

        elements.weatherDisplay.classList.remove('sun', 'moon');
        elements.weatherDisplay.innerHTML = '';
        elements.weatherDisplay.style.display = scene.celestial.sun.visible ? 'block' : 'none';
        if (scene.celestial.sun.visible) {
            const pre = document.createElement('pre');
            pre.textContent = '   \\ | /\n -- 0 --\n   / | \\';
            elements.weatherDisplay.appendChild(pre);
            elements.weatherDisplay.classList.add('sun');
            elements.weatherDisplay.style.left = `${scene.celestial.sun.x}%`;
            elements.weatherDisplay.style.top = `${scene.celestial.sun.y}%`;
            elements.weatherDisplay.style.transform = 'translate(-50%, -50%)';
        }

        elements.moonDisplay.classList.remove('moon');
        elements.moonDisplay.innerHTML = '';
        elements.moonDisplay.style.display = scene.celestial.moon.visible ? 'block' : 'none';
        if (scene.celestial.moon.visible) {
            const pre = document.createElement('pre');
            pre.textContent = scene.celestial.moon.art;
            elements.moonDisplay.appendChild(pre);
            elements.moonDisplay.classList.add('moon');
            elements.moonDisplay.style.left = `${scene.celestial.moon.x}%`;
            elements.moonDisplay.style.top = `${scene.celestial.moon.y}%`;
            elements.moonDisplay.style.transform = 'translate(-50%, -50%)';
        }

        ensurePre(elements.distantLayer).textContent = scene.outdoorProfile.distantArt(scene).join('\n');
        ensurePre(elements.foregroundLayer).textContent = scene.outdoorProfile.foregroundArt(scene).join('\n');

        elements.surroundingsTop.textContent = scene.surroundingsProfile.top;
        elements.surroundingsLeft.textContent = scene.surroundingsProfile.left;
        elements.surroundingsRight.textContent = scene.surroundingsProfile.right;
        elements.surroundingsBottom.textContent = scene.surroundingsProfile.bottom;
        elements.surroundingsLabel.textContent = scene.surroundingsProfile.label.toUpperCase();
        elements.outdoorLabel.textContent = scene.outdoorProfile.label.toUpperCase();
        elements.horizonLineLeft.textContent = repeatChars(elements.weatherWindow.clientWidth / 2, ['_', '.', '─', '─', '·']);
        elements.horizonLineRight.textContent = repeatChars(elements.weatherWindow.clientWidth / 2, ['─', '·', '─', '_', '─']);
    }

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    function cleanupController(controller) {
        if (!controller) return;
        (controller.intervals || []).forEach((id) => clearInterval(id));
        (controller.timeouts || []).forEach((id) => clearTimeout(id));
        (controller.nodes || []).forEach((node) => node.remove());
    }

    function createCloudController(layer, scene) {
        const controller = { intervals: [], nodes: [] };
        function spawnCloud() {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.textContent = Math.random() > 0.5 ? ' .--.   .--. ' : '  .--.  ';
            cloud.style.top = `${randomBetween(10, 42)}%`;
            cloud.style.left = `-${randomBetween(10, 30)}%`;
            cloud.style.animationDuration = `${randomBetween(26, 46)}s`;
            cloud.style.opacity = String(randomBetween(0.55, 0.9));
            layer.appendChild(cloud);
            controller.nodes.push(cloud);
            setTimeout(() => {
                cloud.remove();
                controller.nodes = controller.nodes.filter((node) => node !== cloud);
            }, 50000);
        }
        const initialCount = Math.max(1, Math.ceil(scene.weather.cloudCover / 25));
        for (let index = 0; index < initialCount; index += 1) spawnCloud();
        controller.intervals.push(setInterval(spawnCloud, 7000));
        return controller;
    }

    function createRainController(layer, scene) {
        const controller = { intervals: [], nodes: [] };
        const intensity = Math.max(1, Math.ceil(scene.weather.precipitationAmount * 1.4));
        const dropChar = scene.weather.precipitationType === 'freezingRain' ? '♦' : scene.weather.precipitationType === 'drizzle' ? '.' : '│';
        function spawnDrop() {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.textContent = dropChar;
            drop.style.left = `${randomBetween(0, 100)}%`;
            drop.style.top = `${randomBetween(-15, 5)}%`;
            drop.style.animationDuration = `${randomBetween(0.65, 1.2)}s`;
            drop.style.setProperty('--end-y', `${randomBetween(280, 420)}px`);
            layer.appendChild(drop);
            controller.nodes.push(drop);
            setTimeout(() => {
                drop.remove();
                controller.nodes = controller.nodes.filter((node) => node !== drop);
            }, 1500);
        }
        controller.intervals.push(setInterval(spawnDrop, Math.max(50, 180 - (intensity * 20))));
        return controller;
    }

    function createSnowController(layer, scene) {
        const controller = { intervals: [], nodes: [] };
        const density = Math.max(1, Math.ceil(scene.weather.precipitationAmount * 1.2));
        function spawnFlake() {
            const flake = document.createElement('div');
            flake.className = 'snowflake';
            flake.textContent = Math.random() > 0.7 ? '+' : '*';
            flake.style.left = `${randomBetween(0, 100)}%`;
            flake.style.top = `${randomBetween(-10, 5)}%`;
            flake.style.animationDuration = `${randomBetween(3, 5)}s`;
            flake.style.setProperty('--end-y', `${randomBetween(220, 380)}px`);
            flake.style.setProperty('--end-x', `${randomBetween(-60, 60)}px`);
            layer.appendChild(flake);
            controller.nodes.push(flake);
            setTimeout(() => {
                flake.remove();
                controller.nodes = controller.nodes.filter((node) => node !== flake);
            }, 5500);
        }
        controller.intervals.push(setInterval(spawnFlake, Math.max(120, 320 - (density * 45))));
        return controller;
    }

    function createFogController(layer, scene) {
        const controller = { intervals: [], nodes: [] };
        const density = Math.max(1, Math.ceil(scene.fogDensity * 6));
        function spawnFog() {
            const fog = document.createElement('div');
            fog.className = 'fog-wisp';
            fog.textContent = Math.random() > 0.5 ? ' ~~~~~~~~ ' : '  ~~~~~   ';
            fog.style.top = `${randomBetween(30, 78)}%`;
            fog.style.left = `-${randomBetween(15, 40)}%`;
            fog.style.opacity = String(randomBetween(0.15, 0.45));
            fog.style.animationDuration = `${randomBetween(18, 34)}s`;
            layer.appendChild(fog);
            controller.nodes.push(fog);
            setTimeout(() => {
                fog.remove();
                controller.nodes = controller.nodes.filter((node) => node !== fog);
            }, 36000);
        }
        for (let index = 0; index < density; index += 1) spawnFog();
        controller.intervals.push(setInterval(spawnFog, 9000));
        return controller;
    }

    function createThunderstormController(layer) {
        const controller = { intervals: [], nodes: [], timeouts: [] };
        controller.intervals.push(setInterval(() => {
            layer.classList.add('lightning-flash');
            const timeoutId = setTimeout(() => {
                layer.classList.remove('lightning-flash');
            }, 180);
            controller.timeouts.push(timeoutId);
        }, 3800));
        return controller;
    }

    function createHailController(layer) {
        const controller = { intervals: [], nodes: [] };
        function spawnStone() {
            const stone = document.createElement('div');
            stone.className = 'hail-stone';
            stone.textContent = 'o';
            stone.style.left = `${randomBetween(0, 100)}%`;
            stone.style.top = `${randomBetween(-10, 3)}%`;
            stone.style.animationDuration = `${randomBetween(0.4, 0.7)}s`;
            stone.style.setProperty('--stop-y', `${randomBetween(200, 340)}px`);
            layer.appendChild(stone);
            controller.nodes.push(stone);
            setTimeout(() => {
                stone.remove();
                controller.nodes = controller.nodes.filter((node) => node !== stone);
            }, 1200);
        }
        controller.intervals.push(setInterval(spawnStone, 180));
        return controller;
    }

    function createBirdController(layer) {
        const controller = { intervals: [], nodes: [] };
        function spawnBird() {
            const bird = document.createElement('div');
            bird.className = 'bird-pass';
            bird.textContent = Math.random() > 0.5 ? 'v  v' : '\\_/';
            bird.style.top = `${randomBetween(15, 38)}%`;
            bird.style.left = '-10%';
            bird.style.animationDuration = `${randomBetween(8, 14)}s`;
            layer.appendChild(bird);
            controller.nodes.push(bird);
            setTimeout(() => {
                bird.remove();
                controller.nodes = controller.nodes.filter((node) => node !== bird);
            }, 15000);
        }
        controller.intervals.push(setInterval(spawnBird, 12000));
        return controller;
    }

    function createWindController(layer) {
        const controller = { intervals: [], nodes: [] };
        function spawnStreak() {
            const streak = document.createElement('div');
            streak.className = 'wind-particle';
            streak.textContent = Math.random() > 0.5 ? '---' : '__';
            streak.style.setProperty('--start-x', '-12%');
            streak.style.setProperty('--start-y', `${randomBetween(18, 82)}%`);
            streak.style.animationDuration = `${randomBetween(1.8, 3.4)}s`;
            layer.appendChild(streak);
            controller.nodes.push(streak);
            setTimeout(() => {
                streak.remove();
                controller.nodes = controller.nodes.filter((node) => node !== streak);
            }, 4000);
        }
        controller.intervals.push(setInterval(spawnStreak, 260));
        return controller;
    }

    const EFFECT_REGISTRY = {
        clouds: function (layers, scene) { return createCloudController(layers.atmosphereLayer, scene); },
        rain: function (layers, scene) { return createRainController(layers.precipitationLayer, scene); },
        snow: function (layers, scene) { return createSnowController(layers.precipitationLayer, scene); },
        fog: function (layers, scene) { return createFogController(layers.atmosphereLayer, scene); },
        thunderstorm: function (layers) { return createThunderstormController(layers.skyLayer); },
        hail: function (layers) { return createHailController(layers.precipitationLayer); },
        wind: function (layers) { return createWindController(layers.wildlifeLayer); },
        birds: function (layers) { return createBirdController(layers.wildlifeLayer); }
    };

    function EffectManager(layers) {
        this.layers = layers;
        this.active = new Map();
        this.lastSignature = '';
    }

    EffectManager.prototype.clear = function () {
        this.active.forEach((controller) => cleanupController(controller));
        this.active.clear();
        Object.keys(this.layers).forEach((key) => {
            const layer = this.layers[key];
            if (layer && layer.classList) {
                layer.classList.remove('lightning-flash');
            }
            if (layer && typeof layer.innerHTML === 'string') {
                layer.innerHTML = '';
            }
        });
        this.lastSignature = '';
    };

    EffectManager.prototype.update = function (scene) {
        const nextSignature = JSON.stringify({
            effects: scene.activeEffects,
            cloudCover: Math.round(scene.weather.cloudCover),
            precip: scene.weather.precipitationType,
            precipAmount: scene.weather.precipitationAmount,
            windSpeed: Math.round(scene.weather.windSpeed),
            fogDensity: scene.fogDensity,
            key: scene.weather.key
        });

        if (nextSignature !== this.lastSignature) {
            this.clear();
            this.lastSignature = nextSignature;
        }

        const nextEffects = new Set(scene.activeEffects);
        nextEffects.forEach((effectId) => {
            if (!this.active.has(effectId) && EFFECT_REGISTRY[effectId]) {
                this.active.set(effectId, EFFECT_REGISTRY[effectId](this.layers, scene));
            }
        });
    };

    const state = createInitialState();
    let refreshIntervalId = null;
    let clockIntervalId = null;
    let effectManager = null;

    const elements = {
        body: document.body,
        container: document.querySelector('.container'),
        sceneStage: document.getElementById('sceneStage'),
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
            el.selected = option.value === selected;
            select.appendChild(el);
        });
    }

    function setTemperatureUnit(unit, persist) {
        state.currentTemperatureUnit = unit;
        elements.temperatureToggle.querySelectorAll('.temperature-option').forEach((option) => {
            option.classList.toggle('active', option.dataset.unit === unit);
        });
        if (persist !== false) {
            storage.setItem('temperatureUnit', unit);
        }
        renderCurrentScene();
    }

    function setTheme(theme, persist) {
        state.theme = theme;
        elements.body.classList.toggle('light-mode', theme === 'light');
        elements.themeToggle.querySelectorAll('.theme-option').forEach((option) => {
            option.classList.toggle('active', option.dataset.theme === theme);
        });
        if (persist !== false) {
            storage.setItem('theme', theme);
        }
    }

    function setDevMode(enabled, persist) {
        state.devMode = enabled;
        elements.container.classList.toggle('dev-mode-off', !enabled);
        elements.devToggleBtn.classList.toggle('active', enabled);
        elements.devToolsContainer.style.display = enabled ? 'flex' : 'none';
        if (persist !== false) {
            storage.setItem('devMode', String(enabled));
        }
        renderCurrentScene();
    }

    function showLocationInput(show) {
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
        elements.weatherInfo.textContent = buildWeatherInfo(scene, state.currentTemperatureUnit, state.devMode);
        elements.outdoorProfileSelect.value = scene.outdoorProfileKey;
        elements.surroundingsProfileSelect.value = scene.surroundingsProfileKey;
        document.querySelectorAll('.moon-phase-btn').forEach((button) => {
            button.classList.toggle('active', button.dataset.phase === state.manualMoonPhase);
        });
        document.querySelectorAll('.weather-btn').forEach((button) => {
            button.classList.toggle('active', button.dataset.weather === scene.weather.key);
        });
    }

    async function applyWeatherScene(weatherScene, updateUnitDefault) {
        state.weatherScene = weatherScene;
        state.currentLocation = weatherScene.location;
        state.currentCountryCode = weatherScene.location.countryCode || DEFAULT_LOCATION.countryCode;
        if (updateUnitDefault && !storage.getItem('temperatureUnit')) {
            setTemperatureUnit(getDefaultTemperatureUnit(state.currentCountryCode), false);
        }
        renderCurrentScene();
    }

    async function loadWeatherForLocation(location) {
        const weatherScene = await fetchWeatherForCoords(location);
        await applyWeatherScene(weatherScene, true);
    }

    function startRefreshLoop() {
        clearInterval(refreshIntervalId);
        refreshIntervalId = setInterval(async function () {
            if (!state.currentLocation) return;
            try {
                await loadWeatherForLocation(state.currentLocation);
            } catch (error) {
                console.error('Weather refresh failed:', error);
            }
        }, 600000);
    }

    function startClockLoop() {
        clearInterval(clockIntervalId);
        clockIntervalId = setInterval(renderCurrentScene, 60000);
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
        populateSelect(elements.outdoorProfileSelect, Object.keys(OUTDOOR_PROFILES).map((value) => ({ value: value, label: OUTDOOR_PROFILES[value].label })), 'forest');
        populateSelect(elements.surroundingsProfileSelect, Object.keys(SURROUNDINGS_PROFILES).map((value) => ({ value: value, label: SURROUNDINGS_PROFILES[value].label })), state.selectedSurroundingsProfile);

        elements.outdoorProfileSelect.addEventListener('change', (event) => {
            state.selectedOutdoorProfile = event.target.value;
            renderCurrentScene();
        });
        elements.surroundingsProfileSelect.addEventListener('change', (event) => {
            state.selectedSurroundingsProfile = event.target.value;
            renderCurrentScene();
        });
        elements.temperatureToggle.querySelectorAll('.temperature-option').forEach((option) => {
            option.addEventListener('click', () => setTemperatureUnit(option.dataset.unit, true));
        });
        elements.themeToggle.querySelectorAll('.theme-option').forEach((option) => {
            option.addEventListener('click', () => setTheme(option.dataset.theme, true));
        });
        elements.changeLocationBtn.addEventListener('click', () => showLocationInput(true));
        elements.submitLocation.addEventListener('click', handleLocationSubmit);
        elements.locationInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handleLocationSubmit();
            }
        });
        elements.devToggleBtn.addEventListener('click', () => setDevMode(!state.devMode, true));
        document.querySelectorAll('.weather-btn').forEach((button) => {
            button.addEventListener('click', async () => {
                const currentLocation = state.currentLocation || DEFAULT_LOCATION;
                await applyWeatherScene(createMockSceneFromWeatherKey(button.dataset.weather, currentLocation), false);
            });
        });
        document.querySelectorAll('.moon-phase-btn').forEach((button) => {
            button.addEventListener('click', () => {
                state.manualMoonPhase = button.dataset.phase;
                renderCurrentScene();
            });
        });
        elements.testWeatherCodeBtn.addEventListener('click', async () => {
            try {
                await applyWeatherScene(createSceneFromWeatherCode(elements.weatherCodeInput.value, state.currentLocation || DEFAULT_LOCATION), false);
            } catch (error) {
                elements.weatherInfo.textContent = 'Enter a weather code from 0 to 99.';
            }
        });
        elements.weatherCodeInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                elements.testWeatherCodeBtn.click();
            }
        });
        window.addEventListener('resize', renderCurrentScene);
    }

    async function init() {
        effectManager = new EffectManager({
            skyLayer: elements.skyLayer,
            atmosphereLayer: elements.atmosphereLayer,
            precipitationLayer: elements.precipitationLayer,
            wildlifeLayer: elements.wildlifeLayer
        });

        bindUi();

        setTheme(storage.getItem('theme') || 'dark', false);
        setDevMode(storage.getItem('devMode') === 'true', false);
        setTemperatureUnit(storage.getItem('temperatureUnit') || state.currentTemperatureUnit, false);

        try {
            const detectedLocation = await getLocation();
            await loadWeatherForLocation(detectedLocation);
        } catch (error) {
            console.error('Geolocation failed, using default location:', error);
            try {
                await loadWeatherForLocation(DEFAULT_LOCATION);
            } catch (weatherError) {
                console.error('Live weather load failed, using mock scene:', weatherError);
                await applyWeatherScene(createMockSceneFromWeatherKey('clear', DEFAULT_LOCATION), true);
            }
        }

        startRefreshLoop();
        startClockLoop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
