// src/core/CombinaUI.js
import * as PIXI from 'pixi.js';
import { DynamicSlotView } from '../views/DynamicSlotView.js';

export class CombinaUI {
    constructor(generator) {
        this.generator = generator;
        this.app = generator.app;
        this.config = generator.config;
        this.slotViews = [];
        this.currentTheme = this.config?.theme || 'dark';
        
        // Definir colores según tema
        this.updateColors();
        
        console.log('CombinaUI constructor - config:', this.config);
    }

    updateColors() {
        if (this.currentTheme === 'light') {
            this.colors = {
                background: 0xf5f5f5,
                panel: 0xffffff,
                card: 0xfafafa,
                border: 0xdddddd,
                text: 0x333333,
                textLight: 0x666666,
                accent: 0xffd93d,
                accentDark: 0xe6c422,
                
                // Colores de los slots para tema claro
                slotBg: 0xffffff,
                slotDark: 0xf0f0f0,
                slotBorder: 0xcccccc,
                
                // Colores de la ventana del slot para tema claro
                windowBg: 0xe0e0e0,
                windowInner: 0xffffff,
                
                buttonPrimary: 0x4CAF50,
                buttonSecondary: 0xFF9800,
                buttonDanger: 0xff6b6b,
                buttonInfo: 0x2196F3,
                buttonPurple: 0x9C27B0,
                leverBase: 0xcccccc,
                leverHandle: 0xffd93d
            };
        } else {
            this.colors = {
                background: 0x0f1219,
                panel: 0x2c3e50,
                card: 0x1e2b38,
                border: 0x4a5b6b,
                text: 0xffffff,
                textLight: 0xcccccc,
                accent: 0xffd93d,
                accentDark: 0xcca800,
                
                // Colores de los slots para tema oscuro
                slotBg: 0x2c3e50,
                slotDark: 0x1e2b38,
                slotBorder: 0x4a5b6b,
                
                // Colores de la ventana del slot para tema oscuro
                windowBg: 0x0a0f14,
                windowInner: 0x000000,
                
                buttonPrimary: 0x4CAF50,
                buttonSecondary: 0xFF9800,
                buttonDanger: 0xff6b6b,
                buttonInfo: 0x2196F3,
                buttonPurple: 0x9C27B0,
                leverBase: 0x4a5b6b,
                leverHandle: 0xffd93d
            };
        }
    }

    updateTheme(theme) {
        this.currentTheme = theme;
        this.updateColors();
        // Recrear UI con nuevo tema
        this.createUI();
    }
    
    createUI() {
        console.log(' Creando UI del Combina - Tema:', this.currentTheme);
        
        if (!this.config || !this.config.parts) {
            console.error('Configuración no disponible en UI');
            return;
        }
        
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        
        // Aplicar color de fondo
        this.app.renderer.backgroundColor = this.colors.background;
        
        this.app.stage.removeChildren();
        
        this.createTitle(width, height);
        this.createResultArea();
        this.createSlots();
        this.createLever();
        this.createButtons();
        
        this.generator.updateResultDisplay();
        
        console.log('UI creada correctamente');
    }

    createTitle(width, height) {
        console.log('Creando título:', this.config.combinaName);
        
        const title = new PIXI.Text(` ${this.config.combinaName} `, {
            fontFamily: 'Arial',
            fontSize: 28,
            fill: this.colors.text,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: this.currentTheme === 'light' ? '#cccccc' : '#000000'
        });
        title.x = width / 2 - title.width / 2;
        title.y = 15;
        this.app.stage.addChild(title);
    }

    createResultArea() {
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        
        const resultContainer = new PIXI.Container();
        
        const margin = 20;
        const resultWidth = 200;
        const resultHeight = 180;
        
        resultContainer.x = margin;
        resultContainer.y = 55;
        
        // Fondo del marco (NUNCA eliminar)
        const bg = new PIXI.Graphics();
        bg.beginFill(this.colors.panel);
        bg.drawRoundedRect(0, 0, resultWidth, resultHeight, 12);
        bg.endFill();
        resultContainer.addChild(bg);
        
        // Borde dorado (NUNCA eliminar)
        const border = new PIXI.Graphics();
        border.lineStyle(2, 0xffd93d);
        border.drawRoundedRect(2, 2, resultWidth - 4, resultHeight - 4, 10);
        resultContainer.addChild(border);
        
        // Título
        const title = new PIXI.Text(`✨ RESULTADO ✨`, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xffd93d,
            fontWeight: 'bold',
            align: 'center'
        });
        title.x = resultWidth / 2 - title.width / 2;
        title.y = 5;
        resultContainer.addChild(title);
        
        this.generator.resultContainer = resultContainer;
        this.app.stage.addChild(resultContainer);
        
