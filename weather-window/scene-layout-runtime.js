(function initSceneLayoutRuntime(global) {
    const DIMENSIONS = {
        WINDOW: {
            DEFAULT_WIDTH: 600,
            DEFAULT_HEIGHT: 400,
            ASPECT_RATIO: 3 / 2
        },
        SPACING: {
            HORIZON_OFFSET_PX: 25,
            SNOW_HORIZON_OFFSET_PX: 18,
            PARTICLE_START_OFFSET: 50,
            TREE_GAP: 0,
            FLOOR_MARGIN: 30
        },
        getWindowWidth() {
            const container = document.getElementById('weatherAnimation');
            return container?.offsetWidth || this.WINDOW.DEFAULT_WIDTH;
        },
        getWindowHeight() {
            const container = document.getElementById('weatherAnimation');
            return container?.offsetHeight || this.WINDOW.DEFAULT_HEIGHT;
        },
        isMobile() {
            return window.innerWidth < 768;
        },
        getBreakpoint() {
            const width = this.getWindowWidth();
            if (width <= 390) return 'mobile';
            if (width <= 560) return 'tablet';
            return 'desktop';
        },
        getScaleFactor() {
            const baseWidth = this.WINDOW.DEFAULT_WIDTH;
            const currentWidth = this.getWindowWidth();
            return Math.min(1, currentWidth / baseWidth);
        },
        getSceneScale() {
            const widthScale = this.getWindowWidth() / this.WINDOW.DEFAULT_WIDTH;
            const heightScale = this.getWindowHeight() / this.WINDOW.DEFAULT_HEIGHT;
            const combinedScale = Math.min(widthScale, heightScale);
            const breakpoint = this.getBreakpoint();
            const minimumScale = breakpoint === 'mobile' ? 0.76 : breakpoint === 'tablet' ? 0.86 : 1;
            return Math.max(minimumScale, Math.min(1, combinedScale));
        },
        percentToY(percent) {
            return this.getWindowHeight() * percent;
        }
    };

    const EFFECT_RESPONSIVE_CONFIG = {
        rain: {
            desktop: { fontScale: 1, densityScale: 1, spawnTopMin: -0.24, spawnTopMax: -0.12, stopMin: 0.86, stopMax: 1, spreadScale: 1, maxActive: 999 },
            tablet: { fontScale: 0.92, densityScale: 0.88, spawnTopMin: -0.22, spawnTopMax: -0.11, stopMin: 0.84, stopMax: 1, spreadScale: 0.92, maxActive: 160 },
            mobile: { fontScale: 0.88, densityScale: 0.76, spawnTopMin: -0.2, spawnTopMax: -0.1, stopMin: 0.83, stopMax: 1, spreadScale: 0.86, maxActive: 120 }
        },
        snow: {
            desktop: { fontScale: 1, densityScale: 1, spawnTopMin: -0.26, spawnTopMax: -0.12, stopMin: 0.82, stopMax: 1, driftScale: 1, spreadScale: 1, maxActive: 999 },
            tablet: { fontScale: 0.92, densityScale: 0.88, spawnTopMin: -0.24, spawnTopMax: -0.11, stopMin: 0.8, stopMax: 1, driftScale: 0.82, spreadScale: 0.9, maxActive: 170 },
            mobile: { fontScale: 0.87, densityScale: 0.74, spawnTopMin: -0.22, spawnTopMax: -0.1, stopMin: 0.79, stopMax: 1, driftScale: 0.68, spreadScale: 0.84, maxActive: 130 }
        },
        cloud: {
            desktop: { fontScale: 1, densityScale: 1, spawnTopMin: 0.06, spawnTopMax: 0.32, driftScale: 1, spreadScale: 1, maxActive: 8 },
            tablet: { fontScale: 0.94, densityScale: 0.86, spawnTopMin: 0.07, spawnTopMax: 0.29, driftScale: 0.92, spreadScale: 0.92, maxActive: 6 },
            mobile: { fontScale: 0.9, densityScale: 0.74, spawnTopMin: 0.07, spawnTopMax: 0.25, driftScale: 0.82, spreadScale: 0.84, maxActive: 5 }
        },
        fog: {
            desktop: { fontScale: 1, densityScale: 1, spawnTopMin: 0.12, spawnTopMax: 0.48, driftScale: 1, spreadScale: 1, maxActive: 9 },
            tablet: { fontScale: 0.9, densityScale: 0.84, spawnTopMin: 0.13, spawnTopMax: 0.42, driftScale: 0.9, spreadScale: 0.88, maxActive: 7 },
            mobile: { fontScale: 0.84, densityScale: 0.7, spawnTopMin: 0.14, spawnTopMax: 0.38, driftScale: 0.78, spreadScale: 0.76, maxActive: 6 }
        },
        hail: {
            desktop: { fontScale: 1, densityScale: 1, spawnTopMin: -0.24, spawnTopMax: -0.12, stopMin: 0.86, stopMax: 1, spreadScale: 1, maxActive: 999 },
            tablet: { fontScale: 0.88, densityScale: 0.82, spawnTopMin: -0.22, spawnTopMax: -0.1, stopMin: 0.84, stopMax: 1, spreadScale: 0.88, maxActive: 110 },
            mobile: { fontScale: 0.8, densityScale: 0.68, spawnTopMin: -0.2, spawnTopMax: -0.1, stopMin: 0.83, stopMax: 1, spreadScale: 0.82, maxActive: 85 }
        },
        rime: {
            desktop: { fontScale: 1, densityScale: 1, spawnTopMin: 0.62, spawnTopMax: 0.82, spreadScale: 1, maxActive: 10 },
            tablet: { fontScale: 0.9, densityScale: 0.84, spawnTopMin: 0.64, spawnTopMax: 0.8, spreadScale: 0.92, maxActive: 8 },
            mobile: { fontScale: 0.82, densityScale: 0.7, spawnTopMin: 0.66, spawnTopMax: 0.79, spreadScale: 0.86, maxActive: 6 }
        }
    };

    function getResponsiveWeatherProfile(effectName) {
        const breakpoint = DIMENSIONS.getBreakpoint();
        const sceneScale = DIMENSIONS.getSceneScale();
        const config = EFFECT_RESPONSIVE_CONFIG[effectName]?.[breakpoint] || EFFECT_RESPONSIVE_CONFIG[effectName]?.desktop || {};
        return {
            breakpoint,
            sceneScale,
            fontScale: (config.fontScale ?? 1) * sceneScale,
            densityScale: config.densityScale ?? 1,
            spawnTopMin: config.spawnTopMin ?? 0,
            spawnTopMax: config.spawnTopMax ?? 1,
            stopMin: config.stopMin ?? 0,
            stopMax: config.stopMax ?? 1,
            driftScale: config.driftScale ?? 1,
            spreadScale: config.spreadScale ?? 1,
            maxActive: config.maxActive ?? 999
        };
    }

    function getResponsiveSceneProfile() {
        const breakpoint = DIMENSIONS.getBreakpoint();
        const sceneScale = DIMENSIONS.getSceneScale();

        if (breakpoint === 'mobile') {
            return {
                treeScale: 0.9 * sceneScale,
                horizonFontScale: 0.88 * sceneScale,
                horizonOffsetPercent: 0.085,
                treeBottomPx: 6,
                charWidthPx: 8.4 * sceneScale
            };
        }

        if (breakpoint === 'tablet') {
            return {
                treeScale: 0.95 * sceneScale,
                horizonFontScale: 0.94 * sceneScale,
                horizonOffsetPercent: 0.088,
                treeBottomPx: 8,
                charWidthPx: 9 * sceneScale
            };
        }

        return {
            treeScale: 1,
            horizonFontScale: 1,
            horizonOffsetPercent: 0.09,
            treeBottomPx: 16,
            charWidthPx: 10
        };
    }

    function getSceneLayout() {
        const width = DIMENSIONS.getWindowWidth();
        const height = DIMENSIONS.getWindowHeight();
        const sceneProfile = getResponsiveSceneProfile();
        const horizonOffsetPercent = sceneProfile.horizonOffsetPercent;
        const horizonTopPercent = (1 - horizonOffsetPercent) * 100;
        const horizonY = height * (1 - horizonOffsetPercent);
        const horizonOffsetPx = height * horizonOffsetPercent;
        const skyTopPercent = 10;
        const skyBottomPercent = DIMENSIONS.isMobile() ? 82 : 80;

        return {
            width,
            height,
            breakpoint: DIMENSIONS.getBreakpoint(),
            sceneScale: DIMENSIONS.getSceneScale(),
            horizonOffsetPercent,
            horizonOffsetPercentCss: `${horizonOffsetPercent * 100}%`,
            horizonTopPercent,
            horizonY,
            horizonOffsetPx,
            skyTopPercent,
            skyBottomPercent,
            treeScale: sceneProfile.treeScale,
            treeBottomPx: sceneProfile.treeBottomPx,
            horizonFontScale: sceneProfile.horizonFontScale,
            charWidthPx: sceneProfile.charWidthPx,
            maskWidthRem: Math.max(2.1, 2.75 * sceneProfile.treeScale),
            maskHeightRem: Math.max(5.8, 8.5 * sceneProfile.treeScale)
        };
    }

    Object.assign(DIMENSIONS, {
        getHorizonOffset() {
            return getSceneLayout().horizonOffsetPx;
        },
        getHorizonY() {
            return getSceneLayout().horizonY;
        }
    });

    global.WeatherWindow = global.WeatherWindow || {};
    Object.assign(global.WeatherWindow, {
        DIMENSIONS,
        getResponsiveWeatherProfile,
        getResponsiveSceneProfile,
        getSceneLayout
    });
})(window);
