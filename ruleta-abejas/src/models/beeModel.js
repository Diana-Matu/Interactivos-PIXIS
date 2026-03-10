export class BeeModel {
    constructor() {
        this.head = null;
        this.thorax = null;
        this.abdomen = null;
    }

    setParts(head, thorax, abdomen) {
        this.head = head;
        this.thorax = thorax;
        this.abdomen = abdomen;
    }

    getAllPixels() {
        const offsetHead = { x: 40, y: 20 };
        const offsetThorax = { x: 40, y: 45 };
        const offsetAbdomen = { x: 40, y: 70 };

        const pixels = [];

        if (this.abdomen) {
            pixels.push(...this.abdomen.pixels.map(p => ({
                ...p,
                x: p.x + offsetAbdomen.x,
                y: p.y + offsetAbdomen.y
            })));
        }

        if (this.thorax) {
            pixels.push(...this.thorax.pixels.map(p => ({
                ...p,
                x: p.x + offsetThorax.x,
                y: p.y + offsetThorax.y
            })));
        }

        if (this.head) {
            pixels.push(...this.head.pixels.map(p => ({
                ...p,
                x: p.x + offsetHead.x,
                y: p.y + offsetHead.y
            })));
        }

        return pixels;
    }

    clone() {
        const clone = new BeeModel();
        clone.setParts(this.head, this.thorax, this.abdomen);
        return clone;
    }
}