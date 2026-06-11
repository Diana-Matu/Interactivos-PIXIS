// src/core/AssetLoader.js
export class AssetLoader {
    constructor() {
        this.cache = new Map();
        this.targetSize = 24; // Tamaño uniforme para pixel art
    }

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(file.name || file, img);
                resolve(img);
            };
            img.onerror = reject;
            
            if (file instanceof File) {
                const url = URL.createObjectURL(file);
                img.src = url;
                // Limpiar URL después de cargar
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    resolve(img);
                };
            } else {
                img.src = file;
            }
        });
    }

    async loadImagesFromFolder(files) {
        const images = [];
        const validFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );
        
        for (const file of validFiles) {
            try {
                const img = await this.loadImage(file);
                const pixelData = this.imageToPixelData(img);
                images.push({
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    originalFile: file,
                    pixels: pixelData,
                    baseColor: this.getDominantColor(pixelData),
                    width: this.targetSize,
                    height: this.targetSize
                });
                console.log(` Cargada imagen: ${file.name}`);
            } catch (error) {
                console.error(` Error cargando ${file.name}:`, error);
            }
        }
        
        return images;
    }

    imageToPixelData(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.targetSize;
        canvas.height = this.targetSize;
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0, this.targetSize, this.targetSize);
        
        const imageData = ctx.getImageData(0, 0, this.targetSize, this.targetSize);
        const pixels = [];
        
        for (let y = 0; y < this.targetSize; y++) {
            for (let x = 0; x < this.targetSize; x++) {
                const index = (y * this.targetSize + x) * 4;
                const r = imageData.data[index];
                const g = imageData.data[index + 1];
                const b = imageData.data[index + 2];
                const a = imageData.data[index + 3];
                
                if (a > 128) {
                    const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                    pixels.push({ x, y, color });
                }
            }
        }
        
        return pixels;
    }

    getDominantColor(pixels) {
        if (pixels.length === 0) return '#888888';
        
        const colorCount = new Map();
        pixels.forEach(pixel => {
            if (pixel.color) {
                colorCount.set(pixel.color, (colorCount.get(pixel.color) || 0) + 1);
            }
        });
        
        let maxCount = 0;
        let dominantColor = pixels[0].color;
        
        colorCount.forEach((count, color) => {
            if (count > maxCount) {
                maxCount = count;
                dominantColor = color;
            }
        });
        
        return dominantColor;
    }

    clearCache() {
        this.cache.clear();
    }
}