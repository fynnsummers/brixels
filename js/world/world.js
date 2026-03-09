// Welt-Generierung und Chunk-Management

class World {
    constructor() {
        this.chunks = new Map();
        this.brokenBlocks = new Set(); // Speichert zerstörte Blöcke als "chunkX,localX,y"
        this.breakAnimations = []; // { blockX, blockY, startTime, duration }
    }
    
    getBlockKey(blockX, blockY) {
        const chunkX = Math.floor(blockX / CONFIG.CHUNK_WIDTH);
        const localX = blockX - chunkX * CONFIG.CHUNK_WIDTH;
        return `${chunkX},${localX},${blockY}`;
    }
    
    placeBlock(blockX, blockY, blockType) {
        const key = this.getBlockKey(blockX, blockY);
        
        // Entferne Block aus der "broken" Liste falls vorhanden
        this.brokenBlocks.delete(key);
        
        // Füge Block zum Chunk hinzu oder ersetze existierenden Block
        const chunkX = Math.floor(blockX / CONFIG.CHUNK_WIDTH);
        const chunk = this.generateChunk(chunkX);
        const localX = blockX - chunkX * CONFIG.CHUNK_WIDTH;
        
        if (localX >= 0 && localX < CONFIG.CHUNK_WIDTH && blockY >= 0 && blockY < CONFIG.WORLD_HEIGHT) {
            chunk[localX][blockY] = blockType;
        }
    }
    
    breakBlock(blockX, blockY, blockType) {
        const key = this.getBlockKey(blockX, blockY);
        
        // Prüfe ob Block bereits zerstört ist
        if (this.brokenBlocks.has(key)) return;
        
        this.brokenBlocks.add(key);
        
        // Break-Animation hinzufügen
        this.breakAnimations.push({
            blockX: blockX,
            blockY: blockY,
            blockType: blockType,
            startTime: Date.now(),
            duration: CONFIG.BREAK_ANIMATION_DURATION
        });
        
        // Wenn dirt-grass abgebaut wird, entferne auch grass darüber
        if (blockType === 'dirt-grass') {
            const grassAbove = this.getBlockAtCoords(blockX, blockY - 1);
            if (grassAbove === 'grass') {
                const grassKey = this.getBlockKey(blockX, blockY - 1);
                
                if (!this.brokenBlocks.has(grassKey)) {
                    this.brokenBlocks.add(grassKey);
                    
                    this.breakAnimations.push({
                        blockX: blockX,
                        blockY: blockY - 1,
                        blockType: 'grass',
                        startTime: Date.now(),
                        duration: CONFIG.BREAK_ANIMATION_DURATION
                    });
                }
            }
        }
        
        // Wenn tree Block abgebaut wird, prüfe ob dirt-grass-tree darunter ist
        if (blockType === 'tree') {
            const blockBelow = this.getBlockAtCoords(blockX, blockY + 1);
            if (blockBelow === 'dirt-grass-tree') {
                // Ändere dirt-grass-tree zu dirt-grass
                const chunkX = Math.floor(blockX / CONFIG.CHUNK_WIDTH);
                const chunk = this.chunks.get(chunkX);
                if (chunk) {
                    const localX = blockX - chunkX * CONFIG.CHUNK_WIDTH;
                    if (localX >= 0 && localX < CONFIG.CHUNK_WIDTH) {
                        chunk[localX][blockY + 1] = 'dirt-grass';
                    }
                }
            }
            
            // Baum-Kollaps: Alle Baum-Blöcke darüber fallen automatisch
            this.scheduleTreeCollapse(blockX, blockY);
        }
        
        // Wenn tree-head, tree-leaves oder dirt-grass-tree abgebaut wird, starte auch Kollaps
        if (blockType === 'tree-head' || blockType === 'tree-leaves' || blockType === 'dirt-grass-tree') {
            this.scheduleTreeCollapse(blockX, blockY);
        }
    }
    
