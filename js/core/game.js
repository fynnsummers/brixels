// Haupt-Spiel-Logik

class Game {
    constructor() {
        this.canvas = document.getElementById('terrain');
        this.setupCanvas();
        
        this.world = new World();
        this.player = new Player(100, 0);
        this.camera = new Camera();
        this.hotbar = new Hotbar();
        this.health = new HealthSystem(this.player);
        this.inventory = new Inventory();
        this.itemDrops = new ItemDrops();
        this.chat = new Chat();
        this.input = new InputHandler(this.hotbar, this.camera);
        this.renderer = new Renderer(this.canvas);
        this.blockBreaker = new BlockBreaker();
        this.blockPlacer = new BlockPlacer();
        this.particleSystem = new ParticleSystem();
        this.commandHandler = new CommandHandler(this);
        
        this.lastTime = Date.now();
        this.spawnX = 100;
        this.spawnY = 0;
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    async init() {
        await this.renderer.loadTextures();
        await this.blockBreaker.loadBreakFrames();
        console.log('Spiel gestartet!');
        
        // Chat Keyboard Handler
        window.addEventListener('keydown', (e) => {
            if (this.input.chatOpen) {
                e.preventDefault();
                
                // Prüfe ob Input-Delay noch aktiv ist
                if (!this.chat.canAcceptInput()) {
                    // Ignoriere alle Eingaben während der Verzögerung
                    return;
                }
                
                if (e.key === 'Enter') {
                    if (this.chat.inputText.trim().length > 0) {
                        const message = this.chat.inputText.trim();
                        
                        // Prüfe ob es ein Command ist
                        if (message.startsWith('/')) {
                            this.commandHandler.execute(message);
                        } else {
                            // Normale Chat-Nachricht
                            this.chat.sendMessage(message);
                        }
                        
                        this.chat.inputText = '';
                        this.chat.cursorPosition = 0;
                    }
                    
                    // Enter schließt den Chat
                    this.input.chatOpen = false;
                } else if (e.key === 'Escape') {
                    // Escape schließt den Chat
                    this.input.chatOpen = false;
                    this.chat.inputText = '';
                    this.chat.cursorPosition = 0;
                } else if (e.key === 'Backspace') {
                    if (this.chat.cursorPosition > 0) {
                        this.chat.inputText = this.chat.inputText.slice(0, this.chat.cursorPosition - 1) + this.chat.inputText.slice(this.chat.cursorPosition);
                        this.chat.cursorPosition--;
                    }
                } else if (e.key === 'Delete') {
                    if (this.chat.cursorPosition < this.chat.inputText.length) {
                        this.chat.inputText = this.chat.inputText.slice(0, this.chat.cursorPosition) + this.chat.inputText.slice(this.chat.cursorPosition + 1);
                    }
                } else if (e.key === 'ArrowLeft') {
                    if (this.chat.cursorPosition > 0) {
                        this.chat.cursorPosition--;
                    }
                } else if (e.key === 'ArrowRight') {
                    if (this.chat.cursorPosition < this.chat.inputText.length) {
                        this.chat.cursorPosition++;
                    }
                } else if (e.key === 'Home') {
                    this.chat.cursorPosition = 0;
                } else if (e.key === 'End') {
                    this.chat.cursorPosition = this.chat.inputText.length;
                } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
                    // Alle einzelnen Zeichen erlaubt (nach Verzögerung)
                    if (this.chat.inputText.length < 50) {
                        this.chat.inputText = this.chat.inputText.slice(0, this.chat.cursorPosition) + e.key + this.chat.inputText.slice(this.chat.cursorPosition);
                        this.chat.cursorPosition++;
                    }
                }
            }
        });
        
        // Spawn Player auf Oberfläche - suche von oben nach unten
        let foundSurface = false;
        for (let y = 0; y < CONFIG.WORLD_HEIGHT * CONFIG.BLOCK_SIZE; y += CONFIG.BLOCK_SIZE) {
            const blockBelow = this.world.getBlockAt(this.player.x + this.player.width / 2, y + CONFIG.BLOCK_SIZE, false);
            const blockAtPos = this.world.getBlockAt(this.player.x + this.player.width / 2, y, false);
            
            // Finde ersten festen Block (nicht Grass) mit Luft darüber
            if (blockBelow && !blockAtPos) {
                this.player.y = y - this.player.height;
                this.spawnX = this.player.x;
                this.spawnY = this.player.y;
                foundSurface = true;
                console.log(`Player spawned at Y: ${this.player.y}, Block Y: ${Math.floor(y / CONFIG.BLOCK_SIZE)}`);
                break;
            }
        }
        
        if (!foundSurface) {
            console.warn('No surface found for spawn!');
            this.player.y = 0;
            this.spawnX = this.player.x;
            this.spawnY = this.player.y;
        }
        
        // Input für Sprung
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                this.player.jump();
            }
        });
        
        this.gameLoop();
    }
    
    update() {
        const now = Date.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;
        
        // Update Tag-Nacht-Zyklus
        this.renderer.updateDayNightCycle(deltaTime);
        
        // Synchronisiere Chat-Status mit Input
        if (this.input.chatOpen && !this.chat.isOpen) {
            this.chat.open();
        } else if (!this.input.chatOpen && this.chat.isOpen) {
            this.chat.close();
        }
        
        // Prüfe auf Respawn
        if (this.health.shouldRespawn()) {
            this.health.respawn(this.spawnX, this.spawnY);
        }
        
        // Nur updaten wenn am Leben
        if (this.health.isAlive()) {
            this.player.update(this.input.keys, this.world);
            
            // Update Player Animation
            this.player.updateAnimation(deltaTime);
            
            // Prüfe Fallschaden
            const fallDamage = this.player.getFallDamage();
            if (fallDamage > 0) {
                this.health.takeDamage(fallDamage);
            }
            
            this.camera.update(this.player, this.canvas.width, this.canvas.height);
            this.input.updateMouse(this.camera, this.player, this.world, this.inventory, this.hotbar, this.blockPlacer);
            
            // Highlight nur wenn Inventar geschlossen ist
            if (!this.input.inventoryOpen) {
                this.renderer.updateHighlight(this.world, this.input.mouse, false);
            } else {
                this.renderer.updateHighlight(this.world, this.input.mouse, true);
            }
            
            this.hotbar.update();
            
            // Block Breaking Update (nur wenn in Range)
            if (this.input.mouse.inRange) {
                // Hole das gehaltene Item
                const selectedSlot = this.hotbar.getSelectedSlot();
                const slot = this.inventory.getSlot(selectedSlot);
                const heldItem = slot.item;
                
                const brokenBlock = this.blockBreaker.update(this.input.mouse, this.world, heldItem);
                if (brokenBlock) {
                    // Erstelle Item-Drop
                    this.itemDrops.createDrop(brokenBlock.x, brokenBlock.y, brokenBlock.blockType);
                    
                    // Erstelle Partikel für den zerstörten Block
                    this.particleSystem.createBlockBreakParticles(
                        brokenBlock.x, 
                        brokenBlock.y, 
                        brokenBlock.blockType,
                        this.renderer.textures
                    );
                    
                    // Wenn dirt-grass, erstelle auch Partikel für grass darüber
                    if (brokenBlock.blockType === 'dirt-grass') {
                        const grassAbove = this.world.getBlockAtCoords(brokenBlock.x, brokenBlock.y - 1);
                        if (grassAbove === 'grass') {
                            this.itemDrops.createDrop(brokenBlock.x, brokenBlock.y - 1, 'grass');
                            this.particleSystem.createBlockBreakParticles(
                                brokenBlock.x, 
                                brokenBlock.y - 1, 
                                'grass',
                                this.renderer.textures
                            );
                        }
                    }
                    
                    this.world.breakBlock(brokenBlock.x, brokenBlock.y, brokenBlock.blockType);
                }
            } else {
                // Außerhalb der Range - stoppe Breaking
                this.blockBreaker.stopBreaking();
            }
            
            // Block Placement Update
            const placedBlock = this.blockPlacer.tryPlaceBlock(this.input.mouse, this.world, this.inventory, this.hotbar, this.player, this.input);
            if (placedBlock) {
                console.log(`Placed ${placedBlock.blockType} at ${placedBlock.x}, ${placedBlock.y}`);
            }
        } else {
            // Inventar offen - stoppe Breaking
            this.blockBreaker.stopBreaking();
        }
        
        // Inventar Drag & Drop
        if (this.input.inventoryOpen) {
            // Berechne Inventar-Position
            const hotbarScale = 1.5;
            const hotbarWidth = this.renderer.textures[this.hotbar.getHotbarTextureName()].width * hotbarScale;
            const invScale = hotbarWidth / this.renderer.textures['inventory'].width;
            const invWidth = this.renderer.textures['inventory'].width * invScale;
            const invHeight = this.renderer.textures['inventory'].height * invScale;
            const invX = (this.canvas.width - invWidth) / 2;
            const hotbarHeight = this.renderer.textures[this.hotbar.getHotbarTextureName()].height * hotbarScale;
            const hotbarY = this.canvas.height - hotbarHeight - 20;
            const invY = hotbarY - invHeight - 20;
            const hotbarX = (this.canvas.width - hotbarWidth) / 2;
            
            // Mouse Down - Start Drag
            if (this.input.mouse.isDown && this.inventory.draggedSlot === null) {
                if (!this.input.mouse.dragStarted) {
                    // Prüfe zuerst Inventar-Slots
                    let slotIndex = this.input.getInventorySlotAtMouse(invX, invY, invWidth, invHeight, this.renderer.textures['inventory']);
                    
                    // Wenn nicht im Inventar, prüfe Hotbar
                    if (slotIndex < 0) {
                        slotIndex = this.input.getHotbarSlotAtMouse(hotbarX, hotbarY, hotbarWidth, hotbarHeight);
                    }
                    
                    if (slotIndex >= 0) {
                        this.inventory.startDrag(slotIndex);
                        this.input.mouse.dragStarted = true;
                    }
                }
            }
            
            // Mouse Up - End Drag
            if (!this.input.mouse.isDown) {
                if (this.inventory.draggedSlot !== null) {
                    // Prüfe zuerst Inventar-Slots
                    let targetSlot = this.input.getInventorySlotAtMouse(invX, invY, invWidth, invHeight, this.renderer.textures['inventory']);
                    
                    // Wenn nicht im Inventar, prüfe Hotbar
                    if (targetSlot < 0) {
                        targetSlot = this.input.getHotbarSlotAtMouse(hotbarX, hotbarY, hotbarWidth, hotbarHeight);
                    }
                    
                    const droppedItem = this.inventory.endDrag(targetSlot);
                    
                    // Wenn Item gedroppt werden soll (außerhalb des Inventars)
                    if (droppedItem) {
                        // Berechne Drop-Position und Wurfrichtung
                        const playerCenterX = this.player.x + this.player.width / 2;
                        const playerCenterY = this.player.y + this.player.height / 2;
                        
                        // Berechne Richtung zur Maus
                        const mouseWorldX = (this.input.mouse.x / this.camera.zoom) + this.camera.x;
                        const mouseWorldY = (this.input.mouse.y / this.camera.zoom) + this.camera.y;
                        
                        const dirX = mouseWorldX - playerCenterX;
                        const dirY = mouseWorldY - playerCenterY;
                        const distance = Math.sqrt(dirX * dirX + dirY * dirY);
                        
                        // Normalisiere Richtung
                        let normalizedDirX = distance > 0 ? dirX / distance : 1;
                        let normalizedDirY = distance > 0 ? dirY / distance : 0;
                        
                        // Begrenze vertikale Richtung: Immer mindestens 30% horizontal
                        // und maximal 45 Grad nach unten (für Bogen-Effekt)
                        if (Math.abs(normalizedDirY) > 0.7) {
                            // Zu steil - korrigiere auf maximal 45 Grad
                            const sign = normalizedDirY > 0 ? 1 : -1;
                            normalizedDirY = 0.7 * sign;
                            normalizedDirX = Math.sqrt(1 - normalizedDirY * normalizedDirY) * (normalizedDirX >= 0 ? 1 : -1);
                        }
                        
                        // Start-Position: Direkt beim Spieler
                        const startX = Math.floor(playerCenterX / CONFIG.BLOCK_SIZE);
                        const startY = Math.floor(playerCenterY / CONFIG.BLOCK_SIZE);
                        
                        // Wurfgeschwindigkeit: Immer mit Aufwärtsbogen
                        const throwSpeed = 8; // Stärke des Wurfs
                        const throwVelocity = {
                            vx: normalizedDirX * throwSpeed,
                            vy: normalizedDirY * throwSpeed - 3 // -3 für stärkeren Aufwärtsbogen
                        };
                        
                        // Droppe alle Items aus dem Stack mit Wurfbogen
                        for (let i = 0; i < droppedItem.count; i++) {
                            // Kleine zufällige Variation für jeden Item-Drop
                            const variation = {
                                vx: throwVelocity.vx + (Math.random() - 0.5) * 1,
                                vy: throwVelocity.vy + (Math.random() - 0.5) * 1
                            };
                            this.itemDrops.createDrop(startX, startY, droppedItem.item, true, variation);
                        }
                        
                        console.log(`Threw ${droppedItem.count}x ${droppedItem.item} in direction (${normalizedDirX.toFixed(2)}, ${normalizedDirY.toFixed(2)})`);
                    }
                }
                this.input.mouse.dragStarted = false;
            }
        } else {
            // Inventar geschlossen - cancel drag
            if (this.inventory.draggedSlot !== null) {
                this.inventory.cancelDrag();
            }
            this.input.mouse.dragStarted = false;
        }
        
        // Update Health System
        this.health.update(deltaTime);
        
        // Update Chat
        this.chat.update(deltaTime);
        
        // Chat-Scroll
        if (this.input.chatOpen && this.input.chatScrollDelta !== 0) {
            this.chat.scroll(this.input.chatScrollDelta);
            this.input.chatScrollDelta = 0;
        }
        
        // Update Break Animations
        this.world.updateAnimations();
        
        // Verarbeite Tree Collapse Drops
        const treeDrops = this.world.getTreeCollapseDrops();
        for (let drop of treeDrops) {
            // Erstelle Item-Drop
            this.itemDrops.createDrop(drop.x, drop.y, drop.type);
            
            // Erstelle Partikel
            this.particleSystem.createBlockBreakParticles(
                drop.x,
                drop.y,
                drop.type,
                this.renderer.textures
            );
        }
        
        // Update Partikel
        this.particleSystem.update();
        
        // Update Item Drops
        this.itemDrops.update(this.world, this.player, this.inventory);
    }
    
    render() {
        this.renderer.render(this.world, this.player, this.camera, this.input.mouse, this.blockBreaker, this.particleSystem, this.hotbar, this.health, this.itemDrops, this.inventory, this.input, this.chat);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Spiel starten
const game = new Game();
game.init();