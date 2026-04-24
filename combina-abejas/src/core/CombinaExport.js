import JSZip from 'jszip';

export class CombinaExport {
    constructor(generator) {
        this.generator = generator;
        this.config = generator.config;
        this.slots = generator.slots;
        this.app = generator.app;
    }

    exportResult() {
        if (!this.generator.resultSprite) {
            this.generator.showMessage('No hay avatar para guardar');
            return;
        }
        
        const canvas = this.generator.assembleResult(this.generator.currentCombination);
        const link = document.createElement('a');
        link.download = `${this.config.combinaName}_avatar.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        this.generator.showMessage('Imagen guardada!');
    }

    exportConfig() {
        const configToExport = {
            combinaName: this.config.combinaName,
            orientation: this.config.orientation,
            theme: this.config.theme,
            partsCount: this.config.parts.length,
            partsNames: this.config.parts.map(p => p.name),
            adjustments: this.config.adjustments,
            imagesData: []
        };
        
        for (let i = 0; i < this.config.parts.length; i++) {
            const part = this.config.parts[i];
            const variants = [];
            
            for (let j = 0; j < part.loadedVariants.length; j++) {
                const variant = part.loadedVariants[j];
                if (variant.originalImageData) {
                    variants.push({
                        name: variant.name,
                        data: variant.originalImageData,
                        originalWidth: variant.originalWidth,
                        originalHeight: variant.originalHeight
                    });
                }
            }
            configToExport.imagesData.push(variants);
        }
        
        const dataStr = JSON.stringify(configToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `${this.config.combinaName}_config.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        
        this.generator.showMessage('Configuración exportada!');
    }

    async importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const configData = JSON.parse(event.target.result);
                    
                    const wizardConfig = {
                        name: configData.combinaName,
                        partsCount: configData.partsCount,
                        partsNames: configData.partsNames,
                        orientation: configData.orientation,
                        theme: configData.theme,
                        partsImages: [],
                        adjustments: configData.adjustments || { parts: [] }
                    };
                    
                    for (let i = 0; i < configData.imagesData.length; i++) {
                        const variantDatas = configData.imagesData[i];
                        const files = [];
                        
                        for (let j = 0; j < variantDatas.length; j++) {
                            const variantData = variantDatas[j];
                            const blob = this.dataURLToBlob(variantData.data);
                            const file = new File([blob], `${variantData.name}.png`, { type: 'image/png' });
                            files.push(file);
                        }
                        wizardConfig.partsImages.push(files);
                    }
                    
