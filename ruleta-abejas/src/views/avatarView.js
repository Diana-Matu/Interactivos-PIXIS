import * as PIXI from 'pixi.js';

export class AvatarView {
    constructor(app, x, y, width = 480, height = 420) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;
        
        this.beeSprite = null;
        this.speciesText = null;
        
        this.createAvatarFrame();
        
        console.log(` AvatarView creado en (${x}, ${y})`);
    }

    createAvatarFrame() {
        // Fondo del marco
        const bg = new PIXI.Graphics();
        bg.beginFill(0x2c3e50);
        bg.drawRoundedRect(0, 0, this.width, this.height, 10);
        bg.endFill();
        this.container.addChild(bg);
        
        // Borde dorado
        const border = new PIXI.Graphics();
        border.lineStyle(3, 0xffd93d);
        border.drawRoundedRect(0, 0, this.width, this.height, 10);
        this.container.addChild(border);
        
        // Título
        const title = new PIXI.Text('🐝 MI ABEJA 🐝', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffd93d,
            align: 'center',
            fontWeight: 'bold'
        });
        title.x = this.width / 2 - title.width / 2;
        title.y = 10;
        this.container.addChild(title);
        
        // Área del avatar (azul claro) - AHORA MÁS ANCHA PARA ABEJA HORIZONTAL
        const avatarArea = new PIXI.Graphics();
        avatarArea.beginFill(0xC1EFF7);
        avatarArea.drawRoundedRect(10, 35, this.width - 20, this.height - 70, 5);
        avatarArea.endFill();
        this.container.addChild(avatarArea);
        
        // Texto de especies
        this.speciesText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 1,
            fill: 0xffd93d,
            align: 'center',
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: this.width - 50
        });
        this.speciesText.x = this.width / 2;
        this.speciesText.y = this.height - 25;
        this.speciesText.anchor.set(0.5, 0);
        this.container.addChild(this.speciesText);
    }

    updateAvatar(combination) {
        console.log('🎨 Actualizando avatar con:', combination);
        
        // Limpiar sprite anterior
        if (this.beeSprite) {
            this.beeSprite.destroy();
            this.beeSprite = null;
        }

        if (!combination || !combination.head || !combination.thorax || !combination.abdomen) {
            console.error('❌ Combinación inválida');
            return;
        }

        try {
            // Crear canvas para dibujar la abeja 
            const canvas = document.createElement('canvas');
            canvas.width = 508;
            canvas.height = 508;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            // Limpiar canvas
            ctx.clearRect(0, 0, 508, 508);

            // Posiciones
            const offsets = {
                head: { x: 15.3, y: 4 },      // Cabeza a la izquierda
                thorax: { x: 20, y: 4},     // Tórax en el medio
                abdomen: { x: 26.6, y: 4 }      // Abdomen a la derecha
            };
            
            // Escala para hacer los píxeles más grandes (cada píxel original se dibuja como un bloque)
            const pixelScale = 8.2; // Cada píxel de la abeja será un bloque de 8x8
            
            //  DIBUJAR ABDOMEN
            if (combination.abdomen && combination.abdomen.pixels) {
                combination.abdomen.pixels.forEach(p => {
                    const color = p.color || combination.abdomen.baseColor;
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        (p.x + offsets.abdomen.x) * pixelScale,
                        (p.y + offsets.abdomen.y) * pixelScale,
                        pixelScale, pixelScale
                    );
                });
            }
            
            //  DIBUJAR TÓRAX 
            if (combination.thorax && combination.thorax.pixels) {
                combination.thorax.pixels.forEach(p => {
                    const color = p.color || combination.thorax.baseColor;
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        (p.x + offsets.thorax.x) * pixelScale,
                        (p.y + offsets.thorax.y) * pixelScale,
                        pixelScale, pixelScale
                    );
                });
            }
            
            //  DIBUJAR CABEZA 
            if (combination.head && combination.head.pixels) {
                combination.head.pixels.forEach(p => {
                    const color = p.color || combination.head.baseColor;
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        (p.x + offsets.head.x) * pixelScale,
                        (p.y + offsets.head.y) * pixelScale,
                        pixelScale, pixelScale
                    );
                });
            }
            
            // Crear textura y sprite
            const texture = PIXI.Texture.from(canvas);
            this.beeSprite = new PIXI.Sprite(texture);
            
            // Posicionar en el centro del área del avatar
            this.beeSprite.x = this.width / 2 - 200; // Centrado horizontalmente
            this.beeSprite.y = 60; // Centrado verticalmente
            this.beeSprite.scale.set(0.9); // Escala
            
            // Añadir al contenedor
            this.container.addChild(this.beeSprite);
            
            console.log(' Avatar actualizado correctamente (horizontal)');
            
        } catch (error) {
            console.error(' Error al crear avatar:', error);
        }
    }

    getShortName(fullName) {
        if (!fullName) return '???';
        const parts = fullName.split(' ');
        if (parts.length <= 2) return fullName;
        return parts[0] + ' ' + parts[1];
    }

    clear() {
        if (this.beeSprite) {
            this.beeSprite.destroy();
            this.beeSprite = null;
        }
        if (this.speciesText) {
            this.speciesText.text = '';
        }
    }
}