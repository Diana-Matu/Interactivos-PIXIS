import { BeeGenome } from '../models/beeGenome.js';
import { SeededRandom } from '../utils/seededRandom.js';

export class SlotController {
    constructor() {
        console.log('🎰 Inicializando tragamonedas...');
        
        this.genome = new BeeGenome();
        this.random = new SeededRandom();
        
        this.slots = [
            { index: 0, parts: [], spinning: false, position: 0, finalIndex: 0, spinSpeed: 0 },
            { index: 1, parts: [], spinning: false, position: 0, finalIndex: 0, spinSpeed: 0 },
            { index: 2, parts: [], spinning: false, position: 0, finalIndex: 0, spinSpeed: 0 }
        ];
        
        this.currentCombination = { head: null, thorax: null, abdomen: null };
        this.isSpinning = false;
        this.spinStartTime = 0;
        
        // Configuración básica
        this.spinConfig = {
            spinTime: 3000,      // 3 segundos de giro
            maxSpeed: 60,
            spacing: 100
        };
        
        this.resetSlots();
        this.updateCurrentCombination();
    }

    resetSlots() {
        this.slots.forEach((slot, index) => {
            slot.parts = this.genome.getPartsForSlot(index, this.random);
            slot.position = 0;
            slot.finalIndex = Math.floor(slot.parts.length / 2);
            slot.spinSpeed = 0;
            slot.spinning = false;
        });
    }

    startSpin() {
        if (this.isSpinning) return;
        
        console.log('INICIANDO GIRO');
        this.isSpinning = true;
        this.spinStartTime = Date.now();
        
        this.slots.forEach((slot, index) => {
            slot.spinning = true;
            slot.finalIndex = this.random.randomInt(0, slot.parts.length - 1);
            slot.spinSpeed = this.spinConfig.maxSpeed;
            console.log(`Slot ${index} objetivo: ${slot.finalIndex}`);
        });
    }

    updateSpin() {
        if (!this.isSpinning) return false;

        const elapsed = Date.now() - this.spinStartTime;
        
        // Calcular progreso del giro (0 a 1)
        let progress = Math.min(1, elapsed / this.spinConfig.spinTime);
        
        let allFinished = true;
        
        this.slots.forEach((slot, index) => {
            if (!slot.spinning) return;
            
            allFinished = false;
            
            // Fase 1: Aceleración (primer 20%)
            if (progress < 0.2) {
                slot.spinSpeed = this.spinConfig.maxSpeed * (progress / 0.2);
            }
            // Fase 2: Velocidad constante (20% a 70%)
            else if (progress < 0.7) {
                slot.spinSpeed = this.spinConfig.maxSpeed;
            }
            // Fase 3: Desaceleración (70% a 100%)
            else {
                const decelProgress = (progress - 0.7) / 0.3;
                slot.spinSpeed = this.spinConfig.maxSpeed * (1 - decelProgress);
            }
            
            slot.position += slot.spinSpeed;
            
            // Detener cuando llegue al final
            if (progress >= 1) {
                slot.spinning = false;
                slot.position = slot.finalIndex * this.spinConfig.spacing;
                slot.spinSpeed = 0;
            }
            
            // Mantener posición cíclica
            const maxPosition = slot.parts.length * this.spinConfig.spacing;
            slot.position %= maxPosition;
        });

        if (allFinished) {
            this.isSpinning = false;
            this.updateCurrentCombination();
            console.log(' GIRO COMPLETADO', this.currentCombination);
            return false;
        }

        return true;
    }

    updateCurrentCombination() {
        if (!this.slots[0].parts.length || !this.slots[1].parts.length || !this.slots[2].parts.length) {
            return;
        }

        this.currentCombination = {
            head: this.slots[0].parts[this.slots[0].finalIndex],
            thorax: this.slots[1].parts[this.slots[1].finalIndex],
            abdomen: this.slots[2].parts[this.slots[2].finalIndex]
        };

        console.log('Combinación actualizada:', {
            head: this.currentCombination.head?.name,
            thorax: this.currentCombination.thorax?.name,
            abdomen: this.currentCombination.abdomen?.name
        });
    }

    getSlotPosition(slotIndex) {
        return this.slots[slotIndex].position;
    }

    getCurrentCombination() {
        return this.currentCombination;
    }
}