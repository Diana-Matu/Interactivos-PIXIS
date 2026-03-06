export class WheelView {
    constructor(app, bees) {
        this.app = app;
        this.bees = bees;
        this.container = new PIXI.Container();
        this.radius = 260; 
        
        this.createWheel();
    }

    createWheel() {
        // Fondo de la ruleta 
        const outerRing = new PIXI.Graphics();
        outerRing.beginFill(0xDEB887); 
        outerRing.drawCircle(0, 0, this.radius + 15); 
        outerRing.endFill();
        this.container.addChild(outerRing);

        // Fondo de la ruleta más grande
        const background = new PIXI.Graphics();
        background.beginFill(0xF4A460); // Madera media
        background.drawCircle(0, 0, this.radius);
        background.endFill();
        
        // Añadir textura de madera 
        for (let i = 0; i < 5; i++) {
            background.lineStyle(2, 0x8B4513, 0.2);
            background.drawCircle(0, 0, this.radius - (i * 35));
        }
        
        this.container.addChild(background);

        // Crear segmentos con abejas más grandes
        const numSegments = this.bees.length;
        for (let i = 0; i < numSegments; i++) {
            const angle = (i / numSegments) * Math.PI * 2;
            
            // Contenedor del segmento
            const segment = new PIXI.Container();
            segment.rotation = angle;

            // Línea divisoria más gruesa
            const line = new PIXI.Graphics();
            line.lineStyle(3, 0x8B4513); // Más gruesa
            line.moveTo(0, 0);
            line.lineTo(0, -this.radius);
            segment.addChild(line);

            // Sprite de la abeja MÁS GRANDE
            const beeSprite = new PIXI.Sprite(this.bees[i].texture);
            beeSprite.anchor.set(0.5);
            beeSprite.position.set(0, -this.radius + 100); // Radio
            beeSprite.scale.set(0.7); 
            
            beeSprite.rotation = -angle;
            
            // Estilo pixel art
            beeSprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            
            segment.addChild(beeSprite);
            this.container.addChild(segment);
        }

        // Centro de la ruleta más grande
        const centerOuter = new PIXI.Graphics();
        centerOuter.beginFill(0x8B4513); // Marrón oscuro
        centerOuter.drawCircle(0, 0, 40); 
        centerOuter.endFill();
        this.container.addChild(centerOuter);

        const centerInner = new PIXI.Graphics();
        centerInner.beginFill(0xFFD700); // Dorado
        centerInner.drawCircle(0, 0, 30); 
        centerInner.endFill();
        
        // Añadir detalles al centro
        centerInner.lineStyle(2, 0xFFFFFF);
        centerInner.drawCircle(0, 0, 10);
        
        this.container.addChild(centerInner);

        // Pequeño adorno en el centro
        const centerDot = new PIXI.Graphics();
        centerDot.beginFill(0xFFFFFF);
        centerDot.drawCircle(0, 0, 8);
        centerDot.endFill();
        this.container.addChild(centerDot);
    }

    // Método para crear la flecha indicadora (se llamará desde el controlador)
    createArrow() {
        const arrow = new PIXI.Graphics();
        arrow.beginFill(0xFF0000);
        arrow.drawPolygon([
            -20, -this.radius - 30,
            20, -this.radius - 30,
            0, -this.radius - 60
        ]);
        arrow.endFill();
        
        // Borde blanco para la flecha
        arrow.lineStyle(2, 0xFFFFFF);
        arrow.drawPolygon([
            -20, -this.radius - 30,
            20, -this.radius - 30,
            0, -this.radius - 60
        ]);
        
        arrow.position.set(this.container.x, this.container.y - 20);
        return arrow;
    }
}