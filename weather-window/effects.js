function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function cleanupController(controller) {
    if (!controller) {
        return;
    }

    if (controller.intervals) {
        controller.intervals.forEach((id) => clearInterval(id));
    }
    if (controller.timeouts) {
        controller.timeouts.forEach((id) => clearTimeout(id));
    }
    if (controller.nodes) {
        controller.nodes.forEach((node) => node.remove());
    }
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
    for (let index = 0; index < initialCount; index += 1) {
        spawnCloud();
    }

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

    for (let index = 0; index < density; index += 1) {
        spawnFog();
    }
    controller.intervals.push(setInterval(spawnFog, 9000));
    return controller;
}

function createThunderstormController(layer) {
    const controller = { intervals: [], nodes: [] };

    controller.intervals.push(setInterval(() => {
        layer.classList.add('lightning-flash');
        const timeoutId = setTimeout(() => {
            layer.classList.remove('lightning-flash');
        }, 180);
        controller.timeouts = controller.timeouts || [];
        controller.timeouts.push(timeoutId);
    }, randomBetween(2800, 5600)));

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

const REGISTRY = {
    clouds: {
        mount: ({ atmosphereLayer }, scene) => createCloudController(atmosphereLayer, scene)
    },
    rain: {
        mount: ({ precipitationLayer }, scene) => createRainController(precipitationLayer, scene)
    },
    snow: {
        mount: ({ precipitationLayer }, scene) => createSnowController(precipitationLayer, scene)
    },
    fog: {
        mount: ({ atmosphereLayer }, scene) => createFogController(atmosphereLayer, scene)
    },
    thunderstorm: {
        mount: ({ skyLayer }) => createThunderstormController(skyLayer)
    },
    hail: {
        mount: ({ precipitationLayer }) => createHailController(precipitationLayer)
    },
    wind: {
        mount: ({ wildlifeLayer }) => createWindController(wildlifeLayer)
    },
    birds: {
        mount: ({ wildlifeLayer }) => createBirdController(wildlifeLayer)
    }
};

export class EffectManager {
    constructor(layers) {
        this.layers = layers;
        this.active = new Map();
        this.lastSignature = '';
    }

    update(scene) {
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

        for (const [effectId, controller] of this.active.entries()) {
            if (!nextEffects.has(effectId)) {
                cleanupController(controller);
                this.active.delete(effectId);
            }
        }

        for (const effectId of nextEffects) {
            if (this.active.has(effectId) || !REGISTRY[effectId]) {
                continue;
            }

            const controller = REGISTRY[effectId].mount(this.layers, scene);
            this.active.set(effectId, controller);
        }
    }

    clear() {
        for (const controller of this.active.values()) {
            cleanupController(controller);
        }
        this.active.clear();
        Object.values(this.layers).forEach((layer) => {
            if (layer && layer.classList) {
                layer.classList.remove('lightning-flash');
            }
            if (layer && 'innerHTML' in layer) {
                layer.innerHTML = '';
            }
        });
        this.lastSignature = '';
    }
}
