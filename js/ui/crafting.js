// Crafting-System

class Crafting {
    constructor() {
        this.isOpen = false;
        this.recipes = this.initializeRecipes();
        this.selectedRecipe = null;
        this.craftingGrid = Array(16).fill(null); // 4x4 Grid (16 slots)
        this.resultSlot = null;
    }
    
    initializeRecipes() {
        return [
            {
                id: 'tree_to_wood',
                pattern: [
                    ['tree']  // 1 tree block
                ],
                result: {
                    item: 'wood',
                    count: 4
                },
                shapeless: true // Kann überall im Grid platziert werden
            }
            // Weitere Rezepte können hier hinzugefügt werden
        ];
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        if (!this.isOpen) {
            this.clearGrid();
        }
    }
    
    open() {
        this.isOpen = true;
    }
    
    close() {
        this.isOpen = false;
        this.clearGrid();
    }
    
    clearGrid() {
        this.craftingGrid = Array(16).fill(null); // 4x4 Grid (16 slots)
        this.resultSlot = null;
        this.selectedRecipe = null;
    }
    
    // Prüfe ob ein Rezept mit dem aktuellen Grid übereinstimmt
    checkRecipes() {
        this.resultSlot = null;
        this.selectedRecipe = null;
        
        // Zähle alle Items im Grid
        const itemCounts = {};
        let totalItems = 0;
        
        for (let i = 0; i < 16; i++) {
            const slot = this.craftingGrid[i];
            if (slot && slot.item) {
                itemCounts[slot.item] = (itemCounts[slot.item] || 0) + slot.count;
                totalItems += slot.count;
            }
        }
        
        // Prüfe alle Rezepte
        for (const recipe of this.recipes) {
            if (this.matchesRecipe(recipe, itemCounts, totalItems)) {
                this.selectedRecipe = recipe;
                
                // Berechne wie oft das Rezept gemacht werden kann
                const maxCrafts = this.calculateMaxCrafts(recipe, itemCounts);
                
                this.resultSlot = {
                    item: recipe.result.item,
                    count: recipe.result.count * maxCrafts
                };
                break;
            }
        }
    }
    
    matchesRecipe(recipe, itemCounts, totalItems) {
        if (recipe.shapeless) {
            // Shapeless Rezept - nur Items und Mengen müssen stimmen
            const requiredItems = {};
            
            for (const patternRow of recipe.pattern) {
                for (const item of patternRow) {
                    if (item) {
                        requiredItems[item] = (requiredItems[item] || 0) + 1;
                    }
                }
            }
            
            // Prüfe ob alle benötigten Items vorhanden sind
            for (const [item, requiredCount] of Object.entries(requiredItems)) {
                if (!itemCounts[item] || itemCounts[item] < requiredCount) {
                    return false;
                }
            }
            
            // Prüfe ob keine zusätzlichen Items vorhanden sind
            for (const item of Object.keys(itemCounts)) {
                if (!requiredItems[item]) {
                    return false;
                }
            }
            
            return true;
        }
        
        // TODO: Shaped Rezepte implementieren
        return false;
    }
    
    calculateMaxCrafts(recipe, itemCounts) {
        let maxCrafts = Infinity;
        
        for (const patternRow of recipe.pattern) {
            for (const item of patternRow) {
                if (item) {
                    const available = itemCounts[item] || 0;
                    const needed = 1; // Für shapeless Rezepte
                    maxCrafts = Math.min(maxCrafts, Math.floor(available / needed));
                }
            }
        }
        
        return maxCrafts === Infinity ? 0 : maxCrafts;
    }
    
    // Füge Item zum Crafting-Grid hinzu
    addItemToGrid(slotIndex, itemKey, count = 1) {
        if (slotIndex >= 0 && slotIndex < 16) { // 4x4 Grid = 16 slots
            this.craftingGrid[slotIndex] = { item: itemKey, count: count };
            this.checkRecipes();
        }
    }
    