    scheduleTreeCollapse(startX, startY) {
        // Finde alle verbundenen Baum-Blöcke über dieser Position
        const treeBlocks = [];
        const visited = new Set();
        
        // Suche nach oben für tree, tree-head, tree-leaves
        for (let y = startY - 1; y >= 0; y--) {
            const blockType = this.getBlockAtCoords(startX, y);
            if (blockType === 'tree' || blockType === 'tree-head' || blockType === 'tree-leaves') {
                const key = `${startX},${y}`;
                if (!visited.has(key)) {
                    treeBlocks.push({ x: startX, y: y, type: blockType });
                    visited.add(key);
                }
            } else {
                break; // Stoppe wenn kein Baum-Block mehr
            }
        }
        
        // Suche ALLE Leaves rekursiv - nicht nur direkt neben tree-head
        // Starte mit allen gefundenen tree-head und tree-leaves Blöcken
        let searchQueue = [...treeBlocks.filter(b => b.type === 'tree-head' || b.type === 'tree-leaves')];
        let searchIndex = 0;
        
        while (searchIndex < searchQueue.length) {
            const current = searchQueue[searchIndex];
            searchIndex++;
            
            // Prüfe alle 8 Richtungen (horizontal, vertikal, diagonal)
            for (let offsetX = -2; offsetX <= 2; offsetX++) {
                for (let offsetY = -2; offsetY <= 2; offsetY++) {
                    if (offsetX === 0 && offsetY === 0) continue;
                    
                    const checkX = current.x + offsetX;
                    const checkY = current.y + offsetY;
                    const key = `${checkX},${checkY}`;
                    
                    if (!visited.has(key)) {
                        const checkType = this.getBlockAtCoords(checkX, checkY);
                        
                        if (checkType === 'tree-leaves') {
                            visited.add(key);
                            const newBlock = { x: checkX, y: checkY, type: checkType };
                            treeBlocks.push(newBlock);
                            searchQueue.push(newBlock); // Suche weiter von diesem Leaf aus
                        }
                    }
                }
            }
        }
        
        // Baue Blöcke von UNTEN nach OBEN ab (realistischer Fall)
        if (!this.treeCollapseQueue) {
            this.treeCollapseQueue = [];
        }
        
        // Sortiere von UNTEN nach OBEN
        // WICHTIG: Höhere Y-Werte = weiter unten im Spiel (Y wächst nach unten)
        // Also: Höhere Y-Werte zuerst (b.y - a.y) = von unten nach oben
        treeBlocks.sort((a, b) => {
            // Erst nach Y sortieren (unten nach oben = höhere Y zuerst)
            if (a.y !== b.y) return b.y - a.y;
            // Bei gleicher Y-Koordinate: Sortiere nach Abstand vom Stamm (Mitte zuerst)
            const distA = Math.abs(a.x - startX);
            const distB = Math.abs(b.x - startX);
            return distA - distB;
        });
        
        // Füge zur Queue hinzu mit Zeitstempel
        const baseTime = Date.now();
        let delayIndex = 0;
        
        treeBlocks.forEach((block) => {
            // Berechne Delay basierend auf Typ und Abstand vom Stamm
            let delay = 100; // Standard für tree und tree-head
            
            if (block.type === 'tree-leaves') {
                // Leaves: Basis-Delay 150ms + extra Delay für äußere Leaves
                const distanceFromCenter = Math.abs(block.x - startX);
                delay = 150 + (distanceFromCenter * 50); // 150ms, 200ms, 250ms je nach Abstand
            }
            
            this.treeCollapseQueue.push({
                x: block.x,
                y: block.y,
                type: block.type,
                breakTime: baseTime + (delayIndex * delay)
            });
            
            delayIndex++;
        });
    }
    
