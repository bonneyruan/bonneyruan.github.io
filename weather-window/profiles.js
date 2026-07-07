export const OUTDOOR_PROFILES = {
    forest: {
        label: 'Forest',
        skyTexture: ['  .      .   ', '     .       '],
        distantArt: () => [
            '      /\\        /\\           /\\      ',
            '  /\\ /  \\  /\\  /  \\   /\\    /  \\     ',
            ' /  V    \\/  \\/    \\_/  \\__/    \\    '
        ],
        foregroundArt: (scene) => {
            const snowyGround = scene.weather.precipitationType === 'snow' ? '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^' : '""""""""""""""""""""""""""""""""""""""""';
            return [
                '      (%%%%)          (%%%%)           ',
                '     (%%%%%%)        (%%%%%%)          ',
                '   ___||__||___________||__||___       ',
                snowyGround
            ];
        }
    },
    coastal: {
        label: 'Coastal',
        skyTexture: ['      .    .    ', '   .      .     '],
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
        skyTexture: ['      .        . ', '   .       .     '],
        distantArt: () => [
            '            /\\               /\\        ',
            '    /\\     /  \\      /\\     /  \\  /\\   ',
            '   /  \\___/    \\____/  \\___/    \\/  \\  '
        ],
        foregroundArt: (scene) => {
            const trail = scene.weather.precipitationType === 'snow'
                ? '___________..__..___________..__.._____'
                : '___________/  /_____________/  /_______';
            return [
                '      ||                 ||            ',
                '   ___||_________________||____        ',
                trail
            ];
        }
    },
    plains: {
        label: 'Plains',
        skyTexture: ['   .           . ', '        .        '],
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
        skyTexture: ['      .         .', '   .        .    '],
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
        skyTexture: ['     .    .     ', '  .      .      '],
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
        skyTexture: ['      .      .  ', '   .      .     '],
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

export const SURROUNDINGS_PROFILES = {
    neutral: {
        label: 'Neutral',
        top: '                                          ',
        left: '    \n    \n    \n    \n    \n    \n    ',
        right: '    \n    \n    \n    \n    \n    \n    ',
        bottom: '                                          ',
        stageClass: 'surroundings-neutral'
    },
    minimalRoom: {
        label: 'Minimal Room',
        top: '   .----------------------------------.   ',
        left: '   |\\\n   ||\n   ||\n   ||\n   ||\n   ||\n   |/',
        right: '\\|   \n||   \n||   \n||   \n||   \n||   \n/|   ',
        bottom: '   |____book____lamp____plant_________|   ',
        stageClass: 'surroundings-room'
    },
    house: {
        label: 'House',
        top: '   .== curtain rail ==.     .== framed art ==.   ',
        left: '  /|\n / |\n/  |\n|  |\n|  |\n|  |\n|__|',
        right: '|__|\n|  |\n|  |\n|  |\n|  |\n|  \\\n|\\  \\',
        bottom: '   [ chair ]______ [ radiator ] ______[ rug ]   ',
        stageClass: 'surroundings-house'
    },
    cafe: {
        label: 'Cafe',
        top: '   .- menu board -.      .- hanging light -.   ',
        left: '  ( )\n _| |_\n|_   _|\n  | |\n  | |\n _| |_\n(_____',
        right: '_____)\n _| |_\n  | |\n  | |\n|_   _|\n _| |_\n( )',
        bottom: '   [ cup ]___[ table edge ]___[ pastry case ]   ',
        stageClass: 'surroundings-cafe'
    }
};

export function getOutdoorProfile(key) {
    return OUTDOOR_PROFILES[key] || OUTDOOR_PROFILES.forest;
}

export function getSurroundingsProfile(key) {
    return SURROUNDINGS_PROFILES[key] || SURROUNDINGS_PROFILES.minimalRoom;
}

export function getOutdoorProfileOptions() {
    return Object.entries(OUTDOOR_PROFILES).map(([value, profile]) => ({
        value,
        label: profile.label
    }));
}

export function getSurroundingsProfileOptions() {
    return Object.entries(SURROUNDINGS_PROFILES).map(([value, profile]) => ({
        value,
        label: profile.label
    }));
}

export function deriveOutdoorProfileKey(locationName = '') {
    const normalized = locationName.toLowerCase();

    if (/(beach|bay|coast|ocean|sea)/.test(normalized)) {
        return 'coastal';
    }
    if (/(mountain|alps|andes|rocky|himalaya)/.test(normalized)) {
        return 'mountain';
    }
    if (/(desert|sahara|arizona|nevada)/.test(normalized)) {
        return 'desert';
    }
    if (/(tokyo|new york|london|paris|city|downtown|seoul)/.test(normalized)) {
        return 'urban';
    }
    if (/(hawaii|bali|tropical|rainforest|miami)/.test(normalized)) {
        return 'tropical';
    }
    if (/(prairie|plains|field|farm|kansas)/.test(normalized)) {
        return 'plains';
    }

    return 'forest';
}
