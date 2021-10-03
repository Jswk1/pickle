import { expect } from "chai";
import { defineStep, stepDefinitions } from "../Step";
import { extractVariables, stepConvertExpressions } from "../StepExpression";

describe("Step Expression Tests", () => {
    describe("stepConvertExpressions", () => {
        it("should convert steps without custom expressions", () => {
            const out1 = stepConvertExpressions("When This test is ran.");
            expect(out1.regexp.toString()).to.be.equal("/When This test is ran\\./");
            expect(out1.parsers).to.be.empty;

            const out2 = stepConvertExpressions("Then This test will be [green?]");
            expect(out2.regexp.toString()).to.be.equal("/Then This test will be \\[green\\?\\]/");
            expect(out2.parsers).to.be.empty;
        });

        it("should convert steps with custom expressions", () => {
            const out1 = stepConvertExpressions("When This test is ran for the {int} time.");
            expect(out1.regexp.toString()).to.be.equal("/When This test is ran for the (\\\-?\\\d*) time\\./");
            expect(out1.parsers.length).to.be.equal(1);

            const out2 = stepConvertExpressions("Then The result of this test will be {string}.");
            expect(out2.regexp.toString()).to.be.equal("/Then The result of this test will be (?:\\\"(.*)\\\")\\./");
            expect(out2.parsers.length).to.be.equal(1);

            const out3 = stepConvertExpressions("Step {int} with {decimal} many {string} expressions.");
            expect(out3.regexp.toString()).to.be.equal("/Step (\\\-?\\\d*) with (\\\-?\\\d*\\\.?\\\d*) many (?:\\\"(.*)\\\") expressions\\./");
            expect(out3.parsers.length).to.be.equal(3);
        });
    });

    describe("extractVariables", () => {
        it("should should extract integers", () => {
            const description1 = "Step {int} with {int} integers.";
            defineStep(description1, () => undefined);
            const definition1 = stepDefinitions.get(description1);

            expect(extractVariables({ description: "Step 1 with 2 integers.", definition: definition1 })).to.eql([1, 2]);
        });

        it("should should extract decimals", () => {
            const description1 = "Number {decimal} divided by {decimal} gives {decimal}";
            defineStep(description1, () => undefined);
            const definition1 = stepDefinitions.get(description1);

            expect(extractVariables({ description: "Number 10 divided by 2.5 gives 4", definition: definition1 })).to.eql([10, 2.5, 4]);
        });

        it("should should extract strings", () => {
            const description1 = "Someone once said {string} and then {string}.";
            defineStep(description1, () => undefined);
            const definition1 = stepDefinitions.get(description1);

            expect(extractVariables({ description: `Someone once said "To be or not to be" and then "that is "the" question".`, definition: definition1 })).to.eql(["To be or not to be", `that is "the" question`]);
        });

        it("should should extract multiple types", () => {
            const description1 = "Step with integer {int} and decimal {decimal} with string {string} included.";
            defineStep(description1, () => undefined);
            const definition1 = stepDefinitions.get(description1);

            expect(extractVariables({ description: `Step with integer 1234 and decimal -6.4 with string "lol" included.`, definition: definition1 })).to.eql([1234, -6.4, "lol"]);
        });
    });
});