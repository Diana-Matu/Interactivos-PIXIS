// src/core/CombinaGenerator.js
import { ConfigManager } from './ConfigManager.js';
import { AssetLoader } from './AssetLoader.js';
import { CombinaUI } from './CombinaUI.js';
import { CombinaSpin } from './CombinaSpin.js';
import { CombinaExport } from './CombinaExport.js';
import * as PIXI from 'pixi.js';

export class CombinaGenerator {
    constructor(app) {
        console.log(' CombinaGenerator constructor');
        this.app = app;
        this.configManager = new ConfigManager();
        this.assetLoader = new AssetLoader();
        this.app.renderer.backgroundColor = 0xf5f5f5;
        // Datos
        this.slots = [];
        this.slotViews = [];
        this.currentCombination = [];
        this.isSpinning = false;
        this.spinStartTime = 0;
        this.config = null;
        this.resultSprite = null;
        this.resultContainer = null;
        this.lever = null;
        this.ui = null;
        this.spinModule = null;
        this.exportModule = null;
        
        // Bind resize
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }

    handleResize() {
        if (!this.app || !this.config) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        let gameWidth = Math.min(1400, width - 40);
        let gameHeight = Math.min(900, height - 40);
        
        if (width < 768) {
            gameWidth = width - 20;
            gameHeight = height - 20;
        }
        
        this.app.renderer.resize(gameWidth, gameHeight);
        
        if (this.ui && this.config) {
            const currentCombination = [...this.currentCombination];
            const currentAdjustments = this.config.adjustments;
            
            this.ui.createUI();
            
            this.currentCombination = currentCombination;
            this.config.adjustments = currentAdjustments;
            this.updateResultDisplay();
            
            if (this.slotViews && this.slotViews.length > 0) {
                this.slotViews.forEach((view, index) => {
                    const slot = this.slots[index];
                    if (slot && slot.parts) {
                        view.updateParts(
                            slot.parts,
                            slot.position,
                            { spinning: false, spinSpeed: 0, finalIndex: slot.finalIndex }
                        );
                    }
                });
            }
        }
    }

    // ===== APLICAR TEMA =====
    applyTheme(theme) {
        if (theme === 'light') {
            this.app.renderer.backgroundColor = 0xf5f5f5;
        } else {
            this.app.renderer.backgroundColor = 0x0f1219;
        }
    }

    // ===== MODO ASISTENTE (único modo) =====
    async initializeWithWizard() {
            console.log('Iniciando asistente de configuración...');
            this.configManager.clearConfig();
            this.app.stage.removeChildren();
            
            const welcomeMsg = new PIXI.Text('BIENVENIDO AL CREADOR DE COMBINAS', {
                fontFamily: 'Arial', fontSize: 28, fill: 0x171515,
                fontWeight: 'bold'
            });
            welcomeMsg.x = this.app.screen.width / 2 - welcomeMsg.width / 2;
            welcomeMsg.y = this.app.screen.height / 2 - 50;
            this.app.stage.addChild(welcomeMsg);
            
            const subMsg = new PIXI.Text('Crea tu propio juego de combinaciones', {
                fontFamily: 'Arial', fontSize: 16, fill: 0x737373
            });
            subMsg.x = this.app.screen.width / 2 - subMsg.width / 2;
            subMsg.y = this.app.screen.height / 2;
            this.app.stage.addChild(subMsg);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            welcomeMsg.destroy();
            subMsg.destroy();
            
            const { ConfigWizard } = await import('../views/ConfigWizard.js');
            const wizard = new ConfigWizard(this.app, async (config) => {
                console.log('Wizard completado, guardando Combina...');
                await this.saveAndBuildCombina(config);
            });
        }

    // ===== GUARDAR Y CONSTRUIR =====

