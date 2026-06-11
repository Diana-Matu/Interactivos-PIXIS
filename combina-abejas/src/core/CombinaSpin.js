// src/core/CombinaSpin.js
import * as PIXI from 'pixi.js';

export class CombinaSpin {
    constructor(generator) {
        this.generator = generator;
        this.spinConfig = {
            spinTime: 2500,
            maxSpeed: 80,
            spacing: 90,
            spinDelay: []
        };
    }

    async spin() {
        if (this.generator.isSpinning) return;
        
        console.log(' INICIANDO GIRO');
        this.generator.isSpinning = true;
        this.generator.spinStartTime = Date.now();
        
        this.showSpinningMessage();
        
        this.generator.slots.forEach((slot, index) => {
            if (slot.parts.length === 0) return;
            
            slot.spinning = true;
            slot.finalIndex = Math.floor(Math.random() * slot.parts.length);
            slot.spinSpeed = this.spinConfig.maxSpeed;
            
            console.log(`Slot ${index} (${slot.type}): objetivo ${slot.finalIndex}`);
        });
        
        await this.animateSpin();
        
        this.generator.isSpinning = false;
        this.updateCurrentCombination();
        this.generator.updateResultDisplay();
        this.generator.celebrate();
        
        console.log(' GIRO COMPLETADO');
    }

    showSpinningMessage() {
        if (this.generator.resultSprite) {
            this.generator.resultSprite.destroy();
        }
        
        // Limpiar mensajes anteriores en el contenedor
        if (this.generator.resultContainer.children) {
            for (let i = this.generator.resultContainer.children.length - 1; i >= 3; i--) {
                const child = this.generator.resultContainer.children[i];
                if (child !== this.generator.resultContainer.children[0] && 
                    child !== this.generator.resultContainer.children[1] && 
                    child !== this.generator.resultContainer.children[2]) {
                    child.destroy();
                }
            }
        }
        
        const spinningMsg = new PIXI.Text('GIRANDO...', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffd93d,
            fontWeight: 'bold'
        });
        
        // Centrar en el contenedor del avatar (resultContainer)
        spinningMsg.x = (this.generator.resultContainer.width - spinningMsg.width) / 2;
        spinningMsg.y = (this.generator.resultContainer.height - spinningMsg.height) / 2;
        
        this.generator.resultContainer.addChild(spinningMsg);
        this.generator.resultSprite = spinningMsg;
    }

    async animateSpin() {
        const startTime = Date.now();
        const duration = this.spinConfig.spinTime;
        
        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                let allFinished = true;
                
                this.generator.slots.forEach((slot, index) => {
                    if (!slot.spinning) return;
                    
                    allFinished = false;
                    const slotProgress = Math.min(1, elapsed / (duration - this.spinConfig.spinDelay[index]));
                    
                    // Velocidad variable
                    if (slotProgress < 0.2) {
                        slot.spinSpeed = this.spinConfig.maxSpeed * (slotProgress / 0.2);
                    } else if (slotProgress < 0.7) {
                        slot.spinSpeed = this.spinConfig.maxSpeed;
                    } else {
                        const decelProgress = (slotProgress - 0.7) / 0.3;
                        slot.spinSpeed = this.spinConfig.maxSpeed * (1 - decelProgress);
                    }
                    
                    slot.position += slot.spinSpeed;
                    const maxPosition = slot.parts.length * this.spinConfig.spacing;
                    slot.position %= maxPosition;
                    
                    if (elapsed >= duration - this.spinConfig.spinDelay[index]) {
                        slot.spinning = false;
                        slot.position = slot.finalIndex * this.spinConfig.spacing;
                        slot.spinSpeed = 0;
                    }
                    
                    if (this.generator.slotViews[index]) {
                        this.generator.slotViews[index].updateParts(
                            slot.parts,
                            slot.position,
                            {
                                spinning: slot.spinning,
                                spinSpeed: slot.spinSpeed,
                                finalIndex: slot.finalIndex
                            }
                        );
                    }
                });
                
                if (allFinished) {
                    this.generator.slots.forEach((slot, index) => {
                        if (this.generator.slotViews[index]) {
                            this.generator.slotViews[index].updateParts(
                                slot.parts,
                                slot.finalIndex * this.spinConfig.spacing,
                                { spinning: false, spinSpeed: 0, finalIndex: slot.finalIndex }
                            );
                        }
                    });
                    resolve();
                } else {
                    requestAnimationFrame(animate.bind(this));
                }
            };
            
            animate.call(this);
        });
    }

    updateCurrentCombination() {
        this.generator.currentCombination = [];
        this.generator.slots.forEach((slot, index) => {
            if (slot.parts.length > 0 && slot.finalIndex !== null) {
                const finalIdx = Math.min(slot.finalIndex, slot.parts.length - 1);
                this.generator.currentCombination[index] = slot.parts[finalIdx];
                console.log(`Slot ${index}: seleccionado ${slot.parts[finalIdx]?.name}`);
            } else {
                this.generator.currentCombination[index] = null;
            }
        });
    }
}