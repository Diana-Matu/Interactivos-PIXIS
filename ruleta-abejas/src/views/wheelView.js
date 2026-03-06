export class WheelView {
    constructor(app, bees) {
        this.app = app;
        this.bees = bees;
        this.container = new PIXI.Container();
        this.radius = 260; 
        
        this.createWheel();
    }

    createWheel() {
        // Fondo de la ruleta - color crema/amarillo muy suave que combina con el dorado
        const wheelBackground = new PIXI.Graphics();
        wheelBackground.beginFill(0xFFF8E7); // Crema muy suave (casi blanco con tono amarillo)
        wheelBackground.drawCircle(0, 0, this.radius + 15);
        wheelBackground.endFill();
        
        // Borde sutil en dorado claro
        wheelBackground.lineStyle(2, 0xFFD700, 0.5); // Dorado semitransparente
        wheelBackground.drawCircle(0, 0, this.radius + 15);
        
        this.container.addChild(wheelBackground);

        // Crear segmentos solo con abejas
        const numSegments = this.bees.length;
        for (let i = 0; i < numSegments; i++) {
            const angle = (i / numSegments) * Math.PI * 2;
            
            // Contenedor del segmento
            const segment = new PIXI.Container();
            segment.rotation = angle;

            // Sprite de la abeja
            const beeSprite = new PIXI.Sprite(this.bees[i].texture);
            beeSprite.anchor.set(0.5);
            beeSprite.position.set(0, -this.radius + 100);
            beeSprite.scale.set(0.7); 
            
            beeSprite.rotation = -angle;
            
            // Estilo pixel art
            beeSprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            
            segment.addChild(beeSprite);
            this.container.addChild(segment);
        }

        // Centro dorado
        const centerCircle = new PIXI.Graphics();
        centerCircle.beginFill(0xFFD700); // Dorado
        centerCircle.drawCircle(0, 0, 35);
        centerCircle.endFill();
        this.container.addChild(centerCircle);

        // Centro blanco perlado
        const whiteCenter = new PIXI.Graphics();
        whiteCenter.beginFill(0xFFF5E6); // Blanco con tono amarillo
        whiteCenter.drawCircle(0, 0, 15);
        whiteCenter.endFill();
        this.container.addChild(whiteCenter);
    }

    createArrow() {
        const arrowContainer = new PIXI.Container();
        
        // Línea desde el centro hacia afuera - color dorado oscuro 
        const line = new PIXI.Graphics();
        line.lineStyle(4, 0xB8860B); // Dorado oscuro
        line.moveTo(0, 0);
        line.lineTo(0, -this.radius - 50);
        arrowContainer.addChild(line);
        
        // Triángulo en la punta - rojo pero con borde dorado
        const triangle = new PIXI.Graphics();
        triangle.beginFill(0xFF0000);
        triangle.drawPolygon([
            -15, -this.radius - 50,
            15, -this.radius - 50,
            0, -this.radius - 80
        ]);
        triangle.endFill();
        
        // Borde dorado para el triángulo
        triangle.lineStyle(2, 0xFFD700);
        triangle.drawPolygon([
            -15, -this.radius - 50,
            15, -this.radius - 50,
            0, -this.radius - 80
        ]);
        
        arrowContainer.addChild(triangle);
        
        // Círculo en el centro - dorado con borde
        const centerDot = new PIXI.Graphics();
        centerDot.beginFill(0xB8860B); // Dorado oscuro
        centerDot.drawCircle(0, 0, 8);
        centerDot.endFill();
        
        // Borde dorado claro para el círculo
        centerDot.lineStyle(2, 0xFFD700);
        centerDot.drawCircle(0, 0, 8);
        
        arrowContainer.addChild(centerDot);
        
        return arrowContainer;
    }
}