export class BeeBuilder {
    constructor(app, avatarView) {
        this.app = app;
        this.avatarView = avatarView;
        this.container = new PIXI.Container();
        
        this.init();
        app.stage.addChild(this.container);
    }
    
    init() {
        // Panel de construcción
        const panel = new PIXI.Graphics();
        panel.beginFill(0x2a1a2a, 0.8);
        panel.lineStyle(2, 0xaa88ff);
        panel.drawRoundedRect(0, 0, 200, 150, 10);
        panel.endFill();
        this.container.addChild(panel);
        
        const title = new PIXI.Text('CONSTRUCTOR', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xaa88ff
        });
        title.x = 100 - title.width / 2;
        title.y = 10;
        this.container.addChild(title);
        
        this.statusText = new PIXI.Text('Esperando...', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xffffff
        });
        this.statusText.x = 20;
        this.statusText.y = 40;
        this.container.addChild(this.statusText);
        
        // Posición
        this.container.x = 30;
        this.container.y = 480;
    }
    
    buildFromAvatar(avatar) {
        if (!avatar) return;
        
        const species = avatar.parts[1]?.especie || 'Desconocida';
        const rarity = this.calculateRarity(avatar);
        
        this.statusText.text = `Construyendo:\n${species}\nRareza: ${rarity}`;
        
        // Animación de construcción
        this.buildAnimation();
    }
    
    calculateRarity(avatar) {
        const especies = new Set(avatar.parts.map(p => p.especie));
        if (especies.size === 1) return '⚡ LEGENDARIO';
        if (especies.size === 2) return '✨ RARO';
        return '📦 COMÚN';
    }
    
    buildAnimation() {
        let step = 0;
        const colors = [0xffaa00, 0x00ffaa, 0xaa00ff];
        
        const interval = setInterval(() => {
            if (step >= 5) {
                clearInterval(interval);
                this.statusText.text = '¡Construido!';
                return;
            }
            
            this.container.children[0].tint = colors[step % colors.length];
            step++;
        }, 100);
    }
    
    update() {
        // Animaciones falta realizar
    }
    
    resize(width, height) {
        this.container.x = 30;
        this.container.y = height - 200;
    }
}