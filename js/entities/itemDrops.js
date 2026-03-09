// Item-Drop-System

class ItemDrops {
    constructor() {
        this.items = [];
    }
    
    createDrop(blockX, blockY, blockType, isThrown = false, throwVelocity = null) {
        const worldX = blockX * CONFIG.BLOCK_SIZE + CONFIG.BLOCK_SIZE / 2;
        const worldY = blockY * CONFIG.BLOCK_SIZE + CONFIG.BLOCK_SIZE / 2;
        
        let vx, vy;
        if (isThrown && throwVelocity) {
            // Geworfenes Item mit Wurfbogen
            vx = throwVelocity.vx;
            vy = throwVelocity.vy;
        } else {
            // Normaler Drop (z.B. von Block-Breaking)
            vx = (Math.random() - 0.5) * 2;
            vy = -3;
        }
        
        this.items.push({
            x: worldX,
            y: worldY,
            vx: vx,
            vy: vy,
            type: blockType,
            rotationAngle: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.04,
            bobOffset: Math.random() * Math.PI * 2,
            age: 0,
            pickupDelay: isThrown ? 2000 : 0, // 2 Sekunden Delay für geworfene Items
            createdTime: Date.now()
        });
    }
    
    update(world, player, inventory) {
        const now = Date.now();
        
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            
            // Prüfe ob Pickup-Delay noch aktiv ist
            const canPickup = (now - item.createdTime) >= item.pickupDelay;
            
            // Prüfe Distanz zum Player
            const dx = (player.x + player.width / 2) - item.x;
            const dy = (player.y + player.height / 2) - item.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Wenn in Pickup-Range UND Pickup-Delay abgelaufen, ziehe Item zum Player
            if (canPickup && distance < CONFIG.PICKUP_RANGE) {
                // Magnet-Effekt
                const pullSpeed = 0.15;
                item.vx = dx * pullSpeed;
                item.vy = dy * pullSpeed;
                
                // Wenn sehr nah, sammle auf
                if (distance < 10) {
                    if (inventory.addItem(item.type)) {
                        this.items.splice(i, 1);
                        console.log(`Picked up ${item.type}`);
                    }
                    continue;
                }
            } else {
                // Normale Physik wenn außerhalb der Range oder Pickup-Delay aktiv
                item.vy += CONFIG.ITEM_GRAVITY;
                item.vx *= 0.95;
            }
            
            // Bewegung mit Block-Kollision
            const itemSize = CONFIG.ITEM_SIZE;
            const halfSize = itemSize / 2;
            
            // Horizontale Bewegung mit Kollisionsprüfung
            const newX = item.x + item.vx;
            const leftEdge = newX - halfSize;
            const rightEdge = newX + halfSize;
            const topEdge = item.y - halfSize;
            const bottomEdge = item.y + halfSize;
            
            // Prüfe horizontale Kollision
            let horizontalCollision = false;
            if (item.vx > 0) {
                // Bewegt sich nach rechts
                if (world.getBlockAt(rightEdge, item.y, false)) {
                    horizontalCollision = true;
                    item.vx = -item.vx * 0.5; // Abprallen mit Energieverlust
                }
            } else if (item.vx < 0) {
                // Bewegt sich nach links
                if (world.getBlockAt(leftEdge, item.y, false)) {
                    horizontalCollision = true;
                    item.vx = -item.vx * 0.5; // Abprallen mit Energieverlust
                }
            }
            
            if (!horizontalCollision) {
                item.x = newX;
            }
            
            // Vertikale Bewegung mit Kollisionsprüfung
            const newY = item.y + item.vy;
            const newTopEdge = newY - halfSize;
            const newBottomEdge = newY + halfSize;
            
            // Prüfe vertikale Kollision
            let verticalCollision = false;
            if (item.vy > 0) {
                // Bewegt sich nach unten
                if (world.getBlockAt(item.x, newBottomEdge, false)) {
                    verticalCollision = true;
                    item.vy = -item.vy * 0.3; // Abprallen mit mehr Energieverlust
                    item.vx *= 0.8; // Reibung
                    
                    // Wenn Geschwindigkeit zu gering, stoppe
                    if (Math.abs(item.vy) < 0.5) {
                        item.vy = 0;
                        // Positioniere auf Block-Oberfläche
                        const blockY = Math.floor(newBottomEdge / CONFIG.BLOCK_SIZE);
                        item.y = blockY * CONFIG.BLOCK_SIZE - halfSize;
                    }
                }
            } else if (item.vy < 0) {
                // Bewegt sich nach oben
                if (world.getBlockAt(item.x, newTopEdge, false)) {
                    verticalCollision = true;
                    item.vy = -item.vy * 0.3; // Abprallen mit Energieverlust
                }
            }
            
            if (!verticalCollision) {
                item.y = newY;
            }
            
            // 3D-Rotation (langsam um Y-Achse drehen)
            item.rotationAngle += item.rotationSpeed;
            
            item.age++;
        }
    }
    
    render(ctx, camera, textures, darkness = 0) {
        for (const item of this.items) {
            const screenX = item.x - camera.x;
            const screenY = item.y - camera.y;
            
            // Bob-Animation (langsam hoch und runter)
            const bobAmount = Math.sin(item.age * 0.03 + item.bobOffset) * 3;
            
            // Berechne 3D-Perspektive (Y-Achsen-Rotation)
            // cos gibt Werte von -1 bis 1, wir mappen das auf 0.2 bis 1 (nie zu schmal)
            const scaleX = Math.abs(Math.cos(item.rotationAngle)) * 0.8 + 0.2;
            
            ctx.save();
            ctx.translate(screenX, screenY + bobAmount);
            
            // Seitliche 3D-Skalierung
            ctx.scale(scaleX, 1);
            
            // Wende Dunkelheit als Brightness-Filter an
            if (darkness > 0) {
                const brightness = Math.round((1 - darkness) * 100);
                ctx.filter = `brightness(${brightness}%)`;
            }
            
            const texture = textures[item.type];
            if (texture) {
                ctx.drawImage(
                    texture,
                    -CONFIG.ITEM_SIZE / 2,
                    -CONFIG.ITEM_SIZE / 2,
                    CONFIG.ITEM_SIZE,
                    CONFIG.ITEM_SIZE
                );
            }
            
            ctx.filter = 'none';
            ctx.restore();
        }
    }
    
    getItemCount() {
        return this.items.length;
    }
}
