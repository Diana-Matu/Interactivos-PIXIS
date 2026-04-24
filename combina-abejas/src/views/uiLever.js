import * as PIXI from 'pixi.js';

export class UILever extends PIXI.Container {
    constructor(x, y, scale = 1.5, onSpin = null) {
        super();
        
        this.x = x;
        this.y = y;
        this.baseScale = scale;
        this.scale.set(scale);
        this.onSpin = onSpin;
        
        // Estados de la palanca
        this.isAnimating = false;
        this.angle = 0;
        this.maxAngle = 65;
        
        // Elementos gráficos
        this.armGraphics = null;
        this.knobGraphics = null;
        this.baseContainer = null;
        
        this.createBase();
        this.createMovingParts();
        this.createStaticElements();
        
        this.setupInteractivity();
    }

    createBase() {
        this.baseContainer = new PIXI.Container();
        
        // Sombra de la base
        const baseShadow = new PIXI.Graphics();
        baseShadow.beginFill(0x000000, 0.3);
        baseShadow.drawRoundedRect(-15, 5, 55, 85, 12);
        baseShadow.endFill();
        
        // Base principal
        const base = new PIXI.Graphics();
        base.beginFill(0x555555);
        base.drawRoundedRect(-20, 0, 65, 85, 15);
        base.endFill();
        
        // Detalles metálicos
        base.lineStyle(1, 0x777777, 0.5);
        for (let i = 0; i < 70; i += 8) {
            base.moveTo(-15, i + 5);
            base.lineTo(50, i + 5);
        }
        
        base.lineStyle(2, 0x999999);
        base.drawRoundedRect(-20, 0, 65, 85, 15);
        
        base.lineStyle(1, 0x333333);
        base.drawRoundedRect(-18, 2, 61, 81, 13);
        
        // Tornillos decorativos
        const screwPositions = [
            {x: -10, y: 15},
            {x: 45, y: 15},
            {x: -10, y: 65},
            {x: 45, y: 65}
        ];
        
        screwPositions.forEach(pos => {
            const screw = new PIXI.Graphics();
            screw.beginFill(0x888888);
            screw.drawCircle(pos.x, pos.y, 5);
            screw.endFill();
            
            screw.lineStyle(2, 0x444444);
            screw.moveTo(pos.x - 3, pos.y - 3);
            screw.lineTo(pos.x + 3, pos.y + 3);
            screw.moveTo(pos.x + 3, pos.y - 3);
            screw.lineTo(pos.x - 3, pos.y + 3);
            
            base.addChild(screw);
        });
        
        // Placa frontal
        const plate = new PIXI.Graphics();
        plate.beginFill(0xffffff, 0.1);
        plate.drawRoundedRect(-15, 5, 55, 75, 10);
        plate.endFill();
        
        this.baseContainer.addChild(baseShadow);
        this.baseContainer.addChild(base);
        this.baseContainer.addChild(plate);
        
        this.addChild(this.baseContainer);
    }

    createMovingParts() {
        this.pivotX = 15;
        this.pivotY = 30;
        
        this.armGraphics = new PIXI.Graphics();
        this.addChild(this.armGraphics);
        
        this.knobGraphics = new PIXI.Graphics();
        this.addChild(this.knobGraphics);
        
        this.updateMovingParts();
    }

