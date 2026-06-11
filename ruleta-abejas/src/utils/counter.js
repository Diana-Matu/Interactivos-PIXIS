export class Counter {
    constructor() {
        this.value = 0;
    }
    
    next() {
        return ++this.value;
    }
    
    reset() {
        this.value = 0;
    }
    
    current() {
        return this.value;
    }
}