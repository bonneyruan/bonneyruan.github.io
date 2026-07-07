(function initUiRuntime(global) {
    function showLocationInput() {
        const inputContainer = document.getElementById('locationInputContainer');
        const changeBtn = document.getElementById('changeLocationBtn');
        inputContainer.style.display = 'flex';
        changeBtn.style.display = 'none';

        setTimeout(() => {
            document.getElementById('locationInput').focus();
        }, 100);
    }

    function hideLocationInput() {
        const inputContainer = document.getElementById('locationInputContainer');
        const changeBtn = document.getElementById('changeLocationBtn');
        inputContainer.style.display = 'none';
        changeBtn.style.display = 'block';
    }

    function checkAPIKey() {
        return true;
    }

    global.WeatherWindow = global.WeatherWindow || {};
    Object.assign(global.WeatherWindow, {
        showLocationInput,
        hideLocationInput,
        checkAPIKey
    });
})(window);