        async saveAndBuildCombina(configData) {
            console.log('saveAndBuildCombina iniciado');
            console.log('ConfigData:', configData);
            
            const theme = configData.theme || 'dark';

            const loadingMsg = new PIXI.Text('Cargando combinador...', {
                fontFamily: 'Arial', fontSize: 20, fill: 0x333333, fontWeight: 'bold'
            });
            loadingMsg.x = this.app.screen.width / 2 - loadingMsg.width / 2;
            loadingMsg.y = this.app.screen.height / 2;
            this.app.stage.addChild(loadingMsg);
            
            const partsData = [];
            
            for (let i = 0; i < configData.partsCount; i++) {
                const files = configData.partsImages[i];
                if (files && files.length > 0) {
                    console.log(`Cargando ${files.length} imágenes para parte ${i}`);
                    const images = await this.assetLoader.loadImagesFromFolder(files);
                    partsData.push({
                        id: i,
                        name: configData.partsNames[i],
                        variants: images,
                        loadedVariants: images
                    });
                    console.log(`Parte ${i} (${configData.partsNames[i]}): ${images.length} variantes cargadas`);
                } else {
                    console.error(`Parte ${i} (${configData.partsNames[i]}) no tiene imágenes`);
                }
            }
            
            this.config = {
                combinaName: configData.name,
                orientation: configData.orientation,
                parts: partsData,
                adjustments: configData.adjustments || { parts: [] },
                theme: theme,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            
            this.applyTheme(theme);
            this.configManager.saveConfig(this.config);
            this.initSlots();
            
            loadingMsg.destroy();
            
            this.app.stage.removeChildren();
            this.ui = new CombinaUI(this);
            this.ui.createUI();
            
            const successMsg = new PIXI.Text(` ${this.config.combinaName} creado! `, {
                fontFamily: 'Arial', fontSize: 18, fill: 0x4a4a4a, fontWeight: 'bold'
            });
            successMsg.x = this.app.screen.width / 2 - successMsg.width / 2;
            successMsg.y = 80;
            this.app.stage.addChild(successMsg);
            setTimeout(() => successMsg.destroy(), 3000);
        }


    // ===== INICIALIZACIÓN DE SLOTS =====
    initSlots() {
        if (!this.config || !this.config.parts) return;
        
        this.slots = this.config.parts.map((part, index) => ({
            index: index,
            type: part.name,
            parts: part.loadedVariants || [],
            spinning: false,
            position: 0,
            finalIndex: null,
            spinSpeed: 0,
            currentIndex: 0
        }));
        
        this.spinModule = new CombinaSpin(this);
        this.exportModule = new CombinaExport(this);
        
        this.spinModule.spinConfig.spinDelay = this.slots.map((_, i) => i * 300);
        this.currentCombination = this.slots.map(() => null);
    }

    // ===== RESULTADO =====

    updateResultDisplay() {
        const hasValidCombination = this.currentCombination.some(part => part !== null);
        
        // Limpiar solo el sprite del avatar
        if (this.resultSprite) {
            this.resultSprite.destroy();
            this.resultSprite = null;
        }
        
        // Limpiar mensajes anteriores
        if (this.resultContainer.children) {
            for (let i = this.resultContainer.children.length - 1; i >= 3; i--) {
                const child = this.resultContainer.children[i];
                if (child !== this.resultContainer.children[0] && 
                    child !== this.resultContainer.children[1] && 
                    child !== this.resultContainer.children[2]) {
                    child.destroy();
                }
            }
        }
        
        
        if (!hasValidCombination) {
            const emptyMsg = new PIXI.Text(' GIRA\nPARA COMENZAR', {
                fontFamily: 'Arial', 
                fontSize: 12, 
                fill: this.config?.theme === 'light' ? 0x333333 : 0xffffff, 
                align: 'center', 
                fontWeight: 'bold'
            });
            emptyMsg.x = (this.resultContainer.width - emptyMsg.width) / 2;
            emptyMsg.y = (this.resultContainer.height - emptyMsg.height) / 2;
            this.resultContainer.addChild(emptyMsg);
            this.resultSprite = emptyMsg;
            return;
        }
        
        // Generar avatar con los ajustes guardados
        const canvas = this.assembleResult(this.currentCombination);
        const texture = PIXI.Texture.from(canvas);
        const sprite = new PIXI.Sprite(texture);
        
        // Centrar el sprite dentro del marco
        sprite.x = (this.resultContainer.width - sprite.width) / 2;
        sprite.y = (this.resultContainer.height - sprite.height) / 2;
        sprite.scale.set(1);
        
        this.resultContainer.addChild(sprite);
        this.resultSprite = sprite;
        
        console.log('Avatar actualizado');
    }

    assembleResult(parts) {
        const validParts = parts.filter(part => part !== null);
        
        if (validParts.length === 0) {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GIRA', canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillText('PARA COMENZAR', canvas.width / 2, canvas.height / 2 + 10);
            return canvas;
        }
        
        const adjustments = this.config.adjustments || { parts: [] };
        const orientation = this.config.orientation;
        
        const canvasWidth = 180;
        const canvasHeight = 130;
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Verificar si hay ajustes de posición guardados
        const hasSavedPositions = adjustments.parts.some(p => p.x !== undefined && p.y !== undefined);
        
        if (hasSavedPositions) {
            // Usar posiciones guardadas directamente
            console.log('Usando posiciones guardadas en el avatar');
            
            for (let i = 0; i < validParts.length; i++) {
                const part = validParts[i];
                const savedAdj = adjustments.parts.find(a => a.index === i);
                
                if (!savedAdj) continue;
                
                // Escalar la posición al tamaño del canvas
                const x = savedAdj.x;
                const y = savedAdj.y;
                const scale = savedAdj.scale || 1;
                
                // Obtener los píxeles de la parte
                if (part.pixels && part.pixels.length > 0) {
                    let minX = Infinity, minY = Infinity;
                    
                    part.pixels.forEach(pixel => {
                        minX = Math.min(minX, pixel.x);
                        minY = Math.min(minY, pixel.y);
                    });
                    
                    part.pixels.forEach(pixel => {
                        const color = pixel.color || part.baseColor;
                        ctx.fillStyle = color;
                        const drawX = x + ((pixel.x - minX) * scale);
                        const drawY = y + ((pixel.y - minY) * scale);
                        const size = Math.max(1, Math.floor(scale));
                        ctx.fillRect(drawX, drawY, size, size);
                    });
                }
            }
        } else {
            // Usar posicionamiento automático
            console.log('Usando posicionamiento automático en el avatar');
            
            let totalWidth = 0;
            let totalHeight = 0;
            let partDimensions = [];
            
            for (let i = 0; i < validParts.length; i++) {
                const part = validParts[i];
                const adj = adjustments.parts.find(a => a.index === i) || { scale: 1 };
                
                let minX = Infinity, maxX = -Infinity;
                let minY = Infinity, maxY = -Infinity;
                
                if (part.pixels && part.pixels.length > 0) {
                    part.pixels.forEach(pixel => {
                        const scaledX = pixel.x * adj.scale;
                        const scaledY = pixel.y * adj.scale;
                        minX = Math.min(minX, scaledX);
                        maxX = Math.max(maxX, scaledX);
                        minY = Math.min(minY, scaledY);
                        maxY = Math.max(maxY, scaledY);
                    });
                } else {
                    minX = 0;
                    maxX = 15;
                    minY = 0;
                    maxY = 15;
                }
                
                const width = (maxX - minX + 1) || 20;
                const height = (maxY - minY + 1) || 20;
                
                partDimensions.push({ width, height, minX, minY, pixels: part.pixels, adjustment: adj });
                
                if (orientation === 'horizontal') {
                    totalWidth += width + (i > 0 ? 2 : 0);
                    totalHeight = Math.max(totalHeight, height);
                } else {
                    totalHeight += height + (i > 0 ? 2 : 0);
                    totalWidth = Math.max(totalWidth, width);
                }
            }
            
            const padding = 10;
            const scaleX = (canvasWidth - padding * 2) / totalWidth;
            const scaleY = (canvasHeight - padding * 2) / totalHeight;
            const finalScale = Math.min(scaleX, scaleY, 4.5);
            
            let offsetX = padding;
            let offsetY = padding;
            
            if (orientation === 'horizontal') {
                offsetY = (canvasHeight - (totalHeight * finalScale)) / 2;
            } else {
                offsetX = (canvasWidth - (totalWidth * finalScale)) / 2;
            }
            
            for (let i = 0; i < validParts.length; i++) {
                const part = validParts[i];
                const dim = partDimensions[i];
                if (!part || !dim) continue;
                
                const adj = dim.adjustment;
                const scale = adj.scale * finalScale;
                
                let baseX, baseY;
                if (orientation === 'horizontal') {
                    baseX = offsetX;
                    baseY = offsetY;
                    if (i > 0) {
                        const prevDim = partDimensions[i - 1];
                        offsetX += (prevDim.width * finalScale) + (2 * finalScale);
                        baseX = offsetX;
                    }
                } else {
                    baseX = offsetX;
                    baseY = offsetY;
                    if (i > 0) {
                        const prevDim = partDimensions[i - 1];
                        offsetY += (prevDim.height * finalScale) + (2 * finalScale);
                        baseY = offsetY;
                    }
                }
                
                if (dim.pixels && dim.pixels.length > 0) {
                    dim.pixels.forEach(pixel => {
                        const color = pixel.color || part.baseColor;
                        ctx.fillStyle = color;
                        const x = baseX + ((pixel.x - dim.minX) * scale);
                        const y = baseY + ((pixel.y - dim.minY) * scale);
                        const size = Math.max(1, Math.floor(scale));
                        ctx.fillRect(x, y, size, size);
                    });
                }
            }
        }
        
        return canvas;
    }

    // ===== MÉTODOS DELEGADOS =====
    async spin() {
        if (this.spinModule) await this.spinModule.spin();
    }

    updateCurrentCombination() {
        if (this.spinModule) this.spinModule.updateCurrentCombination();
    }

    exportResult() {
        if (this.exportModule) this.exportModule.exportResult();
    }

    exportConfig() {
        if (this.exportModule) this.exportModule.exportConfig();
    }

    async exportCombinaPackage() {
        if (this.exportModule) await this.exportModule.exportCombinaPackage();
    }

    async importConfig() {
        if (this.exportModule) await this.exportModule.importConfig();
    }

    async openAvatarAdjuster() {
        const hasValid = this.currentCombination.some(p => p !== null);
        if (!hasValid) {
            this.showMessage(' Gira primero para generar un avatar antes de ajustar');
            return;
        }
        
        const { AvatarAdjuster } = await import('../views/AvatarAdjuster.js');
        
        const mainUI = this.app.stage.children.filter(child => 
            child !== this.resultContainer && child !== this.lever);
        mainUI.forEach(child => child.visible = false);
        
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.85);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();
        overlay.eventMode = 'static';
        this.app.stage.addChild(overlay);
        
        const panel = new PIXI.Graphics();
        panel.beginFill(0x2c3e50);
        panel.drawRoundedRect(0, 0, 900, 600, 20);
        panel.endFill();
        panel.x = this.app.screen.width / 2 - 450;
        panel.y = this.app.screen.height / 2 - 300;
        this.app.stage.addChild(panel);
        
        const title = new PIXI.Text(' AJUSTAR POSICIÓN DEL AVATAR', {
            fontFamily: 'Arial', fontSize: 20, fill: 0xffd93d, fontWeight: 'bold'
        });
        title.x = panel.x + 450 - title.width / 2;
        title.y = panel.y + 15;
        this.app.stage.addChild(title);
        
        const currentParts = this.config.parts.map(part => ({
            name: part.name,
            pixels: part.variants[0]?.pixels || [],
            baseColor: part.variants[0]?.baseColor || '#888888'
        }));

    const adjuster = new AvatarAdjuster(
        this.app, panel.x + 50, panel.y + 80, 500, 450,
        this.currentCombination,
        this.config,
        (adjustments) => {
            console.log(' Callback onSave: Recibiendo ajustes', adjustments);
            
            // Guardar ajustes en la configuración
            this.config.adjustments = adjustments;
            this.configManager.saveConfig(this.config);
            
            // Forzar actualización del avatar con los nuevos ajustes
            this.updateResultDisplay();
            
            // Limpiar panel de ajuste
            overlay.destroy();
            panel.destroy();
            title.destroy();
            adjuster.container.destroy();
            saveBtn.destroy();
            cancelBtn.destroy();
            
            // Mostrar UI principal
            mainUI.forEach(child => child.visible = true);
            
            this.showMessage('Ajustes guardados!');
        },
        () => {
            console.log(' Callback onCancel');
            overlay.destroy();
            panel.destroy();
            title.destroy();
            adjuster.container.destroy();
            saveBtn.destroy();
            cancelBtn.destroy();
            mainUI.forEach(child => child.visible = true);
        }
    );
            
        this.app.stage.addChild(adjuster.container);
        adjuster.loadParts();
        
        const saveBtn = this.createSimpleButton(panel.x + 750, panel.y + 490, 100, 40, 'GUARDAR', 0x4CAF50);
        saveBtn.on('pointerdown', () => adjuster.save());
        this.app.stage.addChild(saveBtn);
        
        const cancelBtn = this.createSimpleButton(panel.x + 750, panel.y + 540, 100, 40, 'CANCELAR', 0x666666);
        cancelBtn.on('pointerdown', () => adjuster.cancel());
        this.app.stage.addChild(cancelBtn);
    }

