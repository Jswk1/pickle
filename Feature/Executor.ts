import { extractVariables } from "../Step/Expression";
import { IStep } from "../Step/Step";
import { IScenario, IFeature } from "./Loader";

export enum OutcomeStatus {
    Ok = 1,
    Warning = 2,
    Error = 4,
    Skipped = 8
}

interface IStepOutcome {
    step: IStep;
    status: OutcomeStatus;
    error?: Error;
}

interface IScenarioOutcome {
    scenario: IScenario;
    status: OutcomeStatus;
    stepOutcomes: IStepOutcome[];
}

export interface IFeatureOutcome {
    feature: IFeature;
    status: OutcomeStatus;
    scenarioOutcomes: IScenarioOutcome[];
    error?: Error;
}

async function runWithTimeout(timeoutMS: number, runFn: () => Promise<any>, onTimeoutError: string) {
    return new Promise((resolve, reject) => {
        runFn().then(resolve).catch(reject);

        setTimeout(() => reject(onTimeoutError), timeoutMS);
    });
}

export async function executeFeature(feature: IFeature) {
    const context = { variables: {} };
    const featureOutcome: IFeatureOutcome = {
        feature,
        status: OutcomeStatus.Ok,
        scenarioOutcomes: []
    }

    console.log(`=================================`);
    console.log(`Feature: ${feature.name}`);
    console.log(`=================================`);

    for (let i = 0; i < feature.scenarios.length; i++) {
        const scenario = feature.scenarios[i];
        const scenarioOutcome: IScenarioOutcome = {
            scenario,
            status: OutcomeStatus.Ok,
            stepOutcomes: []
        }

        featureOutcome.scenarioOutcomes.push(scenarioOutcome);

        console.log(`  - Scenario: ${scenario.name}`);
        const stepList: IStep[] = [...feature.backgroundSteps, ...scenario.steps];

        for (let j = 0; j < stepList.length; j++) {
            const step = stepList[j];
            const stepOutcome: IStepOutcome = {
                step,
                status: OutcomeStatus.Ok
            };

            scenarioOutcome.stepOutcomes.push(stepOutcome);

            const variables = extractVariables(step);
            console.log(`     - Step: ${step.description}`);

            const { timeoutMS } = step.definition.options;
            try {
                await runWithTimeout(timeoutMS, async () => {
                    await step.definition.cb.apply(context, variables);
                }, `Timeout after ${timeoutMS} milliseconds.`);
            } catch (ex) {
                featureOutcome.status = scenarioOutcome.status = stepOutcome.status = OutcomeStatus.Error;
                featureOutcome.error = stepOutcome.error = ex;

                /** Skip remaining steps */
                stepList.slice(j + 1).forEach(e => scenarioOutcome.stepOutcomes.push({
                    status: OutcomeStatus.Skipped,
                    step: e
                }));

                break;
            }
        }
    }

    return featureOutcome;
}