import { expect } from "chai"

describe("Array.last", () => {
    it("should return last element of an array", () => {
        expect([1, 2, 3].last()).to.be.equal(3);
    });

    it("should return undefined if array is empty", () => {
        expect([].last()).to.be.equal(undefined);
    })
})