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

function renderSky(scene, elements) {
    elements.skyLayer.dataset.skyMode = scene.skyMode;
}

function renderCelestial(scene, elements) {
    const { weatherDisplay, moonDisplay } = elements;
    const sun = scene.celestial.sun;
    const moon = scene.celestial.moon;

    weatherDisplay.classList.remove('sun', 'moon');
    weatherDisplay.innerHTML = '';
    weatherDisplay.style.display = sun.visible ? 'block' : 'none';

    if (sun.visible) {
        const pre = document.createElement('pre');
        pre.textContent = '   \\ | /\n -- 0 --\n   / | \\';
        weatherDisplay.appendChild(pre);
        weatherDisplay.classList.add('sun');
        weatherDisplay.style.left = `${sun.x}%`;
        weatherDisplay.style.top = `${sun.y}%`;
        weatherDisplay.style.transform = 'translate(-50%, -50%)';
    }

    moonDisplay.classList.remove('moon');
    moonDisplay.innerHTML = '';
    moonDisplay.style.display = moon.visible ? 'block' : 'none';

    if (moon.visible) {
        const pre = document.createElement('pre');
        pre.textContent = moon.art;
        moonDisplay.appendChild(pre);
        moonDisplay.classList.add('moon');
        moonDisplay.style.left = `${moon.x}%`;
        moonDisplay.style.top = `${moon.y}%`;
        moonDisplay.style.transform = 'translate(-50%, -50%)';
    }
}

function renderOutdoorScene(scene, elements) {
    const distantPre = ensurePre(elements.distantLayer);
    const foregroundPre = ensurePre(elements.foregroundLayer);

    distantPre.textContent = scene.outdoorProfile.distantArt(scene).join('\n');
    foregroundPre.textContent = scene.outdoorProfile.foregroundArt(scene).join('\n');
}

function renderSurroundings(scene, elements) {
    const profile = scene.surroundingsProfile;
    const stage = elements.sceneStage;

    stage.dataset.surroundings = scene.surroundingsProfileKey;
    elements.surroundingsTop.textContent = profile.top;
    elements.surroundingsLeft.textContent = profile.left;
    elements.surroundingsRight.textContent = profile.right;
    elements.surroundingsBottom.textContent = profile.bottom;
    elements.surroundingsLabel.textContent = profile.label.toUpperCase();
    elements.outdoorLabel.textContent = scene.outdoorProfile.label.toUpperCase();
}

function renderHorizon(elements) {
    const width = elements.weatherWindow.clientWidth || 600;
    elements.horizonLineLeft.textContent = repeatChars(width / 2, ['_', '.', '─', '─', '·']);
    elements.horizonLineRight.textContent = repeatChars(width / 2, ['─', '·', '─', '_', '─']);
}

export function renderScene(scene, elements) {
    renderSky(scene, elements);
    renderCelestial(scene, elements);
    renderOutdoorScene(scene, elements);
    renderSurroundings(scene, elements);
    renderHorizon(elements);
}
