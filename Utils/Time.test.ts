import { expect } from "chai";
import { extractEntryDirectory, createRegexFromPattern } from "./QueryFiles";
import { logDuration } from "./Time";

describe("Time Utils Test", () => {
    describe("logDuration", () => {
        it("should display milliseconds", () => {
            expect(logDuration(0)).to.equal("0ms");
            expect(logDuration(500)).to.equal("500ms");
            expect(logDuration(999)).to.equal("999ms");
        });

        it("should display seconds and milliseconds", () => {
            expect(logDuration(1000)).to.equal("1s");
            expect(logDuration(1001)).to.equal("1s 1ms");
            expect(logDuration(2000)).to.equal("2s");
            expect(logDuration(59999)).to.equal("59s 999ms");
        });

        it("should display minutes, seconds and milliseconds", () => {
            expect(logDuration(60000)).to.equal("1m");
            expect(logDuration(60001)).to.equal("1m 1ms");
            expect(logDuration(61001)).to.equal("1m 1s 1ms");
            expect(logDuration(3599999)).to.equal("59m 59s 999ms");
        });

        it("should display hours, minutes, seconds and milliseconds", () => {
            expect(logDuration(3600000)).to.equal("1h");
            expect(logDuration(3600001)).to.equal("1h 1ms");
            expect(logDuration(3601000)).to.equal("1h 1s");
            expect(logDuration(3601001)).to.equal("1h 1s 1ms");
            expect(logDuration(3661001)).to.equal("1h 1m 1s 1ms");
        });
    });
});