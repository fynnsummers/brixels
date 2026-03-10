// Input-Handler

class InputHandler {
    constructor(hotbar, camera) {
        this.keys = {};
        this.hotbar = hotbar;
        this.camera = camera; // Kamera-Referenz für Zoom
        this.inventoryOpen = false; // Inventar-Status
        this.craftingOpen = false; // Crafting-Status
        this.chatOpen = false; // Chat-Status
        this.pauseOpen = false; // Pause-Menü-Status
        this.pauseLeaveButton = null; // Leave-Button Position
        this.chatScrollDelta = 0; // Chat-Scroll-Delta
        this.debugMode = false; // Debug-Modus (F3)
        this.mouse = {
            x: 0,
            y: 0,
            clickX: 0,
            clickY: 0,
            worldX: 0,
            worldY: 0,
            blockX: 0,
            blockY: 0,
            isDown: false,
            isRightDown: false,
            dragStarted: false,
            inRange: true,
            hasBlockInSlot: false, // Ob ein Block im ausgewählten Slot ist
            canBuild: false, // Ob man an dieser Stelle bauen kann
            shakeOffset: { x: 0, y: 0 },
            shakeIntensity: 0,
            flashRed: 0,
            cursorAlpha: 1, // Für smooth Transition
            targetCursorAlpha: 1
        };
        
        this.setupListeners();
    }
    
