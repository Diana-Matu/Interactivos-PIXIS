export class AvatarView {
    constructor(app) {
        this.app = app;
        this.container = new PIXI.Container();
        
        this.createFrame();
        app.stage.addChild(this.container);
        
        // Escuchar evento de selección de abeja
        document.addEventListener('beeSelected', (event) => {
            this.showAvatar(event.detail);
        });
    }

    createFrame() {
        // Marco decorativo más grande
        const frame = new PIXI.Graphics();
        frame.beginFill(0xFFFFFF, 0.9);
        frame.drawRoundedRect(-120, -85, 240, 170, 20); 
        frame.endFill();
        frame.lineStyle(5, 0xDEB887); 
        frame.drawRoundedRect(-120, -85, 240, 170, 20);
        
        this.container.addChild(frame);
        
        // Título más grande
        const title = new PIXI.Text('Tu Abeja:', {
            fontFamily: 'Arial',
            fontSize: 22, 
            fontWeight: 'bold',
            fill: 0x8B4513
        });
        title.anchor.set(0.5);
        title.position.set(0, -55); 
        this.container.addChild(title);
        
        this.frame = frame;
        this.title = title;
    }

    showAvatar(beeData) {
        const { bee, variation } = beeData;
        
        // Limpiar avatar anterior 
        while(this.container.children.length > 2) {
            this.container.removeChildAt(2);
        }

        // Texto del nombre 
        const nameText = new PIXI.Text(bee.name, {
            fontFamily: 'Arial',
            fontSize: 20, 
            fontWeight: 'bold',
            fill: 0x8B4513
        });
        nameText.anchor.set(0.5);
        nameText.position.set(0, 50); 
        this.container.addChild(nameText);

        // Sprite de la abeja más grande
        const beeSprite = new PIXI.Sprite(bee.texture);
        beeSprite.anchor.set(0.5);
        beeSprite.position.set(0, -5); 
        beeSprite.scale.set(variation.scale * 0.9); 
        
        // Estilo pixel art
        beeSprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        
        this.container.addChild(beeSprite);
        
        // Aplicar accesorios según variación
        this.applyAccessories(variation, beeSprite.position);
    }

    applyAccessories(variation, position) {
        if (variation.hasGlasses) {
            const glasses = new PIXI.Graphics();
            glasses.lineStyle(3, 0x000000); // Más grueso
            glasses.drawCircle(position.x - 18, position.y - 8, 10); // Ajustado
            glasses.drawCircle(position.x + 18, position.y - 8, 10);
            glasses.moveTo(position.x - 8, position.y - 8);
            glasses.lineTo(position.x + 8, position.y - 8);
            this.container.addChild(glasses);
        }
        
        if (variation.hasCrown) {
            const crown = new PIXI.Graphics();
            crown.beginFill(0xFFD700);
            crown.drawPolygon([
                position.x - 20, position.y - 35,
                position.x, position.y - 50,
                position.x + 20, position.y - 35
            ]);
            crown.endFill();
            this.container.addChild(crown);
        }
        
        if (variation.hasScarf) {
            const scarf = new PIXI.Graphics();
            scarf.beginFill(0xFF6B6B);
            scarf.drawRect(position.x - 25, position.y + 8, 50, 10); // Ajustado
            scarf.endFill();
            this.container.addChild(scarf);
        }
    }
}