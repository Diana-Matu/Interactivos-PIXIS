import { Game } from './core/game.js';

// Inicializar el juego cuando cargue la página
window.addEventListener('load', () => {
    const game = new Game();
    game.init();
});