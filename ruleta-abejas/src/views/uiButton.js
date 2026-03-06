export function createButton(text, onClick) {
    const buttonContainer = new PIXI.Container();
    
    // Sombra
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.3);
    shadow.drawRoundedRect(-78, -23, 156, 56, 28);
    shadow.endFill();
    buttonContainer.addChild(shadow);
    
    // Fondo del botón
    const background = new PIXI.Graphics();
    background.beginFill(0xFFB347); // Naranja suave
    background.drawRoundedRect(-80, -25, 160, 60, 30);
    background.endFill();
    
    // Borde
    background.lineStyle(3, 0xFFFFFF);
    background.drawRoundedRect(-80, -25, 160, 60, 30);
    
    buttonContainer.addChild(background);
    
    // Texto del botón
    const buttonText = new PIXI.Text(text, {
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        align: 'center',
        dropShadow: true,
        dropShadowColor: '#ecaa7a',
        dropShadowDistance: 3
    });
    buttonText.anchor.set(0.5);
    
    buttonContainer.addChild(buttonText);
    
    // Hacer interactivo
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';
    buttonContainer.on('pointerdown', onClick);
    
    // Efectos hover
    buttonContainer.on('pointerover', () => {
        background.tint = 0xFFA07A; 
        buttonContainer.scale.set(1.05);
    });
    
    buttonContainer.on('pointerout', () => {
        background.tint = 0xFFFFFF;
        buttonContainer.scale.set(1);
    });
    
    return buttonContainer;
}