    // Entferne Item aus Crafting-Grid
    removeItemFromGrid(slotIndex) {
        if (slotIndex >= 0 && slotIndex < 16) { // 4x4 Grid = 16 slots
            const item = this.craftingGrid[slotIndex];
            this.craftingGrid[slotIndex] = null;
            this.checkRecipes();
            return item;
        }
        return null;
    }
    
    // Hole Item aus Grid-Slot
    getGridSlot(slotIndex) {
        if (slotIndex >= 0 && slotIndex < 16) { // 4x4 Grid = 16 slots
            return this.craftingGrid[slotIndex] || { item: null, count: 0 };
        }
        return { item: null, count: 0 };
    }
    
    // Versuche Item in Crafting-Grid zu platzieren
    tryPlaceItem(slotIndex, itemKey, count) {
        if (slotIndex >= 0 && slotIndex < 16) {
            const currentSlot = this.craftingGrid[slotIndex];
            
            if (!currentSlot || currentSlot.item === null) {
                // Slot ist leer - platziere Item
                this.craftingGrid[slotIndex] = { item: itemKey, count: count };
                this.checkRecipes();
                return true;
            } else if (currentSlot.item === itemKey) {
                // Gleicher Item-Typ - stacke
                currentSlot.count += count;
                this.checkRecipes();
                return true;
            } else {
                // Anderer Item-Typ - kann nicht platzieren
                return false;
            }
        }
        return false;
    }
    
    // Hole Item aus Crafting-Grid (für Drag & Drop)
    takeItem(slotIndex) {
        if (slotIndex >= 0 && slotIndex < 16) {
            const slot = this.craftingGrid[slotIndex];
            if (slot && slot.item) {
                const item = { item: slot.item, count: slot.count };
                this.craftingGrid[slotIndex] = null;
                this.checkRecipes();
                return item;
            }
        }
        return null;
    }
    
    // Crafting ausführen (Items aus Grid entfernen)
    executeCraft(craftAll = false) {
        if (!this.selectedRecipe || !this.resultSlot) return null;
        
        const recipe = this.selectedRecipe;
        const maxCrafts = this.calculateMaxCrafts(recipe, this.getItemCounts());
        const craftCount = craftAll ? maxCrafts : 1; // Entweder 1x oder alles
        
        if (craftCount <= 0) return null;
        
        const craftedItem = {
            item: this.resultSlot.item,
            count: recipe.result.count * craftCount // Anzahl basierend auf craftCount
        };
        
        // Entferne Items aus dem Grid (craftCount x Rezept)
        const requiredItems = {};
        for (const patternRow of recipe.pattern) {
            for (const item of patternRow) {
                if (item) {
                    requiredItems[item] = (requiredItems[item] || 0) + craftCount; // craftCount statt 1
                }
            }
        }
        
        // Entferne Items aus dem Grid
        for (const [item, count] of Object.entries(requiredItems)) {
            let remaining = count;
            for (let i = 0; i < 16 && remaining > 0; i++) {
                const slot = this.craftingGrid[i];
                if (slot && slot.item === item) {
                    const toRemove = Math.min(remaining, slot.count);
                    slot.count -= toRemove;
                    remaining -= toRemove;
                    
                    if (slot.count <= 0) {
                        this.craftingGrid[i] = null;
                    }
                }
            }
        }
        
        // Aktualisiere Rezepte
        this.checkRecipes();
        
        return craftedItem;
    }
    
    // Hilfsmethode um Item-Counts zu bekommen
    getItemCounts() {
        const itemCounts = {};
        for (let i = 0; i < 16; i++) {
            const slot = this.craftingGrid[i];
            if (slot && slot.item) {
                itemCounts[slot.item] = (itemCounts[slot.item] || 0) + slot.count;
            }
        }
        return itemCounts;
    }
    
    // Hole Result-Slot
    getResultSlot() {
        return this.resultSlot || { item: null, count: 0 };
    }
}