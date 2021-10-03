import { expect } from "chai";
import { stepConvertExpressions } from "../StepExpression";

describe("Step Expression Tests", () => {
    describe("stepConvertExpressions", () => {
        it("should convert steps without custom expressions", () => {
            const out1 = stepConvertExpressions("When This test is ran.");
            expect(out1.regexp.toString()).to.be.equal("/When This test is ran\\./");
            expect(out1.resolvers).to.be.empty;

            const out2 = stepConvertExpressions("Then This test will be [green?]");
            expect(out2.regexp.toString()).to.be.equal("/Then This test will be \\[green\\?\\]/");
            expect(out2.resolvers).to.be.empty;
        });

        it("should convert steps with custom expressions", () => {
            const out1 = stepConvertExpressions("When This test is ran for the {int} time.");
            expect(out1.regexp.toString()).to.be.equal("/When This test is ran for the (\\\-?\\\d*) time\\./");
            expect(out1.resolvers.length).to.be.equal(1);

            const out2 = stepConvertExpressions("Then The result of this test will be {string}.");
            expect(out2.regexp.toString()).to.be.equal("/Then The result of this test will be (\\\"(.*)\\\")\\./");
            expect(out2.resolvers.length).to.be.equal(1);

            const out3 = stepConvertExpressions("Step {int} with {decimal} many {string} expressions.");
            expect(out3.regexp.toString()).to.be.equal("/Step (\\\-?\\\d*) with (\\\-?\\\d*\\\.?\\\d*) many (\\\"(.*)\\\") expressions\\./");
            expect(out3.resolvers.length).to.be.equal(3);
        });
    });
});