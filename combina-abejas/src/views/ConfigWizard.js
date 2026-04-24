import * as PIXI from 'pixi.js';

export class ConfigWizard {
    constructor(app, onComplete) {
        this.app = app;
        this.onComplete = onComplete;
        this.step = 0;
        this.configData = {
            name: '',
            partsCount: 0,
            partsNames: [],
            orientation: 'horizontal',
            theme: 'dark',
            partsImages: []
        };
        
        this.container = null;
        this.inputText = null;
        this.cursor = null;
        this.inputs = [];
        this.fileInputs = [];
        this.imageCounters = [];
        
        this.createWizard();
    }

    createWizard() {
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0xf5f5f5, 0.98);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();
        overlay.eventMode = 'static';
        this.container = overlay;
        
        const panel = new PIXI.Graphics();
        panel.beginFill(0xffffff);
        panel.drawRoundedRect(0, 0, 750, 600, 20);
        panel.endFill();
        panel.lineStyle(1, 0xdddddd);
        panel.drawRoundedRect(0, 0, 750, 600, 20);
        panel.x = this.app.screen.width / 2 - 375;
        panel.y = this.app.screen.height / 2 - 300;
        this.container.addChild(panel);
        
        const mainTitle = new PIXI.Text('CREADOR DE COMBINAS', {
            fontFamily: 'Arial',
            fontSize: 28,
            fill: 0x333333,
            fontWeight: 'bold'
        });
        mainTitle.x = this.app.screen.width / 2 - mainTitle.width / 2;
        mainTitle.y = panel.y + 20;
        this.container.addChild(mainTitle);
        
