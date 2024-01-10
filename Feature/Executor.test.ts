import { expect } from "chai";
import { beforeStep, Given, Then, When } from "../Runner";
import { afterStep, loadStepDefinitions } from "../Step/Step";
import { executeFeature, executeStep, OutcomeStatus } from "./Executor";
import { loadFeature } from "./Loader";

describe("executor tests", async () => {
    const featureContent = `
    Feature: Executor Test
        Background:
            Given initial data

        Scenario: First Scenario
            When "first" scenario is tested
            Then it is completed succesfully

        Scenario: Second Scenario
            When "second" scenario is tested
            Then it will fail
            And this step will be skipped

        Scenario: Third Scenario
            When "third" scenario is tested
            Then it will timeout

        Scenario: Fourth Scenario
            When "fourth" scenario is tested
    `;

    Given("initial data", { timeout: 1000 }, function () {
        this.variables.initialData = { a: 1, b: "test", c: new Date() };
    });

    When("{string} scenario is tested", { timeout: 1000 }, function (scenario: string) {
        this.variables.scenario = scenario;
    });

    Then("it is completed succesfully", { timeout: 1000 }, function () {
        expect(this.variables.scenario).to.be.equal("first");
    });

    Then("it will fail", { timeout: 1000 }, function () {
        throw new Error("It failed.");
    });

    Then("this step will be skipped", { timeout: 1000 }, function () {
        throw new Error("It is skipped indeed. It would fail here if it wasn't.");
    });

    Then("it will timeout", { timeout: 10 }, async function () {
        await new Promise((resolve) => setTimeout(resolve, 100));
    });

    loadStepDefinitions({});

    const feature = loadFeature(featureContent);

    describe("executeStep", () => {
        it("should execute steps individually", async () => {
            // First scenario -> Then it is completed succesfully
            const outcome1 = await executeStep(feature.scenarios[0], feature.scenarios[0].steps[1], { variables: { scenario: "first" } });
            expect(outcome1.step.name).to.be.equal("it is completed succesfully");
            expect(outcome1.status).to.be.equal(OutcomeStatus.Ok);

            // Second scenario -> Then it will fail
            const outcome2 = await executeStep(feature.scenarios[1], feature.scenarios[1].steps[1], { variables: {} });
            expect(outcome2.step.name).to.be.equal("it will fail");
            expect(outcome2.status).to.be.equal(OutcomeStatus.Error);
            expect(outcome2.error.message).to.be.equal("It failed.");
        });

        it("should run beforeStep hook", async () => {
            beforeStep((scenario, step) => {
                throw new Error("boom");
            });

            // Fourth scenario -> It will explode due to beforeStep hook
            const outcome1 = await executeStep(feature.scenarios[3], feature.scenarios[3].steps[0], { variables: { scenario: "fourth" } });
            expect(outcome1.step.name).to.be.equal('"fourth" scenario is tested');
            expect(outcome1.status).to.be.equal(OutcomeStatus.Error);

            beforeStep(null);
        });

        it("should run afterStep hook", async () => {
            beforeStep((scenario, step) => {
                throw new Error("boom");
            });

            afterStep((scenario, step, outcome) => {
                outcome.status = OutcomeStatus.Ok;
            });

            // Fourth scenario -> It will explode due to beforeStep hook but it will be updated to OK in afterStep
            const outcome1 = await executeStep(feature.scenarios[3], feature.scenarios[3].steps[0], { variables: { scenario: "fourth" } });

            expect(outcome1.step.name).to.be.equal('"fourth" scenario is tested');
            expect(outcome1.status).to.be.equal(OutcomeStatus.Ok);

            beforeStep(null);
            afterStep(null);
        });
    });

    describe("executeFeature", () => {
        it("should execute the feature", async () => {
            const outcome = await executeFeature(feature);

            expect(outcome.feature).to.be.equal(feature);
            expect(typeof outcome.status).to.be.equal("number");
            expect(typeof outcome.scenarioOutcomes).to.be.equal("object");
        });

        it("should execute the feature with error status", async () => {
            const outcome = await executeFeature(feature);

            expect(outcome.status).to.be.equal(OutcomeStatus.Error);
            expect(outcome.error.message).to.be.equal("Timeout after 10 milliseconds.");
        });

        it("should complete the first scenario", async () => {
            const outcome = await executeFeature(feature);

            expect(outcome.scenarioOutcomes[0].scenario.name).to.be.equal("First Scenario");
            expect(outcome.scenarioOutcomes[0].status).to.be.equal(OutcomeStatus.Ok);
            expect(outcome.scenarioOutcomes[0].stepOutcomes.length).to.be.equal(3);

            expect(outcome.scenarioOutcomes[0].stepOutcomes[0].status).to.be.equal(OutcomeStatus.Ok);
            expect(outcome.scenarioOutcomes[0].stepOutcomes[1].status).to.be.equal(OutcomeStatus.Ok);
            expect(outcome.scenarioOutcomes[0].stepOutcomes[2].status).to.be.equal(OutcomeStatus.Ok);
        });

        it("should fail the second scenario", async () => {
            const outcome = await executeFeature(feature);

            expect(outcome.scenarioOutcomes[1].scenario.name).to.be.equal("Second Scenario");
            expect(outcome.scenarioOutcomes[1].status).to.be.equal(OutcomeStatus.Error);
            expect(outcome.scenarioOutcomes[1].stepOutcomes.length).to.be.equal(4);

            expect(outcome.scenarioOutcomes[1].stepOutcomes[0].status).to.be.equal(OutcomeStatus.Ok);
            expect(outcome.scenarioOutcomes[1].stepOutcomes[1].status).to.be.equal(OutcomeStatus.Ok);
            expect(outcome.scenarioOutcomes[1].stepOutcomes[2].status).to.be.equal(OutcomeStatus.Error);
            expect(outcome.scenarioOutcomes[1].stepOutcomes[2].error.message).to.be.equal("It failed.");
            expect(outcome.scenarioOutcomes[1].stepOutcomes[3].status).to.be.equal(OutcomeStatus.Skipped);
        });

        it("should timeout at the third scenario", async () => {
            const outcome = await executeFeature(feature);

            expect(outcome.scenarioOutcomes[2].scenario.name).to.be.equal("Third Scenario");
            expect(outcome.scenarioOutcomes[2].status).to.be.equal(OutcomeStatus.Error);
            expect(outcome.scenarioOutcomes[2].stepOutcomes.length).to.be.equal(3);

            expect(outcome.scenarioOutcomes[2].stepOutcomes[0].status).to.be.equal(OutcomeStatus.Ok);
            expect(outcome.scenarioOutcomes[2].stepOutcomes[1].status).to.be.equal(OutcomeStatus.Ok);
            expect(outcome.scenarioOutcomes[2].stepOutcomes[2].status).to.be.equal(OutcomeStatus.Error);
            expect(outcome.scenarioOutcomes[2].stepOutcomes[2].error.message).to.be.equal("Timeout after 10 milliseconds.");
        });
    });
});