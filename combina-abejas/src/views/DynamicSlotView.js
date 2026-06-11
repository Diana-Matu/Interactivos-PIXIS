import * as PIXI from 'pixi.js';

export class DynamicSlotView {
    constructor(app, x, y, width, height, partName, partIndex, orientation = 'horizontal', isMobile = false, colors = null) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.partName = partName;
        this.partIndex = partIndex;
        this.orientation = orientation;
        this.isMobile = isMobile;
        
        this.colors = colors || {
            panel: 0x2c3e50,
            slotBg: 0x2c3e50,
            slotDark: 0x1e2b38,
            border: 0x4a5b6b,
            accent: 0xffd93d,
            text: 0xffffff,
            windowBg: 0x0a0f14,
            windowInner: 0x000000
        };
        
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;
        
        this.sprites = [];
        this.blurFilter = new PIXI.BlurFilter();
        this.blurFilter.blur = 0;
        
        this.createSlotMachine();
    }

    createSlotMachine() {
        const titleSize = this.isMobile ? 10 : 14;
        
        const shadow = new PIXI.Graphics();
        shadow.beginFill(0x000000, 0.3);
        shadow.drawRoundedRect(3, 3, this.width - 6, this.height - 6, 10);
        shadow.endFill();
        this.container.addChild(shadow);
        
        const casing = new PIXI.Graphics();
        casing.beginFill(this.colors.slotBg);
        casing.drawRoundedRect(0, 0, this.width, this.height, 12);
        casing.endFill();
        casing.lineStyle(2, this.colors.border);
        casing.drawRoundedRect(2, 2, this.width - 4, this.height - 4, 10);
        this.container.addChild(casing);
        
        const titlePlate = new PIXI.Graphics();
        titlePlate.beginFill(this.colors.slotDark);
        titlePlate.drawRoundedRect(this.width/2 - 45, 5, 90, 22, 8);
        titlePlate.endFill();
        titlePlate.lineStyle(1, this.colors.accent);
        titlePlate.drawRoundedRect(this.width/2 - 45, 5, 90, 22, 8);
        this.container.addChild(titlePlate);
        
        const title = new PIXI.Text(this.partName, {
            fontFamily: 'Arial',
            fontSize: titleSize,
            fill: this.colors.text,
            align: 'center',
            fontWeight: 'bold'
        });
        title.x = this.width / 2 - title.width / 2;
        title.y = 9;
        this.container.addChild(title);
        
        this.viewY = 50;
        this.viewHeight = this.height - 100;
        this.selectorY = this.viewY + this.viewHeight / 2;
        
        const windowFrame = new PIXI.Graphics();
        windowFrame.lineStyle(2, this.colors.border);
        windowFrame.beginFill(this.colors.windowBg, 0.9);
        windowFrame.drawRoundedRect(10, this.viewY, this.width - 20, this.viewHeight, 8);
        windowFrame.endFill();
        this.container.addChild(windowFrame);
        
        const windowBg = new PIXI.Graphics();
        windowBg.beginFill(this.colors.windowInner);
        windowBg.drawRoundedRect(13, this.viewY + 3, this.width - 26, this.viewHeight - 6, 8);
        windowBg.endFill();
        this.container.addChild(windowBg);
        
        const selectorLine = new PIXI.Graphics();
        selectorLine.lineStyle(2, this.colors.accent);
        selectorLine.moveTo(20, this.selectorY);
        selectorLine.lineTo(this.width - 20, this.selectorY);
        this.container.addChild(selectorLine);
        
    }

    updateParts(parts, position, spinState) {
        this.sprites.forEach(sprite => sprite.destroy());
        this.sprites = [];

        if (!parts || parts.length === 0) {
            const noPartsText = new PIXI.Text('Sin partes', {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xff0000,
                align: 'center'
            });
            noPartsText.x = this.width / 2;
            noPartsText.y = this.selectorY;
            noPartsText.anchor.set(0.5);
            this.container.addChild(noPartsText);
            this.sprites.push(noPartsText);
            return;
        }

        const speed = Math.abs(spinState.spinSpeed || 0);
        this.blurFilter.blur = spinState.spinning ? Math.min(4, speed / 12) : 0;

        const spacing = 80;
        const centerIndex = Math.floor(position / spacing) % parts.length;
        
        const minYLimit = this.viewY + 15;
        const maxYLimit = this.viewY + this.viewHeight - 15;
        
        for (let offset = -1; offset <= 1; offset++) {
            const partIndex = (centerIndex + offset + parts.length) % parts.length;
            const part = parts[partIndex];
            
            if (!part) continue;
            
            const texture = this.createPartTexture(part);
            const sprite = new PIXI.Sprite(texture);
            
            const yOffset = (position % spacing) - (offset * spacing);
            let spriteY = this.selectorY + yOffset - 50;
            
            if (spriteY >= minYLimit && spriteY <= maxYLimit) {
                const baseScale = this.isMobile ? 2.5 : 3.0;
                let scale = baseScale;
                let alpha = 0.7;
                
                if (Math.abs(offset) === 1) {
                    alpha = 0.5;
                    scale = baseScale * 0.8;
                }
                
                sprite.x = this.width / 2.5;
                sprite.y = spriteY;
                sprite.scale.set(scale);
                sprite.anchor.set(0.5);
                sprite.alpha = alpha;
                
                if (spinState.spinning) {
                    sprite.filters = [this.blurFilter];
                    sprite.tint = 0xcccccc;
                    
                    if (speed > 40) {
                        sprite.scale.y = scale * 1.2;
                    }
                } else {
                    sprite.filters = [];
                    sprite.tint = 0xffffff;
                    
                    if (offset === 0) {
                        sprite.scale.set(baseScale * 1.1);
                        sprite.alpha = 1.0;
                        
                        const glowSprite = new PIXI.Sprite(texture);
                        glowSprite.x = this.width / 2;
                        glowSprite.y = spriteY;
                        glowSprite.scale.set(baseScale * 1.15);
                        glowSprite.anchor.set(0.5);
                        glowSprite.alpha = 0.25;
                        glowSprite.tint = 0xffd93d;
                        this.container.addChild(glowSprite);
                        this.sprites.push(glowSprite);
                    }
                }
                
                this.container.addChild(sprite);
                this.sprites.push(sprite);
            }
        }
    }

    createPartTexture(part) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        ctx.clearRect(0, 0, 32, 32);
        
        if (part.pixels && part.pixels.length > 0) {
            const scale = 32 / 16;
            part.pixels.forEach(pixel => {
                const color = pixel.color || part.baseColor;
                ctx.fillStyle = color;
                ctx.fillRect(pixel.x * scale, pixel.y * scale, scale, scale);
            });
        } else {
            ctx.fillStyle = part.baseColor || '#888888';
            ctx.fillRect(4, 4, 24, 24);
        }
        
        return PIXI.Texture.from(canvas);
    }
}