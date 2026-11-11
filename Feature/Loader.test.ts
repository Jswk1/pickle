import { expect } from "chai";
import { And, Given, Then, When } from "../Runner";
import { loadStepDefinitions, StepType } from "../Step/Step";
import { loadFeature } from "./Loader";

describe("loadFeature", () => {

    const featureContent = `

    Feature: Loader Test
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

    loadStepDefinitions({});

    it("should load the feature", () => {
        const feature = loadFeature(featureContent);
        expect(typeof feature).to.be.equal("object");
    });

    it("should load feature with name and description", () => {
        const feature = loadFeature(featureContent);

        expect(feature.name).to.be.equal("Loader Test");
        expect(feature.description).to.be.equal("This is a description of the feature.\nIt should be parsed correctly.");
    });

    it("contains 2 specific background steps", () => {
        const feature = loadFeature(featureContent);

        expect(feature.backgroundSteps.length).to.be.equal(2);
        expect(feature.backgroundSteps[0].keyword).to.be.equal("Given");
        expect(feature.backgroundSteps[0].name).to.be.equal("data already exists");
        expect(feature.backgroundSteps[0].type).to.be.equal(StepType.Background);

        expect(feature.backgroundSteps[1].keyword).to.be.equal("And");
        expect(feature.backgroundSteps[1].name).to.be.equal("there is some more");
        expect(feature.backgroundSteps[1].type).to.be.equal(StepType.Background);
    });

    it("contains 4 scenarios", () => {
        const feature = loadFeature(featureContent);

        expect(feature.scenarios.length).to.be.equal(4);

        // Scenario 1
        expect(feature.scenarios[0].name).to.be.equal("First Scenario");
        expect(feature.scenarios[0].steps.length).to.be.equal(2, "First scenario step count");
        expect(feature.scenarios[0].isOutline).to.be.equal(undefined);

        expect(feature.scenarios[0].steps[0].keyword).to.be.equal("When");
        expect(feature.scenarios[0].steps[0].name).to.be.equal(`"first" scenario is started`);
        expect(feature.scenarios[0].steps[0].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[0].steps[1].keyword).to.be.equal("Then");
        expect(feature.scenarios[0].steps[1].name).to.be.equal("it contains exactly 2 steps");
        expect(feature.scenarios[0].steps[1].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[0].steps[0].nextStepId).to.be.equal(feature.scenarios[0].steps[1].id);
        expect(feature.scenarios[0].steps[1].nextStepId).to.be.equal(undefined);

        // Scenario 2
        expect(feature.scenarios[1].name).to.be.equal("Second Scenario");
        expect(feature.scenarios[1].steps.length).to.be.equal(4, "Second scenario step count");
        expect(feature.scenarios[1].isOutline).to.be.equal(undefined);

        expect(feature.scenarios[1].steps[0].keyword).to.be.equal("When");
        expect(feature.scenarios[1].steps[0].name).to.be.equal(`"second" scenario is started`);
        expect(feature.scenarios[1].steps[0].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[1].steps[1].keyword).to.be.equal("And");
        expect(feature.scenarios[1].steps[1].name).to.be.equal("it performs some checks");
        expect(feature.scenarios[1].steps[1].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[1].steps[2].keyword).to.be.equal("Then");
        expect(feature.scenarios[1].steps[2].name).to.be.equal("it contains exactly 3 steps");
        expect(feature.scenarios[1].steps[2].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[1].steps[3].keyword).to.be.equal("And");
        expect(feature.scenarios[1].steps[3].name).to.be.equal("everything works correctly");
        expect(feature.scenarios[1].steps[3].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[1].steps[0].nextStepId).to.be.equal(feature.scenarios[1].steps[1].id);
        expect(feature.scenarios[1].steps[1].nextStepId).to.be.equal(feature.scenarios[1].steps[2].id);
        expect(feature.scenarios[1].steps[2].nextStepId).to.be.equal(feature.scenarios[1].steps[3].id);
        expect(feature.scenarios[1].steps[3].nextStepId).to.be.equal(undefined);

        // Outline Scenario #1
        expect(feature.scenarios[2].name).to.be.equal("Outline Test");
        expect(feature.scenarios[2].steps.length).to.be.equal(2, "Outline scenario #1 step count");
        expect(feature.scenarios[2].isOutline).to.be.equal(true);

        expect(feature.scenarios[2].steps[0].keyword).to.be.equal("When");
        expect(feature.scenarios[2].steps[0].name).to.be.equal("we add 1 plus 1");
        expect(feature.scenarios[2].steps[0].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[2].steps[1].keyword).to.be.equal("Then");
        expect(feature.scenarios[2].steps[1].name).to.be.equal("we get 2");
        expect(feature.scenarios[2].steps[1].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[2].steps[0].nextStepId).to.be.equal(feature.scenarios[2].steps[1].id);
        expect(feature.scenarios[2].steps[1].nextStepId).to.be.equal(undefined);

        // Outline Scenario #2
        expect(feature.scenarios[3].name).to.be.equal("Outline Test");
        expect(feature.scenarios[3].steps.length).to.be.equal(2, "Outline scenario #2 step count");
        expect(feature.scenarios[3].isOutline).to.be.equal(true);

        expect(feature.scenarios[3].steps[0].keyword).to.be.equal("When");
        expect(feature.scenarios[3].steps[0].name).to.be.equal("we add 3 plus 5");
        expect(feature.scenarios[3].steps[0].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[3].steps[1].keyword).to.be.equal("Then");
        expect(feature.scenarios[3].steps[1].name).to.be.equal("we get 8");
        expect(feature.scenarios[3].steps[1].type).to.be.equal(StepType.Scenario);

        expect(feature.scenarios[3].steps[0].nextStepId).to.be.equal(feature.scenarios[3].steps[1].id);
        expect(feature.scenarios[3].steps[1].nextStepId).to.be.equal(undefined);

        // Scenario order
        expect(feature.scenarios[0].nextScenarioId).to.be.equal(feature.scenarios[1].id);
        expect(feature.scenarios[1].nextScenarioId).to.be.equal(feature.scenarios[2].id);
        expect(feature.scenarios[2].nextScenarioId).to.be.equal(feature.scenarios[3].id);
        expect(feature.scenarios[3].nextScenarioId).to.be.equal(undefined);
    });

    describe("Gherkin keywords inside text (issue #9)", () => {
        Then("the page title is {string}", async (title: string) => { });
        Given("the user reads {string}", async (text: string) => { });
        When("the user types {string} into the field", async (text: string) => { });

        loadStepDefinitions({});

        it("should not split a scenario on a keyword inside a step", () => {
            const feature = loadFeature(`
            Feature: Keywords in steps
                Scenario: Titles
                    Then the page title is "Scenario: test"
                    And the user reads "Background: none"
                    And the user reads "Scenario Outline: maybe"
            `);

            expect(feature.scenarios.length).to.be.equal(1);
            expect(feature.backgroundSteps.length).to.be.equal(0);
            expect(feature.scenarios[0].steps.map(e => e.name)).to.deep.equal([
                `the page title is "Scenario: test"`,
                `the user reads "Background: none"`,
                `the user reads "Scenario Outline: maybe"`
            ]);
        });

        it("should keep a keyword inside the feature description as text", () => {
            const feature = loadFeature(`
            Feature: Keywords in description
                Login. Background: users must exist.
                Scenario: S
                    Then the page title is "Home"
            `);

            expect(feature.description).to.be.equal("Login. Background: users must exist.");
            expect(feature.backgroundSteps.length).to.be.equal(0);
            expect(feature.scenarios.length).to.be.equal(1);
        });

        it("should not treat 'Examples:' inside a step of an outline as the examples table", () => {
            const feature = loadFeature(`
            Feature: Keywords in outline
                Scenario Outline: Typing
                    When the user types "Examples: <text>" into the field

                    Examples:
                    | text |
                    | a    |
                    | b    |
            `);

            expect(feature.scenarios.map(e => e.steps[0].name)).to.deep.equal([
                `the user types "Examples: a" into the field`,
                `the user types "Examples: b" into the field`
            ]);
        });

        it("should read the feature name from files with a byte order mark and Windows line endings", () => {
            const content = "\uFEFFFeature: With BOM\r\n    Description\r\n    Scenario: S\r\n        Then the page title is \"x\"\r\n";
            const feature = loadFeature(content);

            expect(feature.name).to.be.equal("With BOM");
            expect(feature.description).to.be.equal("Description");
            expect(feature.scenarios.length).to.be.equal(1);
        });

        it("should still recognise lowercase keywords at the start of a line", () => {
            const feature = loadFeature(`
            feature: Lowercase
                background:
                    Given the user reads "x"
                scenario: S
                    Then the page title is "y"
            `);

            expect(feature.name).to.be.equal("Lowercase");
            expect(feature.backgroundSteps.length).to.be.equal(1);
            expect(feature.scenarios.length).to.be.equal(1);
        });
    });
});