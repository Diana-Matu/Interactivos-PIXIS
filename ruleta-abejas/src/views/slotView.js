import * as PIXI from 'pixi.js';

export class SlotView {
    constructor(app, x, y, width, height) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;
        
        this.sprites = [];
        this.blurFilter = new PIXI.BlurFilter();
        this.blurFilter.blur = 0;
        
        this.createSlotMachine();
    }

    createSlotMachine() {
        // Sombra exterior
        const shadow = new PIXI.Graphics();
        shadow.beginFill(0x000000, 0.3);
        shadow.drawRoundedRect(5, 5, this.width - 50, this.height - 10, 22);
        shadow.endFill();
        this.container.addChild(shadow);
        
        // Carcasa principal
        const casing = new PIXI.Graphics();
        casing.beginFill(0x2c3e50);
        casing.drawRoundedRect(0, 0, this.width, this.height, 15);
        casing.endFill();
        
        // Borde metálico
        casing.lineStyle(3, 0x4a5b6b);
        casing.drawRoundedRect(2, 2, this.width - 4, this.height - 4, 13);
        
        this.container.addChild(casing);
        
        // Panel frontal con textura
        const panel = new PIXI.Graphics();
        panel.beginFill(0x1e2b38);
        panel.drawRoundedRect(5, 5, this.width - 10, this.height - 10, 10);
        panel.endFill();
        
        // Líneas de metal cepillado
        for (let i = 0; i < this.height; i += 8) {
            panel.lineStyle(1, 0x2a3744);
            panel.moveTo(10, i + 10);
            panel.lineTo(this.width - 10, i + 10);
        }
        
        this.container.addChild(panel);
        
        // Título del slot 
        const slotTitles = ['CABEZA', 'TORAX', 'ABDOMEN'];
        let titleIndex = 0;
        if (this.x > 600) titleIndex = 2;
        else if (this.x > 350) titleIndex = 1;
        
        const titlePlate = new PIXI.Graphics();
        titlePlate.beginFill(0x4a5b6b);
        titlePlate.drawRoundedRect(this.width/2 - 50, 10, 100, 25, 8);
        titlePlate.endFill();
        titlePlate.lineStyle(2, 0xffd93d);
        titlePlate.drawRoundedRect(this.width/2 - 50, 10, 100, 25, 8);
        this.container.addChild(titlePlate);
        
        const title = new PIXI.Text(slotTitles[titleIndex], {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffd93d,
            align: 'center',
            fontWeight: 'bold'
        });
        title.x = this.width / 2 - title.width / 2;
        title.y = 15;
        this.container.addChild(title);
        
        // Ventana de visualización
        this.viewY = 60;
        this.viewHeight = 460;
        this.selectorY = this.viewY + this.viewHeight / 2;
        
        const windowFrame = new PIXI.Graphics();
        windowFrame.lineStyle(3, 0xcccccc);
        windowFrame.beginFill(0x0a0f14, 0.9);
        windowFrame.drawRoundedRect(10, this.viewY, this.width - 20, this.viewHeight, 8);
        windowFrame.endFill();
        this.container.addChild(windowFrame);
        
        // Fondo de la ventana
        const windowBg = new PIXI.Graphics();
        windowBg.beginFill(0x000000);
        windowBg.drawRoundedRect(13, this.viewY + 3, this.width - 26, this.viewHeight - 6, 10);
        windowBg.endFill();
        this.container.addChild(windowBg);
        
        // Línea de selección 
        const selectorLine = new PIXI.Graphics();
        selectorLine.lineStyle(2, 0xffd93d);
        selectorLine.moveTo(20, this.selectorY);
        selectorLine.lineTo(this.width - 20, this.selectorY);
        this.container.addChild(selectorLine);
        
    }

    updateParts(parts, position, spinState) {
        // Limpiar sprites anteriores
        this.sprites.forEach(sprite => sprite.destroy());
        this.sprites = [];

        if (!parts || parts.length === 0) return;

        // Configurar desenfoque por velocidad
        const speed = Math.abs(spinState.spinSpeed || 0);
        this.blurFilter.blur = spinState.spinning ? Math.min(3, speed / 12) : 0;

        const spacing = 70; // Mismo valor que en slotController

        parts.forEach((part, index) => {
            const texture = this.createPartTexture(part);
            const sprite = new PIXI.Sprite(texture);
            
            // Posición vertical
            const baseY = this.selectorY + (index - 1) * spacing;
            let spriteY = baseY + position;
            
            // Ajuste cíclico para efecto infinito
            while (spriteY < this.viewY + 50) {
                spriteY += parts.length * spacing;
            }
            while (spriteY > this.viewY + this.viewHeight - 20) {
                spriteY -= parts.length * spacing;
            }
            
            sprite.x = this.width / 2;
            sprite.y = spriteY;
            sprite.scale.set(4.5);
            sprite.anchor.set(0.4);
            
            // Aplicar filtros según estado
            if (spinState.spinning) {
                sprite.filters = [this.blurFilter];
                sprite.tint = 0xcccccc;
            } else {
                sprite.filters = [];
                sprite.tint = 0xffffff;
            }
            
            this.container.addChild(sprite);
            this.sprites.push(sprite);
        });
    }

    createPartTexture(part) {
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        part.pixels.forEach(pixel => {
            const color = pixel.color || part.baseColor;
            ctx.fillStyle = color;
            ctx.fillRect(pixel.x, pixel.y, 1.5, 1.5);
        });
        
        return PIXI.Texture.from(canvas);
    }
}