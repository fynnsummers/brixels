// Inventar-System

class Inventory {
    constructor() {
        // 6 Hotbar-Slots + 42 Inventar-Slots (7x6 Grid)
        this.slots = [];
        for (let i = 0; i < 48; i++) {
            this.slots.push({ item: null, count: 0 });
        }
        
        this.draggedSlot = null; // Welcher Slot wird gerade gezogen
        this.draggedItem = null; // { item: string, count: number }
    }
    
    addItem(itemType, count = 1) {
        let remaining = count;
        
        // Suche nach existierenden Slots mit diesem Item (alle Slots)
        for (let i = 0; i < this.slots.length && remaining > 0; i++) {
            if (this.slots[i].item === itemType) {
                this.slots[i].count += remaining;
                console.log(`Added ${remaining}x ${itemType} to slot ${i}, total: ${this.slots[i].count}`);
                return true;
            }
        }
        
        // Suche nach leeren Slots (alle Slots)
        for (let i = 0; i < this.slots.length && remaining > 0; i++) {
            if (this.slots[i].item === null) {
                this.slots[i].item = itemType;
                this.slots[i].count = remaining;
                console.log(`Added ${remaining}x ${itemType} to new slot ${i}`);
                return true;
            }
        }
        
        // Inventar voll
        return false;
    }
    
    removeItem(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return false;
        
        const slot = this.slots[slotIndex];
        if (slot.count > 0) {
            slot.count--;
            
            // Wenn keine Items mehr, leere den Slot
            if (slot.count === 0) {
                slot.item = null;
            }
            
            return true;
        }
        
        return false;
    }
    
    getSlot(index) {
        return this.slots[index];
    }
    
    startDrag(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) {
            console.log(`Invalid slot index: ${slotIndex}`);
            return;
        }
        
        const slot = this.slots[slotIndex];
        if (slot.item && slot.count > 0) {
            console.log(`Dragging ${slot.item} x${slot.count} from slot ${slotIndex}`);
            this.draggedSlot = slotIndex;
            this.draggedItem = { item: slot.item, count: slot.count };
            // Leere den Slot temporär
            slot.item = null;
            slot.count = 0;
        } else {
            console.log(`Slot ${slotIndex} is empty, cannot drag`);
        }
    }
    
    endDrag(targetSlotIndex) {
        console.log(`Ending drag to slot ${targetSlotIndex}, dragged from ${this.draggedSlot}`);
        
        if (this.draggedSlot === null || this.draggedItem === null) return null;
        
        if (targetSlotIndex < 0 || targetSlotIndex >= this.slots.length) {
            console.log(`Invalid target slot: ${targetSlotIndex}, item will be dropped`);
            // Ungültiger Slot - Item wird gedroppt (return item info)
            const droppedItem = { item: this.draggedItem.item, count: this.draggedItem.count };
            this.draggedSlot = null;
            this.draggedItem = null;
            return droppedItem; // Signalisiere dass Item gedroppt werden soll
        } else {
            const targetSlot = this.slots[targetSlotIndex];
            
            // Wenn Ziel-Slot leer ist
            if (targetSlot.item === null) {
                console.log(`Target slot empty, moving item`);
                targetSlot.item = this.draggedItem.item;
                targetSlot.count = this.draggedItem.count;
            } 
            // Wenn Ziel-Slot das gleiche Item hat
            else if (targetSlot.item === this.draggedItem.item) {
                console.log(`Stacking items`);
                targetSlot.count += this.draggedItem.count;
            }
            // Wenn Ziel-Slot ein anderes Item hat - tausche
            else {
                console.log(`Swapping items`);
                const tempItem = targetSlot.item;
                const tempCount = targetSlot.count;
                
                targetSlot.item = this.draggedItem.item;
                targetSlot.count = this.draggedItem.count;
                
                this.slots[this.draggedSlot].item = tempItem;
                this.slots[this.draggedSlot].count = tempCount;
            }
        }
        
        this.draggedSlot = null;
        this.draggedItem = null;
        return null; // Kein Drop
    }
    
    cancelDrag() {
        if (this.draggedSlot !== null && this.draggedItem !== null) {
            // Prüfe ob es ein normaler Inventory-Slot ist (>= 0)
            if (this.draggedSlot >= 0 && this.draggedSlot < this.slots.length && this.slots[this.draggedSlot]) {
                // Item zurück zum Original Inventory-Slot
                this.slots[this.draggedSlot].item = this.draggedItem.item;
                this.slots[this.draggedSlot].count = this.draggedItem.count;
                this.draggedSlot = null;
                this.draggedItem = null;
            } else if (this.draggedSlot < -1000 && this.draggedSlot > -4000) {
                // Crafting-Slots (negative IDs zwischen -1000 und -4000) - Item wird verworfen
                this.draggedSlot = null;
                this.draggedItem = null;
            } else if (this.draggedSlot === -4000) {
                // Result-Slot (-4000) - Item NICHT löschen, Drag-Zustand beibehalten
                console.log(`Result slot drag cancelled, keeping item: ${this.draggedItem.item} x${this.draggedItem.count}`);
                // draggedSlot und draggedItem bleiben erhalten!
            }
        }
    }
    
    clear() {
        // Leere alle Slots
        for (let i = 0; i < this.slots.length; i++) {
            this.slots[i].item = null;
            this.slots[i].count = 0;
        }
        this.draggedSlot = null;
        this.draggedItem = null;
    }
}
