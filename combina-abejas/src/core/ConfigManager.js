// src/core/ConfigManager.js
export class ConfigManager {
    constructor() {
        this.configKey = 'combina_config';
        this.defaultConfig = {
            combinaName: 'Mi Combina',
            orientation: 'horizontal', // 'horizontal' o 'vertical'
            parts: [],
            createdAt: null,
            lastModified: null
        };
    }

    loadConfig() {
        try {
            const savedConfig = localStorage.getItem(this.configKey);
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                console.log('Configuración cargada:', config.combinaName);
                return config;
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
        return null;
    }

    saveConfig(config) {
        try {
            config.lastModified = new Date().toISOString();
            localStorage.setItem(this.configKey, JSON.stringify(config));
            console.log(' Configuración guardada:', config.combinaName);
            return true;
        } catch (error) {
            console.error('Error guardando configuración:', error);
            return false;
        }
    }

    clearConfig() {
        localStorage.removeItem(this.configKey);
        console.log('Configuración eliminada');
    }

    hasConfig() {
        return localStorage.getItem(this.configKey) !== null;
    }

    exportConfig() {
        const config = this.loadConfig();
        if (!config) return null;
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `${config.combinaName}_config.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        return true;
    }

    importConfig(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    this.saveConfig(config);
                    resolve(config);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}