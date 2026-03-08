// Spiel-Konfiguration
const CONFIG = {
    // Version
    VERSION: 'Alpha 1.0 Dev',
    
    BLOCK_SIZE: 32,
    CHUNK_WIDTH: 16,
    MIN_HEIGHT: 6,
    MAX_HEIGHT: 18, // Mehr Variation für interessanteres Terrain
    STONE_DEPTH: 8,
    UNDERGROUND_DEPTH: 100,
    
    // Terrain-Generierung
    TERRAIN: {
        BASE_FREQUENCY: 0.02,      // Sehr sanfte, lange Hügel
        DETAIL_FREQUENCY: 0.08,    // Sanfte Details
        MOUNTAIN_FREQUENCY: 0.005, // Sehr langsame Berge
        BASE_AMPLITUDE: 3,         // Größere Hügel
        DETAIL_AMPLITUDE: 0.8,     // Weniger Details
        MOUNTAIN_AMPLITUDE: 2.5,   // Sanfte Berge
        MAX_HEIGHT_CHANGE: 1,      // Nur 1 Block pro Schritt für sanftere Steigung
        SMOOTHING_PASSES: 2        // Mehrere Glättungs-Durchgänge
    },
    
    // Physik
    GRAVITY: 0.5,
    JUMP_FORCE: -8,  // Langsamer Sprung
    MOVE_SPEED: 2,
    SPRINT_SPEED: 4,  // Sprint-Geschwindigkeit (Shift)
    MOVE_ACCELERATION: 0.3,
    FRICTION: 0.85,
    
    // Kamera
    CAMERA_SMOOTH: 0.08,
    CAMERA_DRIFT_DELAY: 0.05,
    CAMERA_ZOOM: 2.5,
    
    // Highlight
    HIGHLIGHT_ALPHA: 0.3,
    HIGHLIGHT_SMOOTH: 0.2,
    
    // Block Breaking
    BREAK_TIME: 4000, // Standard-Zeit in Millisekunden
    BREAK_FRAMES: 4,
    BREAK_ANIMATION_DURATION: 200, // Fade-out Animation in ms
    BREAK_RANGE: 4, // Maximale Reichweite in Blöcken
    
    // Partikel
    PARTICLE_GRAVITY: 0.3,
    
    // Items
    ITEM_GRAVITY: 0.4,
    ITEM_SIZE: 16,
    PICKUP_RANGE: 64, // 2 Blöcke = 64 Pixel (größere Range für Magnet-Effekt)
    
    // Fallschaden
    FALL_DAMAGE_THRESHOLD: 7, // Ab 7 Blöcken Fallhöhe
    FALL_DAMAGE_PER_BLOCK: 7, // 1 Herz pro 7 Blöcke (7 Blöcke = 1 Herz, 14 Blöcke = 2 Herzen, etc.)
    
    // Block-spezifische Abbau-Zeiten
    BLOCK_BREAK_TIMES: {
        'grass': 500,        // 0.5 Sekunden
        'dirt-grass': 800,  // 0.8 Sekunden
        'dirt': 800,        // 0.8 Sekunden
        'stone': 3000,       // 3 Sekunden
        'coalore': 4000,     // 4 Sekunden
        'ironore': 5000,     // 5 Sekunden
        'diamondore': 6000,  // 6 Sekunden
        'emeraldore': 7000,  // 7 Sekunden
        'bedrock': Infinity  // Unzerstörbar
    },
    
    // Tool-Anzeige beim Player
    TOOL_DISPLAY: {
        OFFSET_X: 16,        // Horizontal vom Player-Center
        OFFSET_Y: 4,        // Vertikal vom Player-Center (negativ = über dem Player)
        SIZE: 24,            // Größe des Tool-Icons
        ROTATION: 0          // Rotation in Grad (0 = keine Rotation)
    },
    
    // Inventar-Grid
    INVENTORY_GRID: {
        COLS: 6,
        ROWS: 7, // 7 Inventar-Reihen, ohne Hotbar
        START_X: 18,
        START_Y: 16,
        SPACING_X: 45.5,
        SPACING_Y: 47,
        SLOT_SIZE: 40,
        DEBUG: false // Rote Border um Slots anzeigen
    },
    
    // Chat
    CHAT: {
        WIDTH: 350,
        HEIGHT: 550,
        OFFSET_X: 20, // Abstand vom rechten Rand
        OFFSET_Y: 50, // Abstand von oben
        
        // Logger-Bereich
        LOGGER: {
            X: 6,
            Y: 8,
            WIDTH: 338,
            HEIGHT: 498,
            FONT_SIZE: 12,
            LINE_HEIGHT: 16,
            PADDING: 5
        },
        
        // Input-Bereich
        INPUT: {
            X: 6,
            Y: 510,
            WIDTH: 338,
            HEIGHT: 35,
            FONT_SIZE: 11,
            LINE_HEIGHT: 4,
            PADDING: 5
        },
        
        // Scrollbar
        SCROLLBAR: {
            WIDTH: 6,
            COLOR: '#888888',
            HANDLE_COLOR: '#CCCCCC',
            PADDING: 2
        },
        
        DEBUG: false // Rote Border um Logger und Input-Bereich
    },
    
    // Tooltip
    TOOLTIP: {
        FONT_SIZE: 12,
        LINE_HEIGHT: 14,
        PADDING_X: 12,      // Horizontaler Abstand vom Rand
        PADDING_Y: 12,      // Vertikaler Abstand vom Rand
        MIN_WIDTH: 286,     // Minimale Breite
        MIN_HEIGHT: 110,     // Minimale Höhe
        OFFSET_X: 15,       // Abstand vom Cursor
        OFFSET_Y: 15,
        CENTER_VERTICALLY: true  // Text vertikal zentrieren
    },
    
    // Health Bar
    HEALTH_BAR: {
        X: 20,              // X-Position (von links)
        Y: 20,              // Y-Position (von oben)
        SCALE: 1.4           // Skalierung der Health-Bar
    },
    
    // Tag-Nacht-Zyklus
    DAY_NIGHT_CYCLE: {
        ENABLED: true,
        CYCLE_DURATION: 1060000,  // 4 Minuten (240000ms) für einen vollen Tag
        NIGHT_DARKNESS: 0.1,    // Wie dunkel die Nacht ist (0 = komplett dunkel, 1 = keine Dunkelheit) - höher = heller
        SUNRISE_TIME: 0.2,       // Sonnenaufgang bei 20% des Zyklus
        SUNSET_TIME: 0.7         // Sonnenuntergang bei 70% des Zyklus
    },
    
    // Load Screen Einstellungen
    LOAD_SCREEN: {
        CYCLE_DURATION: 30000,   // 30 Sekunden für einen vollen Tag-Nacht-Zyklus
        ZOOM: 1.05,              // Zoom-Faktor (2.5x)
        CAMERA_OFFSET_Y: 1.5,    // Kamera-Offset in Blöcken (negativ = nach oben)
        NIGHT_DARKNESS: 0.65,    // Dunkelheit bei Nacht (gleich wie im Hauptspiel)
        LOADING_TIME: 8000       // Ladezeit in Millisekunden (8 Sekunden)
    }
};

CONFIG.WORLD_HEIGHT = CONFIG.MAX_HEIGHT + CONFIG.UNDERGROUND_DEPTH;