    updateTreeCollapse() {
        if (!this.treeCollapseQueue || this.treeCollapseQueue.length === 0) return;
        
        const now = Date.now();
        const toRemove = [];
        
        for (let i = 0; i < this.treeCollapseQueue.length; i++) {
            const collapse = this.treeCollapseQueue[i];
            
            if (now >= collapse.breakTime) {
                const key = this.getBlockKey(collapse.x, collapse.y);
                
                // Prüfe ob Block noch existiert und nicht bereits zerstört
                if (!this.brokenBlocks.has(key)) {
                    const currentBlock = this.getBlockAtCoords(collapse.x, collapse.y);
                    if (currentBlock === collapse.type) {
                        // Baue Block ab
                        this.brokenBlocks.add(key);
                        
                        // Animation
                        this.breakAnimations.push({
                            blockX: collapse.x,
                            blockY: collapse.y,
                            blockType: collapse.type,
                            startTime: now,
                            duration: CONFIG.BREAK_ANIMATION_DURATION
                        });
                        
                        // Trigger für Item-Drop und Partikel (wird im Game-Loop behandelt)
                        if (!this.treeCollapseDrops) {
                            this.treeCollapseDrops = [];
                        }
                        this.treeCollapseDrops.push({
                            x: collapse.x,
                            y: collapse.y,
                            type: collapse.type
                        });
                    }
                }
                
                toRemove.push(i);
            }
        }
        
        // Entferne verarbeitete Einträge (von hinten nach vorne)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.treeCollapseQueue.splice(toRemove[i], 1);
        }
    }
    
    getTreeCollapseDrops() {
        if (!this.treeCollapseDrops) return [];
        const drops = [...this.treeCollapseDrops];
        this.treeCollapseDrops = [];
        return drops;
    }

    
    isBlockBroken(blockX, blockY) {
        const key = this.getBlockKey(blockX, blockY);
        return this.brokenBlocks.has(key);
    }
    
    getBlockAtCoords(blockX, blockY) {
        if (blockY < 0 || blockY >= CONFIG.WORLD_HEIGHT) return null;
        if (this.isBlockBroken(blockX, blockY)) return null;
        
        const chunkX = Math.floor(blockX / CONFIG.CHUNK_WIDTH);
        const chunk = this.generateChunk(chunkX);
        const localX = blockX - chunkX * CONFIG.CHUNK_WIDTH;
        
        if (localX < 0 || localX >= CONFIG.CHUNK_WIDTH) return null;
        
        return chunk[localX][blockY];
    }
    
    updateAnimations() {
        const now = Date.now();
        this.breakAnimations = this.breakAnimations.filter(anim => {
            return (now - anim.startTime) < anim.duration;
        });
        
        // Update Tree Collapse
        this.updateTreeCollapse();
    }
    
    getBreakAnimations() {
        return this.breakAnimations;
    }
    
    getAnimationProgress(blockX, blockY) {
        const anim = this.breakAnimations.find(a => a.blockX === blockX && a.blockY === blockY);
        if (!anim) return null;
        
        const elapsed = Date.now() - anim.startTime;
        return Math.min(elapsed / anim.duration, 1);
    }
    
    generateChunk(chunkX) {
        if (this.chunks.has(chunkX)) return this.chunks.get(chunkX);
        
        const chunk = [];
        const seed = chunkX * 1000;
        const heights = []; // Speichere Höhen für Glättung
        
        // Erste Pass: Berechne alle Höhen mit verbessertem Noise
        for (let x = 0; x < CONFIG.CHUNK_WIDTH; x++) {
            const worldX = chunkX * CONFIG.CHUNK_WIDTH + x;
            
            // Multi-Layer Noise für natürliches Terrain
            const baseNoise = Math.sin(worldX * CONFIG.TERRAIN.BASE_FREQUENCY + seed * 0.001) * CONFIG.TERRAIN.BASE_AMPLITUDE;
            const detailNoise = Math.sin(worldX * CONFIG.TERRAIN.DETAIL_FREQUENCY + seed * 0.01) * CONFIG.TERRAIN.DETAIL_AMPLITUDE;
            const mountainNoise = Math.sin(worldX * CONFIG.TERRAIN.MOUNTAIN_FREQUENCY + seed * 0.0001) * CONFIG.TERRAIN.MOUNTAIN_AMPLITUDE;
            
            // Zusätzliche Variation für natürlichere Hügel
            const variation1 = Math.sin(worldX * 0.03 + seed * 0.002) * 0.5;
            const variation2 = Math.cos(worldX * 0.06 + seed * 0.005) * 0.3;
            
            const totalNoise = baseNoise + detailNoise + mountainNoise + variation1 + variation2;
            const rawHeight = CONFIG.MIN_HEIGHT + (CONFIG.MAX_HEIGHT - CONFIG.MIN_HEIGHT) / 2 + totalNoise;
            heights.push(rawHeight);
        }
        
        // Zweite Pass: Mehrfache Glättung für sanfte Hügel
        let smoothedHeights = [...heights];
        for (let pass = 0; pass < CONFIG.TERRAIN.SMOOTHING_PASSES; pass++) {
            const tempHeights = [...smoothedHeights];
            for (let x = 1; x < CONFIG.CHUNK_WIDTH - 1; x++) {
                // Durchschnitt mit Nachbarn für sanfte Übergänge
                tempHeights[x] = (smoothedHeights[x - 1] + smoothedHeights[x] * 2 + smoothedHeights[x + 1]) / 4;
            }
            smoothedHeights = tempHeights;
        }
        
        // Dritte Pass: Begrenze Höhenänderung für kletterbare Steigungen
        const finalHeights = [Math.floor(smoothedHeights[0])];
        for (let x = 1; x < CONFIG.CHUNK_WIDTH; x++) {
            const targetHeight = Math.floor(smoothedHeights[x]);
            const heightDiff = targetHeight - finalHeights[x - 1];
            
            // Wenn zu steil, reduziere auf max Änderung
            if (Math.abs(heightDiff) > CONFIG.TERRAIN.MAX_HEIGHT_CHANGE) {
                if (heightDiff > 0) {
                    finalHeights.push(finalHeights[x - 1] + CONFIG.TERRAIN.MAX_HEIGHT_CHANGE);
                } else {
                    finalHeights.push(finalHeights[x - 1] - CONFIG.TERRAIN.MAX_HEIGHT_CHANGE);
                }
            } else {
                finalHeights.push(targetHeight);
            }
        }
        
        // Vierte Pass: Erstelle Chunks mit geglätteten Höhen und Ore-Adern
        const oreVeins = new Set(); // Speichere Ore-Positionen für Adern
        const graniteBlocks = new Set(); // Speichere Granit-Positionen
        const dioriteBlocks = new Set(); // Speichere Diorit-Positionen
        
        for (let x = 0; x < CONFIG.CHUNK_WIDTH; x++) {
            const surfaceHeight = finalHeights[x];
            
            const column = [];
            for (let y = 0; y < CONFIG.WORLD_HEIGHT; y++) {
                let blockType = null;
                
                // Bedrock an der untersten Schicht (Y = CONFIG.WORLD_HEIGHT - 1)
                if (y === CONFIG.WORLD_HEIGHT - 1) {
                    blockType = 'bedrock';
                } else if (y === surfaceHeight) {
                    blockType = 'grass';
                } else if (y === surfaceHeight + 1) {
                    blockType = 'dirt-grass';
                } else if (y > surfaceHeight + 1 && y <= surfaceHeight + 1 + CONFIG.STONE_DEPTH) {
                    blockType = 'dirt';
                } else if (y > surfaceHeight + 1 + CONFIG.STONE_DEPTH) {
                    blockType = 'stone';
                    
                    const blockX = chunkX * CONFIG.CHUNK_WIDTH + x;
                    const veinKey = `${blockX},${y}`;
                    
                    // Granit-Adern - große, lange und breite Cluster in Steinschicht (auch nahe der Oberfläche)
                    // Kann ab 10 Blöcken unter Dirt spawnen
                    const depthBelowDirt = y - (surfaceHeight + 1 + CONFIG.STONE_DEPTH);
                    const graniteSeed = blockX * 6000 + y * 600;
                    
                    // Höhere Spawn-Chance (3%) und spawnt auch nahe der Oberfläche
                    if (depthBelowDirt >= 0 && seededRandom(graniteSeed) < 0.03 && graniteBlocks.size === 0) {
                        // Erstelle sehr große Granit-Ader (30-50 Blöcke)
                        const veinSize = Math.floor(seededRandom(graniteSeed + 1) * 21) + 30; // 30-50 Blöcke
                        blockType = 'granite';
                        graniteBlocks.add(veinKey);
                        
                        // Starte mit einer längeren Basis-Linie (horizontal oder vertikal)
                        const isHorizontal = seededRandom(graniteSeed + 2) > 0.5;
                        const baseLength = Math.floor(seededRandom(graniteSeed + 3) * 12) + 10; // 10-21 Blöcke Basis
                        
                        // Erstelle Basis-Linie
                        for (let i = 1; i <= baseLength && graniteBlocks.size < 50; i++) {
                            const baseKey = isHorizontal ? `${blockX + i},${y}` : `${blockX},${y + i}`;
                            if (!oreVeins.has(baseKey)) {
                                graniteBlocks.add(baseKey);
                            }
                        }
                        
                        // Verdicke die Ader stark in alle Richtungen (2 Blöcke dick)
                        const allGraniteBlocks = Array.from(graniteBlocks);
                        for (let baseBlock of allGraniteBlocks) {
                            if (graniteBlocks.size >= 50) break;
                            
                            const [bx, by] = baseBlock.split(',').map(Number);
                            
                            // Füge Blöcke in alle Richtungen hinzu für große Breite
                            const thickenDirs = [
                                {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1},
                                {x: 1, y: 1}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1},
                                {x: 2, y: 0}, {x: -2, y: 0}, {x: 0, y: 2}, {x: 0, y: -2} // 2 Blöcke entfernt
                            ];
                            
                            for (let dir of thickenDirs) {
                                if (graniteBlocks.size >= 50) break;
                                
                                // 90% Chance für direkte Nachbarn, 70% für diagonale, 50% für 2 Blöcke entfernt
                                let chance = 0.9;
                                if (dir.x !== 0 && dir.y !== 0) chance = 0.7; // diagonal
                                if (Math.abs(dir.x) === 2 || Math.abs(dir.y) === 2) chance = 0.5; // 2 Blöcke entfernt
                                
                                if (seededRandom(graniteSeed + bx + by + dir.x * 100 + dir.y * 200) < chance) {
                                    const thickenKey = `${bx + dir.x},${by + dir.y}`;
                                    if (!graniteBlocks.has(thickenKey) && !oreVeins.has(thickenKey)) {
                                        graniteBlocks.add(thickenKey);
                                    }
                                }
                            }
                        }
                        
                        // Füge mehr Verzweigungen hinzu für natürlichere Form
                        const currentBlocks = Array.from(graniteBlocks);
                        for (let i = 0; i < currentBlocks.length && graniteBlocks.size < 50; i++) {
                            const [bx, by] = currentBlocks[i].split(',').map(Number);
                            
                            // 50% Chance für eine Verzweigung (mehr Verzweigungen)
                            if (seededRandom(graniteSeed + bx * 10 + by * 20) < 0.5) {
                                const branchLength = Math.floor(seededRandom(graniteSeed + bx + by) * 6) + 3; // 3-8 Blöcke
                                const branchDir = Math.floor(seededRandom(graniteSeed + bx * 2 + by * 3) * 4);
                                const dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
                                const dir = dirs[branchDir];
                                
                                for (let j = 1; j <= branchLength && graniteBlocks.size < 50; j++) {
                                    const branchKey = `${bx + dir.x * j},${by + dir.y * j}`;
                                    if (!graniteBlocks.has(branchKey) && !oreVeins.has(branchKey)) {
                                        graniteBlocks.add(branchKey);
                                    }
                                }
                            }
                        }
                    }
                    
                    // Diorit-Adern - große, lange und breite Cluster in Steinschicht (maximal 36 Blöcke pro Chunk)
                    // Prüfe Abstand zu Granit-Adern (mindestens 15 Blöcke Abstand)
                    let tooCloseToGranite = false;
                    for (let checkDist = -15; checkDist <= 15; checkDist++) {
                        for (let checkDistY = -15; checkDistY <= 15; checkDistY++) {
                            const checkKey = `${blockX + checkDist},${y + checkDistY}`;
                            if (graniteBlocks.has(checkKey)) {
                                tooCloseToGranite = true;
                                break;
                            }
                        }
                        if (tooCloseToGranite) break;
                    }
                    
                    const dioriteSeed = blockX * 7000 + y * 700;
                    
                    // Höhere Spawn-Chance (3%) und spawnt auch nahe der Oberfläche
                    if (!tooCloseToGranite && depthBelowDirt >= 0 && seededRandom(dioriteSeed) < 0.03 && dioriteBlocks.size === 0 && blockType === 'stone') {
                        // Erstelle sehr große Diorit-Ader (30-50 Blöcke)
                        const veinSize = Math.floor(seededRandom(dioriteSeed + 1) * 21) + 30; // 30-50 Blöcke
                        blockType = 'diorite';
                        dioriteBlocks.add(veinKey);
                        
                        // Starte mit einer längeren Basis-Linie (horizontal oder vertikal)
                        const isHorizontal = seededRandom(dioriteSeed + 2) > 0.5;
                        const baseLength = Math.floor(seededRandom(dioriteSeed + 3) * 12) + 10; // 10-21 Blöcke Basis
                        
                        // Erstelle Basis-Linie
                        for (let i = 1; i <= baseLength && dioriteBlocks.size < 50; i++) {
                            const baseKey = isHorizontal ? `${blockX + i},${y}` : `${blockX},${y + i}`;
                            if (!oreVeins.has(baseKey) && !graniteBlocks.has(baseKey)) {
                                dioriteBlocks.add(baseKey);
                            }
                        }
                        
                        // Verdicke die Ader stark in alle Richtungen (2 Blöcke dick)
                        const allDioriteBlocks = Array.from(dioriteBlocks);
                        for (let baseBlock of allDioriteBlocks) {
                            if (dioriteBlocks.size >= 50) break;
                            
                            const [bx, by] = baseBlock.split(',').map(Number);
                            
                            // Füge Blöcke in alle Richtungen hinzu für große Breite
                            const thickenDirs = [
                                {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1},
                                {x: 1, y: 1}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1},
                                {x: 2, y: 0}, {x: -2, y: 0}, {x: 0, y: 2}, {x: 0, y: -2} // 2 Blöcke entfernt
                            ];
                            
                            for (let dir of thickenDirs) {
                                if (dioriteBlocks.size >= 50) break;
                                
                                // 90% Chance für direkte Nachbarn, 70% für diagonale, 50% für 2 Blöcke entfernt
                                let chance = 0.9;
                                if (dir.x !== 0 && dir.y !== 0) chance = 0.7; // diagonal
                                if (Math.abs(dir.x) === 2 || Math.abs(dir.y) === 2) chance = 0.5; // 2 Blöcke entfernt
                                
                                if (seededRandom(dioriteSeed + bx + by + dir.x * 100 + dir.y * 200) < chance) {
                                    const thickenKey = `${bx + dir.x},${by + dir.y}`;
                                    if (!dioriteBlocks.has(thickenKey) && !oreVeins.has(thickenKey) && !graniteBlocks.has(thickenKey)) {
                                        dioriteBlocks.add(thickenKey);
                                    }
                                }
                            }
                        }
                        
                        // Füge mehr Verzweigungen hinzu für natürlichere Form
                        const currentBlocks = Array.from(dioriteBlocks);
                        for (let i = 0; i < currentBlocks.length && dioriteBlocks.size < 50; i++) {
                            const [bx, by] = currentBlocks[i].split(',').map(Number);
                            
                            // 50% Chance für eine Verzweigung (mehr Verzweigungen)
                            if (seededRandom(dioriteSeed + bx * 10 + by * 20) < 0.5) {
                                const branchLength = Math.floor(seededRandom(dioriteSeed + bx + by) * 6) + 3; // 3-8 Blöcke
                                const branchDir = Math.floor(seededRandom(dioriteSeed + bx * 2 + by * 3) * 4);
                                const dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
                                const dir = dirs[branchDir];
                                
                                for (let j = 1; j <= branchLength && dioriteBlocks.size < 50; j++) {
                                    const branchKey = `${bx + dir.x * j},${by + dir.y * j}`;
                                    if (!dioriteBlocks.has(branchKey) && !oreVeins.has(branchKey) && !graniteBlocks.has(branchKey)) {
                                        dioriteBlocks.add(branchKey);
                                    }
                                }
                            }
                        }
                    }
                    
                    // Prüfe ob dieser Block Teil einer Granit- oder Diorit-Ader ist
                    if (graniteBlocks.has(veinKey)) {
                        blockType = 'granite';
                    } else if (dioriteBlocks.has(veinKey)) {
                        blockType = 'diorite';
                    }
                    
                    // Nur Erze generieren wenn noch Stone
                    if (blockType === 'stone') {
                    
                    // Coal Ore - weniger häufig (1% statt 1.5%), in kleinen Adern von 3-5 Blöcken
                    const coalSeed = blockX * 1000 + y * 100;
                    if (seededRandom(coalSeed) < 0.01 && !oreVeins.has(veinKey)) {
                        // Erstelle Coal-Ader (3-5 Blöcke in zufälligen Richtungen)
                        const veinSize = Math.floor(seededRandom(coalSeed + 1) * 3) + 3; // 3-5 Blöcke
                        blockType = 'coalore';
                        oreVeins.add(veinKey);
                        
                        // Füge benachbarte Blöcke in verschiedene Richtungen hinzu
                        let added = 1;
                        const directions = [
                            {x: 1, y: 0}, {x: -1, y: 0}, // horizontal
                            {x: 0, y: 1}, {x: 0, y: -1}, // vertikal
                            {x: 1, y: 1}, {x: -1, y: -1} // diagonal
                        ];
                        
                        for (let i = 1; i < veinSize && added < 4; i++) {
                            const dirIndex = Math.floor(seededRandom(coalSeed + i + 10) * directions.length);
                            const dir = directions[dirIndex];
                            const neighborKey = `${blockX + dir.x * i},${y + dir.y * i}`;
                            if (!oreVeins.has(neighborKey)) {
                                oreVeins.add(neighborKey);
                                added++;
                            }
                        }
                    }
                    
                    // Iron Ore - tiefer unten (ab Y > surfaceHeight + 30), einzeln (0.8%)
                    if (y > surfaceHeight + 30 && blockType === 'stone') {
                        const ironSeed = blockX * 2000 + y * 200;
                        if (seededRandom(ironSeed) < 0.008 && !oreVeins.has(veinKey)) {
                            blockType = 'ironore';
                            oreVeins.add(veinKey);
                        }
                    }
                    
                    // Gold Ore - gleiche Tiefe wie Iron (ab Y > surfaceHeight + 30), einzeln (0.8%)
                    if (y > surfaceHeight + 30 && blockType === 'stone') {
                        const goldSeed = blockX * 2500 + y * 250;
                        if (seededRandom(goldSeed) < 0.008 && !oreVeins.has(veinKey)) {
                            blockType = 'goldore';
                            oreVeins.add(veinKey);
                        }
                    }
                    
                    // Diamond Ore - sehr tief (ab Y > surfaceHeight + 50), extrem selten (0.3%)
                    if (y > surfaceHeight + 50 && blockType === 'stone') {
                        const diamondSeed = blockX * 3000 + y * 300;
                        if (seededRandom(diamondSeed) < 0.003 && !oreVeins.has(veinKey)) {
                            blockType = 'diamondore';
                            oreVeins.add(veinKey);
                        }
                    }
                    
                    // Emerald Ore - am tiefsten (ab Y > surfaceHeight + 70), ultra selten (0.15%)
                    if (y > surfaceHeight + 70 && blockType === 'stone') {
                        const emeraldSeed = blockX * 4000 + y * 400;
                        if (seededRandom(emeraldSeed) < 0.0015 && !oreVeins.has(veinKey)) {
                            blockType = 'emeraldore';
                            oreVeins.add(veinKey);
                        }
                    }
                    
                    // Prüfe ob dieser Block Teil einer Coal-Ader ist
                    if (oreVeins.has(veinKey) && blockType === 'stone') {
                        // Finde heraus welches Ore hier sein sollte (nur für Coal-Adern)
                        for (let checkX = x - 2; checkX <= x + 2; checkX++) {
                            for (let checkY = y - 2; checkY <= y + 2; checkY++) {
                                if (checkX < 0 || checkX >= CONFIG.CHUNK_WIDTH) continue;
                                const checkBlockX = chunkX * CONFIG.CHUNK_WIDTH + checkX;
                                const checkKey = `${checkBlockX},${checkY}`;
                                if (oreVeins.has(checkKey)) {
                                    const checkSeed = checkBlockX * 1000 + checkY * 100;
                                    if (seededRandom(checkSeed) < 0.01) {
                                        blockType = 'coalore';
                                        break;
                                    }
                                }
                            }
                            if (blockType === 'coalore') break;
                        }
                    }
                    } // Ende if (blockType === 'stone') - für Ore-Generierung
                } // Ende else if (y > surfaceHeight + 1 + CONFIG.STONE_DEPTH)
                
                column.push(blockType);
            }
            chunk.push(column);
        }
        
        // Speichere Chunk bevor Bäume generiert werden
        this.chunks.set(chunkX, chunk);
        
        // Baum-Generierung - nach der Chunk-Erstellung
        this.generateTreesForChunk(chunkX, chunk, finalHeights);
        
        return chunk;
    }
    
    generateTreesForChunk(chunkX, chunk, finalHeights) {
        // Generiere Bäume für diesen Chunk
        for (let x = 0; x < CONFIG.CHUNK_WIDTH; x++) {
            const surfaceHeight = finalHeights[x];
            const blockX = chunkX * CONFIG.CHUNK_WIDTH + x;
            
            this.tryGenerateTree(chunkX, chunk, x, blockX, surfaceHeight);
        }
        
        // Prüfe auch Bäume aus Nachbar-Chunks die in diesen Chunk ragen könnten
        // Links: Prüfe die letzten 3 Positionen des linken Nachbar-Chunks
        for (let offsetX = -3; offsetX < 0; offsetX++) {
            const neighborBlockX = chunkX * CONFIG.CHUNK_WIDTH + offsetX;
            this.tryGenerateTreeLeavesFromNeighbor(chunkX, chunk, neighborBlockX);
        }
        
        // Rechts: Prüfe die ersten 3 Positionen des rechten Nachbar-Chunks
        for (let offsetX = CONFIG.CHUNK_WIDTH; offsetX < CONFIG.CHUNK_WIDTH + 3; offsetX++) {
            const neighborBlockX = chunkX * CONFIG.CHUNK_WIDTH + offsetX;
            this.tryGenerateTreeLeavesFromNeighbor(chunkX, chunk, neighborBlockX);
        }
    }
    
    tryGenerateTreeLeavesFromNeighbor(targetChunkX, targetChunk, treeBlockX) {
        const treeSeed = treeBlockX * 8000;
        
        // Prüfe ob hier ein Baum sein sollte (gleiche Logik wie bei Generierung)
        if (seededRandom(treeSeed) < 0.05) {
            // Berechne wo die Oberfläche sein sollte (mit gleicher Terrain-Generierung)
            const seed = Math.floor(treeBlockX / CONFIG.CHUNK_WIDTH) * 1000;
            
            // Multi-Layer Noise für natürliches Terrain (gleiche Berechnung wie in generateChunk)
            const baseNoise = Math.sin(treeBlockX * CONFIG.TERRAIN.BASE_FREQUENCY + seed * 0.001) * CONFIG.TERRAIN.BASE_AMPLITUDE;
            const detailNoise = Math.sin(treeBlockX * CONFIG.TERRAIN.DETAIL_FREQUENCY + seed * 0.01) * CONFIG.TERRAIN.DETAIL_AMPLITUDE;
            const mountainNoise = Math.sin(treeBlockX * CONFIG.TERRAIN.MOUNTAIN_FREQUENCY + seed * 0.0001) * CONFIG.TERRAIN.MOUNTAIN_AMPLITUDE;
            const variation1 = Math.sin(treeBlockX * 0.03 + seed * 0.002) * 0.5;
            const variation2 = Math.cos(treeBlockX * 0.06 + seed * 0.005) * 0.3;
            
            const totalNoise = baseNoise + detailNoise + mountainNoise + variation1 + variation2;
            const surfaceY = Math.floor(CONFIG.MIN_HEIGHT + (CONFIG.MAX_HEIGHT - CONFIG.MIN_HEIGHT) / 2 + totalNoise);
            
            if (surfaceY >= 8) {
                const trunkHeight = Math.floor(seededRandom(treeSeed + 1) * 4) + 4;
                const crownY = surfaceY - trunkHeight;
                
                if (crownY >= 0) {
                    // Generiere nur die Blätter die in den Ziel-Chunk ragen
                    this.generateTreeLeaves(targetChunkX, targetChunk, -999, treeBlockX, crownY, trunkHeight, treeSeed);
                }
            }
        }
    }
    
    tryGenerateTree(chunkX, chunk, x, blockX, surfaceHeight) {
        const treeSeed = blockX * 8000;
        
        // 5% Chance für einen Baum an dieser Position
        if (seededRandom(treeSeed) < 0.05) {
            const surfaceY = surfaceHeight;
            
            // Prüfe ob genug Platz für Baum ist (mindestens 8 Blöcke hoch)
            if (surfaceY >= 8) {
                // Entferne grass-Block über dirt-grass (falls vorhanden)
                if (chunk[x][surfaceY] === 'grass') {
                    chunk[x][surfaceY] = null;
                }
                
                // Ändere dirt-grass zu dirt-grass-tree
                if (chunk[x][surfaceY + 1] === 'dirt-grass') {
                    chunk[x][surfaceY + 1] = 'dirt-grass-tree';
                }
                
                // Baum-Höhe: 4-7 Blöcke Stamm
                const trunkHeight = Math.floor(seededRandom(treeSeed + 1) * 4) + 4; // 4-7
                
                // Erstelle Stamm - beginnt direkt über dirt-grass-tree (bei surfaceY)
                for (let i = 0; i < trunkHeight; i++) {
                    const treeY = surfaceY - i;
                    if (treeY >= 0) {
                        chunk[x][treeY] = 'tree';
                    }
                }
                
                // Baumkrone oben auf dem Stamm
                const crownY = surfaceY - trunkHeight;
                if (crownY >= 0) {
                    chunk[x][crownY] = 'tree-head';
                    
                    // Generiere Blätter
                    this.generateTreeLeaves(chunkX, chunk, x, blockX, crownY, trunkHeight, treeSeed);
                }
            }
        }
    }
    
    generateTreeLeaves(targetChunkX, targetChunk, treeLocalX, treeBlockX, crownY, trunkHeight, treeSeed) {
        // Blätter-Größe basierend auf Baumhöhe
        const leafLayers = Math.min(3, Math.max(1, trunkHeight - 3));
        
        // Bei großen Bäumen: Krone 1 Block höher (mehr Platz zwischen Stamm und Krone)
        const crownOffset = leafLayers >= 3 ? -1 : 0;
        const adjustedCrownY = crownY + crownOffset;
        
        // Hilfsfunktion zum Setzen von Blättern
        const setLeaf = (offsetX, offsetY) => {
            const leafBlockX = treeBlockX + offsetX;
            const leafY = adjustedCrownY + offsetY;
            
            if (leafY < 0) return;
            
            const leafChunkX = Math.floor(leafBlockX / CONFIG.CHUNK_WIDTH);
            const leafLocalX = leafBlockX - leafChunkX * CONFIG.CHUNK_WIDTH;
            
            // Nur setzen wenn im Ziel-Chunk
            if (leafChunkX === targetChunkX && leafLocalX >= 0 && leafLocalX < CONFIG.CHUNK_WIDTH) {
                const currentBlock = targetChunk[leafLocalX][leafY];
                if (currentBlock !== 'tree' && currentBlock !== 'tree-head') {
                    targetChunk[leafLocalX][leafY] = 'tree-leaves';
                }
            }
        };
        
        // Oben: Natürliche zentrierte Spitze (nur in der Mitte, keine breiten Blätter)
        setLeaf(0, -1);
        
        // Schicht 1: Auf Höhe der Krone
        setLeaf(-1, 0);
        setLeaf(1, 0);
        // Bei großen Bäumen mit Offset: Fülle auch die Mitte in Schicht 1
        if (crownOffset !== 0) {
            setLeaf(0, 0);
        }
        
        // Schicht 2: 1 Block unter der Krone
        setLeaf(-1, 1);
        setLeaf(1, 1);
        // Bei großen Bäumen mit Offset: Fülle die Mitte (kein Stamm mehr dort)
        if (crownOffset !== 0) {
            setLeaf(0, 1);
        }
        
        // Für mittlere und große Bäume: Mehr Blätter
        if (leafLayers >= 2) {
            // Erweitere Schicht 1
            setLeaf(-2, 0);
            setLeaf(2, 0);
            
            // Erweitere Schicht 2
            setLeaf(-2, 1);
            setLeaf(2, 1);
            
            // Schicht 3: 2 Blöcke unter der Krone
            setLeaf(-1, 2);
            setLeaf(1, 2);
            
            // Zufällige Blätter für natürlicheres Aussehen
            if (seededRandom(treeSeed + 400) < 0.6) {
                setLeaf(0, 2);
            }
        }
        
        // Für große Bäume: Noch mehr Blätter
        if (leafLayers >= 3) {
            // Erweitere Schicht 3
            setLeaf(-2, 2);
            setLeaf(2, 2);
            
            // Schicht 4: 3 Blöcke unter der Krone
            setLeaf(-1, 3);
            setLeaf(1, 3);
            
            // Zufällige Blätter für unregelmäßige Form (nur nah am Zentrum)
            if (seededRandom(treeSeed + 700) < 0.5) {
                setLeaf(0, 3);
            }
            // Asymmetrische zusätzliche Blätter (nur 1 Block vom Zentrum)
            if (seededRandom(treeSeed + 800) < 0.4) {
                setLeaf(-1, -1);
            }
            if (seededRandom(treeSeed + 900) < 0.4) {
                setLeaf(1, -1);
            }
        }
    }
    
    getBlockAt(worldX, worldY, includeGrass = false) {
        const blockX = Math.floor(worldX / CONFIG.BLOCK_SIZE);
        const blockY = Math.floor(worldY / CONFIG.BLOCK_SIZE);
        
        if (blockY < 0 || blockY >= CONFIG.WORLD_HEIGHT) return null;
        
        // Prüfe ob Block zerstört wurde
        if (this.isBlockBroken(blockX, blockY)) return null;
        
        const chunkX = Math.floor(blockX / CONFIG.CHUNK_WIDTH);
        const chunk = this.generateChunk(chunkX);
        const localX = blockX - chunkX * CONFIG.CHUNK_WIDTH;
        
        if (localX < 0 || localX >= CONFIG.CHUNK_WIDTH) return null;
        
        const blockType = chunk[localX][blockY];
        
        // Grass-Block hat keine Kollision (außer für Hover)
        if (blockType === 'grass' && !includeGrass) return null;
        
        return blockType;
    }
    
    cleanupChunks(startChunk, endChunk) {
        for (let [chunkX] of this.chunks) {
            if (chunkX < startChunk - 2 || chunkX > endChunk + 2) {
                this.chunks.delete(chunkX);
            }
        }
    }
}
