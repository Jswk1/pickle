import { extractVariables } from "../Step/Expression";
import { afterFeatureFn, afterScenarioFn, afterStepFn, beforeFeatureFn, beforeScenarioFn, beforeStepFn, IStep, TContext } from "../Step/Step";
import { performance } from "perf_hooks";
import { IScenario, IFeature } from "./Loader";

export enum OutcomeStatus {
    Ok = 1,
    Warning = 2,
    Error = 4,
    Skipped = 8
}

export interface IStepOutcome {
    step: IStep;
    status: OutcomeStatus;
    error?: Error;
    durationMs: number;
}

export interface IScenarioOutcome {
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

        setTimeout(() => reject(new Error(onTimeoutError)), timeoutMS);
    });
}

export async function executeStep(scenario: IScenario, step: IStep, context: TContext) {
    const variables = extractVariables(step);

    const stepOutcome: IStepOutcome = {
        step,
        status: OutcomeStatus.Ok,
        durationMs: 0
    };

    const { timeout } = step.definition.options;

    const startTime = performance.now();
    try {
        if (typeof beforeStepFn === "function")
            await beforeStepFn(scenario, step);

        await runWithTimeout(timeout, async () => {
            await step.definition.cb.call(context, ...variables);
        }, `Timeout after ${timeout} milliseconds.`);
    } catch (ex) {
        stepOutcome.status = OutcomeStatus.Error;
        stepOutcome.error = ex;
    } finally {
        const finishTime = performance.now();
        stepOutcome.durationMs = Math.round(finishTime - startTime);

        if (typeof afterStepFn === "function")
            await afterStepFn(scenario, step, stepOutcome);

        return stepOutcome;
    }
}

export async function executeFeature(feature: IFeature) {
    const featureOutcome: IFeatureOutcome = {
        feature,
        status: OutcomeStatus.Ok,
        scenarioOutcomes: []
    }

    if (typeof beforeFeatureFn === "function")
        await beforeFeatureFn(feature);

    for (let i = 0; i < feature.scenarios.length; i++) {
        const context = { variables: {} };
        const scenario = feature.scenarios[i];
        const scenarioOutcome: IScenarioOutcome = {
            scenario,
            status: OutcomeStatus.Ok,
            stepOutcomes: []
        }

        featureOutcome.scenarioOutcomes.push(scenarioOutcome);

        const stepList: IStep[] = [...feature.backgroundSteps, ...scenario.steps];

        if (typeof beforeScenarioFn === "function")
            await beforeScenarioFn(scenario);

        for (let j = 0; j < stepList.length; j++) {
            const step = stepList[j];

            console.log("Executing - Scenario: " + scenario.name + ` Step (${j + 1}/${stepList.length}): ` + step.name);

            const stepOutcome = await executeStep(scenario, step, context);
            scenarioOutcome.stepOutcomes.push(stepOutcome);

            if (stepOutcome.status === OutcomeStatus.Error) {
                featureOutcome.status = scenarioOutcome.status = OutcomeStatus.Error;
                featureOutcome.error = stepOutcome.error;

                /** Skip remaining steps */
                stepList.slice(j + 1).forEach(e => scenarioOutcome.stepOutcomes.push({
                    status: OutcomeStatus.Skipped,
                    step: e,
                    durationMs: 0
                }));

                break;
            }
        }

        if (typeof afterScenarioFn === "function")
            await afterScenarioFn(scenario, scenarioOutcome);
    }

    if (typeof afterFeatureFn === "function")
        await afterFeatureFn(feature, featureOutcome);

    return featureOutcome;
}