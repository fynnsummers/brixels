# 🎮 Brixel

<p align="center">
  <img width="381" height="159" alt="Brixel Title" src="https://github.com/fynnsummers/brixel/blob/main/assets/title.png" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-Alpha%200.17%20Dev-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript&logoColor=black">
</p>

A **2D Minecraft-inspired sandbox game** built with **vanilla JavaScript** and **HTML5 Canvas**.  
Explore procedurally generated worlds, mine resources, craft tools, and survive the day-night cycle.

[Live Demo (V0.17 Alpha)](https://brixels.netlify.app/)
---

## ✨ Features

### 🌍 World Generation
- **Procedural Terrain**: Infinite world generation with smooth hills and mountains
- **Multiple Biomes**: Varied terrain with different heights and formations
- **Underground Layers**: Deep underground with stone and valuable ores
- **Chunk System**: Efficient chunk-based world loading (max 3 chunks)
- **Tree Generation**: Natural tree spawning with collapse mechanics

### ⛏️ Mining & Resources
- **17 Block Types**: Grass, Dirt, Stone, Ores, Trees, and more
- **5 Material Items**: Coal, Iron, Gold, Diamond, Emerald (drop from ores)
- **Breaking Animation**: 4-frame break animation with particles
- **Item Drops**: Resources drop when blocks break
- **Auto-Pickup**: Magnetic item collection system
- **Tree Collapse**: Breaking tree blocks causes entire tree to collapse

### 🔨 Tools & Crafting
- **4x4 Crafting Grid**: 26 crafting recipes available
- **Tool Tiers**: Wood → Stone → Iron → Gold → Diamond → Emerald
- **Tool Types**: Pickaxe, Axe, Shovel, Sword
- **Mining Speed**: Different speeds per tool tier (2x - 15x)
- **Recipe System**: Shaped recipes with pattern matching
- **Recipe Overlay**: Search and view all recipes in start menu

### 🎒 Inventory System
- **42 Inventory Slots** (6 columns × 7 rows)
- **6 Hotbar Slots** with quick access (keys 1-6)
- **Drag & Drop**: Item management with mouse
- **Item Splitting**: Right-click to split stacks in half
- **Item Stacking**: Up to 64 items per stack
- **Tooltips**: Detailed item information on hover

### ☀️ Day-Night Cycle
- **Dynamic Sky**: Gradient transitions between phases
- **17-Minute Cycle**: Full day-night cycle
- **Darkness System**: 30% darkness during night
- **Pixelated Rendering**: Retro-style gradient rendering
- **Time Phases**: Night → Sunrise → Day → Sunset → Night

### 🏃 Player Mechanics
- **Smooth Movement**: WASD controls with acceleration
- **Sprint**: 2x speed using Shift
- **Jump Physics**: Realistic gravity and jumping
- **Fly Mode**: Toggle with `/fly on` command
- **Player Animations**: Walking and standing animations
- **Fall Damage**: Takes damage after falling 7+ blocks
- **Health System**: 10 hearts (20 HP)

### 💬 Chat & Commands
- **Color Codes**: Support for §a, §c, §e, etc.
- **Admin Commands**: `/adm`, `/adm2` for items
- **Utility Commands**: `/give`, `/list`, `/time`, `/clear`, `/help`
- **Fly Command**: `/fly <on|off>`
- **Chat Overlay**: Press T to open, blocks E/C keys when active

### 🎨 User Interface
- **Health Bar**: Heart-based health display
- **Hotbar**: Quick item access with visual feedback
- **Inventory Screen**: Full inventory management (E)
- **Crafting Screen**: 4x4 crafting grid (C)
- **Item Index**: Browse all items in start menu
- **Block Highlight**: Visual feedback for block selection
- **Break Progress**: Overlay showing break progress
- **Pixel Art Cursor**: Custom cursor design
- **Tooltips**: Item information on hover

### 🎵 Audio & Visuals
- **Background Music**: Title screen music
- **Particle Effects**: Block breaking particles
- **Smooth Camera**: Following system with drift
- **Retro Graphics**: Pixel-art style rendering
- **GPU Acceleration**: Hardware-accelerated rendering

### 📊 Performance & Debug
- **FPS Counter**: VSync FPS and Raw FPS display (F3)
- **Debug Stats**: Chunks, items, particles, animations
- **Memory Management**: Automatic cleanup of unused data
- **Optimized Rendering**: Efficient chunk and particle systems
- **Performance Limits**: Max 100 particles, 50 broken blocks, 20 animations

---

## 🎮 Controls

### Movement
| Key | Action |
|-----|--------|
| `W` / `↑` / `Space` | Jump |
| `A` / `←` | Move Left |
| `D` / `→` | Move Right |
| `Shift` (hold) | Sprint (2x speed) |

### Interaction
| Action | Control |
|--------|---------|
| Break Block | Left Click (hold) |
| Place Block | Right Click |
| Split Item Stack | Right Click (on inventory item) |
| Scroll Hotbar | Mouse Wheel |
| Select Hotbar Slot | Keys 1-6 |

### Interface
| Key | Action |
|-----|--------|
| `E` | Open/Close Inventory |
| `C` | Open/Close Crafting |
| `T` | Open Chat |
| `Enter` | Send Chat Message |
| `Escape` | Close UI |
| `F3` | Toggle Debug Info |

### Fly Mode (when enabled)
| Key | Action |
|-----|--------|
| `Space` | Fly Up |
| `Shift` | Fly Down |

---

## 🚀 Getting Started

### Clone Repository
```bash
git clone https://github.com/fynnsummers/brixel.git
cd brixel
```

### Start Local Server

**Python:**
```bash
python -m http.server 8000
```

**Node.js:**
```bash
npx http-server
```

**PHP:**
```bash
php -S localhost:8000
```

### Open in Browser
```
http://localhost:8000/index.html
```

---

## 📁 Project Structure

```
brixel/
├── assets/
│   ├── textures/          # Block textures
│   ├── tools/             # Tool textures
│   ├── ui/                # UI elements
│   ├── break/             # Break animations
│   ├── cursor.png
│   ├── title.png
│   └── homemc.mp3
│
├── css/
│   ├── style.css          # Game styles
│   └── load.css           # Loading screen styles
│
├── js/
│   ├── core/              # Core game logic
│   │   ├── config.js
│   │   ├── game.js
│   │   ├── items.js
│   │   └── utils.js
│   ├── entities/          # Game entities
│   │   ├── player.js
│   │   ├── itemDrops.js
│   │   └── particles.js
│   ├── rendering/         # Rendering systems
│   │   ├── renderer.js
│   │   ├── camera.js
│   │   └── dayNightCycle.js
│   ├── world/             # World generation
│   │   ├── world.js
│   │   ├── blockBreaker.js
│   │   └── blockPlacer.js
│   ├── ui/                # User interface
│   │   ├── inventory.js
│   │   ├── crafting.js
│   │   ├── recipes.js
│   │   ├── hotbar.js
│   │   ├── chat.js
│   │   ├── commands.js
│   │   └── health.js
│   └── screens/           # Game screens
│       ├── load.js
│       └── titleScreen.js
│
├── index.html             # Start screen
├── world.html             # Game screen
├── README.md
├── WIKI.md                # Game wiki
└── LICENSE.md             # MIT License
```

---

## ⚙️ Configuration

Located in: `js/core/config.js`

### World Settings
```javascript
BLOCK_SIZE: 32
CHUNK_WIDTH: 16
MIN_HEIGHT: 6
MAX_HEIGHT: 18
UNDERGROUND_DEPTH: 100
```

### Physics
```javascript
GRAVITY: 0.5
JUMP_FORCE: -8
MOVE_SPEED: 2
SPRINT_SPEED: 4
```

### Day-Night Cycle
```javascript
CYCLE_DURATION: 1060000  // ~17 minutes
NIGHT_DARKNESS: 0.3
SUNRISE_TIME: 0.2
SUNSET_TIME: 0.7
```

### Camera
```javascript
CAMERA_SMOOTH: 0.08
CAMERA_ZOOM: 2.5
```

---

## 📖 Documentation

For detailed information about blocks, items, tools, and game mechanics, see the [WIKI.md](WIKI.md).

---

## 🎯 Planned Features

- ✅ Crafting System
- ✅ Item Index
- ✅ Performance Optimizations
- ⬜ Mobs & Combat
- ⬜ More Biomes
- ⬜ Multiplayer
- ⬜ Save System
- ⬜ Structures
- ⬜ Weather System

---

## 🐛 Known Issues

No issues currently reported.

---

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

---

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md) for details

---

## 🙏 Acknowledgments

- Inspired by **Minecraft** and Terraria
- Built with **Vanilla JavaScript**
- Pixel-art textures
- Procedural generation algorithms

---

## 🔗 Links

- **Repository**: [github.com/fynnsummers/brixel](https://github.com/fynnsummers/brixel)
- **Wiki**: [WIKI.md](WIKI.md)
- **License**: [LICENSE.md](LICENSE.md)
- **Version**: Alpha 0.17 Dev

---

<p align="center">
Made by <strong>Fynn Summers, Kai, Finn</strong>
</p>






