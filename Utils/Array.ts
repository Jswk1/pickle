export { };

declare global {
    interface Array<T> {
        last(): T;
    }
}

Array.prototype.last = function () {
    return this[this.length - 1];
}