    setupListeners() {
        // Verhindere Kontext-Menü global
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        }, false);
        
        window.addEventListener('keydown', (e) => {
            // T-Taste für Chat (vor keys-Registrierung prüfen)
            if (e.key.toLowerCase() === 't' && !this.chatOpen && !this.inventoryOpen && !this.craftingOpen) {
                // Schließe andere Overlays
                this.inventoryOpen = false;
                this.craftingOpen = false;
                this.pauseOpen = false;
                this.chatOpen = true;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            // Escape schließt Chat, Inventar, Crafting oder öffnet/schließt Pause
            if (e.key === 'Escape') {
                if (this.chatOpen) {
                    this.chatOpen = false;
                    e.preventDefault();
                    return;
                } else if (this.inventoryOpen) {
                    this.inventoryOpen = false;
                    e.preventDefault();
                    return;
                } else if (this.craftingOpen) {
                    this.craftingOpen = false;
                    e.preventDefault();
                    return;
                } else {
                    // Toggle Pause-Menü (schließe andere Overlays)
                    if (!this.pauseOpen) {
                        this.inventoryOpen = false;
                        this.craftingOpen = false;
                        this.chatOpen = false;
                    }
                    this.pauseOpen = !this.pauseOpen;
                    e.preventDefault();
                    return;
                }
            }
            
            // Wenn Chat oder Pause offen, keine anderen Keys registrieren (außer E und C)
            if (this.chatOpen || this.pauseOpen) {
                // E und C sind immer erlaubt
                if (e.key.toLowerCase() === 'e') {
                    // Schließe andere Overlays
                    this.craftingOpen = false;
                    this.chatOpen = false;
                    this.pauseOpen = false;
                    this.inventoryOpen = !this.inventoryOpen;
                    e.preventDefault();
                    return;
                }
                if (e.key.toLowerCase() === 'c') {
                    // Schließe andere Overlays
                    this.inventoryOpen = false;
                    this.chatOpen = false;
                    this.pauseOpen = false;
                    this.craftingOpen = !this.craftingOpen;
                    e.preventDefault();
                    return;
                }
                return;
            }
            
            // Pfeiltasten für Zoom (nur wenn Chat/Inventar/Crafting geschlossen)
            if (e.key === 'ArrowUp' && !this.inventoryOpen && !this.craftingOpen) {
                this.camera.zoomIn();
                e.preventDefault();
                return;
            }
            
            if (e.key === 'ArrowDown' && !this.inventoryOpen && !this.craftingOpen) {
                this.camera.zoomOut();
                e.preventDefault();
                return;
            }
            
            // F3 für Debug-Modus
            if (e.key === 'F3') {
                this.debugMode = !this.debugMode;
                e.preventDefault();
                return;
            }
            
            this.keys[e.key.toLowerCase()] = true;
            
            // E-Taste für Inventar
            if (e.key.toLowerCase() === 'e') {
                // Schließe andere Overlays
                this.craftingOpen = false;
                this.chatOpen = false;
                this.pauseOpen = false;
                this.inventoryOpen = !this.inventoryOpen;
                e.preventDefault();
            }
            
            // C-Taste für Crafting
            if (e.key.toLowerCase() === 'c') {
                // Schließe andere Overlays
                this.inventoryOpen = false;
                this.chatOpen = false;
                this.pauseOpen = false;
                this.craftingOpen = !this.craftingOpen;
                e.preventDefault();
            }
            
            // Zahlen 1-6 für direkte Slot-Auswahl
            const num = parseInt(e.key);
            if (num >= 1 && num <= 6) {
                this.hotbar.selectSlot(num - 1);
            }
        });
        
        window.addEventListener('keyup', (e) => {
            // Wenn Chat oder Pause offen, keine Keys registrieren
            if (this.chatOpen || this.pauseOpen) {
                return;
            }
            this.keys[e.key.toLowerCase()] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Linke Maustaste
                this.mouse.isDown = true;
                this.mouse.clickX = e.clientX;
                this.mouse.clickY = e.clientY;
                
                // Prüfe Pause-Menü Leave Button
                if (this.pauseOpen && this.pauseLeaveButton) {
                    const btn = this.pauseLeaveButton;
                    if (this.mouse.x >= btn.x && this.mouse.x <= btn.x + btn.width &&
                        this.mouse.y >= btn.y && this.mouse.y <= btn.y + btn.height) {
                        // Zurück zu load.html
                        window.location.href = 'load.html';
                        return;
                    }
                }
                
                // Wenn außerhalb der Range, trigger Shake (nur wenn nicht pausiert)
                if (!this.mouse.inRange && !this.pauseOpen) {
                    this.triggerShake();
                }
            } else if (e.button === 2) { // Rechte Maustaste
                this.mouse.isRightDown = true;
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.isDown = false;
            } else if (e.button === 2) {
                this.mouse.isRightDown = false;
            }
        });
        
        // Mausrad für Hotbar-Wechsel und Chat-Scroll
        window.addEventListener('wheel', (e) => {
            // Chat-Scroll wenn Chat offen
            if (this.chatOpen) {
                e.preventDefault();
                // Scroll-Richtung umkehren für natürliches Gefühl
                const scrollDelta = e.deltaY > 0 ? 1 : -1;
                // Chat-Scroll wird in game.js gehandhabt
                this.chatScrollDelta = scrollDelta;
                return;
            }
            
            e.preventDefault();
            
            if (e.deltaY < 0) {
                // Scroll up
                this.hotbar.scrollUp();
            } else if (e.deltaY > 0) {
                // Scroll down
                this.hotbar.scrollDown();
            }
        }, { passive: false });
    }
    
    triggerShake() {
        this.mouse.shakeIntensity = 1;
        this.mouse.flashRed = 1.5; // Stärker für bessere Sichtbarkeit
    }
    
    updateMouse(camera, player, world, inventory, hotbar, blockPlacer) {
        // Berechne Welt-Koordinaten
        this.mouse.worldX = (this.mouse.x / camera.zoom) + camera.x;
        this.mouse.worldY = (this.mouse.y / camera.zoom) + camera.y;
        
        // Berechne Block-Position
        this.mouse.blockX = Math.floor(this.mouse.worldX / CONFIG.BLOCK_SIZE);
        this.mouse.blockY = Math.floor(this.mouse.worldY / CONFIG.BLOCK_SIZE);
        
        // Prüfe Reichweite zum Player
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const blockCenterX = (this.mouse.blockX + 0.5) * CONFIG.BLOCK_SIZE;
        const blockCenterY = (this.mouse.blockY + 0.5) * CONFIG.BLOCK_SIZE;
        
        const distanceInBlocks = Math.sqrt(
            Math.pow((blockCenterX - playerCenterX) / CONFIG.BLOCK_SIZE, 2) +
            Math.pow((blockCenterY - playerCenterY) / CONFIG.BLOCK_SIZE, 2)
        );
        
        this.mouse.inRange = distanceInBlocks <= CONFIG.BREAK_RANGE;
        
        // Prüfe ob man einen Bau-Block im Slot hat
        const selectedSlot = hotbar.getSelectedSlot();
        const slot = inventory.getSlot(selectedSlot);
        this.mouse.hasBlockInSlot = (slot.item && slot.count > 0);
        
        // Prüfe ob man bauen kann (hat Item im Slot und Position ist gültig)
        this.mouse.canBuild = false;
        
        if (this.mouse.hasBlockInSlot && this.mouse.inRange) {
            // Prüfe ob Platzierung möglich wäre
            this.mouse.canBuild = blockPlacer.canPlaceBlock(
                slot.item, 
                this.mouse.blockX, 
                this.mouse.blockY, 
                world, 
                player
            );
        }
        
        // Smooth Cursor Alpha Transition
        if (this.mouse.flashRed > 0) {
            this.mouse.targetCursorAlpha = 0.6; // Blocked cursor alpha
        } else if (!this.mouse.inRange) {
            this.mouse.targetCursorAlpha = 0.4; // Out of range alpha
        } else {
            this.mouse.targetCursorAlpha = 1; // Normal alpha
        }
        
        // Smooth interpolation
        this.mouse.cursorAlpha += (this.mouse.targetCursorAlpha - this.mouse.cursorAlpha) * 0.15;
        
        // Update Shake (etwas langsamer)
        if (this.mouse.shakeIntensity > 0) {
            this.mouse.shakeOffset.x = (Math.random() - 0.5) * 10 * this.mouse.shakeIntensity;
            this.mouse.shakeOffset.y = (Math.random() - 0.5) * 10 * this.mouse.shakeIntensity;
            this.mouse.shakeIntensity *= 0.90; // Langsamer Decay für längere Animation
            
            if (this.mouse.shakeIntensity < 0.01) {
                this.mouse.shakeIntensity = 0;
                this.mouse.shakeOffset.x = 0;
                this.mouse.shakeOffset.y = 0;
            }
        }
        
        // Update Red Flash (etwas langsamer)
        if (this.mouse.flashRed > 0) {
            this.mouse.flashRed *= 0.92; // Langsamer Decay
            if (this.mouse.flashRed < 0.01) {
                this.mouse.flashRed = 0;
            }
        }
    }
    
    getInventorySlotAtMouse(invX, invY, invWidth, invHeight, invTexture) {
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y;
        
        // Prüfe ob Maus über Inventar ist
        if (mouseX < invX || mouseX > invX + invWidth || mouseY < invY || mouseY > invY + invHeight) {
            return -1;
        }
        
        // Slot-Berechnung mit Config
        const grid = CONFIG.INVENTORY_GRID;
        const scale = invWidth / invTexture.width; // Dynamische Berechnung basierend auf Textur
        
        const relativeX = mouseX - invX;
        const relativeY = mouseY - invY;
        
        // Berechne Spalte (0-5)
        let col = -1;
        for (let i = 0; i < grid.COLS; i++) {
            const slotX = (grid.START_X + grid.SPACING_X * i) * scale;
            const slotEndX = slotX + grid.SLOT_SIZE * scale;
            
            if (relativeX >= slotX && relativeX <= slotEndX) {
                col = i;
                break;
            }
        }
        
        if (col === -1) return -1;
        
        // Berechne Reihe (0-6)
        let row = -1;
        for (let i = 0; i < grid.ROWS; i++) {
            const slotY = (grid.START_Y + grid.SPACING_Y * i) * scale;
            const slotEndY = slotY + grid.SLOT_SIZE * scale;
            
            if (relativeY >= slotY && relativeY <= slotEndY) {
                row = i;
                break;
            }
        }
        
        if (row === -1) return -1;
        
        // Berechne Slot-Index (Start bei 6, da 0-5 = Hotbar)
        return 6 + (row * grid.COLS + col);
    }
    
    getHotbarSlotAtMouse(hotbarX, hotbarY, hotbarWidth, hotbarHeight) {
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y;
        
        // Prüfe ob Maus über Hotbar ist
        if (mouseX < hotbarX || mouseX > hotbarX + hotbarWidth || mouseY < hotbarY || mouseY > hotbarY + hotbarHeight) {
            return -1;
        }
        
        // Hotbar-Slot-Berechnung
        const slotWidth = 40;
        const slotStartX = 18;
        const slotSpacing = 45.5;
        const scale = 1.5; // Hotbar scale
        
        const relativeX = mouseX - hotbarX;
        
        // Berechne Spalte (0-5)
        for (let i = 0; i < 6; i++) {
            const slotX = (slotStartX + slotSpacing * i) * scale;
            const slotEndX = slotX + slotWidth * scale;
            
            if (relativeX >= slotX && relativeX <= slotEndX) {
                return i; // Hotbar-Slots sind 0-5
            }
        }
        
        return -1;
    }
    
    getCraftingSlotAtMouse(craftX, craftY, craftWidth, craftHeight, craftScale) {
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y;
        
        // Prüfe ob Maus über Crafting-Grid ist
        if (mouseX < craftX || mouseX > craftX + craftWidth || mouseY < craftY || mouseY > craftY + craftHeight) {
            return -1;
        }
        
        // Crafting-Grid-Slot-Berechnung (4x4)
        const grid = CONFIG.CRAFTING.GRID;
        
        const relativeX = mouseX - craftX;
        const relativeY = mouseY - craftY;
        
        // Berechne Spalte (0-3)
        let col = -1;
        for (let i = 0; i < grid.COLS; i++) {
            const slotX = (grid.START_X + grid.SPACING_X * i) * craftScale;
            const slotEndX = slotX + grid.SLOT_SIZE * craftScale;
            
            if (relativeX >= slotX && relativeX <= slotEndX) {
                col = i;
                break;
            }
        }
        
        if (col === -1) return -1;
        
        // Berechne Reihe (0-3)
        let row = -1;
        for (let i = 0; i < grid.ROWS; i++) {
            const slotY = (grid.START_Y + grid.SPACING_Y * i) * craftScale;
            const slotEndY = slotY + grid.SLOT_SIZE * craftScale;
            
            if (relativeY >= slotY && relativeY <= slotEndY) {
                row = i;
                break;
            }
        }
        
        if (row === -1) return -1;
        
        // Berechne Slot-Index (0-15 für 4x4 Grid)
        return row * grid.COLS + col;
    }
    
    getCraftingResultSlotAtMouse(resultX, resultY, resultWidth, resultHeight, craftScale) {
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y;
        
        // Prüfe ob Maus über Result-Slot ist
        const result = CONFIG.CRAFTING.RESULT;
        const slotX = resultX + result.X * craftScale;
        const slotY = resultY + result.Y * craftScale;
        const slotSize = result.SLOT_SIZE * craftScale;
        
        if (mouseX >= slotX && mouseX <= slotX + slotSize &&
            mouseY >= slotY && mouseY <= slotY + slotSize) {
            return 0; // Result slot
        }
        
        return -1;
    }
    
    getHoveredSlot(inventory, hotbar, renderer) {
        // Crafting-Slots prüfen wenn Crafting offen
        if (this.craftingOpen) {
            // Berechne Crafting-Overlay-Positionen
            const hotbarScale = 1.5;
            const hotbarWidth = renderer.textures[hotbar.getHotbarTextureName()].width * hotbarScale;
            const craftScale = hotbarWidth / renderer.textures['craft'].width;
            const craftWidth = renderer.textures['craft'].width * craftScale;
            const craftHeight = renderer.textures['craft'].height * craftScale;
            const craftX = (renderer.canvas.width - craftWidth) / 2;
            const hotbarHeight = renderer.textures[hotbar.getHotbarTextureName()].height * hotbarScale;
            const hotbarY = renderer.canvas.height - hotbarHeight - 20;
            const craftY = hotbarY - craftHeight - 20;
            
            // Prüfe Crafting-Grid-Slots
            const craftingSlot = this.getCraftingSlotAtMouse(craftX, craftY, craftWidth, craftHeight, craftScale);
            if (craftingSlot >= 0) {
                // Berechne Slot-Position für Crafting-Grid
                const grid = CONFIG.CRAFTING.GRID;
                const row = Math.floor(craftingSlot / grid.COLS);
                const col = craftingSlot % grid.COLS;
                const slotX = craftX + (grid.START_X + grid.SPACING_X * col) * craftScale;
                const slotY = craftY + (grid.START_Y + grid.SPACING_Y * row) * craftScale;
                const slotSize = grid.SLOT_SIZE * craftScale;
                return { slotIndex: -2000 - craftingSlot, x: slotX, y: slotY, width: slotSize, height: slotSize, isCrafting: true };
            }
            
            // Prüfe Result-Slot
            const resultWidth = renderer.textures['craft-result'].width * craftScale;
            const resultHeight = renderer.textures['craft-result'].height * craftScale;
            const resultX = craftX + craftWidth;
            const resultY = craftY;
            const resultSlot = this.getCraftingResultSlotAtMouse(resultX, resultY, resultWidth, resultHeight, craftScale);
            if (resultSlot >= 0) {
                const result = CONFIG.CRAFTING.RESULT;
                const slotX = resultX + result.X * craftScale;
                const slotY = resultY + result.Y * craftScale;
                const slotSize = result.SLOT_SIZE * craftScale;
                return { slotIndex: -3000, x: slotX, y: slotY, width: slotSize, height: slotSize, isCraftingResult: true };
            }
            
            return { slotIndex: -1, x: 0, y: 0, width: 0, height: 0 };
        }
        
        // Nur wenn Inventar offen ist
        if (!this.inventoryOpen) return { slotIndex: -1, x: 0, y: 0, width: 0, height: 0 };
        
        // Prüfe Inventar-Slots (6-47)
        const hotbarScale = 1.5;
        const hotbarWidth = renderer.textures[hotbar.getHotbarTextureName()].width * hotbarScale;
        const invScale = hotbarWidth / renderer.textures['inventory'].width;
        const invWidth = renderer.textures['inventory'].width * invScale;
        const invHeight = renderer.textures['inventory'].height * invScale;
        const invX = (renderer.canvas.width - invWidth) / 2;
        const hotbarHeight = renderer.textures[hotbar.getHotbarTextureName()].height * hotbarScale;
        const hotbarY = renderer.canvas.height - hotbarHeight - 20;
        const invY = hotbarY - invHeight - 20;
        
        const invSlot = this.getInventorySlotAtMouse(invX, invY, invWidth, invHeight, renderer.textures['inventory']);
        if (invSlot !== -1) {
            // Berechne Slot-Position für Inventar
            const grid = CONFIG.INVENTORY_GRID;
            const row = Math.floor((invSlot - 6) / grid.COLS);
            const col = (invSlot - 6) % grid.COLS;
            const slotX = invX + (grid.START_X + grid.SPACING_X * col) * invScale;
            const slotY = invY + (grid.START_Y + grid.SPACING_Y * row) * invScale;
            const slotSize = grid.SLOT_SIZE * invScale;
            return { slotIndex: invSlot, x: slotX, y: slotY, width: slotSize, height: slotSize };
        }
        
        // Prüfe Hotbar-Slots (0-5)
        const hotbarX = (renderer.canvas.width - hotbarWidth) / 2;
        const hotbarSlot = this.getHotbarSlotAtMouse(hotbarX, hotbarY, hotbarWidth, hotbarHeight);
        if (hotbarSlot !== -1) {
            // Berechne Slot-Position für Hotbar
            const slotWidth = 40;
            const slotStartX = 18;
            const slotSpacing = 45.5;
            const scale = 1.5;
            const slotX = hotbarX + (slotStartX + slotSpacing * hotbarSlot) * scale;
            const slotY = hotbarY + 3 * scale;
            const slotSize = slotWidth * scale;
            return { slotIndex: hotbarSlot, x: slotX, y: slotY, width: slotSize, height: slotSize };
        }
        
        return { slotIndex: -1, x: 0, y: 0, width: 0, height: 0 };
    }
}
