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
        this.crafting = new Crafting();
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
            
            // Highlight nur wenn alle Overlays geschlossen sind
            if (!this.input.inventoryOpen && !this.input.craftingOpen) {
                this.renderer.updateHighlight(this.world, this.input.mouse, false, false);
            } else {
                this.renderer.updateHighlight(this.world, this.input.mouse, this.input.inventoryOpen, this.input.craftingOpen);
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
        
        // Inventory & Crafting Drag & Drop
        if (this.input.inventoryOpen || this.input.craftingOpen) {
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
                    let slotIndex = -1;
                    let craftingSlotIndex = -1;
                    
                    // Prüfe zuerst Inventar-Slots (nur wenn Inventar offen)
                    if (this.input.inventoryOpen) {
                        slotIndex = this.input.getInventorySlotAtMouse(invX, invY, invWidth, invHeight, this.renderer.textures['inventory']);
                    }
                    
                    // Wenn nicht im Inventar, prüfe Hotbar (immer verfügbar)
                    if (slotIndex < 0) {
                        slotIndex = this.input.getHotbarSlotAtMouse(hotbarX, hotbarY, hotbarWidth, hotbarHeight);
                    }
                    
                    // Wenn Crafting offen ist, prüfe auch Crafting-Slots für Drag-Start
                    if (slotIndex < 0 && this.input.craftingOpen) {
                        const craftScale = hotbarWidth / this.renderer.textures['craft'].width;
                        const craftWidth = this.renderer.textures['craft'].width * craftScale;
                        const craftHeight = this.renderer.textures['craft'].height * craftScale;
                        const craftX = (this.canvas.width - craftWidth) / 2;
                        const craftY = hotbarY - craftHeight - 20;
                        
                        craftingSlotIndex = this.input.getCraftingSlotAtMouse(craftX, craftY, craftWidth, craftHeight, craftScale);
                        
                        if (craftingSlotIndex >= 0) {
                            // Starte Drag von Crafting-Slot
                            const craftingItem = this.crafting.takeItem(craftingSlotIndex);
                            if (craftingItem) {
                                // Simuliere Inventory-Drag mit temporärem Slot
                                this.inventory.draggedSlot = -1000 - craftingSlotIndex; // Negative Werte für Crafting-Slots
                                this.inventory.draggedItem = craftingItem;
                                this.input.mouse.dragStarted = true;
                                console.log(`Started drag from crafting slot ${craftingSlotIndex}: ${craftingItem.item} x${craftingItem.count}`);
                            }
                        } else {
                            // Prüfe Result-Slot
                            const resultWidth = this.renderer.textures['craft-result'].width * craftScale;
                            const resultHeight = this.renderer.textures['craft-result'].height * craftScale;
                            const resultX = craftX + craftWidth;
                            const resultY = craftY;
                            const resultSlot = this.input.getCraftingResultSlotAtMouse(resultX, resultY, resultWidth, resultHeight, craftScale);
                            
                            if (resultSlot >= 0) {
                                // Starte Drag von Result-Slot - nimm das bereits berechnete Result
                                const currentResult = this.crafting.getResultSlot();
                                if (currentResult && currentResult.item && currentResult.count > 0) {
                                    // Nimm nur 1x das Rezept-Ergebnis (nicht alles)
                                    const recipe = this.crafting.selectedRecipe;
                                    if (recipe) {
                                        const singleCraftResult = {
                                            item: currentResult.item,
                                            count: recipe.result.count // Nur 1x Rezept-Ergebnis
                                        };
                                        
                                        // Entferne Items für 1x Crafting
                                        const actualCraftedItem = this.crafting.executeCraft(false); // Nur 1x craften
                                        
                                        if (actualCraftedItem) {
                                            // Simuliere Inventory-Drag mit Result-Slot-ID
                                            this.inventory.draggedSlot = -4000; // Spezielle ID für Result-Slot
                                            this.inventory.draggedItem = actualCraftedItem;
                                            this.input.mouse.dragStarted = true;
                                            console.log(`Started drag from result slot: ${actualCraftedItem.item} x${actualCraftedItem.count}`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Normale Inventory/Hotbar Drag
                    if (slotIndex >= 0 && craftingSlotIndex < 0) {
                        this.inventory.startDrag(slotIndex);
                        this.input.mouse.dragStarted = true;
                    }
                }
            }
            
            // Mouse Up - End Drag
            if (!this.input.mouse.isDown) {
                if (this.inventory.draggedSlot !== null) {
                    let targetSlot = -1;
                    let craftingTransfer = false;
                    
                    // Prüfe zuerst Inventar-Slots (nur wenn Inventar offen)
                    if (this.input.inventoryOpen) {
                        targetSlot = this.input.getInventorySlotAtMouse(invX, invY, invWidth, invHeight, this.renderer.textures['inventory']);
                    }
                    
                    // Wenn nicht im Inventar, prüfe Hotbar
                    if (targetSlot < 0) {
                        targetSlot = this.input.getHotbarSlotAtMouse(hotbarX, hotbarY, hotbarWidth, hotbarHeight);
                    }
                    
                    // Wenn Crafting offen ist, prüfe auch Crafting-Slots
                    if (targetSlot < 0 && this.input.craftingOpen) {
                        // Berechne Crafting-Overlay-Positionen
                        const craftScale = hotbarWidth / this.renderer.textures['craft'].width;
                        const craftWidth = this.renderer.textures['craft'].width * craftScale;
                        const craftHeight = this.renderer.textures['craft'].height * craftScale;
                        const craftX = (this.canvas.width - craftWidth) / 2;
                        const craftY = hotbarY - craftHeight - 20;
                        
                        // Prüfe Crafting-Grid-Slots (0-15)
                        const craftingSlot = this.input.getCraftingSlotAtMouse(craftX, craftY, craftWidth, craftHeight, craftScale);
                        
                        // Prüfe NICHT Result-Slot (Result-Slot ist verboten)
                        const resultWidth = this.renderer.textures['craft-result'].width * craftScale;
                        const resultHeight = this.renderer.textures['craft-result'].height * craftScale;
                        const resultX = craftX + craftWidth;
                        const resultY = craftY;
                        const resultSlot = this.input.getCraftingResultSlotAtMouse(resultX, resultY, resultWidth, resultHeight, craftScale);
                        
                        if (craftingSlot >= 0 && resultSlot === -1) {
                            // Gültiger Crafting-Grid-Slot - Transfer zu Crafting-System
                            const draggedItem = this.inventory.draggedItem;
                            const isDragFromCrafting = this.inventory.draggedSlot < -1000; // Crafting-Slots haben negative IDs
                            
                            if (draggedItem) {
                                if (this.crafting.tryPlaceItem(craftingSlot, draggedItem.item, draggedItem.count)) {
                                    // Erfolgreich zu Crafting transferiert
                                    if (isDragFromCrafting) {
                                        // Von Crafting zu Crafting - nur draggedItem löschen
                                        this.inventory.draggedSlot = null;
                                        this.inventory.draggedItem = null;
                                    } else {
                                        // Von Inventory/Hotbar zu Crafting - normale endDrag Logik
                                        this.inventory.draggedSlot = null;
                                        this.inventory.draggedItem = null;
                                    }
                                    craftingTransfer = true;
                                    console.log(`Transferred ${draggedItem.count}x ${draggedItem.item} to crafting slot ${craftingSlot}`);
                                } else {
                                    // Transfer fehlgeschlagen
                                    if (isDragFromCrafting) {
                                        // Zurück zu ursprünglichem Crafting-Slot
                                        const originalCraftingSlot = Math.abs(this.inventory.draggedSlot + 1000);
                                        this.crafting.tryPlaceItem(originalCraftingSlot, draggedItem.item, draggedItem.count);
                                        this.inventory.draggedSlot = null;
                                        this.inventory.draggedItem = null;
                                    } else {
                                        this.inventory.cancelDrag();
                                    }
                                    craftingTransfer = true;
                                }
                            }
                        } else if (resultSlot >= 0) {
                            // Result-Slot ist verboten - Cancel drag
                            console.log("Cannot drop items into result slot");
                            this.inventory.cancelDrag();
                            craftingTransfer = true;
                        }
                    }
                    
                    // Nur normale Inventar-Logik wenn kein Crafting-Transfer stattgefunden hat
                    if (!craftingTransfer) {
                        const isDragFromCrafting = this.inventory.draggedSlot < -1000;
                        const isDragFromResult = this.inventory.draggedSlot === -4000;
                        
                        if (isDragFromCrafting || isDragFromResult) {
                            // Drag von Crafting/Result zu Inventory/Hotbar
                            const draggedItem = this.inventory.draggedItem;
                            
                            if (targetSlot >= 0) {
                                // Versuche in Inventory/Hotbar zu platzieren
                                const targetSlotObj = this.inventory.getSlot(targetSlot);
                                
                                if (!targetSlotObj.item) {
                                    // Ziel-Slot ist leer
                                    targetSlotObj.item = draggedItem.item;
                                    targetSlotObj.count = draggedItem.count;
                                    this.inventory.draggedSlot = null;
                                    this.inventory.draggedItem = null;
                                    console.log(`Moved ${draggedItem.count}x ${draggedItem.item} from ${isDragFromResult ? 'result' : 'crafting'} to inventory slot ${targetSlot}`);
                                } else if (targetSlotObj.item === draggedItem.item) {
                                    // Gleicher Item-Typ - stacke
                                    const canAdd = 64 - targetSlotObj.count;
                                    const toAdd = Math.min(draggedItem.count, canAdd);
                                    targetSlotObj.count += toAdd;
                                    
                                    if (toAdd === draggedItem.count) {
                                        // Alle Items wurden hinzugefügt
                                        this.inventory.draggedSlot = null;
                                        this.inventory.draggedItem = null;
                                        console.log(`Stacked ${toAdd}x ${draggedItem.item} from ${isDragFromResult ? 'result' : 'crafting'} to inventory slot ${targetSlot}`);
                                    } else {
                                        // Nur teilweise hinzugefügt - reduziere draggedItem count
                                        this.inventory.draggedItem.count -= toAdd;
                                        console.log(`Partially stacked ${toAdd}x ${draggedItem.item}, ${this.inventory.draggedItem.count} remaining`);
                                    }
                                } else {
                                    // Anderer Item-Typ - kann nicht platzieren
                                    if (isDragFromResult) {
                                        // Result-Slot Items bleiben im Drag-Zustand
                                        console.log("Cannot place result item here, keeping in drag state");
                                    } else {
                                        // Normale Crafting-Items - tausche
                                        const tempItem = targetSlotObj.item;
                                        const tempCount = targetSlotObj.count;
                                        
                                        targetSlotObj.item = draggedItem.item;
                                        targetSlotObj.count = draggedItem.count;
                                        
                                        // Platziere das getauschte Item zurück ins Crafting
                                        const originalCraftingSlot = Math.abs(this.inventory.draggedSlot + 1000);
                                        this.crafting.tryPlaceItem(originalCraftingSlot, tempItem, tempCount);
                                        
                                        this.inventory.draggedSlot = null;
                                        this.inventory.draggedItem = null;
                                        console.log(`Swapped items between crafting and inventory slot ${targetSlot}`);
                                    }
                                }
                            } else {
                                // Außerhalb aller Slots
                                if (isDragFromResult) {
                                    // Result-Slot Items bleiben im Drag-Zustand, werden nicht gedroppt
                                    console.log("Result item dropped outside slots, keeping in drag state");
                                } else {
                                    // Normale Crafting-Items - droppe mit Wurfbogen
                                    const droppedItem = draggedItem;
                                    this.inventory.draggedSlot = null;
                                    this.inventory.draggedItem = null;
                                    
                                    // Drop logic (gleich wie normale Drops)
                                    const playerCenterX = this.player.x + this.player.width / 2;
                                    const playerCenterY = this.player.y + this.player.height / 2;
                                    const startX = playerCenterX + (Math.random() - 0.5) * 20;
                                    const startY = playerCenterY + (Math.random() - 0.5) * 20;
                                    
                                    const mouseWorldX = (this.input.mouse.x / this.camera.zoom) + this.camera.x;
                                    const mouseWorldY = (this.input.mouse.y / this.camera.zoom) + this.camera.y;
                                    
                                    const dirX = mouseWorldX - playerCenterX;
                                    const dirY = mouseWorldY - playerCenterY;
                                    const distance = Math.sqrt(dirX * dirX + dirY * dirY);
                                    
                                    let normalizedDirX = distance > 0 ? dirX / distance : 1;
                                    let normalizedDirY = distance > 0 ? dirY / distance : 0;
                                    
                                    const throwSpeed = 8;
                                    const throwVelocity = {
                                        vx: normalizedDirX * throwSpeed,
                                        vy: normalizedDirY * throwSpeed - 3
                                    };
                                    
                                    for (let i = 0; i < droppedItem.count; i++) {
                                        const variation = {
                                            vx: throwVelocity.vx + (Math.random() - 0.5) * 1,
                                            vy: throwVelocity.vy + (Math.random() - 0.5) * 1
                                        };
                                        this.itemDrops.createDrop(startX, startY, droppedItem.item, true, variation);
                                    }
                                    console.log(`Dropped ${droppedItem.count}x ${droppedItem.item} from crafting`);
                                }
                            }
                        } else {
                            // Normale Inventory/Hotbar Drag-Logik
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
                    }
                }
                this.input.mouse.dragStarted = false;
                this.input.mouse.resultClickProcessed = false; // Reset Result-Click Flag
            }
            
            // Result-Slot Click-to-Hotbar (auch wenn bereits Result-Slot Item gedraggt wird)
            if (this.input.craftingOpen && this.input.mouse.isDown && !this.input.mouse.dragStarted && !this.input.mouse.resultClickProcessed) {
                // Erlaube Klick auch wenn bereits Result-Slot Item gedraggt wird
                const allowClick = !this.inventory.draggedSlot || this.inventory.draggedSlot === -4000;
                const hotbarScale = 1.5;
                const hotbarWidth = this.renderer.textures[this.hotbar.getHotbarTextureName()].width * hotbarScale;
                const craftScale = hotbarWidth / this.renderer.textures['craft'].width;
                const craftWidth = this.renderer.textures['craft'].width * craftScale;
                const craftHeight = this.renderer.textures['craft'].height * craftScale;
                const craftX = (this.canvas.width - craftWidth) / 2;
                const hotbarHeight = this.renderer.textures[this.hotbar.getHotbarTextureName()].height * hotbarScale;
                const hotbarY = this.canvas.height - hotbarHeight - 20;
                const craftY = hotbarY - craftHeight - 20;
                
                const resultWidth = this.renderer.textures['craft-result'].width * craftScale;
                const resultHeight = this.renderer.textures['craft-result'].height * craftScale;
                const resultX = craftX + craftWidth;
                const resultY = craftY;
                const resultSlot = this.input.getCraftingResultSlotAtMouse(resultX, resultY, resultWidth, resultHeight, craftScale);
                
                if (resultSlot >= 0 && allowClick) {
                    // Markiere dass Result-Klick verarbeitet wurde (verhindert mehrfache Ausführung)
                    this.input.mouse.resultClickProcessed = true;
                    
                    // Click auf Result-Slot - prüfe Shift für "Craft All"
                    const craftAll = this.input.keys['Shift']; // Shift gedrückt = alles craften
                    const resultItem = this.crafting.executeCraft(craftAll);
                    if (resultItem) {
                        // Prüfe ob bereits ein Result-Slot Item gedraggt wird
                        if (this.inventory.draggedSlot === -4000 && this.inventory.draggedItem) {
                            // Füge zu bereits gedraggertem Item hinzu (wenn gleicher Typ)
                            if (this.inventory.draggedItem.item === resultItem.item) {
                                this.inventory.draggedItem.count += resultItem.count;
                                console.log(`Added ${resultItem.count}x ${resultItem.item} to existing dragged item, total: ${this.inventory.draggedItem.count}`);
                                return; // Früher Ausstieg - keine weitere Verarbeitung
                            } else {
                                console.log("Cannot combine different item types in drag");
                                return; // Verschiedene Item-Typen können nicht kombiniert werden
                            }
                        }
                        
                        console.log(`Trying to add ${resultItem.count}x ${resultItem.item} to inventory (craftAll: ${craftAll})`);
                        
                        // Versuche Items zur Hotbar hinzuzufügen
                        let remaining = resultItem.count;
                        
                        // Erst versuchen zu bestehenden Stacks hinzuzufügen (Hotbar)
                        for (let i = 0; i < 6 && remaining > 0; i++) {
                            const hotbarSlot = this.inventory.getSlot(i);
                            if (hotbarSlot.item === resultItem.item && hotbarSlot.count < 64) {
                                // Gleicher Item-Typ - stacke
                                const canAdd = 64 - hotbarSlot.count;
                                const toAdd = Math.min(remaining, canAdd);
                                hotbarSlot.count += toAdd;
                                remaining -= toAdd;
                                console.log(`Added ${toAdd}x ${resultItem.item} to existing hotbar stack ${i}, remaining: ${remaining}`);
                            }
                        }
                        
                        // Dann leere Slots in Hotbar füllen
                        for (let i = 0; i < 6 && remaining > 0; i++) {
                            const hotbarSlot = this.inventory.getSlot(i);
                            if (!hotbarSlot.item) {
                                // Leerer Slot - fülle mit maximal 64 Items
                                const toAdd = Math.min(remaining, 64);
                                hotbarSlot.item = resultItem.item;
                                hotbarSlot.count = toAdd;
                                remaining -= toAdd;
                                console.log(`Added ${toAdd}x ${resultItem.item} to empty hotbar slot ${i}, remaining: ${remaining}`);
                            }
                        }
                        
                        // Wenn noch Items übrig sind, versuche sie ins Inventar zu legen (nur wenn Inventar offen)
                        if (remaining > 0 && this.input.inventoryOpen) {
                            // Erst zu bestehenden Stacks hinzufügen (Inventar)
                            for (let i = 6; i < this.inventory.slots.length && remaining > 0; i++) {
                                const invSlot = this.inventory.getSlot(i);
                                if (invSlot.item === resultItem.item && invSlot.count < 64) {
                                    const canAdd = 64 - invSlot.count;
                                    const toAdd = Math.min(remaining, canAdd);
                                    invSlot.count += toAdd;
                                    remaining -= toAdd;
                                    console.log(`Added ${toAdd}x ${resultItem.item} to existing inventory stack ${i}, remaining: ${remaining}`);
                                }
                            }
                            
                            // Dann leere Slots im Inventar füllen
                            for (let i = 6; i < this.inventory.slots.length && remaining > 0; i++) {
                                const invSlot = this.inventory.getSlot(i);
                                if (!invSlot.item) {
                                    const toAdd = Math.min(remaining, 64);
                                    invSlot.item = resultItem.item;
                                    invSlot.count = toAdd;
                                    remaining -= toAdd;
                                    console.log(`Added ${toAdd}x ${resultItem.item} to empty inventory slot ${i}, remaining: ${remaining}`);
                                }
                            }
                        }
                        
                        // Wenn immer noch Items übrig sind, droppe sie mit Wurfbogen
                        if (remaining > 0) {
                            const playerCenterX = this.player.x + this.player.width / 2;
                            const playerCenterY = this.player.y + this.player.height / 2;
                            
                            // Berechne Richtung zur Maus (gleiche Logik wie beim normalen Droppen)
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
                            const startX = playerCenterX + (Math.random() - 0.5) * 20;
                            const startY = playerCenterY + (Math.random() - 0.5) * 20;
                            
                            // Wurfgeschwindigkeit: Immer mit Aufwärtsbogen
                            const throwSpeed = 8; // Stärke des Wurfs
                            const throwVelocity = {
                                vx: normalizedDirX * throwSpeed,
                                vy: normalizedDirY * throwSpeed - 3 // -3 für stärkeren Aufwärtsbogen
                            };
                            
                            // Droppe alle Items aus dem Stack mit Wurfbogen
                            for (let i = 0; i < remaining; i++) {
                                // Kleine zufällige Variation für jeden Item-Drop
                                const variation = {
                                    vx: throwVelocity.vx + (Math.random() - 0.5) * 1,
                                    vy: throwVelocity.vy + (Math.random() - 0.5) * 1
                                };
                                this.itemDrops.createDrop(startX, startY, resultItem.item, true, variation);
                            }
                            
                            console.log(`Dropped ${remaining}x ${resultItem.item} from result slot with throwing arc`);
                        }
                        
                        console.log(`Crafted ${resultItem.count}x ${resultItem.item}, ${remaining} items remaining after inventory placement`);
                    }
                }
            }
        } else {
            // Inventar und Crafting geschlossen - cancel drag (außer für Result-Slot Items)
            if (this.inventory.draggedSlot !== null) {
                if (this.inventory.draggedSlot === -4000) {
                    // Result-Slot Items bleiben auch bei geschlossenen Overlays erhalten
                    console.log("Overlays closed but keeping result item in drag state");
                } else {
                    this.inventory.cancelDrag();
                }
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
        this.renderer.render(this.world, this.player, this.camera, this.input.mouse, this.blockBreaker, this.particleSystem, this.hotbar, this.health, this.itemDrops, this.inventory, this.input, this.chat, this.crafting);
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