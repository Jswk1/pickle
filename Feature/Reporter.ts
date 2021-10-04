import { Log } from "../Utils/Log";
import { IFeatureOutcome, OutcomeStatus } from "./Executor";

export async function reportFeature(featureOutcome: IFeatureOutcome) {
    Log.info("");
    Log.info(`== ${featureOutcome.feature.name} ==`);
    for (const scenarioOutcome of featureOutcome.scenarioOutcomes) {
        const count: { [key: number]: number } = { [OutcomeStatus.Ok]: 0, [OutcomeStatus.Error]: 0, [OutcomeStatus.Warning]: 0, [OutcomeStatus.Skipped]: 0 };
        for (const step of scenarioOutcome.stepOutcomes)
            count[step.status]++;

        Log.info(`  - ${scenarioOutcome.scenario.name}`);
        Log.info(`      - Ok: ${count[OutcomeStatus.Ok]}`);
        Log.info(`      - Error: ${count[OutcomeStatus.Error]}`);
        Log.info(`      - Skipped: ${count[OutcomeStatus.Skipped]}`);

        const total = Object.values(count).reduce((p, c) => p + c, 0);
        Log.info(`      - Summary: ${count[OutcomeStatus.Ok]}/${total}`);

        if (featureOutcome.error)
            Log.info(featureOutcome.error);
    }
}