    cleanupAdjuster(overlay, panel, title, adjuster, mainUI) {
        overlay.destroy();
        panel.destroy();
        title.destroy();
        adjuster.container.destroy();
        mainUI.forEach(child => child.visible = true);
    }

    createSimpleButton(x, y, width, height, text, color) {
        const button = new PIXI.Graphics();
        button.beginFill(color);
        button.drawRoundedRect(0, 0, width, height, 8);
        button.endFill();
        button.x = x;
        button.y = y;
        button.eventMode = 'static';
        button.cursor = 'pointer';
        
        const label = new PIXI.Text(text, {
            fontFamily: 'Arial', fontSize: 12, fill: 0xffffff, fontWeight: 'bold'
        });
        label.x = width / 2 - label.width / 2;
        label.y = height / 2 - label.height / 2;
        button.addChild(label);
        
        return button;
    }

    showMessage(text) {
        const msg = new PIXI.Text(text, {
            fontFamily: 'Arial', fontSize: 18, fill: 0x4CAF50,
            fontWeight: 'bold', dropShadow: true, dropShadowColor: '#000000'
        });
        msg.x = this.app.screen.width / 2 - msg.width / 2;
        msg.y = this.app.screen.height / 2;
        this.app.stage.addChild(msg);
        setTimeout(() => msg.destroy(), 2000);
    }

