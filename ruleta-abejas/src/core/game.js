import * as PIXI from 'pixi.js';
import { SlotController } from '../controllers/slotController.js';
import { SlotView } from '../views/slotView.js';
import { AvatarView } from '../views/avatarView.js';
import { UILever } from '../views/uiLever.js';

export class Game {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.app = null;
        this.slotController = null;
        this.slotViews = [];
        this.avatarView = null;
        this.lever = null;
        this.isSpinning = false;
        
        window.addEventListener('resize', this.resize.bind(this));
        
        this.init();
    }

    init() {
        const { width, height } = this.getDimensions();
        
        this.app = new PIXI.Application({
            view: document.getElementById(this.canvasId),
            width: width,
            height: height,
            backgroundColor: 0x0f1219,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        this.slotController = new SlotController();
        this.slotViews = [];
        
        this.createUI();
        this.start();
        
        console.log('Juego inicializado', { width, height });
    }

    getDimensions() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let width = Math.min(1400, windowWidth - 40);
        let height = Math.min(900, windowHeight - 40);
        
        return { width, height };
    }

    createUI() {
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        
        console.log('Creando UI con dimensiones:', { width, height });
        
        const margin = 20;
        
        // 1. AVATAR (esquina superior izquierda)
        this.avatarView = new AvatarView(this.app, margin, margin, 180, 220);
        this.app.stage.addChild(this.avatarView.container);

        // 2. TRAGAMONEDAS
        const slotWidth = 200;
        const slotHeight = 400;
        
        const totalWidth = slotWidth * 3 + 90;
        const startX = (width - totalWidth) / 2;
        const slotY = 270;
        
        console.log('Posición inicial de slots:', { startX, slotY });
        
        const slotPositions = [
            startX,
            startX + slotWidth + 20,
            startX + (slotWidth + 20) * 2
        ];
        
        slotPositions.forEach((x, index) => {
            console.log(`Creando slot ${index} en x=${x}, y=${slotY}`);
            const slotView = new SlotView(this.app, x, slotY, slotWidth, slotHeight);
            this.app.stage.addChild(slotView.container);
            this.slotViews.push(slotView);
            
            if (this.slotController.slots[index] && this.slotController.slots[index].parts) {
                setTimeout(() => {
                    slotView.updateParts(
                        this.slotController.slots[index].parts,
                        0,
                        { spinning: false, spinSpeed: 0, finalIndex: 1 }
                    );
                }, 100);
            }
        });

        // 3. PALANCA
        const leverX = width - 120;
        const leverY = height * 0.45;
        this.lever = new UILever(leverX, leverY, 1, () => this.spin());
        this.app.stage.addChild(this.lever);

        // 4. TÍTULO
        const title = new PIXI.Text('🐝  CREADOR DE AVATAR  🐝', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xffd93d,
            align: 'center',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowDistance: 4
        });
        title.x = width / 2 - title.width / 2;
        title.y = 20;
        this.app.stage.addChild(title);

        // 5. BOTÓN GUARDAR
        this.createSaveButton(width, height, margin);
        
        console.log('UI creada completamente');
    }

    createSaveButton(width, height, margin) {
        const buttonWidth = 120;
        const buttonHeight = 40;
        
        const saveButton = new PIXI.Graphics();
        saveButton.beginFill(0x4CAF50);
        saveButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
        saveButton.endFill();
        saveButton.x = width - buttonWidth - margin;
        saveButton.y = height - buttonHeight - margin;
        saveButton.eventMode = 'static';
        saveButton.cursor = 'pointer';
        
        saveButton.lineStyle(2, 0x66bb6a);
        saveButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
        
        const saveText = new PIXI.Text('💾 GUARDAR', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff,
            align: 'center',
            fontWeight: 'bold'
        });
        saveText.x = buttonWidth/2 - saveText.width/2;
        saveText.y = buttonHeight/2 - saveText.height/2;
        saveButton.addChild(saveText);
        
        saveButton.on('pointerdown', () => this.saveAvatar());
        saveButton.on('pointerover', () => saveButton.tint = 0x66bb6a);
        saveButton.on('pointerout', () => saveButton.tint = 0xffffff);
        
        this.app.stage.addChild(saveButton);
    }

    resize() {
        if (!this.app) return;
        
        const { width, height } = this.getDimensions();
        this.app.renderer.resize(width, height);
        this.app.stage.removeChildren();
        this.slotViews = [];
        this.createUI();
    }

    spin() {
        if (this.isSpinning) return;
        
        console.log(' Iniciando giro!');
        this.isSpinning = true;
        this.slotController.startSpin();
        this.avatarView.clear();
        
        this.lever.setEnabled(false);
    }

    update() {
        if (this.isSpinning) {
            const stillSpinning = this.slotController.updateSpin();
            
            this.slotViews.forEach((view, index) => {
                const slot = this.slotController.slots[index];
                if (slot && slot.parts) {
                    view.updateParts(
                        slot.parts,
                        this.slotController.getSlotPosition(index),
                        {
                            spinning: slot.spinning,
                            spinSpeed: slot.spinSpeed,
                            finalIndex: slot.finalIndex
                        }
                    );
                }
            });

            if (!stillSpinning) {
                this.isSpinning = false;
                
                // OBTENER LA COMBINACIÓN ACTUAL
                const combination = this.slotController.getCurrentCombination();
                console.log('Combinación obtenida después del giro:', combination);
                
                // VERIFICAR QUE LA COMBINACIÓN ES VÁLIDA
                if (combination && combination.head && combination.thorax && combination.abdomen) {
                    console.log(' Combinación válida, actualizando avatar...');
                    console.log('  Cabeza:', combination.head.name);
                    console.log('  Tórax:', combination.thorax.name);
                    console.log('  Abdomen:', combination.abdomen.name);
                    
                    // ACTUALIZAR AVATAR
                    this.avatarView.updateAvatar(combination);
                } else {
                    console.error(' Combinación inválida:', combination);
                }
                
                this.lever.setEnabled(true);
                this.celebrate();
            }
        }
    }

    celebrate() {
        const emojis = ['🎰', '🎲', '🎯', '✨', '⭐', '💫', '🦋', '🐝'];
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const emoji = new PIXI.Text(emojis[Math.floor(Math.random() * emojis.length)], {
                    fontSize: 24 + Math.random() * 16,
                    fill: 0xffd93d
                });
                emoji.x = 200 + Math.random() * 800;
                emoji.y = 200 + Math.random() * 200;
                emoji.alpha = 0.8;
                this.app.stage.addChild(emoji);
                
                let fade = 1;
                const fadeInterval = setInterval(() => {
                    fade -= 0.05;
                    emoji.alpha = fade;
                    emoji.y -= 1;
                    if (fade <= 0) {
                        clearInterval(fadeInterval);
                        emoji.destroy();
                    }
                }, 50);
            }, i * 100);
        }
    }

    start() {
        this.app.ticker.add(() => this.update());
    }

    saveAvatar() {
        const combination = this.slotController.getCurrentCombination();
        if (combination.head && combination.thorax && combination.abdomen) {
            // Crear canvas para guardar
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            const scale = 2;
            
            // Recolectar todos los píxeles
            const allPixels = [
                ...combination.abdomen.pixels.map(p => ({...p, x: (p.x + 36) * scale, y: (p.y + 42) * scale, color: p.color || combination.abdomen.baseColor})),
                ...combination.thorax.pixels.map(p => ({...p, x: (p.x + 32) * scale, y: (p.y + 28) * scale, color: p.color || combination.thorax.baseColor})),
                ...combination.head.pixels.map(p => ({...p, x: (p.x + 28) * scale, y: (p.y + 15) * scale, color: p.color || combination.head.baseColor}))
            ];
            
            allPixels.forEach(pixel => {
                ctx.fillStyle = pixel.color;
                ctx.fillRect(pixel.x, pixel.y, scale, scale);
            });
            
            // Descargar
            const link = document.createElement('a');
            link.download = `abeja-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Mensaje de confirmación
            const savedMsg = new PIXI.Text('¡GUARDADO! 📸', {
                fontSize: 24,
                fill: 0x4CAF50,
                fontWeight: 'bold'
            });
            savedMsg.x = this.app.screen.width/2 - savedMsg.width/2;
            savedMsg.y = this.app.screen.height/2;
            this.app.stage.addChild(savedMsg);
            
            setTimeout(() => savedMsg.destroy(), 1500);
        }
    }
}