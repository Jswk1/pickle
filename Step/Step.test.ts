import { expect } from "chai";
import { defineStep, findStepDefinition, loadStepDefinitions } from "./Step";

describe("Step Tests", () => {
    describe("findStepDefinition", () => {
        it("should find correct steps with multiple string expressions", () => {
            defineStep("we have {string}", async (str: string) => { });
            defineStep("we have {string} and {string}", async (str1: string, str2: string) => { });
            defineStep("we have {string} and {string} and {string}", async (str1: string, str2: string, str3: string) => { });
            defineStep("we have {string} and number {int}", async (str1: string, num: number) => { });

            loadStepDefinitions({});

            const def1 = findStepDefinition(`we have "string"`);
            const def2 = findStepDefinition(`we have "string" and "some other string"`);
            const def3 = findStepDefinition(`we have "string" and "some other string" and "it gets worse"`);
            const def4 = findStepDefinition(`we have "string" and number 5`);

            expect(def1.pattern).to.be.equal("we have {string}", `For string 'we have "string"' expression 'we have {string}' was found`);
            expect(def2.pattern).to.be.equal("we have {string} and {string}", `For string 'we have "string" and "some other string"' expression 'we have {string} and {string}' was found`);
            expect(def3.pattern).to.be.equal("we have {string} and {string} and {string}", `For string 'we have "string" and "some other string" and "it gets worse"' expression 'we have {string} and {string} and {string}' was found`);
            expect(def4.pattern).to.be.equal("we have {string} and number {int}", `For string 'we have "string" and number 5' and "it gets worse"' expression 'we have {string} and number {int}' was found`);
        });
    });
});