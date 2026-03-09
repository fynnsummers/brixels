// Item-Datenbank

const ITEMS = {
    // Blöcke - Natur
    'stone': {
        id: 1,
        name: 'Stone',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    'dirt': {
        id: 2,
        name: 'Dirt',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    'dirt-grass': {
        id: 3,
        name: 'Grass Block',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    'grass': {
        id: 4,
        name: 'Grass',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    'coalore': {
        id: 5,
        name: 'Coal Ore',
        category: 'blocks',
        subcategory: 'ore',
        stackable: true,
        maxStack: 64
    },
    'ironore': {
        id: 6,
        name: 'Iron Ore',
        category: 'blocks',
        subcategory: 'ore',
        stackable: true,
        maxStack: 64
    },
    'bedrock': {
        id: 7,
        name: 'Bedrock',
        category: 'blocks',
        subcategory: 'special',
        stackable: true,
        maxStack: 64
    },
    'diamondore': {
        id: 8,
        name: 'Diamond Ore',
        category: 'blocks',
        subcategory: 'ore',
        stackable: true,
        maxStack: 64
    },
    'emeraldore': {
        id: 9,
        name: 'Emerald Ore',
        category: 'blocks',
        subcategory: 'ore',
        stackable: true,
        maxStack: 64
    },
    'goldore': {
        id: 10,
        name: 'Gold Ore',
        category: 'blocks',
        subcategory: 'ore',
        stackable: true,
        maxStack: 64
    },
    'granite': {
        id: 11,
        name: 'Granite',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    'diorite': {
        id: 12,
        name: 'Diorite',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    'dirt-grass-tree': {
        id: 13,
        name: 'Grass Block with Tree',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    'tree': {
        id: 14,
        name: 'Tree Trunk',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    'tree-head': {
        id: 15,
        name: 'Tree Crown',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    'tree-leaves': {
        id: 16,
        name: 'Tree Leaves',
        category: 'blocks',
        subcategory: 'natural',
        stackable: true,
        maxStack: 64
    },
    
    // Tools - Äxte
    'axe-wood': {
        id: 100,
        name: 'Wooden Axe',
        category: 'tools',
        subcategory: 'axe',
        stackable: false,
        maxStack: 1,
        damage: 3,
        miningSpeed: 2.0
    },
    'axe-stone': {
        id: 101,
        name: 'Stone Axe',
        category: 'tools',
        subcategory: 'axe',
        stackable: false,
        maxStack: 1,
        damage: 4,
        miningSpeed: 4.0
    },
    'axe-iron': {
        id: 102,
        name: 'Iron Axe',
        category: 'tools',
        subcategory: 'axe',
        stackable: false,
        maxStack: 1,
        damage: 5,
        miningSpeed: 6.0
    },
    'axe-gold': {
        id: 105,
        name: 'Gold Axe',
        category: 'tools',
        subcategory: 'axe',
        stackable: false,
        maxStack: 1,
        damage: 3,
        miningSpeed: 8.0
    },
    'axe-diamond': {
        id: 103,
        name: 'Diamond Axe',
        category: 'tools',
        subcategory: 'axe',
        stackable: false,
        maxStack: 1,
        damage: 6,
        miningSpeed: 10.0
    },
    'axe-emerald': {
        id: 104,
        name: 'Emerald Axe',
        category: 'tools',
        subcategory: 'axe',
        stackable: false,
        maxStack: 1,
        damage: 7,
        miningSpeed: 15.0
    },
    
    // Tools - Spitzhacken
    'pickaxe-wood': {
        id: 110,
        name: 'Wooden Pickaxe',
        category: 'tools',
        subcategory: 'pickaxe',
        stackable: false,
        maxStack: 1,
        damage: 2,
        miningSpeed: 2.0
    },
    'pickaxe-stone': {
        id: 111,
        name: 'Stone Pickaxe',
        category: 'tools',
        subcategory: 'pickaxe',
        stackable: false,
        maxStack: 1,
        damage: 3,
        miningSpeed: 4.0
    },
    'pickaxe-iron': {
        id: 112,
        name: 'Iron Pickaxe',
        category: 'tools',
        subcategory: 'pickaxe',
        stackable: false,
        maxStack: 1,
        damage: 4,
        miningSpeed: 6.0
    },
    'pickaxe-gold': {
        id: 115,
        name: 'Gold Pickaxe',
        category: 'tools',
        subcategory: 'pickaxe',
        stackable: false,
        maxStack: 1,
        damage: 2,
        miningSpeed: 8.0
    },
    'pickaxe-diamond': {
        id: 113,
        name: 'Diamond Pickaxe',
        category: 'tools',
        subcategory: 'pickaxe',
        stackable: false,
        maxStack: 1,
        damage: 5,
        miningSpeed: 10.0
    },
    'pickaxe-emerald': {
        id: 114,
        name: 'Emerald Pickaxe',
        category: 'tools',
        subcategory: 'pickaxe',
        stackable: false,
        maxStack: 1,
        damage: 6,
        miningSpeed: 15.0
    },
    
    // Tools - Schaufeln
    'shovel-wood': {
        id: 120,
        name: 'Wooden Shovel',
        category: 'tools',
        subcategory: 'shovel',
        stackable: false,
        maxStack: 1,
        damage: 2,
        miningSpeed: 2.0
    },
    'shovel-stone': {
        id: 121,
        name: 'Stone Shovel',
        category: 'tools',
        subcategory: 'shovel',
        stackable: false,
        maxStack: 1,
        damage: 3,
        miningSpeed: 4.0
    },
    'shovel-iron': {
        id: 122,
        name: 'Iron Shovel',
        category: 'tools',
        subcategory: 'shovel',
        stackable: false,
        maxStack: 1,
        damage: 4,
        miningSpeed: 6.0
    },
    'shovel-gold': {
        id: 125,
        name: 'Gold Shovel',
        category: 'tools',
        subcategory: 'shovel',
        stackable: false,
        maxStack: 1,
        damage: 2,
        miningSpeed: 8.0
    },
    'shovel-diamond': {
        id: 123,
        name: 'Diamond Shovel',
        category: 'tools',
        subcategory: 'shovel',
        stackable: false,
        maxStack: 1,
        damage: 5,
        miningSpeed: 10.0
    },
    'shovel-emerald': {
        id: 124,
        name: 'Emerald Shovel',
        category: 'tools',
        subcategory: 'shovel',
        stackable: false,
        maxStack: 1,
        damage: 6,
        miningSpeed: 15.0
    },
    
    // Tools - Schwerter
    'sword-wood': {
        id: 130,
        name: 'Wooden Sword',
        category: 'tools',
        subcategory: 'sword',
        stackable: false,
        maxStack: 1,
        damage: 4,
        miningSpeed: 1.5
    },
    'sword-stone': {
        id: 131,
        name: 'Stone Sword',
        category: 'tools',
        subcategory: 'sword',
        stackable: false,
        maxStack: 1,
        damage: 5,
        miningSpeed: 1.5
    },
    'sword-iron': {
        id: 132,
        name: 'Iron Sword',
        category: 'tools',
        subcategory: 'sword',
        stackable: false,
        maxStack: 1,
        damage: 6,
        miningSpeed: 1.5
    },
    'sword-gold': {
        id: 135,
        name: 'Gold Sword',
        category: 'tools',
        subcategory: 'sword',
        stackable: false,
        maxStack: 1,
        damage: 4,
        miningSpeed: 1.5
    },
    'sword-diamond': {
        id: 133,
        name: 'Diamond Sword',
        category: 'tools',
        subcategory: 'sword',
        stackable: false,
        maxStack: 1,
        damage: 7,
        miningSpeed: 1.5
    },
    'sword-emerald': {
        id: 134,
        name: 'Emerald Sword',
        category: 'tools',
        subcategory: 'sword',
        stackable: false,
        maxStack: 1,
        damage: 8,
        miningSpeed: 1.5
    }
};

// Hilfsfunktionen
const ItemRegistry = {
    // Hole Item nach Name
    getByName(name) {
        return ITEMS[name] || null;
    },
    
    // Hole Item nach ID
    getById(id) {
        for (let key in ITEMS) {
            if (ITEMS[key].id === id) {
                return { key: key, ...ITEMS[key] };
            }
        }
        return null;
    },
    
    // Hole alle Items einer Kategorie
    getByCategory(category) {
        const result = [];
        for (let key in ITEMS) {
            if (ITEMS[key].category === category) {
                result.push({ key: key, ...ITEMS[key] });
            }
        }
        return result;
    },
    
    // Hole alle Items einer Subkategorie
    getBySubcategory(subcategory) {
        const result = [];
        for (let key in ITEMS) {
            if (ITEMS[key].subcategory === subcategory) {
                result.push({ key: key, ...ITEMS[key] });
            }
        }
        return result;
    },
    
    // Prüfe ob Item existiert
    exists(nameOrId) {
        if (typeof nameOrId === 'string') {
            return ITEMS[nameOrId] !== undefined;
        } else if (typeof nameOrId === 'number') {
            return this.getById(nameOrId) !== null;
        }
        return false;
    },
    
    // Hole Item-Key (Name) nach ID
    getKeyById(id) {
        for (let key in ITEMS) {
            if (ITEMS[key].id === id) {
                return key;
            }
        }
        return null;
    },
    
    // Liste alle Items
    listAll() {
        const result = [];
        for (let key in ITEMS) {
            result.push({ key: key, ...ITEMS[key] });
        }
        return result;
    }
};
