# Weather Variables and Their Effects

This document lists all weather variables used in the weather window application and what visual effects they control.

## 1. Cloud Cover (`weatherData.clouds.all`)
**Range:** 0-100% (percentage)

**Effects:**
- **Initial Cloud Count**: Determines how many clouds appear on load
  - 0% = 0 clouds
  - 20% = 1 cloud
  - 40% = 2 clouds
  - 60% = 3 clouds
  - 80% = 4 clouds
  - 100% = 5 clouds
  - Formula: `Math.ceil(cloudiness * 5)`

- **Cloud Spawn Rate**: How frequently new clouds appear
  - 100% = every 6 seconds
  - 50% = every 12 seconds
  - 25% = every 24 seconds
  - Formula: `6000 / cloudiness` (clamped between 4-30 seconds)

- **Clouds Per Spawn**: How many clouds spawn at each interval
  - 100% = 2 clouds per spawn
  - 50% = 1 cloud per spawn
  - 25% = 1 cloud per spawn (rounded up)
  - Formula: `Math.ceil(cloudiness * 2)`

---

## 2. Wind Speed (`weatherData.wind.speed`)
**Range:** 0+ m/s (meters per second)

**Effects:**

### Cloud Movement Speed
- **0 m/s** = 600 seconds (very slow, almost still)
- **1 m/s** = 500 seconds (barely moving)
- **3 m/s** = 400 seconds (gentle drift)
- **5 m/s** = 300 seconds (moderate movement)
- **10 m/s** = 150 seconds (noticeable movement)
- **15 m/s** = 100 seconds (fast movement)
- **20+ m/s** = 60 seconds (very fast movement)
- Formula: `600 / (1 + windSpeed * 0.15)` (clamped between 60-600 seconds)

### Fog Movement Speed
- **0 m/s** = 600 seconds (very slow)
- **5 m/s** = 420 seconds
- **10 m/s** = 240 seconds
- **20 m/s** = 120 seconds
- Formula: `600 * (1.0 - windSpeed / 12.5)` (clamped between 120-800 seconds)

### Wind Particle Speed
- **1 m/s** = 12 seconds per particle
- **3.2 m/s** = ~6 seconds per particle
- **10 m/s** = ~2 seconds per particle
- **20+ m/s** = ~2 seconds per particle
- Formula: `6.0 * (6.0 / windSpeed)` (clamped between 0.33-6.0 multiplier)

### Tree Animation Intensity
- **0-2 m/s**: No animation (calm, tree stays still)
- **2-5 m/s**: Gentle rustle (light breeze)
- **5-10 m/s**: Gentle sway (moderate breeze)
- **10-15 m/s**: Strong sway (fresh breeze)
- **15+ m/s**: Storm sway (strong wind)

---

## 3. Wind Direction (`weatherData.wind.deg`)
**Range:** 0-360° (degrees, direction wind is coming FROM)

**Effects:**
- **Wind Particle Direction**: Determines which direction wind particles move across the screen
  - 0° (North) = particles move South (start from top)
  - 90° (East) = particles move West (start from right)
  - 180° (South) = particles move North (start from sides/top, never from bottom)
  - 270° (West) = particles move East (start from left)

---

## 4. Rain Volume (`weatherData.rain['1h']` or `weatherData.rain['3h']`)
**Range:** 0+ mm (millimeters per hour)

**Effects:**
- **Rain Intensity**: Determines how heavy the rain appears
  - **0-0.5mm** = Very light rain (intensity 0.2)
  - **0.5-1mm** = Light rain (intensity 0.3)
  - **1-5mm** = Moderate rain (intensity 0.6)
  - **5+ mm** = Heavy rain (intensity 1.0)

- **Raindrop Spawn Rate**: How frequently raindrops appear
  - Very light: 150ms intervals
  - Light: ~120ms intervals
  - Moderate: 80ms intervals
  - Heavy: 40ms intervals
  - Formula: `150 - (intensity * 110)` (minimum 40ms)

- **Drops Per Spawn**: How many raindrops spawn at each interval
  - Very light: 1-2 drops
  - Light: 1-2 drops
  - Moderate: 2-3 drops
  - Heavy: 3-5 drops
  - Formula: `1 + intensity * 4`

- **Initial Raindrops**: How many raindrops appear immediately on load
  - Formula: `30 * intensity`

---

## 5. Snow Volume (`weatherData.snow['1h']` or `weatherData.snow['3h']`)
**Range:** 0+ mm (millimeters per hour)

**Effects:**
- **Snow Intensity**: Determines how heavy the snow appears
  - **0-0.5mm** = Very light snow (intensity 0.2)
  - **0.5-1mm** = Light snow (intensity 0.3)
  - **1-5mm** = Moderate snow (intensity 0.6)
  - **5+ mm** = Heavy snow (intensity 1.0)