        console.log(' Área de resultado creada');
    }

    createSlots() {
        if (!this.config.parts) {
            console.error(' No hay partes para crear slots');
            return;
        }
        
        const slotCount = this.config.parts.length;
        const slotWidth = 200;
        const slotHeight = 400;
        
        const totalWidth = slotWidth * slotCount + (slotCount - 1) * 20;
        const startX = (this.app.screen.width - totalWidth) / 2;
        const slotY = 250;
        
        this.slotViews = [];
        
        console.log(`Creando ${slotCount} slots - StartX: ${startX}, SlotY: ${slotY}`);
        
        for (let i = 0; i < slotCount; i++) {
            const x = startX + i * (slotWidth + 20);
            const y = slotY;
            
            console.log(`Slot ${i}: nombre=${this.config.parts[i].name}, x=${x}, y=${y}`);
            
            const slotView = new DynamicSlotView(
                this.app, x, y,
                slotWidth, slotHeight,
                this.config.parts[i].name,
                i,
                'horizontal',
                false,
                this.colors
            );
            
            this.app.stage.addChild(slotView.container);
            this.slotViews.push(slotView);
            
            const slotData = this.generator.slots[i];
            if (slotData && slotData.parts && slotData.parts.length > 0) {
                slotView.updateParts(
                    slotData.parts,
                    0,
                    { spinning: false, spinSpeed: 0, finalIndex: null }
                );
            }
        }
        
        this.generator.slotViews = this.slotViews;
        console.log('Slots creados - Posición Y:', slotY);
    }

    createLever() {
        const leverX = this.app.screen.width - 80;
        const leverY = this.app.screen.height / 2;
        
        const leverBase = new PIXI.Graphics();
        leverBase.beginFill(0xC2C0C0);  //  gris oscuro fijo
        leverBase.drawRect(leverX - 15, leverY - 80, 30, 160);
        leverBase.endFill();
        this.app.stage.addChild(leverBase);
        
        const leverHandle = new PIXI.Graphics();
        leverHandle.beginFill(0xff3333);  //  rojo fijo
        leverHandle.drawCircle(leverX, leverY - 60, 20);
        leverHandle.endFill();
        this.app.stage.addChild(leverHandle);
        
        //  brillo a la palanca
        const leverHighlight = new PIXI.Graphics();
        leverHighlight.beginFill(0xff6666, 0.5);
        leverHighlight.drawCircle(leverX - 3, leverY - 63, 6);
        leverHighlight.endFill();
        this.app.stage.addChild(leverHighlight);
        
        leverHandle.eventMode = 'static';
        leverHandle.cursor = 'pointer';
        leverHandle.on('pointerdown', () => this.generator.spin());
        
        this.generator.lever = leverHandle;
    }

    createButtons() {
        console.log(' Creando botones...');
        
        const buttonY = this.app.screen.height - 60;
        
        // Guardar imagen
        const saveImgBtn = this.createButton(this.app.screen.width - 140, buttonY, 120, 40, '💾 GUARDAR', this.colors.buttonPrimary);
        saveImgBtn.on('pointerdown', () => this.generator.exportResult());
        this.app.stage.addChild(saveImgBtn);
        
        // Ajustar avatar
        const adjustBtn = this.createButton(this.app.screen.width - 280, buttonY, 130, 40, '⚙️ AJUSTAR', this.colors.buttonSecondary);
        adjustBtn.on('pointerdown', () => this.generator.openAvatarAdjuster());
        this.app.stage.addChild(adjustBtn);
        
        // Exportar configuración
        const exportConfigBtn = this.createButton(this.app.screen.width - 430, buttonY, 120, 40, '📤 EXPORTAR', this.colors.buttonInfo);
        exportConfigBtn.on('pointerdown', () => this.generator.exportConfig());
        this.app.stage.addChild(exportConfigBtn);
        
        // Exportar paquete
        const exportPackageBtn = this.createButton(this.app.screen.width - 570, buttonY, 140, 40, '📦 PAQUETE', this.colors.buttonPurple);
        exportPackageBtn.on('pointerdown', () => this.generator.exportCombinaPackage());
        this.app.stage.addChild(exportPackageBtn);
        
        // Nuevo combina
        const newBtn = this.createButton(20, buttonY, 120, 40, '🔄 NUEVO', this.colors.buttonDanger);
        newBtn.on('pointerdown', async () => {
            this.generator.configManager.clearConfig();
            this.app.stage.removeChildren();
            await this.generator.initializeWithWizard();
        });
        this.app.stage.addChild(newBtn);
        
        // Botón importar
        if (this.app.screen.width > 768) {
            const importBtn = this.createButton(160, buttonY, 120, 40, '📥 IMPORTAR', this.colors.buttonSecondary);
            importBtn.on('pointerdown', () => this.generator.importConfig());
            this.app.stage.addChild(importBtn);
        }
        
        console.log(' Botones creados');
    }

    createButton(x, y, width, height, text, color) {
        const button = new PIXI.Graphics();
        button.beginFill(color);
        button.drawRoundedRect(0, 0, width, height, 8);
        button.endFill();
        button.x = x;
        button.y = y;
        button.eventMode = 'static';
        button.cursor = 'pointer';
        
        const label = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        label.x = width / 2 - label.width / 2;
        label.y = height / 2 - label.height / 2;
        button.addChild(label);
        
        button.on('pointerover', () => button.tint = 0xffffff);
        button.on('pointerout', () => button.tint = 0xffffff);
        
        return button;
    }

    updateSlots(slots, positions, spinStates) {
        this.slotViews.forEach((view, index) => {
            const slot = slots[index];
            if (slot && slot.parts) {
                view.updateParts(
                    slot.parts,
                    positions[index],
                    spinStates[index]
                );
            }
        });
    }
}