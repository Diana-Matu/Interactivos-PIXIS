import { SeededRandom } from '../utils/seededRandom.js';
import { Counter } from '../utils/counter.js';

export class BeeModel {
    constructor(texture, name) {
        this.texture = texture;
        this.name = name;
        this.baseColor = this.extractBaseColor(texture);
        this.variations = [];
        this.generationCounter = new Counter();
    }

    extractBaseColor(texture) {
        const colors = {
            'Abeja Reina': 0xFFD700,
            'Abeja Obrera': 0xFFAA00,
            'Abeja Zángano': 0xFFB347,
            'Abeja Melífera': 0x4169E1
        };
        return colors[this.name] || 0xFFD700;
    }

    generateVariation(seed) {
        const random = new SeededRandom(seed);
        
        return {
            id: this.generationCounter.increment(),
            scale: 0.6 + random.next() * 0.4, // 0.6 - 1.0
            rotation: (random.next() - 0.5) * 0.2, // -0.1 a 0.1 radianes
            colorOffset: Math.floor(random.next() * 40) - 20, // -20 a 20
            hasGlasses: random.next() > 0.7,
            hasCrown: random.next() > 0.8,
            hasScarf: random.next() > 0.6,
            spots: Math.floor(random.next() * 4)
        };
    }
}