    // Agregar este método helper en CombinaGenerator
    getCurrentPartPositions() {
        if (!this.currentCombination || this.currentCombination.every(p => p === null)) {
            return null;
        }
        
        const validParts = [];
        for (let i = 0; i < this.currentCombination.length; i++) {
            const part = this.currentCombination[i];
            if (part !== null) {
                validParts.push({
                    index: i,
                    part: part
                });
            }
        }
        
        const adjustments = this.config.adjustments || { parts: [] };
        const orientation = this.config.orientation;
        
        const canvasWidth = 180;
        const canvasHeight = 130;
        
        let totalWidth = 0;
        let totalHeight = 0;
        let partDimensions = [];
        
        for (let i = 0; i < validParts.length; i++) {
            const part = validParts[i].part;
            const adj = adjustments.parts.find(a => a.index === i) || { scale: 1 };
            
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            
            part.pixels.forEach(pixel => {
                const scaledX = pixel.x * adj.scale;
                const scaledY = pixel.y * adj.scale;
                minX = Math.min(minX, scaledX);
                maxX = Math.max(maxX, scaledX);
                minY = Math.min(minY, scaledY);
                maxY = Math.max(maxY, scaledY);
            });
            
            const width = (maxX - minX + 1) || 20;
            const height = (maxY - minY + 1) || 20;
            
            partDimensions.push({ width, height, minX, minY, pixels: part.pixels, adjustment: adj });
            
            if (orientation === 'horizontal') {
                totalWidth += width + (i > 0 ? 2 : 0);
                totalHeight = Math.max(totalHeight, height);
            } else {
                totalHeight += height + (i > 0 ? 2 : 0);
                totalWidth = Math.max(totalWidth, width);
            }
        }
        
        const padding = 10;
        const scaleX = (canvasWidth - padding * 2) / totalWidth;
        const scaleY = (canvasHeight - padding * 2) / totalHeight;
        const finalScale = Math.min(scaleX, scaleY, 4.5);
        
        let offsetX = padding;
        let offsetY = padding;
        
        if (orientation === 'horizontal') {
            offsetY = (canvasHeight - (totalHeight * finalScale)) / 2;
        } else {
            offsetX = (canvasWidth - (totalWidth * finalScale)) / 2;
        }
        
        const positions = [];
        
        for (let i = 0; i < validParts.length; i++) {
            const dim = partDimensions[i];
            const adj = dim.adjustment;
            const scale = adj.scale * finalScale;
            
            let baseX, baseY;
            if (orientation === 'horizontal') {
                baseX = offsetX;
                baseY = offsetY;
                if (i > 0) {
                    const prevDim = partDimensions[i - 1];
                    offsetX += (prevDim.width * finalScale) + (2 * finalScale);
                    baseX = offsetX;
                }
            } else {
                baseX = offsetX;
                baseY = offsetY;
                if (i > 0) {
                    const prevDim = partDimensions[i - 1];
                    offsetY += (prevDim.height * finalScale) + (2 * finalScale);
                    baseY = offsetY;
                }
            }
            
            // Calcular el centro de la parte para el sprite
            const spriteCenterX = baseX + ((dim.width * finalScale) / 2);
            const spriteCenterY = baseY + ((dim.height * finalScale) / 2);
            
            positions.push({
                index: validParts[i].index,
                x: spriteCenterX,
                y: spriteCenterY,
                scale: finalScale * adj.scale
            });
        }
        
        return positions;
    }
}