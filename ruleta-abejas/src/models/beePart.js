export class BeePart {
    constructor(type, name, baseColor, pixels) {
        this.type = type;
        this.name = name;
        this.baseColor = baseColor;
        this.pixels = pixels;
        this.species = null;
    }

    createVariation(random, variation = 0.2) {
        const variedPixels = this.pixels.map(pixel => {
            if (pixel.color) {
                return { ...pixel };
            } else {
                return {
                    ...pixel,
                    color: random.randomColor(this.baseColor, variation)
                };
            }
        });

        const varied = new BeePart(
            this.type,
            `${this.name}`,
            this.baseColor,
            variedPixels
        );
        varied.species = this.species;
        
        return varied;
    }
}