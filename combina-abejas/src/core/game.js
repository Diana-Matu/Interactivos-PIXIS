// src/core/game.js
import * as PIXI from 'pixi.js';
import { CombinaGenerator } from './CombinaGenerator.js';

export class Game {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.app = null;
        this.combinaGenerator = null;
        
        // Debounce para resize
        this.resizeTimeout = null;
        window.addEventListener('resize', this.debouncedResize.bind(this));
        
        this.init();
    }

    debouncedResize() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.resize(), 200);
    }

    async init() {
        const { width, height } = this.getDimensions();
        
        this.app = new PIXI.Application({
            view: document.getElementById(this.canvasId),
            width: width,
            height: height,
            backgroundColor: 0x0f1219,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: false
        });

        // Siempre iniciar el asistente
        this.combinaGenerator = new CombinaGenerator(this.app);
        await this.combinaGenerator.initializeWithWizard();
        
        this.start();
    }

    getDimensions() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let width = Math.min(1400, windowWidth - 40);
        let height = Math.min(900, windowHeight - 40);
        
        // Para móviles
        if (windowWidth < 768) {
            width = windowWidth - 20;
            height = windowHeight - 20;
        }
        
        return { width, height };
    }

    resize() {
        if (!this.app) return;
        
        const { width, height } = this.getDimensions();
        this.app.renderer.resize(width, height);
        
        if (this.combinaGenerator && this.combinaGenerator.config) {
            this.combinaGenerator.handleResize();
        }
    }

    start() {
        this.app.ticker.add(() => {
            // Actualizaciones de animación
        });
    }
}