- **Snowflake Spawn Rate**: How frequently snowflakes appear
  - Very light: 300ms intervals
  - Light: ~240ms intervals
  - Moderate: 200ms intervals
  - Heavy: 100ms intervals
  - Formula: `300 - (intensity * 200)` (minimum 100ms)

- **Flakes Per Spawn**: How many snowflakes spawn at each interval
  - Very light: 1 flake
  - Light: 1-2 flakes
  - Moderate: 2-3 flakes
  - Heavy: 3-4 flakes
  - Formula: `1 + intensity * 3`

- **Initial Snowflakes**: How many snowflakes appear immediately on load
  - Formula: `20 * intensity`

---

## 6. Temperature (`weatherData.main.temp`)
**Range:** Any value in Celsius

**Effects:**
- **Snow Persistence**: How long snowflakes stay visible (colder = longer)
  - **5°C**: 1 minute (melts quickly)
  - **0°C**: 3 minutes
  - **-10°C**: 5 minutes
  - **-20°C**: 7 minutes
  - Formula: `180000 + (0 - temperature) * 12000` milliseconds (clamped between 1-7 minutes)

- **Floor Snow Accumulation**: Snowflakes near the horizon line stay twice as long
  - At -10°C: floor snow stays for 10 minutes instead of 5 minutes
  - Creates visible snow accumulation on the ground in cold weather

---

## 7. Visibility (`weatherData.visibility`)
**Range:** 0-10000+ meters

**Effects:**
- **Fog Density**: Lower visibility = denser fog
  - **< 200m** = Very dense fog (density 0.95)
  - **200-500m** = Dense fog (density 0.85)
  - **500-1000m** = Moderate fog (density 0.7)
  - **1000-2000m** = Light fog (density 0.5)
  - **2000m+** = Very light fog (density 0.3)

- **Fog Wisp Count**: Number of fog wisps on screen
  - Dense fog (0.9+) = 7-9 wisps
  - Moderate (0.5-0.7) = 5-7 wisps
  - Light (0.3) = 3-5 wisps
  - Formula: `fogDensity * 6 + 3`

- **Fog Spawn Rate**: How frequently new fog wisps appear
  - Dense fog = every 15 seconds
  - Moderate = every 20-25 seconds
  - Light = every 30 seconds
  - Formula: `30000 - (fogDensity * 15000)` milliseconds

---

## 8. Humidity (`weatherData.main.humidity`)
**Range:** 0-100% (percentage)

**Effects:**
- **Fog Density Adjustment**: Only affects fog if humidity is very high
  - **> 90% humidity**: Increases fog density by +0.1 (capped at 0.95)
  - **> 80% humidity**: Increases fog density by +0.05 (capped at 0.9)
  - Works in combination with visibility to determine final fog density

---

## 9. Location Coordinates (`weatherData.coord.lat`, `weatherData.coord.lon`)
**Range:** Latitude: -90 to 90, Longitude: -180 to 180

**Effects:**
- **Sun Position**: Calculates where the sun appears in the sky based on:
  - Current time
  - Location's latitude and longitude
  - Timezone offset
  - Sun is hidden when below the horizon (below -6° altitude)

- **Moon Position**: Calculates where the moon appears in the sky based on:
  - Current time
  - Location's latitude and longitude
  - Moon phase (calculated from date)
  - Moon is hidden when below the horizon or during new moon phase

---

## 10. Weather Type (`weatherData.weather[0].main`)
**Range:** String values: "Clear", "Clouds", "Rain", "Snow", "Thunderstorm", "Fog", etc.

**Effects:**
- **Primary Weather Display**: Determines which weather animations are shown
- **Thunderstorm**: Shows both rain animation + lightning flashes
- **Multiple Effects**: Can show multiple effects simultaneously (e.g., fog + rain, clouds + rain)

---

## Summary Table

| Variable | Range | Primary Effect |
|----------|-------|----------------|
| Cloud Cover | 0-100% | Number of clouds and spawn rate |
| Wind Speed | 0+ m/s | Movement speed of clouds, fog, wind particles, tree animation |
| Wind Direction | 0-360° | Direction of wind particles |
| Rain Volume | 0+ mm/h | Rain intensity and spawn rate |
| Snow Volume | 0+ mm/h | Snow intensity and spawn rate |
| Temperature | Any °C | How long snow persists (colder = longer) |
| Visibility | 0-10000+ m | Fog density and wisp count |
| Humidity | 0-100% | Fog density adjustment (high humidity only) |
| Coordinates | lat/lon | Sun and moon position in sky |
| Weather Type | String | Which animations are displayed |