    createStaticElements() {
        // Texto "TIRA"
        const pullLabel = new PIXI.Text('TIRA', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff,
            align: 'center',
            fontWeight: 'bold'
        });
        pullLabel.x = 25;
        pullLabel.y = -35;
        this.addChild(pullLabel);
        
        
        // Texto "PALANCA"
        const leverLabel = new PIXI.Text('PALANCA', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xffd93d,
            align: 'center',
            fontWeight: 'bold'
        });
        leverLabel.x = 20;
        leverLabel.y = 95;
        this.addChild(leverLabel);
        
        // Flecha indicadora
        this.arrow = new PIXI.Graphics();
        this.arrow.beginFill(0xffd93d);
        this.arrow.drawPolygon([-6, -18, 6, -18, 0, -8]);
        this.arrow.endFill();
        this.arrow.x = 25;
        this.arrow.y = -45;
        this.addChild(this.arrow);
        
        this.animateArrow();
    }

    animateArrow() {
        let direction = 1;
        const animate = () => {
            if (!this.isAnimating) {
                this.arrow.y += direction * 0.3;
                if (this.arrow.y > -42 || this.arrow.y < -48) {
                    direction *= -1;
                }
            }
            requestAnimationFrame(animate);
        };
        animate();
    }

    updateMovingParts() {
        this.armGraphics.clear();
        this.knobGraphics.clear();
        
        const armLength = 100;
        const rad = this.angle * Math.PI / 180;
        
        const endX = this.pivotX + Math.sin(rad) * armLength;
        const endY = this.pivotY - Math.cos(rad) * armLength;
        
        // Sombra del brazo
        this.armGraphics.lineStyle(14, 0x333333, 0.4);
        this.armGraphics.moveTo(this.pivotX + 2, this.pivotY + 2);
        this.armGraphics.lineTo(endX + 2, endY + 2);
        
        // Brazo principal
        this.armGraphics.lineStyle(14, 0x888888);
        this.armGraphics.moveTo(this.pivotX, this.pivotY);
        this.armGraphics.lineTo(endX, endY);
        
        // Reflejo
        this.armGraphics.lineStyle(4, 0xcccccc, 0.6);
        this.armGraphics.moveTo(this.pivotX - 1, this.pivotY - 1);
        this.armGraphics.lineTo(endX - 1, endY - 1);
        
        // Bisagra
        this.armGraphics.beginFill(0x444444);
        this.armGraphics.drawCircle(this.pivotX, this.pivotY, 10);
        this.armGraphics.endFill();
        this.armGraphics.beginFill(0x888888);
        this.armGraphics.drawCircle(this.pivotX, this.pivotY, 6);
        this.armGraphics.endFill();
        
        // Sombra de la bolita
        this.knobGraphics.beginFill(0x330000, 0.5);
        this.knobGraphics.drawCircle(endX + 3, endY + 3, 18);
        this.knobGraphics.endFill();
        
        // Bolita roja
        this.knobGraphics.beginFill(0xff3333);
        this.knobGraphics.drawCircle(endX, endY, 18);
        this.knobGraphics.endFill();
        
        // Brillo
        this.knobGraphics.beginFill(0xff8888);
        this.knobGraphics.drawCircle(endX - 4, endY - 4, 5);
        this.knobGraphics.endFill();
        
        // Reflejo
        this.knobGraphics.beginFill(0xffffff, 0.8);
        this.knobGraphics.drawCircle(endX - 2, endY - 2, 2);
        this.knobGraphics.endFill();
        
        // Anillo metálico
        this.knobGraphics.lineStyle(2, 0xcccccc);
        this.knobGraphics.drawCircle(endX, endY, 18);
    }

    setupInteractivity() {
        // Hacer que TODA la palanca sea interactiva
        this.eventMode = 'static';
        this.cursor = 'pointer';
        
        // Evento de clic
        this.on('pointerdown', this.onClick.bind(this));
        
        // Hover effects
        this.on('pointerover', this.onHover.bind(this));
        this.on('pointerout', this.onOut.bind(this));
    }

    onClick() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // Animar hacia abajo
        this.animateToAngle(this.maxAngle, 150, () => {
            // Activar giro
            if (this.onSpin) {
                this.onSpin();
            }
            this.vibrate();
            
            // Animar retorno
            setTimeout(() => {
                this.animateToAngle(0, 200, () => {
                    this.isAnimating = false;
                });
            }, 100);
        });
    }

    animateToAngle(targetAngle, duration, onComplete = null) {
        const startAngle = this.angle;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Easing suave
            this.angle = startAngle + (targetAngle - startAngle) * (1 - Math.pow(1 - progress, 3));
            this.updateMovingParts();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.angle = targetAngle;
                this.updateMovingParts();
                if (onComplete) onComplete();
            }
        };
        
        requestAnimationFrame(animate);
    }

    onHover() {
        if (!this.isAnimating) {
            this.knobGraphics.tint = 0xff6666;
            this.knobGraphics.scale.set(1.1);
            this.arrow.tint = 0xffaa00;
        }
    }

    onOut() {
        if (!this.isAnimating) {
            this.knobGraphics.tint = 0xffffff;
            this.knobGraphics.scale.set(1);
            this.arrow.tint = 0xffffff;
        }
    }

    vibrate() {
        const originalX = this.x;
        
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.x = originalX + (i % 2 === 0 ? 4 : -4);
            }, i * 60);
        }
        
        setTimeout(() => {
            this.x = originalX;
        }, 240);
    }

    setEnabled(enabled) {
        this.eventMode = enabled ? 'static' : 'none';
        this.alpha = enabled ? 1 : 0.5;
        
        if (!enabled) {
            this.cursor = 'default';
        }
    }
}