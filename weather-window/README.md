# Weather Window

This folder is the canonical home for the Weather Window project's supporting source.
The public entry page remains at `/weatherwindow.html`, which loads its assets from here.

A black and white ASCII art weather display website. Features an animated ASCII art window that shows the weather in your location with weather-specific animations.

## Features

- **ASCII Art Window**: A beautiful ASCII art frame displaying weather information
- **Weather Animations**:
  - **Rain**: Animated I-beams (│) falling down
  - **Snow**: Animated snowflakes (*) drifting
  - **Clouds**: Drifting cloud ASCII art
  - **Thunderstorm**: Rain with lightning flashes
  - **Wind**: Animated wind particles
  - **Clear/Sunny**: Pulsing sun ASCII art
- **Location Detection**: Automatically detects your location using browser geolocation
- **Real-time Updates**: Weather updates every 10 minutes

## Setup

1. **Run the Website**:
   - Simply open `weatherwindow.html` in your web browser (located in the parent directory)
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server
     ```
   - Then visit `http://localhost:8000` in your browser

2. **Data Sources**:
   - Weather data and geocoding are fetched from Open-Meteo.
   - The modular source lives in files like `app.js`, `weather-data.js`, `scene-state.js`, and `scene-renderer.js`.
   - `app-standalone.js` is the bundled browser entry used by `weatherwindow.html`.

## Usage

- The website will automatically request your location permission
- If you deny location access, it will default to New York coordinates
- Weather information is displayed in ASCII art format
- Animations change based on current weather conditions

## Browser Compatibility

- Modern browsers with geolocation support
- Chrome, Firefox, Safari, Edge (latest versions)

## Notes

- The website uses a black background (#000000) and white text (#ffffff) for a true black and white aesthetic
- All visual elements (except text) are rendered using ASCII art characters
- Weather data and geocoding are fetched from Open-Meteo
