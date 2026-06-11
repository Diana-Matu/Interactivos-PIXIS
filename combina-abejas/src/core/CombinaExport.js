import JSZip from 'jszip';

export class CombinaExport {
    constructor(generator) {
        this.generator = generator;
        this.app = generator.app;
        this.config = generator.config;
    }

    exportResult() {
        if (!this.generator.currentCombination || this.generator.currentCombination.every(p => p === null)) {
            this.generator.showMessage('Gira primero para generar un avatar');
            return;
        }

        try {
            const canvas = this.captureAvatarCanvas();
            
            if (!canvas) {
                this.generator.showMessage('Error al capturar el avatar');
                return;
            }

            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.download = `${this.config.combinaName}_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            this.generator.showMessage('Avatar guardado como imagen!');
        } catch (error) {
            console.error('Error exportando resultado:', error);
            this.generator.showMessage('Error al guardar la imagen');
        }
    }

    captureAvatarCanvas() {
        if (!this.generator.currentCombination || this.generator.currentCombination.every(p => p === null)) {
            return null;
        }
        
        const canvas = this.generator.assembleResult(this.generator.currentCombination);
        return canvas;
    }

    exportConfig() {
        if (!this.config) {
            this.generator.showMessage('No hay configuración para exportar');
            return;
        }

        const exportData = this.prepareExportConfig();
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `${this.config.combinaName}_config_${timestamp}.json`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        this.generator.showMessage('Configuración exportada!');
    }

    prepareExportConfig() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            combinaName: this.config.combinaName,
            orientation: this.config.orientation,
            theme: this.config.theme,
            createdAt: this.config.createdAt,
            lastModified: this.config.lastModified,
            adjustments: this.config.adjustments || { parts: [] },
            parts: []
        };

        for (let i = 0; i < this.config.parts.length; i++) {
            const part = this.config.parts[i];
            const imagesData = [];
            
            for (const variant of (part.loadedVariants || [])) {
                let imageData = null;
                
                if (variant.originalImageData) {
                    imageData = variant.originalImageData;
                } else if (variant.originalImageElement && variant.originalImageElement.src) {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = variant.originalImageElement.width;
                        canvas.height = variant.originalImageElement.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(variant.originalImageElement, 0, 0);
                        imageData = canvas.toDataURL('image/png');
                    } catch (e) {
                        console.error('Error convirtiendo imagen:', e);
                    }
                }
                
                imagesData.push({
                    name: variant.name || `variante_${imagesData.length + 1}`,
                    dataURL: imageData,
                    width: variant.originalWidth,
                    height: variant.originalHeight
                });
            }
            
            exportData.parts.push({
                id: part.id,
                name: part.name,
                variants: imagesData
            });
        }
        
        return exportData;
    }

    async importConfig() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    reject('No se seleccionó archivo');
                    return;
                }
                
                try {
                    const text = await file.text();
                    const imported = JSON.parse(text);
                    await this.importConfigData(imported);
                    resolve(imported);
                } catch (error) {
                    console.error('Error importando:', error);
                    this.generator.showMessage('Error al importar configuración');
                    reject(error);
                }
            };
            
            input.click();
        });
    }

    async importConfigData(imported) {
        if (!imported.parts || !imported.combinaName) {
            throw new Error('Formato de configuración inválido');
        }
        
        this.generator.showMessage('Importando configuración...');
        
        const loadingMsg = new PIXI.Text('Cargando...', {
            fontFamily: 'Arial', fontSize: 20, fill: 0x333333, fontWeight: 'bold'
        });
        loadingMsg.x = this.app.screen.width / 2 - loadingMsg.width / 2;
        loadingMsg.y = this.app.screen.height / 2;
        this.app.stage.addChild(loadingMsg);
        
        const partsData = [];
        
        for (let i = 0; i < imported.parts.length; i++) {
            const partConfig = imported.parts[i];
            const variants = [];
            
            for (const variantData of (partConfig.variants || [])) {
                if (variantData.dataURL) {
                    const img = await this.dataURLToImage(variantData.dataURL);
                    if (img) {
                        variants.push({
                            id: Date.now() + Math.random(),
                            name: variantData.name,
                            originalImageElement: img,
                            originalImageData: variantData.dataURL,
                            originalWidth: img.width,
                            originalHeight: img.height
                        });
                    }
                }
            }
            
            if (variants.length > 0) {
                partsData.push({
                    id: i,
                    name: partConfig.name,
                    variants: variants,
                    loadedVariants: variants
                });
            }
        }
        
        loadingMsg.destroy();
        
        if (partsData.length === 0) {
            throw new Error('No se pudieron cargar las imágenes');
        }
        
        this.config = {
            combinaName: imported.combinaName,
            orientation: imported.orientation || 'horizontal',
            parts: partsData,
            adjustments: imported.adjustments || { parts: [] },
            theme: imported.theme || 'dark',
            createdAt: imported.createdAt || new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        this.generator.config = this.config;
        this.generator.applyTheme(this.config.theme);
        this.generator.configManager.saveConfig(this.config);
        this.generator.initSlots();
        
        this.app.stage.removeChildren();
        if (this.generator.ui) {
            this.generator.ui.updateTheme(this.config.theme);
        } else {
            const { CombinaUI } = await import('./CombinaUI.js');
            this.generator.ui = new CombinaUI(this.generator);
            this.generator.ui.createUI();
        }
        
        this.generator.updateResultDisplay();
        this.generator.showMessage(`${this.config.combinaName} importado!`);
    }

    dataURLToImage(dataURL) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = dataURL;
        });
    }

    async exportCombinaPackage() {
        if (!this.config) {
            this.generator.showMessage('No hay Combina para exportar');
            return;
        }

        this.generator.showMessage('Generando paquete...');
        
        const zip = new JSZip();
        const combinaName = this.config.combinaName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        const imagesFolder = zip.folder('images');
        for (let i = 0; i < this.config.parts.length; i++) {
            const part = this.config.parts[i];
            const partFolder = imagesFolder.folder(`parte_${i}_${part.name.replace(/[^a-z0-9]/gi, '_')}`);
            
            for (let v = 0; v < (part.loadedVariants || []).length; v++) {
                const variant = part.loadedVariants[v];
                const imageBlob = await this.getImageBlob(variant);
                if (imageBlob) {
                    const ext = imageBlob.type === 'image/png' ? 'png' : 
                               imageBlob.type === 'image/jpeg' ? 'jpg' : 'png';
                    partFolder.file(`variante_${v + 1}.${ext}`, imageBlob);
                }
            }
        }
        
        const configData = this.prepareExportConfig();
        zip.file('config.json', JSON.stringify(configData, null, 2));
        
        const htmlContent = this.generateStandaloneHTML(configData);
        zip.file('index.html', htmlContent);
        
        const cssContent = this.generateStandaloneCSS();
        zip.file('style.css', cssContent);
        
        const jsContent = this.generateStandaloneJS(configData);
        zip.file('game.js', jsContent);
        
        const readme = this.generateReadme();
        zip.file('README.txt', readme);
        
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `${combinaName}_${timestamp}.zip`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        this.generator.showMessage('Paquete exportado!');
    }

    async getImageBlob(variant) {
        if (variant.originalFile instanceof File) {
            return variant.originalFile;
        }
        
        if (variant.originalImageData && variant.originalImageData.startsWith('data:')) {
            return this.dataURLToBlob(variant.originalImageData);
        }
        
        if (variant.originalImageElement && variant.originalImageElement.src) {
            try {
                const response = await fetch(variant.originalImageElement.src);
                if (response.ok) {
                    return await response.blob();
                }
            } catch (e) {
                console.error('Error fetching image:', e);
            }
        }
        
        return null;
    }

    dataURLToBlob(dataURL) {
        const parts = dataURL.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const binary = atob(parts[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: mime });
    }

    generateStandaloneHTML(configData) {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${this.config.combinaName} - CombinaBajas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: ${this.config.theme === 'dark' ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'};
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Arial', sans-serif;
            padding: 10px;
            overflow-x: hidden;
        }
        #game-wrapper {
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
        }
        #game-container {
            background: ${this.config.theme === 'dark' ? '#0f1219' : '#f5f5f5'};
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            padding: 10px;
            overflow-x: auto;
            overflow-y: visible;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            cursor: grab;
            user-select: none;
            touch-action: pan-x;
            scroll-behavior: smooth;
        }
        #game-container:active {
            cursor: grabbing;
        }
        #game-container::-webkit-scrollbar {
            height: 6px;
        }
        #game-container::-webkit-scrollbar-track {
            background: ${this.config.theme === 'dark' ? '#2c3e50' : '#dddddd'};
            border-radius: 3px;
        }
        #game-container::-webkit-scrollbar-thumb {
            background: ${this.config.theme === 'dark' ? '#ffd93d' : '#ff9800'};
            border-radius: 3px;
        }
        canvas { 
            display: block; 
            border-radius: 12px; 
            cursor: pointer;
        }
        .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${this.config.theme === 'dark' ? '#ffffff' : '#333333'};
            font-family: Arial;
            font-size: 20px;
            text-align: center;
            z-index: 1000;
            background: rgba(0,0,0,0.7);
            padding: 20px;
            border-radius: 10px;
        }
        .scroll-indicator {
            display: none;
            text-align: center;
            margin-top: 10px;
            font-size: 12px;
            color: ${this.config.theme === 'dark' ? '#cccccc' : '#666666'};
        }
        @media (max-width: 768px) {
            body { padding: 5px; }
            #game-container { padding: 8px; border-radius: 10px; overflow-x: auto; }
            .scroll-indicator { display: block; }
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.2/pixi.min.js"></script>
</head>
<body>
    <div id="game-wrapper">
        <div id="game-container">
            <canvas id="game-canvas"></canvas>
        </div>
        <div class="scroll-indicator" id="scroll-indicator">← Desliza para ver más slots →</div>
    </div>
    <div class="loading" id="loading">Cargando ${this.config.combinaName}... 🎰</div>
    <script>
        const CONFIG_DATA = ${JSON.stringify(configData, null, 2)};
        
        let app, slots = [], slotViews = [], currentCombination = [], isSpinning = false;
        let resultSprite = null, resultContainer = null, config = null, leverHandle = null;
        let isMobile = false;
        let animationInProgress = false;
        const AVATAR_WIDTH = 180, AVATAR_HEIGHT = 130;
        
        function checkMobile() {
            return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        
        const getColors = (theme) => theme === 'light' ? {
            background: 0xf5f5f5, panel: 0xffffff, card: 0xfafafa, border: 0xdddddd,
            text: 0x333333, textLight: 0x666666, accent: 0xffd93d, slotBg: 0xffffff,
            slotDark: 0xf0f0f0, slotBorder: 0xcccccc, windowBg: 0xe0e0e0,
            windowInner: 0xffffff, buttonPrimary: 0x4CAF50, leverBase: 0xcccccc,
            leverHandle: 0xffd93d
        } : {
            background: 0x0f1219, panel: 0x2c3e50, card: 0x1e2b38, border: 0x4a5b6b,
            text: 0xffffff, textLight: 0xcccccc, accent: 0xffd93d, slotBg: 0x2c3e50,
            slotDark: 0x1e2b38, slotBorder: 0x4a5b6b, windowBg: 0x0a0f14,
            windowInner: 0x000000, buttonPrimary: 0x4CAF50, leverBase: 0x4a5b6b,
            leverHandle: 0xffd93d
        };
        
        async function loadImagesFromConfig() {
            config = {
                combinaName: CONFIG_DATA.combinaName,
                orientation: CONFIG_DATA.orientation,
                theme: CONFIG_DATA.theme,
                adjustments: CONFIG_DATA.adjustments || { parts: [] },
                parts: []
            };
            
            for (let i = 0; i < CONFIG_DATA.parts.length; i++) {
                const partConfig = CONFIG_DATA.parts[i];
                const loadedVariants = [];
                for (let v = 0; v < partConfig.variants.length; v++) {
                    const variantData = partConfig.variants[v];
                    if (variantData.dataURL) {
                        const img = await new Promise((resolve) => {
                            const image = new Image();
                            image.onload = () => resolve(image);
                            image.onerror = () => resolve(null);
                            image.src = variantData.dataURL;
                        });
                        if (img) {
                            loadedVariants.push({
                                id: v, name: variantData.name,
                                originalImageElement: img,
                                originalImageData: variantData.dataURL,
                                originalWidth: img.width, originalHeight: img.height
                            });
                        }
                    }
                }
                if (loadedVariants.length > 0) {
                    config.parts.push({ id: i, name: partConfig.name, loadedVariants });
                }
            }
            
            slots = config.parts.map((part, index) => ({
                index, type: part.name, parts: part.loadedVariants || [],
                spinning: false, position: 0, finalIndex: null, spinSpeed: 0, currentIndex: 0
            }));
            currentCombination = slots.map(() => null);
        }
        
        function createUI() {
            const colors = getColors(config.theme);
            app.renderer.backgroundColor = colors.background;
            app.stage.removeChildren();
            
            if (isMobile) {
                // ========== VERSIÓN MÓVIL ==========
                const margin = 8;
                const resultWidth = 140;
                const resultHeight = 120;
                const resultY = 35;
                
                const title = new PIXI.Text(' ' + config.combinaName + ' ', {
                    fontFamily: 'Arial', fontSize: 16, fill: colors.text, fontWeight: 'bold',
                    dropShadow: true, dropShadowColor: config.theme === 'light' ? '#cccccc' : '#000000'
                });
                title.x = margin;
                title.y = 8;
                app.stage.addChild(title);
                
                resultContainer = new PIXI.Container();
                resultContainer.x = margin;
                resultContainer.y = resultY;
                
                const bg = new PIXI.Graphics();
                bg.beginFill(colors.panel);
                bg.drawRoundedRect(0, 0, resultWidth, resultHeight, 12);
                bg.endFill();
                resultContainer.addChild(bg);
                
                const border = new PIXI.Graphics();
                border.lineStyle(2, colors.accent);
                border.drawRoundedRect(2, 2, resultWidth - 4, resultHeight - 4, 10);
                resultContainer.addChild(border);
                
                const resultTitle = new PIXI.Text('RESULTADO', {
                    fontFamily: 'Arial', fontSize: 8, fill: 0xffd93d, fontWeight: 'bold'
                });
                resultTitle.x = (resultWidth / 2) - (resultTitle.width / 2);
                resultTitle.y = 4;
                resultContainer.addChild(resultTitle);
                
                const resultBg = new PIXI.Graphics();
                resultBg.beginFill(config.theme === 'dark' ? 0x1a1a2e : 0xe8e8e8);
                resultBg.drawRoundedRect(6, 20, resultWidth - 12, resultHeight - 28, 8);
                resultBg.endFill();
                resultContainer.addChild(resultBg);
                
                app.stage.addChild(resultContainer);
                
                const leverX = resultContainer.x + resultWidth + 35;
                const leverY = resultY + (resultHeight / 2);
                
                const leverBase = new PIXI.Graphics();
                leverBase.beginFill(colors.leverBase);
                leverBase.drawRect(leverX - 6, leverY - 30, 12, 60);
                leverBase.endFill();
                app.stage.addChild(leverBase);
                
                const leverCircle = new PIXI.Graphics();
                leverCircle.beginFill(0x666666);
                leverCircle.drawCircle(leverX, leverY - 25, 12);
                leverCircle.endFill();
                app.stage.addChild(leverCircle);
                
                leverHandle = new PIXI.Graphics();
                leverHandle.beginFill(colors.leverHandle);
                leverHandle.drawCircle(leverX, leverY - 25, 9);
                leverHandle.endFill();
                app.stage.addChild(leverHandle);
                
                const leverHighlight = new PIXI.Graphics();
                leverHighlight.beginFill(0xff8888, 0.5);
                leverHighlight.drawCircle(leverX - 2, leverY - 27, 3);
                leverHighlight.endFill();
                app.stage.addChild(leverHighlight);
                
                leverHandle.eventMode = 'static';
                leverHandle.cursor = 'pointer';
                leverHandle.on('pointerdown', spinMobile);
                
                const btnWidth = 80;
                const btnHeight = 30;
                const saveBtn = new PIXI.Graphics();
                saveBtn.beginFill(colors.buttonPrimary);
                saveBtn.drawRoundedRect(0, 0, btnWidth, btnHeight, 8);
                saveBtn.endFill();
                saveBtn.x = leverX - (btnWidth / 2) + 6;
                saveBtn.y = leverY + 20;
                saveBtn.eventMode = 'static';
                saveBtn.cursor = 'pointer';
                
                const btnText = new PIXI.Text('💾 GUARDAR', {
                    fontFamily: 'Arial', fontSize: 9, fill: 0xffffff, fontWeight: 'bold'
                });
                btnText.x = (btnWidth / 2) - (btnText.width / 2);
                btnText.y = (btnHeight / 2) - (btnText.height / 2);
                saveBtn.addChild(btnText);
                saveBtn.on('pointerdown', exportResult);
                app.stage.addChild(saveBtn);
                
                const slotCount = config.parts.length;
                const slotWidth = 200;
                const slotHeight = 400;
                const slotSpacing = 15;
                const slotY = resultY + resultHeight + 10;
                const startX = margin;
                
                const totalSlotsWidth = slotCount * (slotWidth + slotSpacing);
                const canvasMinWidth = startX + totalSlotsWidth + margin;
                
                if (app.screen.width < canvasMinWidth) {
                    app.renderer.resize(canvasMinWidth, app.screen.height);
                }
                
                slotViews = [];
                
                for (let i = 0; i < slotCount; i++) {
                    const x = startX + i * (slotWidth + slotSpacing);
                    const partName = config.parts[i].name;
                    const container = new PIXI.Container();
                    container.x = x;
                    container.y = slotY;
                    
                    const sprites = [];
                    let blurFilter = new PIXI.BlurFilter();
                    blurFilter.blur = 0;
                    const cachedTextures = [];
                    
                    const shadow = new PIXI.Graphics();
                    shadow.beginFill(0x000000, 0.3);
                    shadow.drawRoundedRect(3, 3, slotWidth - 6, slotHeight - 6, 10);
                    shadow.endFill();
                    container.addChild(shadow);
                    
                    const casing = new PIXI.Graphics();
                    casing.beginFill(colors.slotBg);
                    casing.drawRoundedRect(0, 0, slotWidth, slotHeight, 12);
                    casing.endFill();
                    casing.lineStyle(2, colors.slotBorder);
                    casing.drawRoundedRect(2, 2, slotWidth - 4, slotHeight - 4, 10);
                    container.addChild(casing);
                    
                    const titlePlate = new PIXI.Graphics();
                    titlePlate.beginFill(colors.slotDark);
                    titlePlate.drawRoundedRect(slotWidth/2 - 45, 5, 90, 22, 8);
                    titlePlate.endFill();
                    titlePlate.lineStyle(1, colors.accent);
                    titlePlate.drawRoundedRect(slotWidth/2 - 45, 5, 90, 22, 8);
                    container.addChild(titlePlate);
                    
                    const slotTitle = new PIXI.Text(partName, {
                        fontFamily: 'Arial', fontSize: 12, fill: colors.accent, fontWeight: 'bold'
                    });
                    slotTitle.x = slotWidth / 2 - slotTitle.width / 2;
                    slotTitle.y = 7;
                    container.addChild(slotTitle);
                    
                    const viewY = 50;
                    const viewHeight = slotHeight - 100;
                    const selectorY = viewY + viewHeight / 2;
                    
                    const windowFrame = new PIXI.Graphics();
                    windowFrame.lineStyle(2, colors.slotBorder);
                    windowFrame.beginFill(colors.windowBg, 0.9);
                    windowFrame.drawRoundedRect(10, viewY, slotWidth - 20, viewHeight, 8);
                    windowFrame.endFill();
                    container.addChild(windowFrame);
                    
                    const windowBg = new PIXI.Graphics();
                    windowBg.beginFill(colors.windowInner);
                    windowBg.drawRoundedRect(13, viewY + 3, slotWidth - 26, viewHeight - 6, 8);
                    windowBg.endFill();
                    container.addChild(windowBg);
                    
                    const selectorLine = new PIXI.Graphics();
                    selectorLine.lineStyle(2, colors.accent);
                    selectorLine.moveTo(20, selectorY);
                    selectorLine.lineTo(slotWidth - 20, selectorY);
                    container.addChild(selectorLine);
                    
                    const updateParts = (parts, position, spinState) => {
                        sprites.forEach(s => s.destroy());
                        sprites.length = 0;
                        if (!parts || parts.length === 0) return;
                        
                        const spacing = 80;
                        const centerIndex = Math.floor(position / spacing) % parts.length;
                        const minYLimit = viewY + 15;
                        const maxYLimit = viewY + viewHeight - 15;
                        
                        for (let offset = -1; offset <= 1; offset++) {
                            const partIdx = (centerIndex + offset + parts.length) % parts.length;
                            const part = parts[partIdx];
                            if (!part) continue;
                            
                            let texture = cachedTextures[partIdx];
                            if (!texture && part.originalImageElement) {
                                texture = PIXI.Texture.from(part.originalImageElement);
                                cachedTextures[partIdx] = texture;
                            }
                            
                            if (texture) {
                                const yOffset = (position % spacing) - (offset * spacing);
                                let spriteY = selectorY + yOffset - 50;
                                
                                if (spriteY >= minYLimit && spriteY <= maxYLimit) {
                                    const maxSlotSize = 120;
                                    let scale = Math.min(maxSlotSize / texture.width, maxSlotSize / texture.height, 1.5);
                                    let alpha = 0.7;
                                    if (Math.abs(offset) === 1) { alpha = 0.5; scale = scale * 0.8; }
                                    
                                    const sprite = new PIXI.Sprite(texture);
                                    sprite.x = slotWidth / 2;
                                    sprite.y = spriteY;
                                    sprite.scale.set(scale);
                                    sprite.anchor.set(0.5);
                                    sprite.alpha = alpha;
                                    
                                    if (spinState.spinning) {
                                        sprite.tint = 0xcccccc;
                                    } else {
                                        sprite.tint = 0xffffff;
                                        if (offset === 0) {
                                            sprite.scale.set(scale * 1.05);
                                            sprite.alpha = 1.0;
                                            const glowSprite = new PIXI.Sprite(texture);
                                            glowSprite.x = slotWidth / 2;
                                            glowSprite.y = spriteY;
                                            glowSprite.scale.set(scale * 1.1);
                                            glowSprite.anchor.set(0.5);
                                            glowSprite.alpha = 0.25;
                                            glowSprite.tint = 0xffd93d;
                                            container.addChild(glowSprite);
                                            sprites.push(glowSprite);
                                        }
                                    }
                                    container.addChild(sprite);
                                    sprites.push(sprite);
                                }
                            }
                        }
                    };
                    
                    app.stage.addChild(container);
                    slotViews.push({ container, updateParts });
                    const slot = slots[i];
                    if (slot && slot.parts) updateParts(slot.parts, 0, { spinning: false, spinSpeed: 0, finalIndex: null });
                }
                
                updateResultDisplay();
                
                const gameContainer = document.getElementById('game-container');
                if (gameContainer) {
                    gameContainer.style.overflowX = 'auto';
                    gameContainer.style.webkitOverflowScrolling = 'touch';
                    gameContainer.scrollLeft = 0;
                }
                
                const scrollIndicator = document.getElementById('scroll-indicator');
                if (scrollIndicator) {
                    const needsScroll = app.screen.width < (startX + slotCount * (slotWidth + slotSpacing) + margin);
                    scrollIndicator.style.display = needsScroll ? 'block' : 'none';
                }
                
            } else {
                // ========== VERSIÓN ESCRITORIO ==========
                const title = new PIXI.Text(' ' + config.combinaName + ' ', {
                    fontFamily: 'Arial', fontSize: 28, fill: colors.text, fontWeight: 'bold',
                    dropShadow: true, dropShadowColor: config.theme === 'light' ? '#cccccc' : '#000000'
                });
                title.x = app.screen.width / 2 - title.width / 2;
                title.y = 15;
                app.stage.addChild(title);
                
                const margin = 20;
                resultContainer = new PIXI.Container();
                resultContainer.x = margin;
                resultContainer.y = 55;
                
                const bg = new PIXI.Graphics();
                bg.beginFill(colors.panel);
                bg.drawRoundedRect(0, 0, 220, 200, 12);
                bg.endFill();
                resultContainer.addChild(bg);
                
                const border = new PIXI.Graphics();
                border.lineStyle(2, colors.accent);
                border.drawRoundedRect(2, 2, 216, 196, 10);
                resultContainer.addChild(border);
                
                const resultTitle = new PIXI.Text('RESULTADO', {
                    fontFamily: 'Arial', fontSize: 11, fill: 0xffd93d, fontWeight: 'bold'
                });
                resultTitle.x = 110 - resultTitle.width / 2;
                resultTitle.y = 6;
                resultContainer.addChild(resultTitle);
                
                const resultBg = new PIXI.Graphics();
                resultBg.beginFill(config.theme === 'dark' ? 0x1a1a2e : 0xe8e8e8);
                resultBg.drawRoundedRect(8, 25, 204, 165, 8);
                resultBg.endFill();
                resultContainer.addChild(resultBg);
                
                app.stage.addChild(resultContainer);
                
                const slotCount = config.parts.length;
                const slotWidth = 200;
                const slotHeight = 400;
                const totalWidth = slotWidth * slotCount + (slotCount - 1) * 20;
                const startX = (app.screen.width - totalWidth) / 2;
                const slotY = 250;
                
                slotViews = [];
                
                for (let i = 0; i < slotCount; i++) {
                    const x = startX + i * (slotWidth + 20);
                    const partName = config.parts[i].name;
                    const container = new PIXI.Container();
                    container.x = x;
                    container.y = slotY;
                    
                    const sprites = [];
                    let blurFilter = new PIXI.BlurFilter();
                    blurFilter.blur = 0;
                    const cachedTextures = [];
                    
                    const shadow = new PIXI.Graphics();
                    shadow.beginFill(0x000000, 0.3);
                    shadow.drawRoundedRect(3, 3, slotWidth - 6, slotHeight - 6, 10);
                    shadow.endFill();
                    container.addChild(shadow);
                    
                    const casing = new PIXI.Graphics();
                    casing.beginFill(colors.slotBg);
                    casing.drawRoundedRect(0, 0, slotWidth, slotHeight, 12);
                    casing.endFill();
                    casing.lineStyle(2, colors.slotBorder);
                    casing.drawRoundedRect(2, 2, slotWidth - 4, slotHeight - 4, 10);
                    container.addChild(casing);
                    
                    const titlePlate = new PIXI.Graphics();
                    titlePlate.beginFill(colors.slotDark);
                    titlePlate.drawRoundedRect(slotWidth/2 - 45, 5, 90, 22, 8);
                    titlePlate.endFill();
                    titlePlate.lineStyle(1, colors.accent);
                    titlePlate.drawRoundedRect(slotWidth/2 - 45, 5, 90, 22, 8);
                    container.addChild(titlePlate);
                    
                    const slotTitle = new PIXI.Text(partName, {
                        fontFamily: 'Arial', fontSize: 14, fill: colors.accent, fontWeight: 'bold'
                    });
                    slotTitle.x = slotWidth / 2 - slotTitle.width / 2;
                    slotTitle.y = 9;
                    container.addChild(slotTitle);
                    
                    const viewY = 50;
                    const viewHeight = slotHeight - 100;
                    const selectorY = viewY + viewHeight / 2;
                    
                    const windowFrame = new PIXI.Graphics();
                    windowFrame.lineStyle(2, colors.slotBorder);
                    windowFrame.beginFill(colors.windowBg, 0.9);
                    windowFrame.drawRoundedRect(10, viewY, slotWidth - 20, viewHeight, 8);
                    windowFrame.endFill();
                    container.addChild(windowFrame);
                    
                    const windowBg = new PIXI.Graphics();
                    windowBg.beginFill(colors.windowInner);
                    windowBg.drawRoundedRect(13, viewY + 3, slotWidth - 26, viewHeight - 6, 8);
                    windowBg.endFill();
                    container.addChild(windowBg);
                    
                    const selectorLine = new PIXI.Graphics();
                    selectorLine.lineStyle(2, colors.accent);
                    selectorLine.moveTo(20, selectorY);
                    selectorLine.lineTo(slotWidth - 20, selectorY);
                    container.addChild(selectorLine);
                    
                    const updateParts = (parts, position, spinState) => {
                        sprites.forEach(s => s.destroy());
                        sprites.length = 0;
                        if (!parts || parts.length === 0) return;
                        
                        const spacing = 80;
                        const centerIndex = Math.floor(position / spacing) % parts.length;
                        const minYLimit = viewY + 15;
                        const maxYLimit = viewY + viewHeight - 15;
                        
                        for (let offset = -1; offset <= 1; offset++) {
                            const partIdx = (centerIndex + offset + parts.length) % parts.length;
                            const part = parts[partIdx];
                            if (!part) continue;
                            
                            let texture = cachedTextures[partIdx];
                            if (!texture && part.originalImageElement) {
                                texture = PIXI.Texture.from(part.originalImageElement);
                                cachedTextures[partIdx] = texture;
                            }
                            
                            if (texture) {
                                const yOffset = (position % spacing) - (offset * spacing);
                                let spriteY = selectorY + yOffset - 50;
                                
                                if (spriteY >= minYLimit && spriteY <= maxYLimit) {
                                    const maxSlotSize = 120;
                                    let scale = Math.min(maxSlotSize / texture.width, maxSlotSize / texture.height, 1.5);
                                    let alpha = 0.7;
                                    if (Math.abs(offset) === 1) { alpha = 0.5; scale = scale * 0.8; }
                                    
                                    const sprite = new PIXI.Sprite(texture);
                                    sprite.x = slotWidth / 2;
                                    sprite.y = spriteY;
                                    sprite.scale.set(scale);
                                    sprite.anchor.set(0.5);
                                    sprite.alpha = alpha;
                                    
                                    if (spinState.spinning) {
                                        sprite.tint = 0xcccccc;
                                    } else {
                                        sprite.tint = 0xffffff;
                                        if (offset === 0) {
                                            sprite.scale.set(scale * 1.05);
                                            sprite.alpha = 1.0;
                                            const glowSprite = new PIXI.Sprite(texture);
                                            glowSprite.x = slotWidth / 2;
                                            glowSprite.y = spriteY;
                                            glowSprite.scale.set(scale * 1.1);
                                            glowSprite.anchor.set(0.5);
                                            glowSprite.alpha = 0.25;
                                            glowSprite.tint = 0xffd93d;
                                            container.addChild(glowSprite);
                                            sprites.push(glowSprite);
                                        }
                                    }
                                    container.addChild(sprite);
                                    sprites.push(sprite);
                                }
                            }
                        }
                    };
                    
                    app.stage.addChild(container);
                    slotViews.push({ container, updateParts });
                    const slot = slots[i];
                    if (slot && slot.parts) updateParts(slot.parts, 0, { spinning: false, spinSpeed: 0, finalIndex: null });
                }
                
                const leverX = app.screen.width - 80;
                const leverY = app.screen.height / 2;
                
                const leverBase = new PIXI.Graphics();
                leverBase.beginFill(colors.leverBase);
                leverBase.drawRect(leverX - 15, leverY - 80, 30, 160);
                leverBase.endFill();
                app.stage.addChild(leverBase);
                
                const leverCircle = new PIXI.Graphics();
                leverCircle.beginFill(0x666666);
                leverCircle.drawCircle(leverX, leverY - 60, 22);
                leverCircle.endFill();
                app.stage.addChild(leverCircle);
                
                leverHandle = new PIXI.Graphics();
                leverHandle.beginFill(colors.leverHandle);
                leverHandle.drawCircle(leverX, leverY - 60, 18);
                leverHandle.endFill();
                app.stage.addChild(leverHandle);
                
                const leverHighlight = new PIXI.Graphics();
                leverHighlight.beginFill(0xff8888, 0.5);
                leverHighlight.drawCircle(leverX - 3, leverY - 63, 6);
                leverHighlight.endFill();
                app.stage.addChild(leverHighlight);
                
                leverHandle.eventMode = 'static';
                leverHandle.cursor = 'pointer';
                leverHandle.on('pointerdown', spinDesktop);
                leverHandle.on('pointerover', () => leverHandle.tint = 0xffaa66);
                leverHandle.on('pointerout', () => leverHandle.tint = 0xffffff);
                
                const buttonY = app.screen.height - 60;
                const saveBtn = new PIXI.Graphics();
                saveBtn.beginFill(colors.buttonPrimary);
                saveBtn.drawRoundedRect(0, 0, 160, 45, 8);
                saveBtn.endFill();
                saveBtn.x = app.screen.width - 180;
                saveBtn.y = buttonY;
                saveBtn.eventMode = 'static';
                saveBtn.cursor = 'pointer';
                
                const btnText = new PIXI.Text('💾 GUARDAR AVATAR', {
                    fontFamily: 'Arial', fontSize: 13, fill: 0xffffff, fontWeight: 'bold'
                });
                btnText.x = 80 - btnText.width / 2;
                btnText.y = 22 - btnText.height / 2;
                saveBtn.addChild(btnText);
                
                saveBtn.on('pointerdown', exportResult);
                saveBtn.on('pointerover', () => saveBtn.tint = 0x66cc66);
                saveBtn.on('pointerout', () => saveBtn.tint = 0xffffff);
                app.stage.addChild(saveBtn);
                
                updateResultDisplay();
            }
        }
        
        // ========== FUNCIÓN SPIN PARA MÓVIL ==========
        function spinMobile() {
            if (isSpinning || animationInProgress) { showMessage('Ya está girando'); return; }
            isSpinning = true;
            animationInProgress = true;
            
            if (leverHandle) {
                leverHandle.y += 15;
                setTimeout(() => { if (leverHandle) leverHandle.y -= 15; }, 150);
            }
            
            const newCombination = [];
            for (let i = 0; i < slots.length; i++) {
                newCombination.push(Math.floor(Math.random() * slots[i].parts.length));
            }
            
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.style.overflowX = 'hidden';
            }
            
            const slotWidth = 200;
            const slotHeight = 400;
            
            const avatarRect = resultContainer ? resultContainer.getBounds() : { x: 20, y: 55 };
            const targetX = avatarRect.x;
            const targetY = avatarRect.y;
            
            const originalPositions = [];
            const originalScales = [];
            
            for (let i = 0; i < slotViews.length; i++) {
                const container = slotViews[i].container;
                originalPositions[i] = { x: container.x, y: container.y };
                originalScales[i] = { x: container.scale?.x || 1, y: container.scale?.y || 1 };
            }
            
            let currentSlotIndex = 0;
            
            function processNextSlot() {
                if (currentSlotIndex >= slotViews.length) {
                    if (gameContainer) {
                        gameContainer.style.overflowX = 'auto';
                    }
                    isSpinning = false;
                    animationInProgress = false;
                    updateResultDisplay();
                    showMessage('✨ Combinación generada! ✨');
                    if (resultSprite) {
                        resultSprite.alpha = 0.7;
                        setTimeout(() => { if (resultSprite) resultSprite.alpha = 1; }, 200);
                    }
                    return;
                }
                
                const slotView = slotViews[currentSlotIndex];
                const slot = slots[currentSlotIndex];
                const finalVariant = newCombination[currentSlotIndex];
                const container = slotView.container;
                
                const startX = container.x;
                const startY = container.y;
                const startScaleX = container.scale?.x || 1;
                const startScaleY = container.scale?.y || 1;
                const targetScale = 2.2;
                
                let animProgress = 0;
                const animDuration = 250;
                let animStartTime = Date.now();
                let isMovingToCenter = true;
                let spinInterval = null;
                let spinFrames = 0;
                const totalSpinFrames = 20;
                
                function animate() {
                    const now = Date.now();
                    const elapsed = now - animStartTime;
                    animProgress = Math.min(1, elapsed / animDuration);
                    const easeOut = 1 - Math.pow(1 - animProgress, 3);
                    
                    if (isMovingToCenter) {
                        const newX = startX + (targetX - startX) * easeOut;
                        const newY = startY + (targetY - startY) * easeOut;
                        const newScaleX = startScaleX + (targetScale - startScaleX) * easeOut;
                        const newScaleY = startScaleY + (targetScale - startScaleY) * easeOut;
                        
                        container.x = newX;
                        container.y = newY;
                        container.scale.set(newScaleX, newScaleY);
                        
                        if (animProgress >= 1) {
                            isMovingToCenter = false;
                            spinFrames = 0;
                            spinInterval = setInterval(function() {
                                spinFrames++;
                                const spinProgress = spinFrames / totalSpinFrames;
                                const speed = Math.max(1, Math.floor(20 * (1 - spinProgress)));
                                const currentIdx = Math.floor(Date.now() / (100 / speed)) % slot.parts.length;
                                const position = (currentIdx * 80) % 2000;
                                
                                slotView.updateParts(slot.parts, position, { 
                                    spinning: true, 
                                    spinSpeed: speed * 5,
                                    finalIndex: null
                                });
                                
                                if (spinFrames >= totalSpinFrames) {
                                    clearInterval(spinInterval);
                                    
                                    const finalPosition = (finalVariant * 80) % 2000;
                                    slotView.updateParts(slot.parts, finalPosition, { 
                                        spinning: false, 
                                        spinSpeed: 0,
                                        finalIndex: finalVariant
                                    });
                                    
                                    currentCombination[currentSlotIndex] = finalVariant;
                                    
                                    const returnStartX = container.x;
                                    const returnStartY = container.y;
                                    const returnStartScaleX = container.scale?.x;
                                    const returnStartScaleY = container.scale?.y;
                                    const returnTargetX = originalPositions[currentSlotIndex].x;
                                    const returnTargetY = originalPositions[currentSlotIndex].y;
                                    const returnTargetScaleX = originalScales[currentSlotIndex].x;
                                    const returnTargetScaleY = originalScales[currentSlotIndex].y;
                                    
                                    let returnProgress = 0;
                                    const returnDuration = 250;
                                    const returnStartTime = Date.now();
                                    
                                    function animateReturn() {
                                        const nowTime = Date.now();
                                        returnProgress = Math.min(1, (nowTime - returnStartTime) / returnDuration);
                                        const easeOutReturn = 1 - Math.pow(1 - returnProgress, 3);
                                        
                                        const newX = returnStartX + (returnTargetX - returnStartX) * easeOutReturn;
                                        const newY = returnStartY + (returnTargetY - returnStartY) * easeOutReturn;
                                        const newScaleX = returnStartScaleX + (returnTargetScaleX - returnStartScaleX) * easeOutReturn;
                                        const newScaleY = returnStartScaleY + (returnTargetScaleY - returnStartScaleY) * easeOutReturn;
                                        
                                        container.x = newX;
                                        container.y = newY;
                                        container.scale.set(newScaleX, newScaleY);
                                        
                                        if (returnProgress < 1) {
                                            requestAnimationFrame(animateReturn);
                                        } else {
                                            currentSlotIndex++;
                                            processNextSlot();
                                        }
                                    }
                                    
                                    requestAnimationFrame(animateReturn);
                                }
                            }, 40);
                        } else {
                            requestAnimationFrame(animate);
                        }
                    }
                }
                
                requestAnimationFrame(animate);
            }
            
            currentSlotIndex = 0;
            processNextSlot();
        }
        
        // ========== FUNCIÓN SPIN PARA ESCRITORIO ==========
        function spinDesktop() {
            if (isSpinning) { showMessage('Ya está girando'); return; }
            isSpinning = true;
            if (leverHandle) {
                leverHandle.y += 15;
                setTimeout(() => { if (leverHandle) leverHandle.y -= 15; }, 150);
            }
            
            const newCombination = [];
            for (let i = 0; i < slots.length; i++) {
                newCombination.push(Math.floor(Math.random() * slots[i].parts.length));
            }
            
            for (let i = 0; i < slotViews.length; i++) {
                const slotView = slotViews[i];
                const slot = slots[i];
                const finalVariant = newCombination[i];
                let spinFrames = 0;
                const totalFrames = 25 + Math.floor(Math.random() * 15);
                
                const animation = setInterval(() => {
                    if (!isSpinning) { clearInterval(animation); return; }
                    spinFrames++;
                    const progress = spinFrames / totalFrames;
                    const speed = Math.max(1, Math.floor(25 * (1 - progress)));
                    const currentIndex = Math.floor(Date.now() / (100 / speed)) % slot.parts.length;
                    const position = (currentIndex * 80) % 1600;
                    slotView.updateParts(slot.parts, position, { spinning: true, spinSpeed: speed * 5, finalIndex: null });
                    if (spinFrames >= totalFrames) {
                        clearInterval(animation);
                        const finalPosition = (finalVariant * 80) % 1600;
                        slotView.updateParts(slot.parts, finalPosition, { spinning: false, spinSpeed: 0, finalIndex: finalVariant });
                    }
                }, 50);
            }
            
            setTimeout(() => {
                currentCombination = newCombination;
                updateResultDisplay();
                isSpinning = false;
                showMessage('✨ Combinación generada! ✨');
                if (resultSprite) {
                    resultSprite.alpha = 0.7;
                    setTimeout(() => { if (resultSprite) resultSprite.alpha = 1; }, 200);
                }
            }, 1500);
        }
        
        function exportResult() {
            if (!currentCombination.some(p => p !== null)) {
                showMessage('Gira primero para generar un avatar');
                return;
            }
            try {
                const canvas = assembleResult();
                if (canvas) {
                    const link = document.createElement('a');
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                    link.download = config.combinaName.replace(/[^a-z0-9]/gi, '_') + '_' + timestamp + '.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    showMessage('✓ Avatar guardado!');
                } else {
                    showMessage('Error al generar la imagen');
                }
            } catch (error) { 
                console.error(error);
                showMessage('Error al guardar'); 
            }
        }
        
        function updateResultDisplay() {
            if (resultSprite) { resultSprite.destroy(); resultSprite = null; }
            if (!resultContainer) return;
            while (resultContainer.children.length > 3) resultContainer.removeChildAt(resultContainer.children.length - 1);
            
            const hasValid = currentCombination.some(part => part !== null);
            if (!hasValid) {
                const emptyMsg = new PIXI.Text('GIRA\\nPARA COMENZAR', {
                    fontFamily: 'Arial', fontSize: isMobile ? 9 : 12, fill: config.theme === 'light' ? 0x333333 : 0xffffff,
                    align: 'center', fontWeight: 'bold'
                });
                emptyMsg.x = (resultContainer.width - emptyMsg.width) / 2;
                emptyMsg.y = (resultContainer.height - emptyMsg.height) / 2;
                resultContainer.addChild(emptyMsg);
                resultSprite = emptyMsg;
                return;
            }
            
            const canvas = assembleResult();
            const texture = PIXI.Texture.from(canvas);
            const sprite = new PIXI.Sprite(texture);
            let scale = 1;
            if (isMobile) {
                scale = Math.min(0.8, resultContainer.width / canvas.width);
            }
            sprite.scale.set(scale);
            sprite.x = (resultContainer.width - sprite.width) / 2;
            sprite.y = (resultContainer.height - sprite.height) / 2;
            resultContainer.addChild(sprite);
            resultSprite = sprite;
        }
        
        function assembleResult() {
            const validParts = [];
            for (let i = 0; i < currentCombination.length; i++) {
                if (currentCombination[i] !== null && typeof currentCombination[i] === 'number') {
                    validParts.push({ slotIndex: i, variantIndex: currentCombination[i] });
                }
            }
            
            if (validParts.length === 0) {
                const canvas = document.createElement('canvas');
                canvas.width = AVATAR_WIDTH; canvas.height = AVATAR_HEIGHT;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, AVATAR_WIDTH, AVATAR_HEIGHT);
                ctx.fillStyle = '#888888'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
                ctx.fillText('GIRA', AVATAR_WIDTH / 2, AVATAR_HEIGHT / 2 - 10);
                ctx.fillText('PARA COMENZAR', AVATAR_WIDTH / 2, AVATAR_HEIGHT / 2 + 10);
                return canvas;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = AVATAR_WIDTH; canvas.height = AVATAR_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, AVATAR_WIDTH, AVATAR_HEIGHT);
            
            const adjustments = config.adjustments || { parts: [] };
            const orientation = config.orientation;
            const BASE_SCALE = 0.07;
            
            if (orientation === 'horizontal') {
                const startX = 15, spacing = 50, centerY = 65;
                for (let i = 0; i < validParts.length; i++) {
                    const configPart = config.parts[validParts[i].slotIndex];
                    if (!configPart) continue;
                    const variant = configPart.loadedVariants?.[validParts[i].variantIndex];
                    if (!variant) continue;
                    let adj = adjustments.parts.find(a => a.index === validParts[i].slotIndex);
                    if (!adj) adj = { index: validParts[i].slotIndex, x: startX + i * spacing, y: centerY, scale: BASE_SCALE };
                    const img = variant.originalImageElement;
                    if (img && img.complete && img.naturalWidth > 0) {
                        const scale = adj.scale || BASE_SCALE;
                        const width = img.width * scale, height = img.height * scale;
                        ctx.drawImage(img, adj.x - width/2, adj.y - height/2, width, height);
                    }
                }
            } else {
                const centerX = 90, startY = 15, spacing = 35;
                for (let i = 0; i < validParts.length; i++) {
                    const configPart = config.parts[validParts[i].slotIndex];
                    if (!configPart) continue;
                    const variant = configPart.loadedVariants?.[validParts[i].variantIndex];
                    if (!variant) continue;
                    let adj = adjustments.parts.find(a => a.index === validParts[i].slotIndex);
                    if (!adj) adj = { index: validParts[i].slotIndex, x: centerX, y: startY + i * spacing, scale: BASE_SCALE };
                    const img = variant.originalImageElement;
                    if (img && img.complete && img.naturalWidth > 0) {
                        const scale = adj.scale || BASE_SCALE;
                        const width = img.width * scale, height = img.height * scale;
                        ctx.drawImage(img, adj.x - width/2, adj.y - height/2, width, height);
                    }
                }
            }
            return canvas;
        }
        
        function showMessage(text) {
            const msg = new PIXI.Text(text, {
                fontFamily: 'Arial', fontSize: isMobile ? 12 : 16, fill: config.theme === 'light' ? 0x333333 : 0xffd93d,
                fontWeight: 'bold', dropShadow: true, dropShadowColor: '#000000'
            });
            msg.x = app.screen.width / 2 - msg.width / 2;
            msg.y = app.screen.height - 70;
            app.stage.addChild(msg);
            setTimeout(() => msg.destroy(), 2000);
        }
        
        function handleResize() {
            setTimeout(() => {
                let screenWidth, screenHeight;
                if (isMobile) {
                    screenWidth = Math.min(window.innerWidth - 20, 800);
                    screenHeight = Math.min(window.innerHeight - 20, 600);
                } else {
                    screenWidth = Math.min(window.innerWidth - 40, 1400);
                    screenHeight = Math.min(window.innerHeight - 40, 900);
                }
                app.renderer.resize(screenWidth, screenHeight);
                createUI();
            }, 100);
        }
        
        async function initGame() {
            const canvas = document.getElementById('game-canvas');
            const loadingDiv = document.getElementById('loading');
            const gameContainer = document.getElementById('game-container');
            
            isMobile = checkMobile();
            
            await loadImagesFromConfig();
            
            let screenWidth, screenHeight;
            if (isMobile) {
                screenWidth = Math.min(window.innerWidth - 20, 800);
                screenHeight = Math.min(window.innerHeight - 20, 600);
            } else {
                screenWidth = Math.min(window.innerWidth - 40, 1400);
                screenHeight = Math.min(window.innerHeight - 40, 900);
            }
            
            canvas.width = screenWidth;
            canvas.height = screenHeight;
            
            app = new PIXI.Application({
                view: canvas,
                width: screenWidth,
                height: screenHeight,
                backgroundColor: 0x0f1219,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });
            
            createUI();
            loadingDiv.style.display = 'none';
            
            if (isMobile && gameContainer) {
                gameContainer.scrollLeft = 0;
            }
            
            window.addEventListener('resize', handleResize);
            window.addEventListener('orientationchange', handleResize);
        }
        
        window.addEventListener('DOMContentLoaded', initGame);
    </script>
</body>
</html>`;
    }

    generateStandaloneCSS() {
        return `body {
    margin: 0;
    padding: 20px;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Arial', sans-serif;
}

#game-container {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 20px;
    padding: 10px;
    overflow-x: auto;
    cursor: grab;
}

#game-container:active {
    cursor: grabbing;
}

canvas {
    display: block;
    border-radius: 12px;
    cursor: pointer;
}

@media (max-width: 768px) {
    body { padding: 10px; }
    #game-container { padding: 5px; border-radius: 10px; }
}`;
    }

    generateStandaloneJS(configData) {
        return `// Juego standalone de ${this.config.combinaName}
console.log('CombinaBajas - ${this.config.combinaName}');`;
    }

    generateReadme() {
        return `========================================
${this.config.combinaName.toUpperCase()} - COMBINA
========================================

INSTRUCCIONES:
1. Abre el archivo index.html en tu navegador web
2. Tira de la palanca para generar combinaciones aleatorias
3. Cada combinación crea un avatar único
4. Usa el botón GUARDAR para descargar la imagen

CONTROLES:
- Palanca: Tira para girar los rodillos
- Botón GUARDAR: Descarga la imagen del avatar actual

SOBRE ESTE COMBINA:
- Nombre: ${this.config.combinaName}
- Orientación: ${this.config.orientation === 'horizontal' ? 'Horizontal (← →)' : 'Vertical (↑ ↓)'}
- Número de partes: ${this.config.parts.length}
- Partes: ${this.config.parts.map(p => p.name).join(', ')}
- Tema: ${this.config.theme === 'dark' ? 'Oscuro' : 'Claro'}

ESTRUCTURA DEL PAQUETE:
- index.html - Página principal
- style.css - Estilos visuales
- game.js - Archivo de compatibilidad
- images/ - Todas las imágenes originales
- config.json - Configuración del Combina

REQUISITOS TÉCNICOS:
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Soporte para JavaScript y canvas

¡Disfruta de tu Combina personalizado!

Generado el: ${new Date().toLocaleString()}
    `;
    }
}