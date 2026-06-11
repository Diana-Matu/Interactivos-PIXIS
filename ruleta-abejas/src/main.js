import { Game } from './core/game.js';
import './style.css';

// Configuración global
window.addEventListener('DOMContentLoaded', () => {
    console.log('🎰 Iniciando Bee Casino Slots...');
    
    try {
        const game = new Game('game-canvas');
        
        // Exponer para debugging en desarrollo
        if (import.meta.env.DEV) {
            window.game = game;
            console.log('🐝 Juego inicializado. Acceso global: window.game');
        }
        
        // Manejar errores no capturados
        window.addEventListener('error', (event) => {
            console.error('❌ Error:', event.error);
        });
        
    } catch (error) {
        console.error('💥 Error fatal al iniciar el juego:', error);
        
        // Mostrar mensaje de error en canvas
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.font = '20px Arial';
        ctx.fillText('Error al cargar el juego', 50, 50);
    }
});

// Prevenir scroll con teclas de flecha
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
    }
});