        const subtitle = new PIXI.Text('Crea tu propio juego de combinaciones', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x666666
        });
        subtitle.x = this.app.screen.width / 2 - subtitle.width / 2;
        subtitle.y = panel.y + 55;
        this.container.addChild(subtitle);
        
        this.showStep(0);
        
        this.app.stage.addChild(this.container);
    }

    showStep(step) {
        if (this.container.children.length > 1) {
            for (let i = this.container.children.length - 1; i >= 1; i--) {
                this.container.removeChild(this.container.children[i]);
            }
        }
        
        const panelX = this.app.screen.width / 2 - 375;
        const panelY = this.app.screen.height / 2 - 300;
        
        switch(step) {
            case 0:
                this.showNameStep(panelX, panelY);
                break;
            case 1:
                this.showPartsCountStep(panelX, panelY);
                break;
            case 2:
                this.showPartsNamesStep(panelX, panelY);
                break;
            case 3:
                this.showOrientationStep(panelX, panelY);
                break;
            case 4:
                this.showThemeStep(panelX, panelY);
                break;
            case 5:
                this.showImagesStep(panelX, panelY);
                break;
        }
    }

    showNameStep(panelX, panelY) {
        const title = new PIXI.Text('PASO 1: NOMBRE DEL COMBINA', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0x333333,
            fontWeight: 'bold'
        });
        title.x = panelX + 375 - title.width / 2;
        title.y = panelY + 20;
        this.container.addChild(title);
        
        const description = new PIXI.Text('¿Cómo se llamará tu juego de combinaciones?', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x333333
        });
        description.x = panelX + 375 - description.width / 2;
        description.y = panelY + 55;
        this.container.addChild(description);
        
        const example = new PIXI.Text('Ej: "CombinaPokémon", "CombinaCasa", "AvatarMix"', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x999999,
            fontStyle: 'italic'
        });
        example.x = panelX + 375 - example.width / 2;
        example.y = panelY + 85;
        this.container.addChild(example);
        
        const inputBg = new PIXI.Graphics();
        inputBg.beginFill(0xfafafa);
        inputBg.drawRoundedRect(panelX + 150, panelY + 150, 450, 50, 10);
        inputBg.endFill();
        inputBg.lineStyle(1, 0xdddddd);
        inputBg.drawRoundedRect(panelX + 150, panelY + 150, 450, 50, 10);
        this.container.addChild(inputBg);
        
        this.inputText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0x222222
        });
        this.inputText.x = panelX + 160;
        this.inputText.y = panelY + 165;
        this.container.addChild(this.inputText);
        
        this.cursor = new PIXI.Text('|', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0x222222
        });
        this.cursor.x = panelX + 160 + this.inputText.width;
        this.cursor.y = panelY + 165;
        this.container.addChild(this.cursor);
        
        const nextBtn = this.createVisualButton(panelX + 300, panelY + 250, 150, 50, 'CONTINUAR', 0xe0e0e0, 0x333333);
        nextBtn.on('pointerdown', () => {
            if (this.inputText.text.trim()) {
                this.configData.name = this.inputText.text;
                this.step++;
                this.showStep(this.step);
                window.removeEventListener('keydown', this.handleInput);
            } else {
                this.showError('Por favor ingresa un nombre');
            }
        });
        this.container.addChild(nextBtn);
        
        this.handleInput = (e) => {
            if (e.key === 'Enter') {
                if (this.inputText.text.trim()) {
                    this.configData.name = this.inputText.text;
                    this.step++;
                    this.showStep(this.step);
                    window.removeEventListener('keydown', this.handleInput);
                }
            } else if (e.key === 'Backspace') {
                this.inputText.text = this.inputText.text.slice(0, -1);
                this.updateCursor();
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
                this.inputText.text += e.key;
                this.updateCursor();
            }
        };
        
        window.addEventListener('keydown', this.handleInput);
        
        const instruction = new PIXI.Text('Escribe el nombre y presiona ENTER o haz clic en CONTINUAR', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x999999
        });
        instruction.x = panelX + 375 - instruction.width / 2;
        instruction.y = panelY + 320;
        this.container.addChild(instruction);
    }

    showPartsCountStep(panelX, panelY) {
        const title = new PIXI.Text(`¿Cuántas partes tendrá tu "${this.configData.name}"?`, {
            fontFamily: 'Arial',
            fontSize: 22,
            fill: 0x333333,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: 500
        });
        title.x = panelX + 375 - title.width / 2;
        title.y = panelY + 30;
        this.container.addChild(title);
        
        const numberBg = new PIXI.Graphics();
        numberBg.beginFill(0xfafafa);
        numberBg.drawRoundedRect(panelX + 300, panelY + 150, 150, 70, 15);
        numberBg.endFill();
        numberBg.lineStyle(1, 0xdddddd);
        numberBg.drawRoundedRect(panelX + 300, panelY + 150, 150, 70, 15);
        this.container.addChild(numberBg);
        
        this.countText = new PIXI.Text('3', {
            fontFamily: 'Arial',
            fontSize: 40,
            fill: 0x222222,
            fontWeight: 'bold'
        });
        this.countText.x = panelX + 375 - this.countText.width / 2;
        this.countText.y = panelY + 165;
        this.container.addChild(this.countText);
        
        const minusBtn = this.createVisualButton(panelX + 200, panelY + 170, 50, 50, '-', 0xe0e0e0, 0x333333);
        minusBtn.on('pointerdown', () => {
            let val = parseInt(this.countText.text);
            if (val > 2) {
                val--;
                this.countText.text = val.toString();
                this.countText.x = panelX + 375 - this.countText.width / 2;
            }
        });
        this.container.addChild(minusBtn);
        
        const plusBtn = this.createVisualButton(panelX + 500, panelY + 170, 50, 50, '+', 0xe0e0e0, 0x333333);
        plusBtn.on('pointerdown', () => {
            let val = parseInt(this.countText.text);
            if (val < 10) {
                val++;
                this.countText.text = val.toString();
                this.countText.x = panelX + 375 - this.countText.width / 2;
            }
        });
        this.container.addChild(plusBtn);
        
        const nextBtn = this.createVisualButton(panelX + 300, panelY + 280, 150, 50, 'CONTINUAR', 0xe0e0e0, 0x333333);
        nextBtn.on('pointerdown', () => {
            this.configData.partsCount = parseInt(this.countText.text);
            this.step++;
            this.showStep(this.step);
        });
        this.container.addChild(nextBtn);
        
        const instruction = new PIXI.Text('Selecciona el número de partes (mínimo 2, máximo 10)', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x999999
        });
        instruction.x = panelX + 375 - instruction.width / 2;
        instruction.y = panelY + 360;
        this.container.addChild(instruction);
    }

    showPartsNamesStep(panelX, panelY) {
        const title = new PIXI.Text(`Ingresa el nombre de cada parte en el orden que se uniran:`, {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0x333333,
            fontWeight: 'bold'
        });
        title.x = panelX + 375 - title.width / 2;
        title.y = panelY + 20;
        this.container.addChild(title);
        
        this.inputs = [];
        const startY = panelY + 90;
        const spacing = 45;
        
        for (let i = 0; i < this.configData.partsCount; i++) {
            const label = new PIXI.Text(`Parte ${i + 1}:`, {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0x333333
            });
            label.x = panelX + 100;
            label.y = startY + i * spacing;
            this.container.addChild(label);
            
            const inputBg = new PIXI.Graphics();
            inputBg.beginFill(0xfafafa);
            inputBg.drawRoundedRect(panelX + 180, startY + i * spacing - 3, 350, 30, 8);
            inputBg.endFill();
            inputBg.lineStyle(1, 0xdddddd);
            inputBg.drawRoundedRect(panelX + 180, startY + i * spacing - 3, 350, 30, 8);
            this.container.addChild(inputBg);
            
            const inputText = new PIXI.Text('', {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0x222222
            });
            inputText.x = panelX + 190;
            inputText.y = startY + i * spacing;
            this.container.addChild(inputText);
            
            this.inputs.push({
                text: inputText,
                value: '',
                index: i,
                bg: inputBg
            });
        }
        
        let currentInput = 0;
        this.inputs[currentInput].bg.tint = 0xcccccc;
        
        const handlePartInput = (e) => {
            if (e.key === 'Enter') {
                if (this.inputs[currentInput].value.trim()) {
                    this.inputs[currentInput].bg.tint = 0xffffff;
                    currentInput++;
                    if (currentInput >= this.inputs.length) {
                        this.configData.partsNames = this.inputs.map(inp => inp.value);
                        this.step++;
                        this.showStep(this.step);
                        window.removeEventListener('keydown', handlePartInput);
                    } else {
                        this.inputs[currentInput].bg.tint = 0xcccccc;
                    }
                }
            } else if (e.key === 'Backspace') {
                this.inputs[currentInput].value = this.inputs[currentInput].value.slice(0, -1);
                this.inputs[currentInput].text.text = this.inputs[currentInput].value;
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
                this.inputs[currentInput].value += e.key;
                this.inputs[currentInput].text.text = this.inputs[currentInput].value;
            }
        };
        
        window.addEventListener('keydown', handlePartInput);
        
        const instruction = new PIXI.Text('Escribe cada nombre y presiona ENTER para continuar', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x999999
        });
        instruction.x = panelX + 375 - instruction.width / 2;
        instruction.y = panelY + 500;
        this.container.addChild(instruction);
    }

    showOrientationStep(panelX, panelY) {
        const title = new PIXI.Text(`¿Cómo se ensamblarán las partes en el avatar final?`, {
            fontFamily: 'Arial',
            fontSize: 22,
            fill: 0x333333,
            fontWeight: 'bold'
        });
        title.x = panelX + 375 - title.width / 2;
        title.y = panelY + 30;
        this.container.addChild(title);
        
        const horizBtn = this.createVisualButton(panelX + 150, panelY + 140, 450, 80, '← IZQUIERDA A DERECHA →', 0xe0e0e0, 0x333333);
        horizBtn.on('pointerdown', () => {
            this.configData.orientation = 'horizontal';
            this.showPreview(panelX, panelY, 'horizontal');
            setTimeout(() => {
                this.step++;
                this.showStep(this.step);
            }, 500);
        });
        this.container.addChild(horizBtn);
        
        const vertBtn = this.createVisualButton(panelX + 150, panelY + 240, 450, 80, '↑ ARRIBA A ABAJO ↓', 0xe0e0e0, 0x333333);
        vertBtn.on('pointerdown', () => {
            this.configData.orientation = 'vertical';
            this.showPreview(panelX, panelY, 'vertical');
            setTimeout(() => {
                this.step++;
                this.showStep(this.step);
            }, 500);
        });
        this.container.addChild(vertBtn);
        
        this.showPreview(panelX, panelY, 'horizontal');
    }

    showPreview(panelX, panelY, orientation) {
        const oldPreview = this.container.children.find(c => c.name === 'preview');
        if (oldPreview) oldPreview.destroy();
        
        const previewX = panelX + 600;
        const previewY = panelY + 140;
        
        const previewBg = new PIXI.Graphics();
        previewBg.beginFill(0xf0f0f0);
        previewBg.drawRoundedRect(0, 0, 150, 150, 10);
        previewBg.endFill();
        previewBg.lineStyle(1, 0xdddddd);
        previewBg.drawRoundedRect(0, 0, 150, 150, 10);
        previewBg.x = previewX;
        previewBg.y = previewY;
        previewBg.name = 'preview';
        this.container.addChild(previewBg);
        
        const previewTitle = new PIXI.Text('Vista previa del avatar', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0x666666
        });
        previewTitle.x = previewX + 75 - previewTitle.width / 2;
        previewTitle.y = previewY + 5;
        previewTitle.name = 'preview';
        this.container.addChild(previewTitle);
        
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 120;
        previewCanvas.height = 120;
        const ctx = previewCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(0, 0, 120, 120);
        
        const colors = ['#c0c0c0', '#d0d0d0', '#e0e0e0'];
        const partNames = ['Parte 1', 'Parte 2', 'Parte 3'];
        
        if (orientation === 'horizontal') {
            const partWidth = 35;
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = colors[i];
                ctx.fillRect(10 + i * partWidth, 42, 30, 35);
                ctx.fillStyle = '#333333';
                ctx.font = 'bold 8px Arial';
                ctx.fillText(partNames[i][0], 10 + i * partWidth + 12, 60);
            }
            ctx.fillStyle = '#999999';
            ctx.fillRect(10, 85, 100, 2);
        } else {
            const partHeight = 35;
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = colors[i];
                ctx.fillRect(42, 10 + i * partHeight, 35, 30);
                ctx.fillStyle = '#333333';
                ctx.font = 'bold 8px Arial';
                ctx.fillText(partNames[i][0], 55, 25 + i * partHeight);
            }
            ctx.fillStyle = '#999999';
            ctx.fillRect(85, 10, 2, 100);
        }
        
        const previewTexture = PIXI.Texture.from(previewCanvas);
        const previewSprite = new PIXI.Sprite(previewTexture);
        previewSprite.x = previewX + 15;
        previewSprite.y = previewY + 20;
        previewSprite.name = 'preview';
        this.container.addChild(previewSprite);
    }

    showThemeStep(panelX, panelY) {
        const title = new PIXI.Text(`¿Qué tema prefieres para tu juego?`, {
            fontFamily: 'Arial',
            fontSize: 22,
            fill: 0x333333,
            fontWeight: 'bold'
        });
        title.x = panelX + 375 - title.width / 2;
        title.y = panelY + 30;
        this.container.addChild(title);
        
        const darkBtn = this.createVisualButton(panelX + 150, panelY + 140, 450, 80, '🌙 TEMA OSCURO', 0xe0e0e0, 0x333333);
        darkBtn.on('pointerdown', () => {
            this.configData.theme = 'dark';
            this.showThemePreview(panelX, panelY, 'dark');
            setTimeout(() => {
                this.step++;
                this.showStep(this.step);
            }, 500);
        });
        this.container.addChild(darkBtn);
        
        const lightBtn = this.createVisualButton(panelX + 150, panelY + 240, 450, 80, '☀️ TEMA CLARO', 0xe0e0e0, 0x333333);
        lightBtn.on('pointerdown', () => {
            this.configData.theme = 'light';
            this.showThemePreview(panelX, panelY, 'light');
            setTimeout(() => {
                this.step++;
                this.showStep(this.step);
            }, 500);
        });
        this.container.addChild(lightBtn);
        
        this.showThemePreview(panelX, panelY, 'dark');
    }

    showThemePreview(panelX, panelY, theme) {
        const oldPreview = this.container.children.find(c => c.name === 'themePreview');
        if (oldPreview) oldPreview.destroy();
        
        const previewX = panelX + 600;
        const previewY = panelY + 140;
        
        const previewBg = new PIXI.Graphics();
        const bgColor = theme === 'dark' ? 0x2d2d2d : 0xffffff;
        const textColor = theme === 'dark' ? 0xffffff : 0x333333;
        
        previewBg.beginFill(bgColor);
        previewBg.drawRoundedRect(0, 0, 150, 150, 10);
        previewBg.endFill();
        previewBg.lineStyle(1, 0xdddddd);
        previewBg.drawRoundedRect(0, 0, 150, 150, 10);
        previewBg.x = previewX;
        previewBg.y = previewY;
        previewBg.name = 'themePreview';
        this.container.addChild(previewBg);
        
        const previewTitle = new PIXI.Text('Vista previa', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: textColor
        });
        previewTitle.x = previewX + 75 - previewTitle.width / 2;
        previewTitle.y = previewY + 5;
        previewTitle.name = 'themePreview';
        this.container.addChild(previewTitle);
        
        const slotDemo = new PIXI.Graphics();
        slotDemo.beginFill(theme === 'dark' ? 0x444444 : 0xe0e0e0);
        slotDemo.drawRoundedRect(previewX + 15, previewY + 20, 120, 100, 8);
        slotDemo.endFill();
        slotDemo.name = 'themePreview';
        this.container.addChild(slotDemo);
        
        const slotText = new PIXI.Text('PARTE', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: textColor,
            fontWeight: 'bold'
        });
        slotText.x = previewX + 75 - slotText.width / 2;
        slotText.y = previewY + 60;
        slotText.name = 'themePreview';
        this.container.addChild(slotText);
    }

    showImagesStep(panelX, panelY) {
        const title = new PIXI.Text(`Carga las imágenes para cada parte`, {
            fontFamily: 'Arial',
            fontSize: 22,
            fill: 0x333333,
            fontWeight: 'bold'
        });
        title.x = panelX + 375 - title.width / 2;
        title.y = panelY + 20;
        this.container.addChild(title);
        
        const subTitle = new PIXI.Text(`Puedes seleccionar múltiples imágenes por parte`, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x666666
        });
        subTitle.x = panelX + 375 - subTitle.width / 2;
        subTitle.y = panelY + 50;
        this.container.addChild(subTitle);
        
        this.configData.partsImages = [];
        this.fileInputs = [];
        this.imageCounters = [];
        
        const startY = panelY + 90;
        const spacing = 70;
        
        for (let i = 0; i < this.configData.partsCount; i++) {
            const partName = this.configData.partsNames[i];
            
            const label = new PIXI.Text(`${partName}:`, {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0x333333,
                fontWeight: 'bold'
            });
            label.x = panelX + 50;
            label.y = startY + i * spacing;
            this.container.addChild(label);
            
            const uploadBtn = this.createVisualButton(panelX + 180, startY + i * spacing - 10, 220, 40, '📂 SELECCIONAR', 0xe0e0e0, 0x333333);
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.accept = 'image/*';
            fileInput.style.position = 'absolute';
            fileInput.style.left = '-1000px';
            fileInput.style.top = '-1000px';
            
            const counter = new PIXI.Text('0 imágenes', {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0x666666,
                fontWeight: 'bold'
            });
            counter.x = panelX + 420;
            counter.y = startY + i * spacing;
            this.container.addChild(counter);
            
            this.imageCounters.push(counter);
            this.configData.partsImages.push([]);
            
            const partIndex = i;
            
            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.configData.partsImages[partIndex] = files;
                const fileCount = files.length;
                
                counter.text = fileCount > 0 ? `${fileCount} imágenes ✓` : '0 imágenes';
                counter.style.fill = fileCount > 0 ? 0x4a4a4a : 0x666666;
                
                if (uploadBtn.label) {
                    uploadBtn.label.text = fileCount > 0 ? `✓ ${fileCount} cargadas` : '📂 SELECCIONAR';
                    uploadBtn.label.x = 110 - uploadBtn.label.width / 2;
                }
                
                if (fileCount > 0) {
                    uploadBtn.tint = 0xc0c0c0;
                } else {
                    uploadBtn.tint = 0xffffff;
                }
                
                fileInput.value = '';
            });
            
            document.body.appendChild(fileInput);
            this.fileInputs.push(fileInput);
            
            uploadBtn.on('pointerdown', () => {
                fileInput.click();
            });
            
            this.container.addChild(uploadBtn);
        }
        
        const createBtn = this.createVisualButton(panelX + 300, panelY + 520, 180, 50, 'CREAR COMBINA', 0x4a4a4a, 0xffffff);
        createBtn.on('pointerdown', async () => {
            let allLoaded = true;
            let missingParts = [];
            
            for (let i = 0; i < this.configData.partsCount; i++) {
                const images = this.configData.partsImages[i];
                if (!images || images.length === 0) {
                    allLoaded = false;
                    missingParts.push(this.configData.partsNames[i]);
                }
            }
            
            if (allLoaded) {
                const loadingMsg = new PIXI.Text('Creando tu Combina...', {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fill: 0x666666,
                    fontWeight: 'bold'
                });
                loadingMsg.x = panelX + 375 - loadingMsg.width / 2;
                loadingMsg.y = panelY + 570;
                this.container.addChild(loadingMsg);
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                loadingMsg.destroy();
                
                const finalConfig = {
                    ...this.configData,
                    adjustments: { parts: [] }
                };
                
                this.onComplete(finalConfig);
                this.container.destroy();
            } else {
                this.showError(`Faltan imágenes para: ${missingParts.join(', ')}`);
            }
        });
        this.container.addChild(createBtn);
        
        const instruction = new PIXI.Text('Selecciona una o más imágenes para cada parte', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x999999
        });
        instruction.x = panelX + 375 - instruction.width / 2;
        instruction.y = panelY + 570;
        this.container.addChild(instruction);
    }

    createVisualButton(x, y, width, height, text, bgColor, textColor) {
        const button = new PIXI.Graphics();
        button.beginFill(bgColor);
        button.drawRoundedRect(0, 0, width, height, 10);
        button.endFill();
        button.lineStyle(1, 0xcccccc);
        button.drawRoundedRect(0, 0, width, height, 10);
        button.x = x;
        button.y = y;
        button.eventMode = 'static';
        button.cursor = 'pointer';
        
        const label = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: textColor,
            fontWeight: 'bold'
        });
        label.x = width / 2 - label.width / 2;
        label.y = height / 2 - label.height / 2;
        button.addChild(label);
        
        button.label = label;
        
        button.on('pointerover', () => {
            button.tint = 0xd0d0d0;
        });
        button.on('pointerout', () => {
            button.tint = 0xffffff;
        });
        button.on('pointerdown', () => {
            button.y += 2;
            setTimeout(() => { button.y -= 2; }, 100);
        });
        
        return button;
    }

    updateCursor() {
        if (this.cursor) {
            this.cursor.x = this.inputText.x + this.inputText.width;
        }
    }

    showError(message) {
        console.error('Error:', message);
        const errorText = new PIXI.Text(message, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xcc3333,
            wordWrap: true,
            wordWrapWidth: 500,
            align: 'center'
        });
        errorText.x = this.app.screen.width / 2 - errorText.width / 2;
        errorText.y = this.app.screen.height / 2 + 200;
        this.container.addChild(errorText);
        setTimeout(() => errorText.destroy(), 3000);
    }
}