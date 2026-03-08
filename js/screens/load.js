// Start Screen mit animierter Welt als Hintergrund

const startScreen = document.getElementById('start-screen');
const loadingScreen = document.getElementById('loading-screen');
const bgCanvas = document.getElementById('bg-canvas');
const loadingCanvas = document.getElementById('loading-canvas');
const newGameBtn = document.getElementById('new-game-btn');
const bgMusic = document.getElementById('bg-music');

// Canvas Setup
bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;
loadingCanvas.width = window.innerWidth;
loadingCanvas.height = window.innerHeight;

const bgCtx = bgCanvas.getContext('2d');
const loadingCtx = loadingCanvas.getContext('2d');

// Welt für Hintergrund
const world = new World();
const textures = {};
let cameraX = 0; // Start Screen: nach rechts
let loadingCameraX = 0; // Loading: nach links

// Tag-Nacht-Zyklus für Load Screen
let dayTime = 0.5; // Start am Tag
let lastTime = Date.now();

// Day-Night Cycle Update
function updateDayNightCycle() {
    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;
    
    dayTime += deltaTime / CONFIG.LOAD_SCREEN.CYCLE_DURATION;
    if (dayTime >= 1) {
        dayTime -= 1;
    }
}

// Himmel-Farben berechnen
function getSkyColors() {
    const time = dayTime;
    
    const colors = {
        night: { top: '#1a1a3a', bottom: '#2a2a4e' },
        sunrise: { top: '#ff6b35', bottom: '#ffd93d' },
        day: { top: '#87CEEB', bottom: '#b8e6ff' },
        sunset: { top: '#ff6b35', bottom: '#ff8c42' },
    };
    
    let topColor, bottomColor;
    
    if (time < 0.2) {
        const t = time / 0.2;
        topColor = lerpColor(colors.night.top, colors.sunrise.top, t);
        bottomColor = lerpColor(colors.night.bottom, colors.sunrise.bottom, t);
    } else if (time < 0.3) {
        const t = (time - 0.2) / 0.1;
        topColor = lerpColor(colors.sunrise.top, colors.day.top, t);
        bottomColor = lerpColor(colors.sunrise.bottom, colors.day.bottom, t);
    } else if (time < 0.7) {
        topColor = colors.day.top;
        bottomColor = colors.day.bottom;
    } else if (time < 0.8) {
        const t = (time - 0.7) / 0.1;
        topColor = lerpColor(colors.day.top, colors.sunset.top, t);
        bottomColor = lerpColor(colors.day.bottom, colors.sunset.bottom, t);
    } else {
        const t = (time - 0.8) / 0.2;
        topColor = lerpColor(colors.sunset.top, colors.night.top, t);
        bottomColor = lerpColor(colors.sunset.bottom, colors.night.bottom, t);
    }
    
    return { top: topColor, bottom: bottomColor };
}

// Farb-Interpolation
function lerpColor(color1, color2, t) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Dunkelheit berechnen
function getDarkness() {
    const time = dayTime;
    const NIGHT_DARKNESS = CONFIG.LOAD_SCREEN.NIGHT_DARKNESS;
    
    if (time < 0.2) {
        const t = time / 0.2;
        return (1 - t) * (1 - NIGHT_DARKNESS);
    } else if (time < 0.3) {
        return 0;
    } else if (time < 0.7) {
        return 0;
    } else if (time < 0.8) {
        const t = (time - 0.7) / 0.1;
        return t * (1 - NIGHT_DARKNESS) * 0.5;
    } else {
        const t = (time - 0.8) / 0.2;
        return 0.5 * (1 - NIGHT_DARKNESS) + t * 0.5 * (1 - NIGHT_DARKNESS);
    }
}

// Pixeliger Gradient
function drawPixelatedGradient(ctx, colors) {
    const pixelSize = 32;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const colorSteps = 8;
    
    for (let y = 0; y < height; y += pixelSize) {
        const t = y / height;
        const quantizedT = Math.floor(t * colorSteps) / colorSteps;
        const color = lerpColor(colors.top, colors.bottom, quantizedT);
        
        ctx.fillStyle = color;
        ctx.fillRect(0, y, width, pixelSize);
    }
}

// Texturen laden
async function loadTextures() {
    const textureNames = ['stone', 'dirt', 'dirt-grass', 'grass', 'coalore'];
    
    const promises = textureNames.map(name => {
        return loadImage(name, `assets/textures/${name}.png`);
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ name, img }) => {
        if (img) {
            textures[name] = img;
        }
    });
}

