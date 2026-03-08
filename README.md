<img width="381" height="159" alt="title" src="https://github.com/user-attachments/assets/8bd2e83e-049c-474f-8252-51fb12ae0da4" />

A 2D Minecraft-inspired sandbox game built with vanilla JavaScript and HTML5 Canvas. Explore procedurally generated worlds, mine resources, craft tools, and survive the day-night cycle!

![Version](https://img.shields.io/badge/version-Alpha%201.0%20Dev-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

## ✨ Features

### 🌍 World Generation
- **Procedural Terrain**: Infinite world generation with smooth hills and mountains
- **Multiple Biomes**: Varied terrain with different heights and formations
- **Underground Layers**: Deep underground with stone and valuable ores
- **Chunk System**: Efficient chunk-based world loading and rendering

### ⛏️ Mining & Resources
- **Block Types**:
  - Grass, Dirt, Stone (basic blocks)
  - Coal Ore, Iron Ore, Diamond Ore, Emerald Ore (valuable resources)
  - Bedrock (unbreakable bottom layer)
- **Breaking Animation**: Visual feedback with 4-frame break animation
- **Item Drops**: Collect resources from broken blocks
- **Auto-Pickup**: Magnetic item collection system

### 🔨 Tools & Crafting
- **5 Tool Tiers**: Wood → Stone → Iron → Diamond → Emerald
- **4 Tool Types**:
  - Pickaxe (mining)
  - Axe (chopping)
  - Shovel (digging)
  - Sword (combat)
- **Tool Display**: Visual tool rendering when equipped
- **Durability System**: Tools have different mining speeds

### 🎒 Inventory System
- **48 Slots**: 6 hotbar slots + 42 inventory slots
- **Drag & Drop**: Intuitive item management
- **Item Stacking**: Stack up to 999 items per slot
- **Tooltips**: Hover to see item names and stats
- **Quick Access**: Number keys (1-6) for hotbar selection

### 🌅 Day-Night Cycle
- **Dynamic Sky**: Smooth gradient transitions between day and night
- **4-Minute Cycle**: Configurable day-night duration
- **Darkness System**: World darkens at night with smooth transitions
- **Pixelated Gradient**: Retro-style sky rendering (32px pixels, 8 color steps)
- **Time Phases**: Night → Sunrise → Day → Sunset → Night

### 🎮 Player Mechanics
- **Smooth Movement**: WASD controls with acceleration and friction
- **Sprint**: Hold Shift to run faster
- **Jump**: Spacebar with realistic physics
- **Fly Mode**: Creative flying with `/fly on` command
- **Animations**: Walking and standing animations with sprite flipping
- **Fall Damage**: Realistic fall damage system (7 blocks threshold)

### 💬 Chat & Commands
- **In-Game Chat**: Press T to open chat
- **Color Codes**: Support for colored text (§a, §c, §e, etc.)
- **Command System**:
  - `/give <item> [count]` - Give yourself items
  - `/list [category]` - List all available items
  - `/adm` - Give all tools (admin)
  - `/fly <on|off>` - Toggle fly mode
  - `/time <day|night>` - Set time of day
  - `/clear` - Clear chat history
  - `/help` - Show all commands

### 🎨 User Interface
- **Health Bar**: Visual health display with heart icons
- **Hotbar**: Quick access to 6 items
- **Inventory Screen**: Full inventory management (press E)
- **Block Highlight**: Visual feedback for block selection
- **Break Progress**: Real-time breaking animation overlay
- **Cursor**: Custom pixel-art cursor

### 🎵 Audio & Visuals
- **Background Music**: Atmospheric music on title screen
- **Particle System**: Visual effects for block breaking
- **Camera System**: Smooth camera following with zoom
- **Retro Graphics**: Pixel-perfect rendering with custom textures

### 🎬 Screens
- **Title Screen**: Animated world background with day-night cycle
- **Loading Screen**: Progress bar with world generation preview
- **Game Screen**: Full gameplay experience

## 📁 Project Structure

```
block-world/
├── assets/                      # Game assets
│   ├── textures/               # Block textures
│   │   ├── grass.png
│   │   ├── dirt.png
│   │   ├── stone.png
│   │   ├── coalore.png
│   │   ├── ironore.png
│   │   ├── diamondore.png
│   │   ├── emeraldore.png
│   │   └── bedrock.png
│   ├── tools/                  # Tool sprites
│   │   ├── pickaxe-*.png
│   │   ├── axe-*.png
│   │   ├── shovel-*.png
│   │   └── sword-*.png
│   ├── ui/                     # UI elements
│   │   ├── inventory.png
│   │   ├── h1-h6.png          # Hotbar slots
│   │   ├── l0-l4.png          # Health hearts
│   │   ├── chat.png
│   │   └── tooltip.png
│   ├── break/                  # Break animations
│   │   ├── b1.png
│   │   ├── b2.png
│   │   ├── b3.png
│   │   └── b4.png
│   ├── p-stand1.png           # Player standing
│   ├── p-stand2.png
│   ├── p-go1.png              # Player walking
│   ├── p-go2.png
│   ├── cursor.png             # Custom cursor
│   ├── title.png              # Title logo
│   └── homemc.mp3             # Background music
│
├── css/                        # Stylesheets
│   ├── style.css              # Main game styles
│   └── load.css               # Loading screen styles
│
├── js/                         # JavaScript source
│   ├── core/                  # Core game systems
│   │   ├── config.js          # Game configuration
│   │   ├── game.js            # Main game loop
│   │   ├── items.js           # Item registry
│   │   └── utils.js           # Utility functions
│   │
│   ├── entities/              # Game entities
│   │   ├── player.js          # Player logic
│   │   ├── particles.js       # Particle system
│   │   └── itemDrops.js       # Dropped items
│   │
│   ├── rendering/             # Rendering systems
│   │   ├── renderer.js        # Main renderer
│   │   ├── camera.js          # Camera system
│   │   └── dayNightCycle.js   # Day-night cycle
│   │
│   ├── world/                 # World generation
│   │   ├── world.js           # World generator
│   │   ├── blockBreaker.js    # Block breaking
│   │   └── blockPlacer.js     # Block placement
│   │
│   ├── ui/                    # User interface
│   │   ├── chat.js            # Chat system
│   │   ├── chatColors.js      # Color codes
│   │   ├── commands.js        # Command handler
│   │   ├── health.js          # Health system
│   │   ├── hotbar.js          # Hotbar UI
│   │   ├── inventory.js       # Inventory system
│   │   └── input.js           # Input handling
│   │
│   └── screens/               # Game screens
│       ├── load.js            # Loading screen
│       └── titleScreen.js     # Title screen
│
├── index.html                  # Main game page
├── load.html                   # Loading/title page
└── README.md                   # This file
```

## 🎮 Controls

### Movement
- `W` / `↑` - Jump
- `A` / `←` - Move Left
- `S` / `↓` - (Reserved)
- `D` / `→` - Move Right
- `Shift` - Sprint (hold while moving)

### Interaction
- `Left Click` - Break Block
- `Right Click` - Place Block
- `Mouse Wheel` - Scroll Hotbar
- `1-6` - Select Hotbar Slot

### Interface
- `E` - Open/Close Inventory
- `T` - Open Chat
- `Enter` - Send Chat Message
- `Escape` - Close UI

### Debug
- `F3` - Toggle Debug Overlay

### Fly Mode (Creative)
- `Space` - Fly Up
- `Shift` - Fly Down

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Local web server (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/block-world.git
cd block-world
```

2. Start a local web server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

3. Open your browser and navigate to:
```
http://localhost:8000/load.html
```

### Quick Start
1. Click "New Game" on the title screen
2. Wait for world generation
3. Use WASD to move, Left Click to mine, Right Click to place
4. Press E to open inventory
5. Press T to open chat and use commands

## ⚙️ Configuration

All game settings can be configured in `js/core/config.js`:

### World Settings
```javascript
BLOCK_SIZE: 32,           // Block size in pixels
CHUNK_WIDTH: 16,          // Blocks per chunk
MIN_HEIGHT: 6,            // Minimum terrain height
MAX_HEIGHT: 18,           // Maximum terrain height
UNDERGROUND_DEPTH: 100,   // Underground layers
```

### Physics
```javascript
GRAVITY: 0.5,             // Gravity strength
JUMP_FORCE: -8,           // Jump power
MOVE_SPEED: 2,            // Walk speed
SPRINT_SPEED: 4,          // Sprint speed
```

### Day-Night Cycle
```javascript
DAY_NIGHT_CYCLE: {
    ENABLED: true,
    CYCLE_DURATION: 240000,    // 4 minutes
    NIGHT_DARKNESS: 0.65,      // Darkness level (0-1)
    SUNRISE_TIME: 0.2,         // 20% of cycle
    SUNSET_TIME: 0.7           // 70% of cycle
}
```

### Camera
```javascript
CAMERA_SMOOTH: 0.08,      // Camera smoothing
CAMERA_ZOOM: 2.5,         // Zoom level
```

## 🎨 Item System

### Block Types
| ID | Name | Description | Break Time |
|----|------|-------------|------------|
| 1 | Grass | Surface grass block | 0.5s |
| 2 | Dirt-Grass | Grass with dirt | 0.8s |
| 3 | Dirt | Underground dirt | 0.8s |
| 4 | Stone | Common underground | 3.0s |
| 5 | Coal Ore | Fuel source | 4.0s |
| 6 | Iron Ore | Metal resource | 5.0s |
| 7 | Bedrock | Unbreakable | ∞ |
| 8 | Diamond Ore | Rare gem | 6.0s |
| 9 | Emerald Ore | Rarest gem | 7.0s |

### Tool Tiers
| Tier | Material | Mining Speed | Rarity |
|------|----------|--------------|--------|
| 1 | Wood | Slowest | Common |
| 2 | Stone | Slow | Common |
| 3 | Iron | Medium | Uncommon |
| 4 | Diamond | Fast | Rare |
| 5 | Emerald | Fastest | Very Rare |

## 🎯 Ore Generation

- **Coal Ore**: Spawns at Y > surfaceHeight + 20 (2% chance)
- **Iron Ore**: Spawns at Y > surfaceHeight + 35 (1% chance)
- **Diamond Ore**: Spawns at Y > surfaceHeight + 50 (0.3% chance)
- **Emerald Ore**: Spawns at Y > surfaceHeight + 70 (0.15% chance)

## 🐛 Known Issues

- None currently reported

## 🔮 Planned Features

- [ ] Crafting system
- [ ] Mobs and combat
- [ ] More biomes
- [ ] Multiplayer support
- [ ] Save/Load system
- [ ] More block types
- [ ] Building structures
- [ ] Weather system

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by Minecraft
- Built with vanilla JavaScript
- Pixel art textures
- Procedural generation algorithms

---

Made with ❤️ by [Your Name]
