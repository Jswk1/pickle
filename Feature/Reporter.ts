import { IFeatureOutcome, OutcomeStatus } from "./Executor";

export async function reportFeature(featureOutcome: IFeatureOutcome) {
    console.log("");
    console.log(`== ${featureOutcome.feature.name} ==`);
    for (const scenarioOutcome of featureOutcome.scenarioOutcomes) {
        const count: { [key: number]: number } = { [OutcomeStatus.Ok]: 0, [OutcomeStatus.Error]: 0, [OutcomeStatus.Warning]: 0, [OutcomeStatus.Skipped]: 0 };
        for (const step of scenarioOutcome.stepOutcomes)
            count[step.status]++;

        console.log(`  - ${scenarioOutcome.scenario.name}`);
        console.log(`      - Ok: ${count[OutcomeStatus.Ok]}`);
        console.log(`      - Error: ${count[OutcomeStatus.Error]}`);
        console.log(`      - Skipped: ${count[OutcomeStatus.Skipped]}`);

        const total = Object.values(count).reduce((p, c) => p + c, 0);
        console.log(`      - Summary: ${count[OutcomeStatus.Ok]}/${total}`);

        if (featureOutcome.error)
            console.log(featureOutcome.error);
    }
}