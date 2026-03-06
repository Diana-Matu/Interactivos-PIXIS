import { WheelController } from '../controllers/wheelController.js';
import { AvatarView } from '../views/avatarView.js';
import { BeeModel } from '../models/beeModel.js';
import { createButton } from '../views/uiButton.js';

export class Game {
    constructor() {
        this.app = null;
        this.wheelController = null;
        this.avatarView = null;
        this.bees = [];
        this.spinButton = null;
    }

    async init() {
        // Inicializar PixiJS con fondo amarillo pastel
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0xFFF7C8, // Amarillo pastel
            antialias: false,
            resolution: 1,
            autoDensity: true
        });
        
        document.getElementById('game-container').appendChild(this.app.view);
        
        // Ajustar tamaño al cambiar la ventana
        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
            this.repositionElements();
        });

        // Cargar texturas de abejas
        await this.createTestTextures();
        
        // Inicializar controladores y vistas
        this.wheelController = new WheelController(this.app, this.bees);
        this.avatarView = new AvatarView(this.app);
        
        // Crear botón de giro
        this.spinButton = createButton('¡Girar Ruleta!', () => {
            this.wheelController.spin();
        });
        this.app.stage.addChild(this.spinButton);
        
        // Iniciar el loop de actualización
        this.app.ticker.add(this.update.bind(this));
        
        // Posicionar elementos inicialmente
        this.repositionElements();
    }

    async createTestTextures() {
        // Crear texturas de prueba más grandes y detalladas
        const beeNames = ['Abeja Reina', 'Abeja Obrera', 'Abeja Zángano', 'Abeja Melífera'];
        
        for (let i = 0; i < 4; i++) {
            // Crear un gráfico más grande para las texturas
            const graphics = new PIXI.Graphics();
            
            // Colores base para cada abeja
            const colors = [0xffd700, 0xffaa00, 0xffb347, 0x4169e1];
            
            // Cuerpo principal 
            graphics.beginFill(colors[i]);
            graphics.drawEllipse(0, 0, 50, 40); 
            graphics.endFill();
            
            // Rayas negras 
            graphics.beginFill(0x000000);
            graphics.drawRect(-40, -15, 80, 8);  
            graphics.drawRect(-40, 5, 80, 8);    
            graphics.endFill();
            
            // Ojos más grandes
            graphics.beginFill(0xffffff);
            graphics.drawCircle(-20, -20, 10);   
            graphics.drawCircle(20, -20, 10);    
            graphics.endFill();
            
            graphics.beginFill(0x000000);
            graphics.drawCircle(-20, -20, 5);    
            graphics.drawCircle(20, -20, 5);     
            graphics.endFill();
            
            // Antenas
            graphics.lineStyle(3, 0x000000);
            graphics.moveTo(-15, -35);
            graphics.lineTo(-25, -50);
            graphics.moveTo(15, -35);
            graphics.lineTo(25, -50);
            
            // Bolitas en antenas
            graphics.beginFill(0xffaa00);
            graphics.drawCircle(-25, -50, 5);
            graphics.drawCircle(25, -50, 5);
            graphics.endFill();
            
            const texture = this.app.renderer.generateTexture(graphics);
            const bee = new BeeModel(texture, beeNames[i]);
            this.bees.push(bee);
        }
    }

    repositionElements() {
        if (this.wheelController) {
            this.wheelController.container.x = window.innerWidth / 2;
            this.wheelController.container.y = window.innerHeight / 2 - 30; 
        }
        
        if (this.avatarView) {
            this.avatarView.container.x = window.innerWidth - 220;
            this.avatarView.container.y = window.innerHeight - 180;
        }
        
        if (this.spinButton) {
            this.spinButton.x = window.innerWidth / 2;
            this.spinButton.y = window.innerHeight - 150; 
        }
    }

    update(delta) {
        if (this.wheelController) {
            this.wheelController.update(delta);
        }
    }
}