// Welt rendern
function renderWorld(ctx, cameraX) {
    // Update Day-Night Cycle
    updateDayNightCycle();
    
    // Himmel mit Gradient
    const skyColors = getSkyColors();
    drawPixelatedGradient(ctx, skyColors);
    
    const darkness = getDarkness();
    
    const zoom = CONFIG.LOAD_SCREEN.ZOOM;
    const cameraOffsetY = CONFIG.BLOCK_SIZE * CONFIG.LOAD_SCREEN.CAMERA_OFFSET_Y;
    
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(0, cameraOffsetY);
    
    const startChunk = Math.floor((cameraX - CONFIG.BLOCK_SIZE) / (CONFIG.CHUNK_WIDTH * CONFIG.BLOCK_SIZE));
    const endChunk = Math.ceil((cameraX + ctx.canvas.width / zoom + CONFIG.BLOCK_SIZE) / (CONFIG.CHUNK_WIDTH * CONFIG.BLOCK_SIZE));
    
    for (let chunkX = startChunk; chunkX <= endChunk; chunkX++) {
        const chunk = world.generateChunk(chunkX);
        
        for (let x = 0; x < CONFIG.CHUNK_WIDTH; x++) {
            for (let y = 0; y < CONFIG.WORLD_HEIGHT; y++) {
                const blockType = chunk[x][y];
                if (!blockType) continue;
                
                const worldX = (chunkX * CONFIG.CHUNK_WIDTH + x) * CONFIG.BLOCK_SIZE;
                const worldY = y * CONFIG.BLOCK_SIZE;
                const screenX = worldX - cameraX;
                const screenY = worldY;
                
                if (screenX > -CONFIG.BLOCK_SIZE && screenX < ctx.canvas.width / zoom &&
                    screenY > -CONFIG.BLOCK_SIZE && screenY < ctx.canvas.height / zoom) {
                    
                    const texture = textures[blockType];
                    if (texture) {
                        ctx.drawImage(texture, screenX, screenY, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
                    }
                }
            }
        }
    }
    
    ctx.restore();
    
    // Dunkelheit als Overlay über den gesamten Canvas (hinter dem Logo)
    if (darkness > 0) {
        ctx.save();
        ctx.globalAlpha = darkness;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }
}

// Animation Loop für Start Screen
function animateStartScreen() {
    if (!startScreen.classList.contains('hidden')) {
        cameraX += 0.5; // Langsam nach rechts
        renderWorld(bgCtx, cameraX);
        requestAnimationFrame(animateStartScreen);
    }
}

// Animation Loop für Loading Screen
function animateLoadingScreen() {
    if (!loadingScreen.classList.contains('hidden')) {
        loadingCameraX -= 0.5; // Langsam nach links
        renderWorld(loadingCtx, loadingCameraX);
        requestAnimationFrame(animateLoadingScreen);
    }
}

// Musik starten bei erstem Klick oder Tastendruck
let musicStarted = false;
function startMusic() {
    if (!musicStarted) {
        bgMusic.volume = 0.1; // 10% Lautstärke
        bgMusic.play().catch(e => {
            console.log('Audio play failed:', e);
            // Fallback: Versuche bei nächster Interaktion
            document.addEventListener('click', () => {
                bgMusic.volume = 0.1;
                bgMusic.play();
            }, { once: true });
        });
        musicStarted = true;
    }
}

// Versuche Musik sofort zu starten
startMusic();

// Falls Browser Autoplay blockiert, starte bei erster Interaktion
document.addEventListener('click', startMusic);
document.addEventListener('keydown', startMusic);

// New Game Button
newGameBtn.addEventListener('click', () => {
    startGame();
});

function startGame() {
    // Verstecke Start Screen
    startScreen.classList.add('hidden');
    
    // Zeige Loading Screen
    loadingScreen.classList.remove('hidden');
    loadingCameraX = cameraX; // Starte von aktueller Position
    animateLoadingScreen();
    
    // Verwende die konfigurierte Ladezeit
    const loadTime = CONFIG.LOAD_SCREEN.LOADING_TIME;
    const startTime = Date.now();
    
    // Warte bis die Ladezeit abgelaufen ist
    const checkComplete = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= loadTime) {
            clearInterval(checkComplete);
            
            // Fade out Musik
            const fadeOut = setInterval(() => {
                if (bgMusic.volume > 0.05) {
                    bgMusic.volume -= 0.05;
                } else {
                    bgMusic.pause();
                    clearInterval(fadeOut);
                }
            }, 100);
            
            // Navigiere zum Spiel
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    }, 100);
}

// Window Resize
window.addEventListener('resize', () => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    loadingCanvas.width = window.innerWidth;
    loadingCanvas.height = window.innerHeight;
});

// Version anzeigen
document.getElementById('version-start').textContent = CONFIG.VERSION;
document.getElementById('version-loading').textContent = CONFIG.VERSION;

// Start
loadTextures().then(() => {
    animateStartScreen();
});
