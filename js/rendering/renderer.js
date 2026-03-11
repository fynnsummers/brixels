// Rendering-System

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        // Hardware-Beschleunigung aktivieren (ohne desynchronized für stabiles Rendering)
        this.ctx = canvas.getContext('2d', {
            alpha: false,           // Kein Alpha-Kanal = schneller
            willReadFrequently: false // Optimiert für Schreiben, nicht Lesen
        });
        
        // Zusätzliche Performance-Optimierungen
        this.ctx.imageSmoothingEnabled = false; // Pixelated rendering
        
        this.textures = {};
        this.highlightAlpha = 0;
        this.targetHighlightAlpha = 0;
        
        // Tag-Nacht-Zyklus - starte am Tag (0.5 = Mittag)
        this.dayTime = 0.5;
    }
    
    async loadTextures() {
        const textureNames = ['stone', 'dirt', 'dirt-grass', 'grass', 'coalore', 'ironore', 'goldore', 'bedrock', 'diamondore', 'emeraldore', 'granite', 'diorite', 'dirt-grass-tree', 'tree', 'tree-head', 'tree-leaves', 'cursor', 'blocked-cursor', 'inventory', 'craft', 'craft-result', 'chat', 'chat-inactive', 'tooltip', 'title', 'wood', 'wood-stick', 'coal', 'iron', 'gold', 'diamond', 'emerald'];
        
        // Player-Animationen hinzufügen
        for (let i = 1; i <= 2; i++) {
            textureNames.push(`p-stand${i}`);
        }
        for (let i = 1; i <= 2; i++) {
            textureNames.push(`p-go${i}`);
        }
        
        // Tools hinzufügen
        const toolTypes = ['axe', 'pickaxe', 'shovel', 'sword'];
        const toolMaterials = ['wood', 'stone', 'iron', 'gold', 'diamond', 'emerald'];
        
        for (let type of toolTypes) {
            for (let material of toolMaterials) {
                textureNames.push(`${type}-${material}`);
            }
        }
        
        for (let i = 1; i <= 6; i++) {
            textureNames.push(`h${i}`);
        }
        
        for (let i = 0; i <= 4; i++) {
            textureNames.push(`l${i}`);
        }
        
        const promises = textureNames.map(name => {
            let path;
            if (name === 'cursor' || name === 'blocked-cursor' || name === 'title') {
                path = `assets/${name}.png`;
            } else if (name.startsWith('p-stand') || name.startsWith('p-go')) {
                path = `assets/${name}.png`;
            } else if (name === 'inventory' || name === 'craft' || name === 'craft-result' || name === 'chat' || name === 'chat-inactive' || name === 'tooltip') {
                path = `assets/ui/${name}.png`;
            } else if ((name.startsWith('h') || name.startsWith('l')) && name.length === 2) {
                path = `assets/ui/${name}.png`;
            } else if (name.includes('-') && (name.startsWith('axe') || name.startsWith('pickaxe') || name.startsWith('shovel') || name.startsWith('sword'))) {
                path = `assets/tools/${name}.png`;
            } else {
                path = `assets/textures/${name}.png`;
            }
            return loadImage(name, path);
        });
        
        const results = await Promise.all(promises);
        results.forEach(({ name, img }) => {
            if (img) {
                this.textures[name] = img;
            }
        });
        console.log('Loaded textures:', Object.keys(this.textures));
    }
    
    updateHighlight(world, mouse, inventoryOpen, craftingOpen) {
        if (inventoryOpen || craftingOpen) {
            // Kein Highlight wenn Inventar oder Crafting offen
            this.targetHighlightAlpha = 0;
            this.highlightAlpha = 0;
            return;
        }
        
        const hoveredBlock = world.getBlockAt(mouse.worldX, mouse.worldY, true);
        this.targetHighlightAlpha = hoveredBlock ? CONFIG.HIGHLIGHT_ALPHA : 0;
        this.highlightAlpha += (this.targetHighlightAlpha - this.highlightAlpha) * CONFIG.HIGHLIGHT_SMOOTH;
    }
    
    render(world, player, camera, mouse, blockBreaker, particleSystem, hotbar, health, itemDrops, inventory, input, chat, crafting, game) {
        // Zeichne Himmel mit Gradient (Tag-Nacht-Zyklus)
        const skyColors = this.getSkyColors();
        this.drawPixelatedGradient(skyColors);
        
        this.ctx.save();
        this.ctx.scale(camera.zoom, camera.zoom);
        
        // Berechne Dunkelheit für Blöcke/Entities
        const darkness = this.getDarkness();
        
        const startChunk = Math.floor((camera.x - CONFIG.BLOCK_SIZE) / (CONFIG.CHUNK_WIDTH * CONFIG.BLOCK_SIZE));
        const endChunk = Math.ceil((camera.x + this.canvas.width / camera.zoom + CONFIG.BLOCK_SIZE) / (CONFIG.CHUNK_WIDTH * CONFIG.BLOCK_SIZE));
        
        // Berechne sichtbare Y-Range mit 10 Blöcke Buffer
        const bufferBlocks = 10;
        const minVisibleY = Math.max(0, Math.floor(camera.y / CONFIG.BLOCK_SIZE) - bufferBlocks);
        const maxVisibleY = Math.min(CONFIG.WORLD_HEIGHT - 1, Math.ceil((camera.y + this.canvas.height / camera.zoom) / CONFIG.BLOCK_SIZE) + bufferBlocks);
        
        world.cleanupChunks(startChunk, endChunk);
        
        for (let chunkX = startChunk; chunkX <= endChunk; chunkX++) {
            const chunk = world.generateChunk(chunkX);
            
            for (let x = 0; x < CONFIG.CHUNK_WIDTH; x++) {
                // Nur sichtbare Y-Range rendern
                for (let y = minVisibleY; y <= maxVisibleY; y++) {
                    const blockType = chunk[x][y];
                    if (!blockType) continue;
                    
                    const worldX = (chunkX * CONFIG.CHUNK_WIDTH + x) * CONFIG.BLOCK_SIZE;
                    const worldY = y * CONFIG.BLOCK_SIZE;
                    const blockX = chunkX * CONFIG.CHUNK_WIDTH + x;
                    const blockY = y;
                    
                    if (world.isBlockBroken(blockX, blockY)) continue;
                    
                    const screenX = worldX - camera.x;
                    const screenY = worldY - camera.y;
                    
                    if (screenX > -CONFIG.BLOCK_SIZE && screenX < this.canvas.width / camera.zoom &&
                        screenY > -CONFIG.BLOCK_SIZE && screenY < this.canvas.height / camera.zoom) {
                        
                        const animProgress = world.getAnimationProgress(blockX, blockY);
                        
                        if (animProgress !== null) {
                            this.ctx.globalAlpha = 1 - animProgress;
                            this.ctx.drawImage(this.textures[blockType], screenX, screenY, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
                            this.ctx.globalAlpha = 1;
                        } else {
                            this.ctx.drawImage(this.textures[blockType], screenX, screenY, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
                        }
                    }
                }
            }
        }
        
        const playerScreenX = player.x - camera.x;
        const playerScreenY = player.y - camera.y;
        
        this.ctx.save();
        this.ctx.translate(playerScreenX + player.width / 2, playerScreenY + player.height / 2);
        this.ctx.scale(player.scale, 1);
        
        // Hole aktuellen Animations-Frame
        const animFrame = player.getAnimationFrame();
        const playerTexture = this.textures[animFrame];
        
        if (playerTexture) {
            this.ctx.drawImage(playerTexture, -player.width / 2, -player.height / 2, player.width, player.height);
        }
        
        this.ctx.restore();
        
        const selectedSlot = hotbar.getSelectedSlot();
        const slot = inventory.getSlot(selectedSlot);
        if (slot.item && slot.count > 0) {
            const itemTexture = this.textures[slot.item];
            if (itemTexture) {
                const item = ItemRegistry.getByName(slot.item);
                
                // Prüfe ob es ein Tool ist
                const isTool = item && item.category === 'tools';
                
                if (isTool) {
                    // Tool-Anzeige mit CONFIG und Player-Scale
                    const toolSize = CONFIG.TOOL_DISPLAY.SIZE;
                    // Offset wird mit player.scale multipliziert für Flip
                    const toolOffsetX = CONFIG.TOOL_DISPLAY.OFFSET_X * player.scale;
                    const toolX = playerScreenX + player.width / 2 + toolOffsetX - toolSize / 2;
                    const toolY = playerScreenY + player.height / 2 + CONFIG.TOOL_DISPLAY.OFFSET_Y - toolSize / 2;
                    
                    this.ctx.save();
                    this.ctx.translate(toolX + toolSize / 2, toolY + toolSize / 2);
                    // Rotation und Scale kombinieren
                    this.ctx.scale(player.scale, 1);
                    this.ctx.rotate(CONFIG.TOOL_DISPLAY.ROTATION * Math.PI / 180);
                    
                    this.ctx.drawImage(itemTexture, -toolSize / 2, -toolSize / 2, toolSize, toolSize);
                    this.ctx.restore();
                } else {
                    // Block-Anzeige mit CONFIG und Player-Scale
                    const blockSize = CONFIG.BLOCK_DISPLAY.SIZE;
                    // Offset wird mit player.scale multipliziert für Flip
                    const blockOffsetX = CONFIG.BLOCK_DISPLAY.OFFSET_X * player.scale;
                    const blockX = playerScreenX + player.width / 2 + blockOffsetX - blockSize / 2;
                    const blockY = playerScreenY + player.height / 2 + CONFIG.BLOCK_DISPLAY.OFFSET_Y - blockSize / 2;
                    
                    this.ctx.save();
                    this.ctx.translate(blockX + blockSize / 2, blockY + blockSize / 2);
                    // Rotation und Scale kombinieren
                    this.ctx.scale(player.scale, 1);
                    this.ctx.rotate(CONFIG.BLOCK_DISPLAY.ROTATION * Math.PI / 180);
                    
                    this.ctx.drawImage(itemTexture, -blockSize / 2, -blockSize / 2, blockSize, blockSize);
                    this.ctx.restore();
                }
            }
        }
        
        particleSystem.render(this.ctx, camera, this.textures);
        itemDrops.render(this.ctx, camera, this.textures, darkness);
        
        if (this.highlightAlpha > 0.01 && !mouse.isDown && !input.inventoryOpen && !input.craftingOpen) {
            const highlightWorldX = mouse.blockX * CONFIG.BLOCK_SIZE;
            const highlightWorldY = mouse.blockY * CONFIG.BLOCK_SIZE;
            const highlightScreenX = highlightWorldX - camera.x;
            const highlightScreenY = highlightWorldY - camera.y;
            const alpha = mouse.inRange ? this.highlightAlpha : this.highlightAlpha * 0.3;
            
            if (mouse.flashRed > 0 && !mouse.inRange) {
                this.ctx.fillStyle = `rgba(255, 100, 100, ${alpha * 0.8})`;
            } else {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            }
            this.ctx.fillRect(highlightScreenX, highlightScreenY, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
        }
        
        if (mouse.inRange && !input.inventoryOpen && !input.craftingOpen) {
            const breakingBlock = blockBreaker.getBreakingBlock();
            if (breakingBlock) {
                const frameIndex = blockBreaker.getCurrentFrame();
                if (frameIndex !== null) {
                    const breakWorldX = breakingBlock.x * CONFIG.BLOCK_SIZE;
                    const breakWorldY = breakingBlock.y * CONFIG.BLOCK_SIZE;
                    const breakScreenX = breakWorldX - camera.x;
                    const breakScreenY = breakWorldY - camera.y;
                    const frameTexture = blockBreaker.getFrameTexture(frameIndex);
                    this.ctx.drawImage(frameTexture, breakScreenX, breakScreenY, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
                }
            }
        }
        
        this.ctx.restore();
        
        // Dunkelheit als schwarzes Overlay über die gesamte Welt (außer UI)
        if (darkness > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = darkness;
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
        
        // Inventar-Overlay (wenn E gedrückt) - VOR Hotbar und Cursor
        let hoveredSlotIndex = -1; // Track hovered slot für Tooltip
        
        if (input.inventoryOpen) {
            // Dunkler Hintergrund
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Inventar-Bild mit gleicher Breite wie Hotbar
            if (this.textures['inventory']) {
                const hotbarScale = 1.5;
                const hotbarWidth = this.textures[hotbar.getHotbarTextureName()].width * hotbarScale;
                
                // Berechne Scale basierend auf Hotbar-Breite
                const invScale = hotbarWidth / this.textures['inventory'].width;
                const invWidth = this.textures['inventory'].width * invScale;
                const invHeight = this.textures['inventory'].height * invScale;
                const invX = (this.canvas.width - invWidth) / 2;
                
                // Position über der Hotbar
                const hotbarHeight = this.textures[hotbar.getHotbarTextureName()].height * hotbarScale;
                const hotbarY = this.canvas.height - hotbarHeight - CONFIG.HOTBAR.OFFSET_Y;
                const invY = hotbarY - invHeight - 20;
                
                this.ctx.drawImage(this.textures['inventory'], invX, invY, invWidth, invHeight);
                
                // Prüfe welcher Inventar-Slot gehovered wird
                hoveredSlotIndex = input.getInventorySlotAtMouse(invX, invY, invWidth, invHeight, this.textures['inventory']);
                
                // Zeichne Items in Inventar-Slots (nur Slots 6-47, nicht Hotbar 0-5)
                const grid = CONFIG.INVENTORY_GRID;
                const itemSize = 28 * invScale;
                
                // Nur Inventar-Slots zeichnen (6-47), nicht Hotbar (0-5)
                for (let row = 0; row < grid.ROWS; row++) {
                    for (let col = 0; col < grid.COLS; col++) {
                        const slotIndex = 6 + (row * grid.COLS + col); // Start bei Slot 6
                        const slot = inventory.getSlot(slotIndex);
                        
                        const slotOriginalX = grid.START_X + grid.SPACING_X * col;
                        const slotOriginalY = grid.START_Y + grid.SPACING_Y * row;
                        const slotScreenX = invX + slotOriginalX * invScale;
                        const slotScreenY = invY + slotOriginalY * invScale;
                        
                        // Debug: Rote Border um Slots
                        if (grid.DEBUG) {
                            this.ctx.strokeStyle = '#FF0000';
                            this.ctx.lineWidth = 2;
                            this.ctx.strokeRect(slotScreenX, slotScreenY, grid.SLOT_SIZE * invScale, grid.SLOT_SIZE * invScale);
                        }
                        
                        // Hover-Effekt: Leichte weiße Füllung
                        if (hoveredSlotIndex === slotIndex) {
                            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                            this.ctx.fillRect(slotScreenX, slotScreenY, grid.SLOT_SIZE * invScale, grid.SLOT_SIZE * invScale);
                        }
                        
                        // Skip wenn Slot gerade gezogen wird
                        if (inventory.draggedSlot === slotIndex) continue;
                        
                        if (slot.item && slot.count > 0) {
                            const slotCenterX = slotScreenX + (grid.SLOT_SIZE * invScale) / 2;
                            const slotCenterY = slotScreenY + (grid.SLOT_SIZE * invScale) / 2;
                            const itemX = slotCenterX - itemSize / 2;
                            const itemY = slotCenterY - itemSize / 2;
                            
                            const texture = this.textures[slot.item];
                            if (texture) {
                                this.ctx.drawImage(texture, itemX, itemY, itemSize, itemSize);
                            }
                            
                            // Zeichne Count
                            if (slot.count > 1) {
                                this.ctx.save();
                                this.ctx.font = '10px "Press Start 2P", monospace';
                                this.ctx.fillStyle = '#FFFFFF';
                                this.ctx.strokeStyle = '#000000';
                                this.ctx.lineWidth = 2;
                                this.ctx.textAlign = 'right';
                                this.ctx.textBaseline = 'bottom';
                                const countText = slot.count.toString();
                                const countX = slotScreenX + grid.SLOT_SIZE * invScale - 2;
                                const countY = slotScreenY + grid.SLOT_SIZE * invScale - 2;
                                this.ctx.strokeText(countText, countX, countY);
                                this.ctx.fillText(countText, countX, countY);
                                this.ctx.restore();
                            }
                        }
                    }
                }
                
                // Zeichne gezogenes Item am Cursor - aber NICHT für Result-Slot Items
                if (inventory.draggedItem && inventory.draggedSlot !== -4000) {
                    const texture = this.textures[inventory.draggedItem.item];
                    if (texture) {
                        const dragItemSize = itemSize;
                        const dragX = mouse.x - dragItemSize / 2;
                        const dragY = mouse.y - dragItemSize / 2;
                        
                        this.ctx.globalAlpha = 0.8;
                        this.ctx.drawImage(texture, dragX, dragY, dragItemSize, dragItemSize);
                        this.ctx.globalAlpha = 1;
                        
                        // Count
                        if (inventory.draggedItem.count > 1) {
                            this.ctx.save();
                            this.ctx.font = '10px "Press Start 2P", monospace';
                            this.ctx.fillStyle = '#FFFFFF';
                            this.ctx.strokeStyle = '#000000';
                            this.ctx.lineWidth = 2;
                            this.ctx.textAlign = 'right';
                            this.ctx.textBaseline = 'bottom';
                            const countText = inventory.draggedItem.count.toString();
                            this.ctx.strokeText(countText, dragX + dragItemSize, dragY + dragItemSize);
                            this.ctx.fillText(countText, dragX + dragItemSize, dragY + dragItemSize);
                            this.ctx.restore();
                        }
                    }
                }
            }
        }
        
        // Crafting-Overlay (wenn C gedrückt) - NACH Inventar-Overlay
        if (input.craftingOpen) {
            // Dunkler Hintergrund
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Crafting-Bilder mit gleicher Skalierung wie Inventar
            if (this.textures['craft'] && this.textures['craft-result']) {
                const hotbarScale = 1.5;
                const hotbarWidth = this.textures[hotbar.getHotbarTextureName()].width * hotbarScale;
                
                // Berechne Scale basierend auf Hotbar-Breite
                const craftScale = hotbarWidth / this.textures['craft'].width;
                const craftWidth = this.textures['craft'].width * craftScale;
                const craftHeight = this.textures['craft'].height * craftScale;
                
                // Craft-Bild mittig positionieren
                const craftX = (this.canvas.width - craftWidth) / 2;
                
                // Position über der Hotbar (gleich wie Inventar)
                const hotbarHeight = this.textures[hotbar.getHotbarTextureName()].height * hotbarScale;
                const hotbarY = this.canvas.height - hotbarHeight - CONFIG.HOTBAR.OFFSET_Y;
                const craftY = hotbarY - craftHeight - 20;
                
                // Zeichne Craft-Bild
                this.ctx.drawImage(this.textures['craft'], craftX, craftY, craftWidth, craftHeight);
                
                // Craft-Result-Bild direkt rechts neben Craft-Bild
                const resultWidth = this.textures['craft-result'].width * craftScale;
                const resultHeight = this.textures['craft-result'].height * craftScale;
                const resultX = craftX + craftWidth; // Direkt rechts neben craft
                const resultY = craftY; // Gleiche Y-Position
                
                // Zeichne Craft-Result-Bild
                this.ctx.drawImage(this.textures['craft-result'], resultX, resultY, resultWidth, resultHeight);
                
                // Prüfe welcher Crafting-Slot gehovered wird
                if (hoveredSlotIndex === -1) {
                    const hoveredSlotData = input.getHoveredSlot(inventory, hotbar, this);
                    if (hoveredSlotData.slotIndex !== -1) {
                        hoveredSlotIndex = hoveredSlotData.slotIndex;
                    }
                }
                
                // Debug: Zeichne Crafting-Grid-Slots (4x4)
                const craftGrid = CONFIG.CRAFTING.GRID;
                if (craftGrid.DEBUG) {
                    this.ctx.strokeStyle = '#FF0000';
                    this.ctx.lineWidth = 3; // Dicker für bessere Sichtbarkeit
                    
                    for (let row = 0; row < craftGrid.ROWS; row++) {
                        for (let col = 0; col < craftGrid.COLS; col++) {
                            const slotOriginalX = craftGrid.START_X + craftGrid.SPACING_X * col;
                            const slotOriginalY = craftGrid.START_Y + craftGrid.SPACING_Y * row;
                            const slotScreenX = craftX + slotOriginalX * craftScale;
                            const slotScreenY = craftY + slotOriginalY * craftScale;
                            const slotSize = craftGrid.SLOT_SIZE * craftScale;
                            
                            this.ctx.strokeRect(slotScreenX, slotScreenY, slotSize, slotSize);
                        }
                    }
                }
                
                // Debug: Zeichne Result-Slot (etwas größer)
                const craftResult = CONFIG.CRAFTING.RESULT;
                if (craftResult.DEBUG) {
                    this.ctx.strokeStyle = '#00FF00'; // Grün für Result-Slot
                    this.ctx.lineWidth = 3; // Dicker für bessere Sichtbarkeit
                    
                    const resultSlotX = resultX + craftResult.X * craftScale;
                    const resultSlotY = resultY + craftResult.Y * craftScale;
                    const resultSlotSize = craftResult.SLOT_SIZE * craftScale;
                    
                    this.ctx.strokeRect(resultSlotX, resultSlotY, resultSlotSize, resultSlotSize);
                }
                
                // TODO: Zeichne Items in Crafting-Slots (4x4 Grid)
                const itemSize = 28 * craftScale; // Gleiche Item-Größe wie Inventar
                
                // Zeichne Items in Crafting-Grid-Slots (0-15)
                for (let row = 0; row < craftGrid.ROWS; row++) {
                    for (let col = 0; col < craftGrid.COLS; col++) {
                        const slotIndex = row * craftGrid.COLS + col; // 0-15 für 4x4 Grid
                        const slot = crafting.getGridSlot(slotIndex);
                        
                        const slotOriginalX = craftGrid.START_X + craftGrid.SPACING_X * col;
                        const slotOriginalY = craftGrid.START_Y + craftGrid.SPACING_Y * row;
                        const slotScreenX = craftX + slotOriginalX * craftScale;
                        const slotScreenY = craftY + slotOriginalY * craftScale;
                        
                        // Hover-Effekt: Leichte weiße Füllung
                        if (hoveredSlotIndex === -2000 - slotIndex) {
                            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                            this.ctx.fillRect(slotScreenX, slotScreenY, craftGrid.SLOT_SIZE * craftScale, craftGrid.SLOT_SIZE * craftScale);
                        }
                        
                        // Zeichne Item wenn vorhanden
                        if (slot.item && slot.count > 0) {
                            const slotCenterX = slotScreenX + (craftGrid.SLOT_SIZE * craftScale) / 2;
                            const slotCenterY = slotScreenY + (craftGrid.SLOT_SIZE * craftScale) / 2;
                            const itemX = slotCenterX - itemSize / 2;
                            const itemY = slotCenterY - itemSize / 2;
                            
                            const texture = this.textures[slot.item];
                            if (texture) {
                                this.ctx.drawImage(texture, itemX, itemY, itemSize, itemSize);
                            }
                            
                            // Zeichne Count
                            if (slot.count > 1) {
                                this.ctx.save();
                                this.ctx.font = '10px "Press Start 2P", monospace';
                                this.ctx.fillStyle = '#FFFFFF';
                                this.ctx.strokeStyle = '#000000';
                                this.ctx.lineWidth = 2;
                                this.ctx.textAlign = 'right';
                                this.ctx.textBaseline = 'bottom';
                                const countText = slot.count.toString();
                                const countX = slotScreenX + craftGrid.SLOT_SIZE * craftScale - 2;
                                const countY = slotScreenY + craftGrid.SLOT_SIZE * craftScale - 2;
                                this.ctx.strokeText(countText, countX, countY);
                                this.ctx.fillText(countText, countX, countY);
                                this.ctx.restore();
                            }
                        }
                    }
                }
                
                // Zeichne Result-Item
                const resultSlot = crafting.getResultSlot();
                const resultSlotX = resultX + craftResult.X * craftScale;
                const resultSlotY = resultY + craftResult.Y * craftScale;
                
                // Hover-Effekt für Result-Slot: Leichte weiße Füllung
                if (hoveredSlotIndex === -3000) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.fillRect(resultSlotX, resultSlotY, craftResult.SLOT_SIZE * craftScale, craftResult.SLOT_SIZE * craftScale);
                }
                
                if (resultSlot.item && resultSlot.count > 0) {
                    const resultCenterX = resultSlotX + (craftResult.SLOT_SIZE * craftScale) / 2;
                    const resultCenterY = resultSlotY + (craftResult.SLOT_SIZE * craftScale) / 2;
                    const resultItemSize = craftResult.ITEM_SIZE * craftScale; // Verwende spezielle Result-Item-Größe
                    const resultItemX = resultCenterX - resultItemSize / 2;
                    const resultItemY = resultCenterY - resultItemSize / 2;
                    
                    const texture = this.textures[resultSlot.item];
                    if (texture) {
                        this.ctx.drawImage(texture, resultItemX, resultItemY, resultItemSize, resultItemSize);
                    }
                    
                    // Zeichne Count mit besserem Padding
                    if (resultSlot.count > 1) {
                        this.ctx.save();
                        this.ctx.font = '10px "Press Start 2P", monospace';
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.strokeStyle = '#000000';
                        this.ctx.lineWidth = 2;
                        this.ctx.textAlign = 'right';
                        this.ctx.textBaseline = 'bottom';
                        const countText = resultSlot.count.toString();
                        const countX = resultSlotX + craftResult.SLOT_SIZE * craftScale - 8; // Mehr Padding von rechts
                        const countY = resultSlotY + craftResult.SLOT_SIZE * craftScale - 8; // Mehr Padding von unten
                        this.ctx.strokeText(countText, countX, countY);
                        this.ctx.fillText(countText, countX, countY);
                        this.ctx.restore();
                    }
                }
                
                // Zeichne gezogenes Item am Cursor (für Crafting) - aber NICHT für Result-Slot Items
                if (inventory.draggedItem && inventory.draggedSlot !== -4000) {
                    const texture = this.textures[inventory.draggedItem.item];
                    if (texture) {
                        const dragItemSize = itemSize;
                        const dragX = mouse.x - dragItemSize / 2;
                        const dragY = mouse.y - dragItemSize / 2;
                        
                        this.ctx.globalAlpha = 0.8;
                        this.ctx.drawImage(texture, dragX, dragY, dragItemSize, dragItemSize);
                        this.ctx.globalAlpha = 1;
                        
                        // Count
                        if (inventory.draggedItem.count > 1) {
                            this.ctx.save();
                            this.ctx.font = '10px "Press Start 2P", monospace';
                            this.ctx.fillStyle = '#FFFFFF';
                            this.ctx.strokeStyle = '#000000';
                            this.ctx.lineWidth = 2;
                            this.ctx.textAlign = 'right';
                            this.ctx.textBaseline = 'bottom';
                            const countText = inventory.draggedItem.count.toString();
                            this.ctx.strokeText(countText, dragX + dragItemSize, dragY + dragItemSize);
                            this.ctx.fillText(countText, dragX + dragItemSize, dragY + dragItemSize);
                            this.ctx.restore();
                        }
                    }
                }
            }
        }
        
        const healthTextureName = health.getHealthTextureName();
        if (this.textures[healthTextureName]) {
            const healthConfig = CONFIG.HEALTH_BAR;
            const healthWidth = this.textures[healthTextureName].width * healthConfig.SCALE;
            const healthHeight = this.textures[healthTextureName].height * healthConfig.SCALE;
            this.ctx.drawImage(this.textures[healthTextureName], healthConfig.X, healthConfig.Y, healthWidth, healthHeight);
        }
        
        const blockX = Math.floor(player.x / CONFIG.BLOCK_SIZE);
        const blockY = Math.floor(player.y / CONFIG.BLOCK_SIZE);
        const coordElement = document.getElementById('coordinates');
        if (coordElement) {
            coordElement.textContent = `X: ${blockX}  Y: ${blockY}`;
        }
        
        const hotbarTextureName = hotbar.getHotbarTextureName();
        if (this.textures[hotbarTextureName]) {
            const scale = CONFIG.HOTBAR.SCALE;
            const hotbarWidth = this.textures[hotbarTextureName].width * scale;
            const hotbarHeight = this.textures[hotbarTextureName].height * scale;
            const hotbarX = (this.canvas.width - hotbarWidth) / 2;
            const hotbarY = this.canvas.height - hotbarHeight - CONFIG.HOTBAR.OFFSET_Y;
            
            this.ctx.drawImage(this.textures[hotbarTextureName], hotbarX, hotbarY, hotbarWidth, hotbarHeight);
            
            // Prüfe welcher Hotbar-Slot gehovered wird (wenn Inventar oder Crafting offen)
            if ((input.inventoryOpen || input.craftingOpen) && hoveredSlotIndex === -1) {
                hoveredSlotIndex = input.getHotbarSlotAtMouse(hotbarX, hotbarY, hotbarWidth, hotbarHeight);
            }
            
            const slotWidth = CONFIG.HOTBAR.SLOT_SIZE;
            const slotHeight = CONFIG.HOTBAR.SLOT_SIZE;
            const slotStartX = CONFIG.HOTBAR.SLOT_START_X;
            const slotStartY = CONFIG.HOTBAR.SLOT_START_Y;
            const slotSpacing = CONFIG.HOTBAR.SLOT_SPACING;
            const itemSize = 28 * scale;
            
            for (let i = 0; i < 6; i++) {
                const slotOriginalX = slotStartX + slotSpacing * i;
                const slotOriginalY = slotStartY;
                const slotScreenX = hotbarX + slotOriginalX * scale;
                const slotScreenY = hotbarY + slotOriginalY * scale;
                
                // Debug: Rote Border um jeden Slot
                if (CONFIG.HOTBAR.DEBUG) {
                    this.ctx.strokeStyle = 'red';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(slotScreenX, slotScreenY, slotWidth * scale, slotHeight * scale);
                }
                
                // Hover-Effekt: Leichte weiße Füllung
                if (hoveredSlotIndex === i) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.fillRect(slotScreenX, slotScreenY, slotWidth * scale, slotHeight * scale);
                }
                
                const slot = inventory.getSlot(i);
                if (slot.item && slot.count > 0) {
                    const slotCenterX = slotScreenX + (slotWidth * scale) / 2;
                    const slotCenterY = slotScreenY + (slotHeight * scale) / 2;
                    const itemX = slotCenterX - itemSize / 2;
                    const itemY = slotCenterY - itemSize / 2;
                    
                    const texture = this.textures[slot.item];
                    if (texture) {
                        this.ctx.drawImage(texture, itemX, itemY, itemSize, itemSize);
                    }
                    
                    if (slot.count > 1) {
                        this.ctx.save();
                        this.ctx.font = '10px "Press Start 2P", monospace';
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.strokeStyle = '#000000';
                        this.ctx.lineWidth = 2;
                        this.ctx.textAlign = 'right';
                        this.ctx.textBaseline = 'bottom';
                        const countText = slot.count.toString();
                        const countX = slotScreenX + slotWidth * scale - 2;
                        const countY = slotScreenY + slotHeight * scale - 2;
                        this.ctx.strokeText(countText, countX, countY);
                        this.ctx.fillText(countText, countX, countY);
                        this.ctx.restore();
                    }
                }
            }
        }
        
        // Chat Rendering
        const shouldShowChat = input.chatOpen || chat.fadeAlpha > 0;
        
        if (shouldShowChat) {
            const chatConfig = CONFIG.CHAT;
            const chatX = this.canvas.width - chatConfig.WIDTH - chatConfig.OFFSET_X;
            const chatY = chatConfig.OFFSET_Y;
            
            if (input.chatOpen) {
                // Chat ist offen - zeige alles
                // Dunkler Hintergrund
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Chat-Bild (aktiv)
                if (this.textures['chat']) {
                    this.ctx.drawImage(this.textures['chat'], chatX, chatY, chatConfig.WIDTH, chatConfig.HEIGHT);
                }
            } else {
                // Chat ist geschlossen - Fade-Out
                // Kein schwarzer Hintergrund
                
                // Chat-Bild (inaktiv) mit Fade
                if (this.textures['chat-inactive']) {
                    this.ctx.save();
                    this.ctx.globalAlpha = chat.fadeAlpha;
                    this.ctx.drawImage(this.textures['chat-inactive'], chatX, chatY, chatConfig.WIDTH, chatConfig.HEIGHT);
                    this.ctx.restore();
                }
            }
            
            // Logger-Bereich
            const loggerX = chatX + chatConfig.LOGGER.X;
            const loggerY = chatY + chatConfig.LOGGER.Y;
            const loggerWidth = chatConfig.LOGGER.WIDTH;
            const loggerHeight = chatConfig.LOGGER.HEIGHT;
            
            // Input-Bereich
            const inputX = chatX + chatConfig.INPUT.X;
            const inputY = chatY + chatConfig.INPUT.Y;
            const inputWidth = chatConfig.INPUT.WIDTH;
            const inputHeight = chatConfig.INPUT.HEIGHT;
            
            // Debug: Rote Border um Logger-Bereich
            if (chatConfig.DEBUG) {
                this.ctx.strokeStyle = '#FF0000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(loggerX, loggerY, loggerWidth, loggerHeight);
                
                // Debug: Rote Border um Input-Bereich
                this.ctx.strokeRect(inputX, inputY, inputWidth, inputHeight);
            }
            
            // Zeichne Nachrichten mit Clipping und Fade
            this.ctx.save();
            
            // Clipping-Bereich für Logger
            this.ctx.beginPath();
            this.ctx.rect(loggerX, loggerY, loggerWidth, loggerHeight);
            this.ctx.clip();
            
            // Fade-Alpha anwenden wenn Chat geschlossen
            if (!input.chatOpen) {
                this.ctx.globalAlpha = chat.fadeAlpha;
            }
            
            this.ctx.font = `${chatConfig.LOGGER.FONT_SIZE}px "Press Start 2P", monospace`;
            this.ctx.textBaseline = 'top';
            
            const visibleMessages = chat.getVisibleMessages();
            let currentY = loggerY + chatConfig.LOGGER.PADDING;
            
            // Render Nachrichten mit Farbunterstützung
            for (let i = 0; i < visibleMessages.length; i++) {
                const msg = visibleMessages[i];
                const maxWidth = loggerWidth - chatConfig.LOGGER.PADDING * 2;
                
                // Parse Farbcodes
                const colorSegments = ChatColors.parseText(msg.text);
                
                let currentX = loggerX + chatConfig.LOGGER.PADDING;
                
                // Zeichne jeden farbigen Segment
                for (let seg of colorSegments) {
                    this.ctx.fillStyle = seg.color;
                    
                    // Word wrap für diesen Segment
                    const words = seg.text.split(' ');
                    
                    for (let j = 0; j < words.length; j++) {
                        const word = words[j] + (j < words.length - 1 ? ' ' : '');
                        const wordWidth = this.ctx.measureText(word).width;
                        
                        // Prüfe ob Wort in aktuelle Zeile passt
                        if (currentX + wordWidth > loggerX + maxWidth + chatConfig.LOGGER.PADDING) {
                            // Neue Zeile
                            currentY += chatConfig.LOGGER.LINE_HEIGHT;
                            currentX = loggerX + chatConfig.LOGGER.PADDING;
                            
                            if (currentY + chatConfig.LOGGER.LINE_HEIGHT > loggerY + loggerHeight) {
                                break;
                            }
                        }
                        
                        this.ctx.fillText(word, currentX, currentY);
                        currentX += wordWidth;
                    }
                }
                
                // Nächste Nachricht in neuer Zeile
                currentY += chatConfig.LOGGER.LINE_HEIGHT;
                if (currentY + chatConfig.LOGGER.LINE_HEIGHT > loggerY + loggerHeight) break;
            }
            
            this.ctx.restore();
            
            // Scrollbar zeichnen (wenn nötig)
            const maxVisibleLines = Math.floor(loggerHeight / chatConfig.LOGGER.LINE_HEIGHT);
            if (chat.messages.length > maxVisibleLines) {
                const scrollbarX = loggerX + loggerWidth - chatConfig.SCROLLBAR.WIDTH - chatConfig.SCROLLBAR.PADDING;
                const scrollbarY = loggerY + chatConfig.SCROLLBAR.PADDING;
                const scrollbarHeight = loggerHeight - chatConfig.SCROLLBAR.PADDING * 2;
                
                // Scrollbar Hintergrund
                this.ctx.fillStyle = chatConfig.SCROLLBAR.COLOR;
                this.ctx.fillRect(scrollbarX, scrollbarY, chatConfig.SCROLLBAR.WIDTH, scrollbarHeight);
                
                // Scrollbar Handle
                const handleHeight = Math.max(20, (maxVisibleLines / chat.messages.length) * scrollbarHeight);
                const maxScroll = chat.messages.length - maxVisibleLines;
                const handleY = scrollbarY + ((maxScroll - chat.scrollOffset) / maxScroll) * (scrollbarHeight - handleHeight);
                
                this.ctx.fillStyle = chatConfig.SCROLLBAR.HANDLE_COLOR;
                this.ctx.fillRect(scrollbarX, handleY, chatConfig.SCROLLBAR.WIDTH, handleHeight);
            }
            
            // Input-Text mit Clipping und Cursor-Position (nur wenn Chat offen)
            if (input.chatOpen) {
                this.ctx.save();
                
                // Clipping-Bereich für Input
                this.ctx.beginPath();
                this.ctx.rect(inputX, inputY, inputWidth, inputHeight);
                this.ctx.clip();
                
                this.ctx.font = `${chatConfig.INPUT.FONT_SIZE}px "Press Start 2P", monospace`;
                this.ctx.textBaseline = 'top';
                
                // Vertikale Zentrierung mit LINE_HEIGHT
                const textY = inputY + (inputHeight - chatConfig.INPUT.LINE_HEIGHT) / 2;
                
                // Färbe Command-Input
                const colorSegments = ChatColors.colorizeCommand(chat.inputText);
                
                // Berechne Text-Breite bis Cursor
                let textBeforeWidth = 0;
                let charCount = 0;
                for (let seg of colorSegments) {
                    if (charCount + seg.text.length >= chat.cursorPosition) {
                        // Cursor ist in diesem Segment
                        const charsInSegment = chat.cursorPosition - charCount;
                        textBeforeWidth += this.ctx.measureText(seg.text.slice(0, charsInSegment)).width;
                        break;
                    } else {
                        textBeforeWidth += this.ctx.measureText(seg.text).width;
                        charCount += seg.text.length;
                    }
                }
                
                // Berechne gesamte Text-Breite
                let fullTextWidth = 0;
                for (let seg of colorSegments) {
                    fullTextWidth += this.ctx.measureText(seg.text).width;
                }
                
                const maxInputWidth = inputWidth - chatConfig.INPUT.PADDING * 2;
                
                // Wenn Text zu breit, scrolle so dass Cursor sichtbar ist
                let textX = inputX + chatConfig.INPUT.PADDING;
                if (textBeforeWidth > maxInputWidth) {
                    textX = inputX + inputWidth - chatConfig.INPUT.PADDING - textBeforeWidth - 10;
                } else if (fullTextWidth > maxInputWidth) {
                    // Text ist zu lang, aber Cursor ist am Anfang/Mitte
                    textX = inputX + chatConfig.INPUT.PADDING;
                }
                
                // Zeichne farbige Segmente
                let currentX = textX;
                for (let seg of colorSegments) {
                    this.ctx.fillStyle = seg.color;
                    this.ctx.fillText(seg.text, currentX, textY);
                    currentX += this.ctx.measureText(seg.text).width;
                }
                
                // Blinkender Cursor an der richtigen Position
                if (chat.cursorBlink < 500) {
                    const cursorX = textX + textBeforeWidth;
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(cursorX, textY, 2, chatConfig.INPUT.LINE_HEIGHT);
                }
                
                this.ctx.restore();
            }
        }
        
        // Tooltip (wenn Inventar oder Crafting offen und über Item)
        if (input.inventoryOpen || input.craftingOpen) {
            const hoveredSlotData = input.getHoveredSlot(inventory, hotbar, this);
            if (hoveredSlotData.slotIndex !== -1) {
                let slot = null;
                
                // Crafting-Grid-Slot
                if (hoveredSlotData.isCrafting) {
                    const craftingSlotIndex = Math.abs(hoveredSlotData.slotIndex + 2000);
                    const craftingSlot = game.crafting.getGridSlot(craftingSlotIndex);
                    if (craftingSlot.item && craftingSlot.count > 0) {
                        slot = craftingSlot;
                    }
                }
                // Crafting-Result-Slot
                else if (hoveredSlotData.isCraftingResult) {
                    const resultSlot = game.crafting.getResultSlot();
                    if (resultSlot.item && resultSlot.count > 0) {
                        slot = resultSlot;
                    }
                }
                // Normal Inventar/Hotbar
                else {
                    slot = inventory.getSlot(hoveredSlotData.slotIndex);
                }
                
                if (slot && slot.item && slot.count > 0) {
                    this.renderTooltip(slot.item, hoveredSlotData);
                }
            }
        }
        
        // Pause-Menü (wenn ESC gedrückt)
        if (input.pauseOpen) {
            this.renderPauseMenu(input);
        }
        
        // Cursor NACH Pause-Menü rendern (damit er über allem ist)
        if (this.textures['cursor']) {
            const cursorX = mouse.x - 12 + mouse.shakeOffset.x;
            const cursorY = mouse.y - 12 + mouse.shakeOffset.y;
            let cursorTexture = this.textures['cursor'];
            
            // Cursor-Logik nur wenn alle Overlays geschlossen sind
            if (!input.inventoryOpen && !input.craftingOpen && !input.pauseOpen) {
                if (mouse.flashRed > 0) {
                    cursorTexture = this.textures['blocked-cursor'];
                } else if (mouse.hasBlockInSlot) {
                    cursorTexture = this.textures['cursor'];
                } else if (!mouse.inRange) {
                    cursorTexture = this.textures['blocked-cursor'];
                }
            }
            
            if (cursorTexture) {
                // Cursor immer sichtbar (auch in allen Overlays)
                this.ctx.globalAlpha = (input.inventoryOpen || input.craftingOpen || input.pauseOpen) ? 1 : mouse.cursorAlpha;
                this.ctx.drawImage(cursorTexture, cursorX, cursorY, 24, 24);
                this.ctx.globalAlpha = 1;
            }
        }
        
        // Zeichne Result-Slot Item am Cursor (auch außerhalb der Overlays)
        if (inventory.draggedSlot === -4000 && inventory.draggedItem) {
            const texture = this.textures[inventory.draggedItem.item];
            if (texture) {
                const dragItemSize = 32; // Größe des gezogenen Items
                const dragItemX = mouse.x - dragItemSize / 2;
                const dragItemY = mouse.y - dragItemSize / 2;
                
                this.ctx.drawImage(texture, dragItemX, dragItemY, dragItemSize, dragItemSize);
                
                // Zeichne Count
                if (inventory.draggedItem.count > 1) {
                    this.ctx.save();
                    this.ctx.font = '10px "Press Start 2P", monospace';
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 2;
                    this.ctx.textAlign = 'right';
                    this.ctx.textBaseline = 'bottom';
                    const countText = inventory.draggedItem.count.toString();
                    const countX = dragItemX + dragItemSize - 2;
                    const countY = dragItemY + dragItemSize - 2;
                    this.ctx.strokeText(countText, countX, countY);
                    this.ctx.fillText(countText, countX, countY);
                    this.ctx.restore();
                }
            }
        }
        
        // Debug-Overlay (F3)
        if (input.debugMode) {
            this.renderDebugOverlay(world, player, camera, mouse, hotbar, inventory, health, input);
        }
    }
    
    renderTooltip(itemName, slotData) {
        const item = ItemRegistry.getByName(itemName);
        if (!item || !this.textures['tooltip']) return;
        
        const config = CONFIG.TOOLTIP;
        
        this.ctx.save();
        this.ctx.font = `${config.FONT_SIZE}px "Press Start 2P", monospace`;
        
        // Tooltip-Inhalt vorbereiten
        const lines = [item.name];
        
        // Füge Stats hinzu wenn Tool
        if (item.category === 'tools') {
            if (item.damage) {
                lines.push(`Damage: ${item.damage}`);
            }
            if (item.miningSpeed) {
                lines.push(`Speed: ${item.miningSpeed}x`);
            }
        }
        
        // Berechne Tooltip-Größe basierend auf Text
        let maxWidth = 0;
        for (let line of lines) {
            const width = this.ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        }
        
        // Berechne finale Größe mit Padding und Minimum
        const tooltipWidth = Math.max(config.MIN_WIDTH, maxWidth + config.PADDING_X * 2);
        const tooltipHeight = Math.max(config.MIN_HEIGHT, lines.length * config.LINE_HEIGHT + config.PADDING_Y * 2);
        
        // Position: Mittig über dem Slot
        const slotCenterX = slotData.x + slotData.width / 2;
        let tooltipX = slotCenterX - tooltipWidth / 2;
        let tooltipY = slotData.y - tooltipHeight - 10; // 10px Abstand über dem Slot
        
        // Verhindere dass Tooltip aus dem Canvas läuft
        if (tooltipX < 5) {
            tooltipX = 5;
        }
        if (tooltipX + tooltipWidth > this.canvas.width - 5) {
            tooltipX = this.canvas.width - tooltipWidth - 5;
        }
        if (tooltipY < 5) {
            tooltipY = slotData.y + slotData.height + 10; // Unter dem Slot wenn kein Platz oben
        }
        
        // Zeichne Tooltip-Bild (gestreckt auf berechnete Größe)
        this.ctx.drawImage(this.textures['tooltip'], tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Text mit Schatten und zentriert
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // Berechne vertikale Zentrierung wenn aktiviert
        let startY = tooltipY + config.PADDING_Y;
        if (config.CENTER_VERTICALLY) {
            const totalTextHeight = lines.length * config.LINE_HEIGHT;
            const availableHeight = tooltipHeight - config.PADDING_Y * 2;
            startY = tooltipY + (tooltipHeight - totalTextHeight) / 2;
        }
        
        for (let i = 0; i < lines.length; i++) {
            const textX = tooltipX + tooltipWidth / 2;
            const textY = startY + i * config.LINE_HEIGHT;
            
            // Weicher Schatten
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            // Erste Zeile (Name) in Weiß, Rest in Grau
            if (i === 0) {
                this.ctx.fillStyle = '#FFFFFF';
            } else {
                this.ctx.fillStyle = '#AAAAAA';
            }
            
            this.ctx.fillText(lines[i], textX, textY);
        }
        
        this.ctx.restore();
    }
    
    renderDebugOverlay(world, player, camera, mouse, hotbar, inventory, health, input) {
            // Chunk-Grenzen zeichnen (ROT) - bis ganz nach unten
            this.ctx.save();
            this.ctx.scale(camera.zoom, camera.zoom);

            const startChunk = Math.floor((camera.x - CONFIG.BLOCK_SIZE) / (CONFIG.CHUNK_WIDTH * CONFIG.BLOCK_SIZE));
            const endChunk = Math.ceil((camera.x + this.canvas.width / camera.zoom + CONFIG.BLOCK_SIZE) / (CONFIG.CHUNK_WIDTH * CONFIG.BLOCK_SIZE));

            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            this.ctx.lineWidth = 3;

            for (let chunkX = startChunk; chunkX <= endChunk; chunkX++) {
                const worldX = chunkX * CONFIG.CHUNK_WIDTH * CONFIG.BLOCK_SIZE;
                const screenX = worldX - camera.x;

                this.ctx.beginPath();
                this.ctx.moveTo(screenX, 0 - camera.y);
                this.ctx.lineTo(screenX, CONFIG.WORLD_HEIGHT * CONFIG.BLOCK_SIZE - camera.y);
                this.ctx.stroke();
            }

            // Block-Raster (DUNKELBLAU)
            this.ctx.strokeStyle = 'rgba(0, 50, 150, 0.4)';
            this.ctx.lineWidth = 1;

            const minVisibleY = Math.max(0, Math.floor(camera.y / CONFIG.BLOCK_SIZE));
            const maxVisibleY = Math.min(CONFIG.WORLD_HEIGHT - 1, Math.ceil((camera.y + this.canvas.height / camera.zoom) / CONFIG.BLOCK_SIZE));

            for (let chunkX = startChunk; chunkX <= endChunk; chunkX++) {
                for (let x = 0; x < CONFIG.CHUNK_WIDTH; x++) {
                    const worldX = (chunkX * CONFIG.CHUNK_WIDTH + x) * CONFIG.BLOCK_SIZE;
                    const screenX = worldX - camera.x;

                    this.ctx.beginPath();
                    this.ctx.moveTo(screenX, minVisibleY * CONFIG.BLOCK_SIZE - camera.y);
                    this.ctx.lineTo(screenX, maxVisibleY * CONFIG.BLOCK_SIZE - camera.y);
                    this.ctx.stroke();
                }
            }

            for (let y = minVisibleY; y <= maxVisibleY; y++) {
                const worldY = y * CONFIG.BLOCK_SIZE;
                const screenY = worldY - camera.y;

                this.ctx.beginPath();
                this.ctx.moveTo(startChunk * CONFIG.CHUNK_WIDTH * CONFIG.BLOCK_SIZE - camera.x, screenY);
                this.ctx.lineTo((endChunk + 1) * CONFIG.CHUNK_WIDTH * CONFIG.BLOCK_SIZE - camera.x, screenY);
                this.ctx.stroke();
            }

            this.ctx.restore();

            // Player-Hitbox zeichnen (mit Kamera-Zoom)
            this.ctx.save();
            this.ctx.scale(camera.zoom, camera.zoom);
            
            const playerScreenX = player.x - camera.x;
            const playerScreenY = player.y - camera.y;
            const centerX = playerScreenX + player.width / 2;
            const centerY = playerScreenY + player.height / 2;
            
            // Range Distance als äußerer Raster-Rahmen (gelb, nur Außenränder)
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const rangeInBlocks = CONFIG.BREAK_RANGE; // 4 Blöcke
            
            // Berechne Player-Block-Position
            const playerBlockX = Math.floor(playerCenterX / CONFIG.BLOCK_SIZE);
            const playerBlockY = Math.floor(playerCenterY / CONFIG.BLOCK_SIZE);
            
            // Finde alle Blöcke in Reichweite
            const blocksInRange = new Set();
            for (let offsetX = -rangeInBlocks; offsetX <= rangeInBlocks; offsetX++) {
                for (let offsetY = -rangeInBlocks; offsetY <= rangeInBlocks; offsetY++) {
                    const blockX = playerBlockX + offsetX;
                    const blockY = playerBlockY + offsetY;
                    
                    // Berechne Distanz vom Player-Zentrum zu Block-Zentrum
                    const blockCenterX = blockX * CONFIG.BLOCK_SIZE + CONFIG.BLOCK_SIZE / 2;
                    const blockCenterY = blockY * CONFIG.BLOCK_SIZE + CONFIG.BLOCK_SIZE / 2;
                    const distance = Math.sqrt(
                        Math.pow(blockCenterX - playerCenterX, 2) + 
                        Math.pow(blockCenterY - playerCenterY, 2)
                    );
                    const distanceInBlocks = distance / CONFIG.BLOCK_SIZE;
                    
                    // Nur Blöcke in Reichweite sammeln
                    if (distanceInBlocks <= rangeInBlocks) {
                        blocksInRange.add(`${blockX},${blockY}`);
                    }
                }
            }
            
            // Erst die Füllung zeichnen (20% gelb)
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            for (const blockKey of blocksInRange) {
                const [blockX, blockY] = blockKey.split(',').map(Number);
                const screenX = blockX * CONFIG.BLOCK_SIZE - camera.x;
                const screenY = blockY * CONFIG.BLOCK_SIZE - camera.y;
                this.ctx.fillRect(screenX, screenY, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
            }
            
            // Dann die äußeren Ränder zeichnen
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; // Gelber Border
            this.ctx.lineWidth = 2;
            
            for (const blockKey of blocksInRange) {
                const [blockX, blockY] = blockKey.split(',').map(Number);
                const screenX = blockX * CONFIG.BLOCK_SIZE - camera.x;
                const screenY = blockY * CONFIG.BLOCK_SIZE - camera.y;
                
                // Prüfe welche Seiten Außenränder sind (keine Nachbarn in Range)
                const hasTop = !blocksInRange.has(`${blockX},${blockY - 1}`);
                const hasBottom = !blocksInRange.has(`${blockX},${blockY + 1}`);
                const hasLeft = !blocksInRange.has(`${blockX - 1},${blockY}`);
                const hasRight = !blocksInRange.has(`${blockX + 1},${blockY}`);
                
                // Zeichne nur die Außenränder
                this.ctx.beginPath();
                if (hasTop) {
                    this.ctx.moveTo(screenX, screenY);
                    this.ctx.lineTo(screenX + CONFIG.BLOCK_SIZE, screenY);
                }
                if (hasBottom) {
                    this.ctx.moveTo(screenX, screenY + CONFIG.BLOCK_SIZE);
                    this.ctx.lineTo(screenX + CONFIG.BLOCK_SIZE, screenY + CONFIG.BLOCK_SIZE);
                }
                if (hasLeft) {
                    this.ctx.moveTo(screenX, screenY);
                    this.ctx.lineTo(screenX, screenY + CONFIG.BLOCK_SIZE);
                }
                if (hasRight) {
                    this.ctx.moveTo(screenX + CONFIG.BLOCK_SIZE, screenY);
                    this.ctx.lineTo(screenX + CONFIG.BLOCK_SIZE, screenY + CONFIG.BLOCK_SIZE);
                }
                this.ctx.stroke();
            }
            
            // Koordinaten-Linien durch Player-Zentrum
            const coordPlayerScreenX = player.x - camera.x;
            const coordPlayerScreenY = player.y - camera.y;
            const coordCenterX = coordPlayerScreenX + player.width / 2;
            const coordCenterY = coordPlayerScreenY + player.height / 2;
            
            // Vertikale Linie (X-Koordinate) in Rot
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(coordCenterX, 0);
            this.ctx.lineTo(coordCenterX, this.canvas.height / camera.zoom);
            this.ctx.stroke();
            
            // Horizontale Linie (Y-Koordinate) in Blau
            this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(0, coordCenterY);
            this.ctx.lineTo(this.canvas.width / camera.zoom, coordCenterY);
            this.ctx.stroke();
            
            // Koordinaten-Text
            const blockX = Math.floor(playerCenterX / CONFIG.BLOCK_SIZE);
            const blockY = Math.floor(playerCenterY / CONFIG.BLOCK_SIZE);
            
            this.ctx.font = '8px "Press Start 2P", monospace';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.textAlign = 'center';
            
            // X-Koordinate Text (rot, an vertikaler Linie)
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
            this.ctx.strokeText(`X:${blockX}`, coordCenterX, 15);
            this.ctx.fillText(`X:${blockX}`, coordCenterX, 15);
            
            // Y-Koordinate Text (blau, an horizontaler Linie)
            this.ctx.fillStyle = 'rgba(0, 0, 255, 0.9)';
            this.ctx.save();
            this.ctx.translate(15, coordCenterY);
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.strokeText(`Y:${blockY}`, 0, 0);
            this.ctx.fillText(`Y:${blockY}`, 0, 0);
            this.ctx.restore();
            
            // Hitbox-Umriss (schwarzer Strich, 80% Sichtbarkeit, dünner)
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 1; // Dünner: 1px statt 2px
            this.ctx.strokeRect(playerScreenX, playerScreenY, player.width, player.height);
            
            // Player-Zentrum markieren (schwarzer Punkt, 80% Sichtbarkeit)
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(centerX - 1, centerY - 1, 2, 2);
            
            // Blickrichtung als waagerechter Strich (schwarz, 80% Sichtbarkeit, dünner)
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 1; // Dünner: 1px statt 2px
            this.ctx.beginPath();
            const directionLength = 25; // Länger für bessere Sichtbarkeit
            const directionY = playerScreenY + 12; // Etwas tiefer: 12px statt 8px
            const directionStartX = player.facingRight ? centerX + 5 : centerX - 5; // Startet außerhalb der Box
            const directionEndX = player.facingRight ? directionStartX + directionLength : directionStartX - directionLength;
            this.ctx.moveTo(directionStartX, directionY);
            this.ctx.lineTo(directionEndX, directionY);
            this.ctx.stroke();
            
            // Aktueller Animations-Frame als Text (viel kleiner)
            const animFrame = player.getAnimationFrame();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.font = '6px "Press Start 2P", monospace'; // Viel kleiner: 6px statt 10px
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            
            // Text über dem Player
            const textX = centerX;
            const textY = playerScreenY - 8; // Etwas weiter oben
            this.ctx.strokeText(animFrame, textX, textY);
            this.ctx.fillText(animFrame, textX, textY);
            
            this.ctx.restore();

            // Debug-Text LINKS unter Health Bar - nur Variablen farbig
            this.ctx.save();

            const selectedSlot = hotbar.getSelectedSlot();
            const slot = inventory.getSlot(selectedSlot);
            const itemInHand = slot.item || 'None';
            const itemCount = slot.count || 0;
            const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy).toFixed(2);
            const mouseBlockX = Math.floor(mouse.worldX / CONFIG.BLOCK_SIZE);
            const mouseBlockY = Math.floor(mouse.worldY / CONFIG.BLOCK_SIZE);

            // Position unter der Health Bar
            const healthConfig = CONFIG.HEALTH_BAR;
            const debugStartX = healthConfig.X + 10;
            let currentY = healthConfig.Y + 70; // 70px unter Health Bar Start

            this.ctx.font = '14px "Press Start 2P", monospace';
            this.ctx.strokeStyle = '#000000be';
            this.ctx.lineWidth = 3;
            
            // Hilfsfunktion: Text mit farbigen Variablen
            const drawLine = (label, value, valueColor) => {
                // Label in Weiß
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.strokeText(label, debugStartX, currentY);
                this.ctx.fillText(label, debugStartX, currentY);
                
                // Wert in Farbe
                const labelWidth = this.ctx.measureText(label).width;
                this.ctx.fillStyle = valueColor;
                this.ctx.strokeText(value, debugStartX + labelWidth, currentY);
                this.ctx.fillText(value, debugStartX + labelWidth, currentY);
                
                currentY += 16;
            };

            // Block in Hand
            drawLine('Block in Hand: ', itemInHand, itemInHand !== 'None' ? '#00FF00' : '#FFFFFF');
            drawLine('Count: ', itemCount.toString(), '#FFFFFF');
            drawLine('Item ID: ', slot.item ? ItemRegistry.getByName(slot.item).id.toString() : 'N/A', '#AAAAAA');
            currentY += 4; // Extra Abstand
            
            // Health
            const healthValue = `${health ? health.currentHealth : 'undefined'} / ${health ? health.maxHealth : 'undefined'}`;
            drawLine('Health: ', healthValue, '#FF0000');
            drawLine('Speed: ', speed, parseFloat(speed) > 0 ? '#FFFF00' : '#FFFFFF');
            drawLine('Velocity: ', `${player.vx.toFixed(2)} / ${player.vy.toFixed(2)}`, '#FFFFFF');
            drawLine('On Ground: ', player.onGround.toString(), player.onGround ? '#00FF00' : '#FF0000');
            drawLine('Facing: ', player.facingRight ? 'Right' : 'Left', '#FFFFFF');
            currentY += 4; // Extra Abstand
            
            // Camera
            drawLine('Camera: ', `${camera.x.toFixed(2)} / ${camera.y.toFixed(2)}`, '#AAAAAA');
            drawLine('Zoom: ', `${camera.zoom.toFixed(2)}x (Level ${camera.zoomLevel})`, '#00FFFF');
            currentY += 4; // Extra Abstand
            
            // Mouse
            drawLine('Mouse: ', `${mouse.worldX.toFixed(2)} / ${mouse.worldY.toFixed(2)}`, '#AAAAAA');
            drawLine('Block: ', `${mouseBlockX} / ${mouseBlockY}`, '#AAAAAA');
            drawLine('In Range: ', mouse.inRange.toString(), mouse.inRange ? '#00FF00' : '#FF0000');
            currentY += 4; // Extra Abstand
            
            // System
            drawLine('Loaded Chunks: ', world.chunks.size.toString(), '#FFFF00');
            drawLine('Broken Blocks: ', world.brokenBlocks.size.toString(), world.brokenBlocks.size <= 50 ? '#00FF00' : '#FFFF00');
            drawLine('Animations: ', world.breakAnimations.length.toString(), world.breakAnimations.length <= 20 ? '#00FF00' : '#FFFF00');
            drawLine('Item Drops: ', game.itemDrops.getItemCount().toString(), game.itemDrops.getItemCount() <= 30 ? '#00FF00' : '#FFFF00');
            drawLine('Particles: ', game.particleSystem.getParticleCount().toString(), game.particleSystem.getParticleCount() <= 100 ? '#00FF00' : '#FFFF00');
            currentY += 4; // Extra Abstand
            
            // Memory-Statistiken (wenn verfügbar)
            if (performance.memory) {
                const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                const totalMB = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
                const limitMB = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
                
                // Berechne Prozentsatz der Nutzung
                const usagePercent = Math.round((usedMB / limitMB) * 100);
                
                // Farbe basierend auf Speicherverbrauch
                let memoryColor = '#00FF00'; // Grün für niedrig
                if (usagePercent > 70) {
                    memoryColor = '#FF0000'; // Rot für hoch
                } else if (usagePercent > 50) {
                    memoryColor = '#FFFF00'; // Gelb für mittel
                }
                
                drawLine('Memory: ', `${usedMB}MB / ${limitMB}MB (${usagePercent}%)`, memoryColor);
                drawLine('Heap Total: ', `${totalMB}MB`, '#AAAAAA');
            } else {
                drawLine('Memory: ', 'Not Available', '#888888');
            }
            
            const fps = Math.round(1000 / (Date.now() - (this.lastFrameTime || Date.now()) || 16));
            drawLine('VSync FPS: ', fps.toString(), fps >= 60 ? '#00FF00' : (fps >= 30 ? '#FFFF00' : '#FF0000'));
            
            const rawFps = game.rawFps || 0;
            drawLine('Raw FPS: ', rawFps.toString(), '#00BFFF');

            this.ctx.restore();
            this.lastFrameTime = Date.now();
        }
    
    updateDayNightCycle(deltaTime) {
        if (!CONFIG.DAY_NIGHT_CYCLE.ENABLED) return;
        
        // Update Zeit (0 bis 1)
        this.dayTime += deltaTime / CONFIG.DAY_NIGHT_CYCLE.CYCLE_DURATION;
        if (this.dayTime >= 1) {
            this.dayTime -= 1;
        }
    }
    
    getSkyColors() {
        const time = this.dayTime;
        const config = CONFIG.DAY_NIGHT_CYCLE;
        
        // Definiere Farben für verschiedene Tageszeiten (nie ganz schwarz)
        const colors = {
            night: { top: '#1a1a3a', bottom: '#2a2a4e' },      // Dunkelblaue Nacht (nicht schwarz)
            sunrise: { top: '#ff6b35', bottom: '#ffd93d' },    // Orange/Gelb
            day: { top: '#87CEEB', bottom: '#b8e6ff' },        // Helles Blau
            sunset: { top: '#ff6b35', bottom: '#ff8c42' },     // Orange
        };
        
        let topColor, bottomColor;
        
        if (time < config.SUNRISE_TIME) {
            // Nacht bis Sonnenaufgang
            const t = time / config.SUNRISE_TIME;
            topColor = this.lerpColor(colors.night.top, colors.sunrise.top, t);
            bottomColor = this.lerpColor(colors.night.bottom, colors.sunrise.bottom, t);
        } else if (time < 0.3) {
            // Sonnenaufgang bis Tag
            const t = (time - config.SUNRISE_TIME) / 0.1;
            topColor = this.lerpColor(colors.sunrise.top, colors.day.top, t);
            bottomColor = this.lerpColor(colors.sunrise.bottom, colors.day.bottom, t);
        } else if (time < config.SUNSET_TIME) {
            // Tag
            topColor = colors.day.top;
            bottomColor = colors.day.bottom;
        } else if (time < 0.8) {
            // Sonnenuntergang
            const t = (time - config.SUNSET_TIME) / 0.1;
            topColor = this.lerpColor(colors.day.top, colors.sunset.top, t);
            bottomColor = this.lerpColor(colors.day.bottom, colors.sunset.bottom, t);
        } else {
            // Sonnenuntergang bis Nacht
            const t = (time - 0.8) / 0.2;
            topColor = this.lerpColor(colors.sunset.top, colors.night.top, t);
            bottomColor = this.lerpColor(colors.sunset.bottom, colors.night.bottom, t);
        }
        
        return { top: topColor, bottom: bottomColor };
    }
    
    getDarkness() {
        if (!CONFIG.DAY_NIGHT_CYCLE.ENABLED) return 0;
        
        const time = this.dayTime;
        const config = CONFIG.DAY_NIGHT_CYCLE;
        const maxDarkness = 1 - config.NIGHT_DARKNESS; // 0.65 -> 0.35 Dunkelheit
        
        // Berechne Dunkelheit basierend auf Tageszeit
        if (time < config.SUNRISE_TIME) {
            // Nacht bis Sonnenaufgang
            const t = time / config.SUNRISE_TIME;
            return (1 - t) * maxDarkness;
        } else if (time < 0.3) {
            // Sonnenaufgang bis Tag
            return 0;
        } else if (time < config.SUNSET_TIME) {
            // Tag
            return 0;
        } else if (time < 0.8) {
            // Sonnenuntergang
            const t = (time - config.SUNSET_TIME) / 0.1;
            return t * maxDarkness * 0.5;
        } else {
            // Sonnenuntergang bis Nacht
            const t = (time - 0.8) / 0.2;
            return 0.5 * maxDarkness + t * 0.5 * maxDarkness;
        }
    }
    
    lerpColor(color1, color2, t) {
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
    
    
    renderPauseMenu(input) {
        // Schwarzes Overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title-Logo zentriert oben (viel kleiner für das neue große title.png)
        if (this.textures['title']) {
            const logoScale = 0.3; // Viel kleiner: 0.3 statt 1 für das neue große title.png
            const logoWidth = this.textures['title'].width * logoScale;
            const logoHeight = this.textures['title'].height * logoScale;
            const logoX = (this.canvas.width - logoWidth) / 2;
            const logoY = this.canvas.height * 0.25; // 25% von oben
            
            this.ctx.drawImage(this.textures['title'], logoX, logoY, logoWidth, logoHeight);
        }
        
        // Leave Button
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        const buttonY = this.canvas.height * 0.6; // 60% von oben
        
        // Speichere Button-Position für Klick-Erkennung
        input.pauseLeaveButton = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
        
        // Prüfe ob Maus über Button ist
        const isHovered = input.mouse.x >= buttonX && input.mouse.x <= buttonX + buttonWidth &&
                         input.mouse.y >= buttonY && input.mouse.y <= buttonY + buttonHeight;
        
        // Button-Hintergrund (heller wenn gehovered)
        this.ctx.fillStyle = isHovered ? 'rgba(100, 100, 100, 0.9)' : 'rgba(60, 60, 60, 0.9)';
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button-Border
        this.ctx.strokeStyle = isHovered ? '#FFFFFF' : '#AAAAAA';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button-Text
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Leave Game', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    }
    
    drawPixelatedGradient(colors) {
        const pixelSize = 32; // Größe der "Pixel" für den Gradient (größer = pixeliger)
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colorSteps = 8; // Anzahl der Farbstufen (weniger = pixeliger)
        
        for (let y = 0; y < height; y += pixelSize) {
            const t = y / height;
            // Quantisiere t auf colorSteps Stufen für pixelige Farbübergänge
            const quantizedT = Math.floor(t * colorSteps) / colorSteps;
            const color = this.lerpColor(colors.top, colors.bottom, quantizedT);
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, y, width, pixelSize);
        }
    }
}
