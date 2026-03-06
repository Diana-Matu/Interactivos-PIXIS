export class Counter {
    constructor(start = 0) {
        this.value = start;
    }

    increment() {
        return ++this.value;
    }

    decrement() {
        return --this.value;
    }

    reset() {
        this.value = 0;
    }
}