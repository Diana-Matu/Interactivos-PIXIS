import { WheelView } from '../views/wheelView.js';

export class WheelController {
    constructor(app, bees) {
        this.app = app;
        this.bees = bees;
        this.wheelView = new WheelView(app, bees);
        this.container = this.wheelView.container;
        this.isSpinning = false;
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.spinSpeed = 0;
        this.spinDuration = 0;
        this.spinStartTime = 0;
        this.arrow = null;
        
        this.app.stage.addChild(this.container);
        
        // Crear y añadir la flecha indicadora USANDO EL MÉTODO DE WHEELVIEW
        this.createArrow();
    }

    createArrow() {
        // USAR el método createArrow de WheelView en lugar de crear la flecha manualmente
        this.arrow = this.wheelView.createArrow();
        
        // La flecha ya viene posicionada correctamente desde WheelView
        // pero podemos ajustar su posición si es necesario
        this.arrow.x = this.container.x;
        this.arrow.y = this.container.y;
        
        this.app.stage.addChild(this.arrow);
    }

    spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.spinStartTime = performance.now();
        
        // Calcular giro: múltiples vueltas + ángulo aleatorio
        const spins = 10 + Math.floor(Math.random() * 8); // 10-18 vueltas 
        const randomAngle = Math.random() * Math.PI * 2;
        this.targetAngle = this.currentAngle + (spins * Math.PI * 2) + randomAngle;
        this.spinDuration = 3500; 
    }

    calculateSelectedBee() {
        const normalizedAngle = this.targetAngle % (Math.PI * 2);
        const segmentAngle = (Math.PI * 2) / this.bees.length;
        let index = Math.floor(normalizedAngle / segmentAngle) % this.bees.length;
        
        // Ajustar índice negativo
        if (index < 0) index += this.bees.length;
        
        const bee = this.bees[index];
        const variation = bee.generateVariation(Date.now());
        
        // Disparar evento para mostrar avatar
        const event = new CustomEvent('beeSelected', { 
            detail: { bee, variation } 
        });
        document.dispatchEvent(event);
        
        return { bee, variation };
    }

    update(delta) {
        if (this.isSpinning) {
            const currentTime = performance.now();
            const elapsed = currentTime - this.spinStartTime;
            
            if (elapsed < this.spinDuration) {
                const progress = elapsed / this.spinDuration;
                
                let easeOut;
                if (progress < 0.1) {
                    easeOut = progress * 10; // Aceleración muy rápida al inicio
                } else if (progress < 0.3) {
                    easeOut = 1 - Math.pow(1 - (progress - 0.1) / 0.2, 2); // Desaceleración media
                } else {
                    easeOut = 1 - Math.pow(1 - (progress - 0.3) / 0.7, 4); // Desaceleración suave al final
                }
                
                // Ángulo actual interpolado
                this.currentAngle = this.targetAngle - (this.targetAngle - this.currentAngle) * (1 - easeOut);
                
                // Añadir vibración más notoria al final
                if (progress > 0.8) {
                    const vibrationIntensity = Math.min(1, (progress - 0.8) * 10);
                    const vibration = Math.sin(progress * 100) * 0.03 * (1 - (progress - 0.8) / 0.2);
                    this.currentAngle += vibration;
                }
            } else {
                // Finalizar giro
                this.currentAngle = this.targetAngle;
                this.isSpinning = false;
                
                // Calcular y mostrar resultado
                const result = this.calculateSelectedBee();
                
                // Mostrar en consola para depuración
                console.log('Abeja seleccionada:', result.bee.name);
            }
            
            // Aplicar rotación
            this.container.rotation = this.currentAngle;
        }
        
        // Actualizar posición de la flecha si es necesario
        if (this.arrow) {
            // La flecha NO debe rotar con la ruleta, por eso la mantenemos fija
            this.arrow.x = this.container.x;
            this.arrow.y = this.container.y;
        }
    }
}