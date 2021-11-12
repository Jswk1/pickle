import { expect } from "chai";
import { And, Given, Then, When } from "../Runner";
import { StepType } from "../Step/Step";
import { loadFeature } from "./Loader";

describe("loadFeature Test", () => {

    const featureContent = `

    Feature: Test Feature Name
        This is a description of the feature.
        It should be parsed correctly.

        Background:
            Given data already exists
            And there is some more

        Scenario: First Scenario
            When "first" scenario is started
            Then it contains exactly 2 steps

        Scenario: Second Scenario
            When "second" scenario is started
            And it performs some checks
            Then it contains exactly 3 steps
            And everything works correctly

        Scenario Outline: Outline Test
            When we add <a> plus <b>
            Then we get <c>

            Examples:
            | a | b | c |
            | 1 | 1 | 2 |
            | 3 | 5 | 8 |
    `;

    Given("data already exists", async () => { });
    And("there is some more", async () => { });
    When("{string} scenario is started", async (order: string) => { });
    Then("it contains exactly {int} steps", async (count: number) => { });
    And("it performs some checks", async (count: number) => { });
    And("everything works correctly", async () => { });
    When("we add {int} plus {int}", async (a: number, b: number) => { });
    Then("we get {int}", async (c: number) => { });

    const feature = loadFeature(featureContent);

    it("should load feature with name and description", () => {
        expect(feature.name).to.be.equal("Test Feature Name");
        expect(feature.description).to.be.equal("This is a description of the feature.\nIt should be parsed correctly.");
    });

    it("contains 2 specific background steps", () => {
        expect(feature.backgroundSteps.length).to.be.equal(2);
        expect(feature.backgroundSteps[0].name).to.be.equal(`Given data already exists`);
        expect(feature.backgroundSteps[0].type).to.be.equal(StepType.Background);
        expect(feature.backgroundSteps[1].name).to.be.equal(`And there is some more`);
        expect(feature.backgroundSteps[1].type).to.be.equal(StepType.Background);
    });

    it("contains 4 scenarios", () => {
        expect(feature.scenarios.length).to.be.equal(4);

        // Scenario 1
        expect(feature.scenarios[0].name).to.be.equal("First Scenario");
        expect(feature.scenarios[0].steps.length).to.be.equal(2, "First scenario step count");
        expect(feature.scenarios[0].isOutline).to.be.equal(undefined);

        expect(feature.scenarios[0].steps[0].name).to.be.equal(`When "first" scenario is started`);
        expect(feature.scenarios[0].steps[0].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[0].steps[1].name).to.be.equal(`Then it contains exactly 2 steps`);
        expect(feature.scenarios[0].steps[1].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[0].steps[0].nextStepId).to.be.equal(feature.scenarios[0].steps[1].id);
        expect(feature.scenarios[0].steps[1].nextStepId).to.be.equal(undefined);

        // Scenario 2
        expect(feature.scenarios[1].name).to.be.equal("Second Scenario");
        expect(feature.scenarios[1].steps.length).to.be.equal(4, "Second scenario step count");
        expect(feature.scenarios[1].isOutline).to.be.equal(undefined);

        expect(feature.scenarios[1].steps[0].name).to.be.equal(`When "second" scenario is started`);
        expect(feature.scenarios[1].steps[0].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[1].steps[1].name).to.be.equal("And it performs some checks");
        expect(feature.scenarios[1].steps[1].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[1].steps[2].name).to.be.equal("Then it contains exactly 3 steps");
        expect(feature.scenarios[1].steps[2].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[1].steps[3].name).to.be.equal("And everything works correctly");
        expect(feature.scenarios[1].steps[3].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[1].steps[0].nextStepId).to.be.equal(feature.scenarios[1].steps[1].id);
        expect(feature.scenarios[1].steps[1].nextStepId).to.be.equal(feature.scenarios[1].steps[2].id);
        expect(feature.scenarios[1].steps[2].nextStepId).to.be.equal(feature.scenarios[1].steps[3].id);
        expect(feature.scenarios[1].steps[3].nextStepId).to.be.equal(undefined);

        // Outline Scenario #1
        expect(feature.scenarios[2].name).to.be.equal("Outline Test");
        expect(feature.scenarios[2].steps.length).to.be.equal(2, "Outline scenario #1 step count");
        expect(feature.scenarios[2].isOutline).to.be.equal(true);

        expect(feature.scenarios[2].steps[0].name).to.be.equal("When we add 1 plus 1");
        expect(feature.scenarios[2].steps[0].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[2].steps[1].name).to.be.equal("Then we get 2");
        expect(feature.scenarios[2].steps[1].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[2].steps[0].nextStepId).to.be.equal(feature.scenarios[2].steps[1].id);
        expect(feature.scenarios[2].steps[1].nextStepId).to.be.equal(undefined);

        // Outline Scenario #2
        expect(feature.scenarios[3].name).to.be.equal("Outline Test");
        expect(feature.scenarios[3].steps.length).to.be.equal(2, "Outline scenario #2 step count");
        expect(feature.scenarios[3].isOutline).to.be.equal(true);

        expect(feature.scenarios[3].steps[0].name).to.be.equal("When we add 3 plus 5");
        expect(feature.scenarios[3].steps[0].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[3].steps[1].name).to.be.equal("Then we get 8");
        expect(feature.scenarios[3].steps[1].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[3].steps[0].nextStepId).to.be.equal(feature.scenarios[3].steps[1].id);
        expect(feature.scenarios[3].steps[1].nextStepId).to.be.equal(undefined);

        // Scenario order
        expect(feature.scenarios[0].nextScenarioId).to.be.equal(feature.scenarios[1].id);
        expect(feature.scenarios[1].nextScenarioId).to.be.equal(feature.scenarios[2].id);
        expect(feature.scenarios[2].nextScenarioId).to.be.equal(feature.scenarios[3].id);
        expect(feature.scenarios[3].nextScenarioId).to.be.equal(undefined);
    });
});