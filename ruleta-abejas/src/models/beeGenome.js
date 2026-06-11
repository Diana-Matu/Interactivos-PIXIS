import { BeePart } from './beePart.js';
import { SeededRandom } from '../utils/seededRandom.js';

export class BeeGenome {
    constructor() {
        this.parts = {
            heads: [],
            thoraxes: [],
            abdomens: []
        };
        
        this.generateAllParts();
    }

    generateAllParts() {
        for (let i = 0; i < 6; i++) {
            this.parts.heads.push(this.createHead(i));
            this.parts.thoraxes.push(this.createThorax(i));
            this.parts.abdomens.push(this.createAbdomen(i));
        }
    }

    createHead(variation) {
        const pixels = [];
        const colors = ['#FDB813', '#FFD700', '#FFC72C', '#FFA500', '#FF8C00', '#FFB347'];
        const baseColor = colors[variation % colors.length];
        
        const shape = [
            {x: 4, y: 2}, {x: 5, y: 2}, {x: 6, y: 2}, {x: 7, y: 2},
            {x: 3, y: 3}, {x: 4, y: 3}, {x: 5, y: 3}, {x: 6, y: 3}, {x: 7, y: 3}, {x: 8, y: 3},
            {x: 3, y: 4}, {x: 4, y: 4}, {x: 5, y: 4}, {x: 6, y: 4}, {x: 7, y: 4}, {x: 8, y: 4},
            {x: 4, y: 5}, {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5}
        ];
        
        shape.forEach(pos => pixels.push({ x: pos.x, y: pos.y }));
        pixels.push({ x: 5, y: 3, color: '#000000' });
        pixels.push({ x: 6, y: 3, color: '#000000' });
        
        if (variation % 2 === 0) {
            pixels.push({ x: 4, y: 1, color: '#000000' });
            pixels.push({ x: 7, y: 1, color: '#000000' });
        } else {
            pixels.push({ x: 4, y: 1, color: '#000000' });
            pixels.push({ x: 7, y: 1, color: '#000000' });
            pixels.push({ x: 5, y: 0, color: '#000000' });
            pixels.push({ x: 6, y: 0, color: '#000000' });
        }
        
        if (variation === 3) {
            pixels.push({ x: 5, y: 5, color: '#000000' });
            pixels.push({ x: 6, y: 5, color: '#000000' });
        }
        
        return new BeePart('head', `Cabeza ${variation + 1}`, baseColor, pixels);
    }

    createThorax(variation) {
        const pixels = [];
        const colors = ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#B8860B', '#C19A6B'];
        const baseColor = colors[variation % colors.length];
        
        const shape = [
            {x: 4, y: 2}, {x: 5, y: 2}, {x: 6, y: 2}, {x: 7, y: 2}, {x: 8, y: 2}, {x: 9, y: 2},
            {x: 3, y: 3}, {x: 4, y: 3}, {x: 5, y: 3}, {x: 6, y: 3}, {x: 7, y: 3}, {x: 8, y: 3}, {x: 9, y: 3}, {x: 10, y: 3},
            {x: 3, y: 4}, {x: 4, y: 4}, {x: 5, y: 4}, {x: 6, y: 4}, {x: 7, y: 4}, {x: 8, y: 4}, {x: 9, y: 4}, {x: 10, y: 4},
            {x: 4, y: 5}, {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5}, {x: 8, y: 5}, {x: 9, y: 5}
        ];
        
        shape.forEach(pos => pixels.push({ x: pos.x, y: pos.y }));
        
        if (variation % 2 === 0) {
            pixels.push({ x: 5, y: 2, color: '#000000' });
            pixels.push({ x: 8, y: 2, color: '#000000' });
        }
        
        return new BeePart('thorax', `Tórax ${variation + 1}`, baseColor, pixels);
    }

    createAbdomen(variation) {
        const pixels = [];
        const colors = ['#000000', '#1A1A1A', '#2C2C2C', '#3A3A3A', '#4A4A4A', '#5A5A5A'];
        const baseColor = colors[variation % colors.length];
        const stripeColor = variation % 2 === 0 ? '#FDB813' : '#FFD700';
        
        const shape = [
            {x: 5, y: 1}, {x: 6, y: 1}, {x: 7, y: 1}, {x: 8, y: 1},
            {x: 4, y: 2}, {x: 5, y: 2}, {x: 6, y: 2}, {x: 7, y: 2}, {x: 8, y: 2}, {x: 9, y: 2},
            {x: 4, y: 3}, {x: 5, y: 3}, {x: 6, y: 3}, {x: 7, y: 3}, {x: 8, y: 3}, {x: 9, y: 3},
            {x: 4, y: 4}, {x: 5, y: 4}, {x: 6, y: 4}, {x: 7, y: 4}, {x: 8, y: 4}, {x: 9, y: 4},
            {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5}, {x: 8, y: 5}
        ];
        
        shape.forEach(pos => pixels.push({ x: pos.x, y: pos.y }));
        
        for (let i = 1; i <= 3; i++) {
            if (variation % 2 === 0) {
                pixels.push({ x: 6, y: i * 2, color: stripeColor });
                pixels.push({ x: 7, y: i * 2, color: stripeColor });
            } else {
                for (let x = 5; x <= 8; x++) {
                    if (i % 2 === 0) {
                        pixels.push({ x: x, y: i * 2 - 1, color: stripeColor });
                    }
                }
            }
        }
        
        return new BeePart('abdomen', `Abdomen ${variation + 1}`, baseColor, pixels);
    }

    getPartsForSlot(slotIndex, random) {
        let parts;
        switch(slotIndex) {
            case 0: parts = this.parts.heads; break;
            case 1: parts = this.parts.thoraxes; break;
            case 2: parts = this.parts.abdomens; break;
            default: return [];
        }

        const shuffled = [...parts];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(random.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }

    getRandomCombination(random) {
        return {
            head: this.parts.heads[random.randomInt(0, this.parts.heads.length - 1)],
            thorax: this.parts.thoraxes[random.randomInt(0, this.parts.thoraxes.length - 1)],
            abdomen: this.parts.abdomens[random.randomInt(0, this.parts.abdomens.length - 1)]
        };
    }
}