                    this.generator.configManager.clearConfig();
                    await this.generator.saveAndBuildCombina(wizardConfig);
                    this.generator.showMessage('Configuración importada correctamente!');
                    
                } catch (error) {
                    console.error('Error al importar:', error);
                    this.generator.showMessage('Error al importar la configuración');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    async exportCombinaPackage() {
        this.generator.showMessage('Generando paquete...');
        
        const zip = new JSZip();
        
        const gameHTML = this.generateGameHTML();
        zip.file('index.html', gameHTML);
        
        const gameCSS = this.generateGameCSS();
        zip.file('style.css', gameCSS);
        
        const gameJS = await this.generateGameJS();
        zip.file('game.js', gameJS);
        
        const configJSON = this.generateConfigJSON();
        zip.file('config.json', configJSON);
        
        const imagesFolder = zip.folder('assets');
        const imagePromises = [];
        
        for (let i = 0; i < this.config.parts.length; i++) {
            const part = this.config.parts[i];
            const partFolder = imagesFolder.folder(`parte_${i + 1}_${part.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`);
            
            for (let j = 0; j < part.loadedVariants.length; j++) {
                const variant = part.loadedVariants[j];
                const fileName = `${variant.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
                
                if (variant.originalImageData) {
                    const base64Data = variant.originalImageData.split(',')[1];
                    const binaryData = atob(base64Data);
                    const array = new Uint8Array(binaryData.length);
                    for (let k = 0; k < binaryData.length; k++) {
                        array[k] = binaryData.charCodeAt(k);
                    }
                    partFolder.file(fileName, array);
                }
            }
        }
        
        await Promise.all(imagePromises);
        
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.download = `${this.config.combinaName}_combina_package.zip`;
        link.href = URL.createObjectURL(content);
        link.click();
        URL.revokeObjectURL(link.href);
        
        this.generator.showMessage('Paquete generado!');
    }

    generateGameHTML() {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>${this.config.combinaName} - Juego de Combinaciones</title>
    <link rel="stylesheet" href="style.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: ${this.config.theme === 'light' ? '#f5f5f5' : '#0f1219'};
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
            width: 100%;
            height: 100vh;
        }
        
        canvas {
            display: block;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/pixi.js@7.2.4/dist/pixi.min.js"></script>
    <script src="game.js"></script>
</body>
</html>`;
    }

    generateGameCSS() {
        return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

#game-container {
    text-align: center;
}

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: ${this.config.theme === 'light' ? '#dddddd' : '#2c3e50'};
}

::-webkit-scrollbar-thumb {
    background: ${this.config.theme === 'light' ? '#999999' : '#ffd93d'};
    border-radius: 4px;
}`;
    }

    async generateGameJS() {
        const adjustments = this.config.adjustments || { parts: [] };
        
        return `// ${this.config.combinaName} - Juego de Combinaciones
// Generado con CombinaBajas

const gameConfig = {
    combinaName: "${this.config.combinaName}",
    orientation: "${this.config.orientation}",
    theme: "${this.config.theme}",
    parts: ${JSON.stringify(this.config.parts.map(p => ({ name: p.name, variantsCount: p.loadedVariants.length })))},
    adjustments: ${JSON.stringify(adjustments)}
};

class CombinaGame {
    constructor() {
        this.app = null;
        this.slots = [];
        this.slotViews = [];
        this.currentCombination = [];
        this.isSpinning = false;
        this.config = gameConfig;
        this.resultContainer = null;
        this.lever = null;
        this.imagesCache = {};
        
        this.init();
    }
    
    async init() {
        const canvas = document.getElementById('game-canvas');
        const width = Math.min(1200, window.innerWidth - 40);
        const height = Math.min(800, window.innerHeight - 40);
        
        this.app = new PIXI.Application({
            view: canvas,
            width: width,
            height: height,
            backgroundColor: this.config.theme === 'light' ? 0xf5f5f5 : 0x0f1219,
            antialias: false
        });
        
        await this.loadImages();
        this.createUI();
        this.setupResize();
        
        console.log('Juego inicializado:', this.config.combinaName);
    }
    
    async loadImages() {
        const imageUrls = [];
        for (let i = 0; i < this.config.parts.length; i++) {
            for (let j = 0; j < this.config.parts[i].variantsCount; j++) {
                imageUrls.push(\`assets/parte_\${i + 1}_\${this.config.parts[i].name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/variant_\${j + 1}.png\`);
            }
        }
        
        const loadPromises = imageUrls.map(url => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 32;
                    canvas.height = 32;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, 0, 0, 32, 32);
                    this.imagesCache[url] = canvas;
                    resolve();
                };
                img.onerror = () => resolve();
                img.src = url;
            });
        });
        
        await Promise.all(loadPromises);
    }
    
    getPartImage(partIndex, variantIndex) {
        const url = \`assets/parte_\${partIndex + 1}_\${this.config.parts[partIndex].name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/variant_\${variantIndex + 1}.png\`;
        return this.imagesCache[url];
    }
    
    createUI() {
        this.app.stage.removeChildren();
        
        this.createTitle();
        this.createResultArea();
        this.createSlots();
        this.createLever();
        this.createButtons();
        
        this.updateResultDisplay();
    }
    
    createTitle() {
        const title = new PIXI.Text(\` \${this.config.combinaName} \`, {
            fontFamily: 'Arial',
            fontSize: 28,
            fill: this.config.theme === 'light' ? 0x333333 : 0xffffff,
            fontWeight: 'bold'
        });
        title.x = this.app.screen.width / 2 - title.width / 2;
        title.y = 15;
        this.app.stage.addChild(title);
    }
    
    createResultArea() {
        const resultContainer = new PIXI.Container();
        const resultWidth = 200;
        const resultHeight = 180;
        
        resultContainer.x = 20;
        resultContainer.y = 55;
        
        const bg = new PIXI.Graphics();
        bg.beginFill(this.config.theme === 'light' ? 0xffffff : 0x2c3e50);
        bg.drawRoundedRect(0, 0, resultWidth, resultHeight, 12);
        bg.endFill();
        resultContainer.addChild(bg);
        
        const border = new PIXI.Graphics();
        border.lineStyle(2, 0xffd93d);
        border.drawRoundedRect(2, 2, resultWidth - 4, resultHeight - 4, 10);
        resultContainer.addChild(border);
        
        const title = new PIXI.Text('✨ RESULTADO ✨', {
            fontFamily: 'Arial', fontSize: 10, fill: 0xffd93d, fontWeight: 'bold'
        });
        title.x = resultWidth / 2 - title.width / 2;
        title.y = 5;
        resultContainer.addChild(title);
        
        this.resultContainer = resultContainer;
        this.app.stage.addChild(resultContainer);
    }
    
    createSlots() {
        const slotCount = this.config.parts.length;
        const slotWidth = 200;
        const slotHeight = 400;
        
        const totalWidth = slotWidth * slotCount + (slotCount - 1) * 20;
        const startX = (this.app.screen.width - totalWidth) / 2;
        const slotY = 250;
        
        for (let i = 0; i < slotCount; i++) {
            const x = startX + i * (slotWidth + 20);
            const slotView = new DynamicSlotView(
                this.app, x, slotY, slotWidth, slotHeight,
                this.config.parts[i].name, i, this.config.theme, this.getPartImage.bind(this)
            );
            this.app.stage.addChild(slotView.container);
            this.slotViews.push(slotView);
            this.slots.push({
                index: i,
                parts: Array(this.config.parts[i].variantsCount).fill().map((_, idx) => ({ index: idx })),
                position: 0,
                finalIndex: null,
                spinSpeed: 0
            });
        }
    }
    
    createLever() {
        const leverX = this.app.screen.width - 80;
        const leverY = this.app.screen.height / 2;
        
        const leverBase = new PIXI.Graphics();
        leverBase.beginFill(0x666666);
        leverBase.drawRect(leverX - 15, leverY - 80, 30, 160);
        leverBase.endFill();
        this.app.stage.addChild(leverBase);
        
        const leverHandle = new PIXI.Graphics();
        leverHandle.beginFill(0xff3333);
        leverHandle.drawCircle(leverX, leverY - 60, 20);
        leverHandle.endFill();
        this.app.stage.addChild(leverHandle);
        
        leverHandle.eventMode = 'static';
        leverHandle.cursor = 'pointer';
        leverHandle.on('pointerdown', () => this.spin());
        
        this.lever = leverHandle;
    }
    
    createButtons() {
        const buttonY = this.app.screen.height - 60;
        
        const saveBtn = this.createButton(this.app.screen.width - 140, buttonY, 120, 40, '💾 GUARDAR', 0x4a4a4a);
        saveBtn.on('pointerdown', () => this.exportResult());
        this.app.stage.addChild(saveBtn);
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
            fontFamily: 'Arial', fontSize: 12, fill: 0xffffff, fontWeight: 'bold'
        });
        label.x = width / 2 - label.width / 2;
        label.y = height / 2 - label.height / 2;
        button.addChild(label);
        
        return button;
    }
    
    async spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        
        for (let i = 0; i < this.slots.length; i++) {
            this.slots[i].spinning = true;
            this.slots[i].finalIndex = Math.floor(Math.random() * this.slots[i].parts.length);
            this.slots[i].spinSpeed = 80;
        }
        
        const duration = 2500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            let allFinished = true;
            
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                if (!slot.spinning) continue;
                
                allFinished = false;
                const progress = Math.min(1, elapsed / duration);
                
                if (progress < 0.2) {
                    slot.spinSpeed = 80 * (progress / 0.2);
                } else if (progress < 0.7) {
                    slot.spinSpeed = 80;
                } else {
                    const decel = (progress - 0.7) / 0.3;
                    slot.spinSpeed = 80 * (1 - decel);
                }
                
                slot.position += slot.spinSpeed;
                const maxPos = slot.parts.length * 90;
                slot.position %= maxPos;
                
                if (progress >= 1) {
                    slot.spinning = false;
                    slot.position = slot.finalIndex * 90;
                    slot.spinSpeed = 0;
                }
                
                if (this.slotViews[i]) {
                    this.slotViews[i].updateParts(
                        slot.parts,
                        slot.position,
                        { spinning: slot.spinning, spinSpeed: slot.spinSpeed }
                    );
                }
            }
            
            if (allFinished) {
                this.isSpinning = false;
                this.updateCurrentCombination();
                this.updateResultDisplay();
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    updateCurrentCombination() {
        this.currentCombination = [];
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot.finalIndex !== null) {
                this.currentCombination[i] = slot.parts[slot.finalIndex];
            } else {
                this.currentCombination[i] = null;
            }
        }
    }
    
    updateResultDisplay() {
        if (this.resultSprite) {
            this.resultSprite.destroy();
        }
        
        if (this.resultContainer.children) {
            for (let i = this.resultContainer.children.length - 1; i >= 3; i--) {
                this.resultContainer.children[i].destroy();
            }
        }
        
        const hasCombination = this.currentCombination.some(p => p !== null);
        
        if (!hasCombination) {
            const emptyMsg = new PIXI.Text('GIRA\\nPARA COMENZAR', {
                fontFamily: 'Arial', fontSize: 12, fill: this.config.theme === 'light' ? 0x333333 : 0xffffff, align: 'center', fontWeight: 'bold'
            });
            emptyMsg.x = (this.resultContainer.width - emptyMsg.width) / 2;
            emptyMsg.y = (this.resultContainer.height - emptyMsg.height) / 2;
            this.resultContainer.addChild(emptyMsg);
            this.resultSprite = emptyMsg;
            return;
        }
        
        const canvas = this.assembleResult();
        const texture = PIXI.Texture.from(canvas);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = (this.resultContainer.width - sprite.width) / 2;
        sprite.y = (this.resultContainer.height - sprite.height) / 2;
        
        this.resultContainer.addChild(sprite);
        this.resultSprite = sprite;
    }
    
    assembleResult() {
        const validParts = [];
        const adjustments = this.config.adjustments || { parts: [] };
        const orientation = this.config.orientation;
        
        for (let i = 0; i < this.currentCombination.length; i++) {
            if (this.currentCombination[i] !== null) {
                validParts.push({ index: i, variant: this.currentCombination[i] });
            }
        }
        
        const canvasWidth = 180;
        const canvasHeight = 130;
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        if (orientation === 'horizontal') {
            const startX = 15;
            const spacing = 50;
            const centerY = 65;
            
            for (let i = 0; i < validParts.length; i++) {
                const part = validParts[i];
                const imgCanvas = this.getPartImage(part.index, part.variant.index);
                if (imgCanvas) {
                    const adj = adjustments.parts.find(a => a.index === part.index) || { x: startX + i * spacing, y: centerY, scale: 0.8 };
                    ctx.drawImage(imgCanvas, adj.x, adj.y, 32 * adj.scale, 32 * adj.scale);
                }
            }
        } else {
            const centerX = 90;
            const startY = 20;
            const spacing = 40;
            
            for (let i = 0; i < validParts.length; i++) {
                const part = validParts[i];
                const imgCanvas = this.getPartImage(part.index, part.variant.index);
                if (imgCanvas) {
                    const adj = adjustments.parts.find(a => a.index === part.index) || { x: centerX, y: startY + i * spacing, scale: 0.8 };
                    ctx.drawImage(imgCanvas, adj.x, adj.y, 32 * adj.scale, 32 * adj.scale);
                }
            }
        }
        
        return canvas;
    }
    
    exportResult() {
        const canvas = this.assembleResult();
        const link = document.createElement('a');
        link.download = \`\${this.config.combinaName}_avatar.png\`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    setupResize() {
        window.addEventListener('resize', () => {
            const width = Math.min(1200, window.innerWidth - 40);
            const height = Math.min(800, window.innerHeight - 40);
            this.app.renderer.resize(width, height);
            this.createUI();
        });
    }
}

class DynamicSlotView {
    constructor(app, x, y, width, height, partName, partIndex, theme, getImageCallback) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.partName = partName;
        this.partIndex = partIndex;
        this.theme = theme;
        this.getImage = getImageCallback;
        
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;
        
        this.sprites = [];
        this.blurFilter = new PIXI.BlurFilter();
        
        this.createSlotMachine();
    }
    
    createSlotMachine() {
        const colors = this.theme === 'light' 
            ? { slotBg: 0xffffff, slotDark: 0xf0f0f0, border: 0xcccccc, accent: 0x333333, windowBg: 0xe0e0e0, windowInner: 0xffffff }
            : { slotBg: 0x2c3e50, slotDark: 0x1e2b38, border: 0x4a5b6b, accent: 0xffd93d, windowBg: 0x0a0f14, windowInner: 0x000000 };
        
        const casing = new PIXI.Graphics();
        casing.beginFill(colors.slotBg);
        casing.drawRoundedRect(0, 0, this.width, this.height, 12);
        casing.endFill();
        casing.lineStyle(2, colors.border);
        casing.drawRoundedRect(2, 2, this.width - 4, this.height - 4, 10);
        this.container.addChild(casing);
        
        const titlePlate = new PIXI.Graphics();
        titlePlate.beginFill(colors.slotDark);
        titlePlate.drawRoundedRect(this.width/2 - 45, 5, 90, 22, 8);
        titlePlate.endFill();
        titlePlate.lineStyle(1, colors.accent);
        titlePlate.drawRoundedRect(this.width/2 - 45, 5, 90, 22, 8);
        this.container.addChild(titlePlate);
        
        const title = new PIXI.Text(this.partName, {
            fontFamily: 'Arial', fontSize: 12, fill: colors.accent, align: 'center', fontWeight: 'bold'
        });
        title.x = this.width / 2 - title.width / 2;
        title.y = 9;
        this.container.addChild(title);
        
        this.viewY = 50;
        this.viewHeight = this.height - 100;
        this.selectorY = this.viewY + this.viewHeight / 2;
        
        const windowFrame = new PIXI.Graphics();
        windowFrame.lineStyle(2, colors.border);
        windowFrame.beginFill(colors.windowBg, 0.9);
        windowFrame.drawRoundedRect(10, this.viewY, this.width - 20, this.viewHeight, 8);
        windowFrame.endFill();
        this.container.addChild(windowFrame);
        
        const windowBg = new PIXI.Graphics();
        windowBg.beginFill(colors.windowInner);
        windowBg.drawRoundedRect(13, this.viewY + 3, this.width - 26, this.viewHeight - 6, 8);
        windowBg.endFill();
        this.container.addChild(windowBg);
        
        const selectorLine = new PIXI.Graphics();
        selectorLine.lineStyle(2, colors.accent);
        selectorLine.moveTo(20, this.selectorY);
        selectorLine.lineTo(this.width - 20, this.selectorY);
        this.container.addChild(selectorLine);
    }
    
    updateParts(parts, position, spinState) {
        this.sprites.forEach(sprite => sprite.destroy());
        this.sprites = [];
        
        const spacing = 80;
        const centerIndex = Math.floor(position / spacing) % parts.length;
        const minY = this.viewY + 15;
        const maxY = this.viewY + this.viewHeight - 15;
        
        for (let offset = -1; offset <= 1; offset++) {
            const partIndex = (centerIndex + offset + parts.length) % parts.length;
            const imgCanvas = this.getImage(this.partIndex, partIndex);
            
            if (imgCanvas) {
                const texture = PIXI.Texture.from(imgCanvas);
                const sprite = new PIXI.Sprite(texture);
                const yOffset = (position % spacing) - (offset * spacing);
                let spriteY = this.selectorY + yOffset - 50;
                
                if (spriteY >= minY && spriteY <= maxY) {
                    let scale = 2.5;
                    if (Math.abs(offset) === 1) scale = 2.0;
                    
                    sprite.x = this.width / 2;
                    sprite.y = spriteY;
                    sprite.scale.set(scale);
                    sprite.anchor.set(0.5);
                    
                    if (spinState.spinning) {
                        sprite.filters = [this.blurFilter];
                        sprite.tint = 0xcccccc;
                    } else {
                        sprite.filters = [];
                        if (offset === 0) sprite.scale.set(2.7);
                    }
                    
                    this.container.addChild(sprite);
                    this.sprites.push(sprite);
                }
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new CombinaGame();
});`;
    }

    generateConfigJSON() {
        const exportConfig = {
            combinaName: this.config.combinaName,
            orientation: this.config.orientation,
            theme: this.config.theme,
            partsCount: this.config.parts.length,
            partsNames: this.config.parts.map(p => p.name),
            adjustments: this.config.adjustments
        };
        return JSON.stringify(exportConfig, null, 2);
    }

    dataURLToBlob(dataURL) {
        const parts = dataURL.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const binary = atob(parts[1]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
        }
        return new Blob([array], { type: mime });
    }
}