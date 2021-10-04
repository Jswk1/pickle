import { Log, LogColor } from "../Utils/Log";
import { IFeatureOutcome, OutcomeStatus } from "./Executor";

function statusToColor(status: OutcomeStatus) {
    switch (status) {
        case OutcomeStatus.Ok:
            return LogColor.FgGreen;
        case OutcomeStatus.Warning:
            return LogColor.FgYellow;
        case OutcomeStatus.Error:
            return LogColor.FgRed;
        case OutcomeStatus.Skipped:
            return LogColor.FgWhite
    }
}

function statusToSymbol(status: OutcomeStatus) {
    switch (status) {
        case OutcomeStatus.Ok:
            return Log.color(LogColor.FgGreen, "✔");
        case OutcomeStatus.Warning:
            return Log.color(LogColor.FgYellow, "⚠");
        case OutcomeStatus.Error:
            return Log.color(LogColor.FgRed, "✘");
        case OutcomeStatus.Skipped:
            return Log.color(LogColor.FgWhite, "?");
    }
}

export async function reportFeature(featureOutcome: IFeatureOutcome) {
    console.log("\n\n");
    Log.info(Log.color(LogColor.FgWhite, `=====${"=".repeat(featureOutcome.feature.name.length)}=====`));
    Log.info(Log.color(LogColor.FgWhite, `====== ${featureOutcome.feature.name} ======`));
    Log.info(Log.color(LogColor.FgWhite, `=====${"=".repeat(featureOutcome.feature.name.length)}=====`));

    for (const scenarioOutcome of featureOutcome.scenarioOutcomes) {
        Log.info(`  ${statusToSymbol(scenarioOutcome.status)} ${scenarioOutcome.scenario.name}`);
        const count: { [key: number]: number } = { [OutcomeStatus.Ok]: 0, [OutcomeStatus.Error]: 0, [OutcomeStatus.Warning]: 0, [OutcomeStatus.Skipped]: 0 };

        for (const stepOutcome of scenarioOutcome.stepOutcomes) {
            count[stepOutcome.status]++;
            Log.info(`    ${statusToSymbol(stepOutcome.status)} ${stepOutcome.step.name}`);
            if (stepOutcome.status === OutcomeStatus.Error)
                Log.error(`        Error: ${stepOutcome.error}`);

        }

        const total = Object.values(count).reduce((p, c) => p + c, 0);
        const percentage = count[OutcomeStatus.Ok] * 100 / total;
        Log.info(`Summary: ${count[OutcomeStatus.Ok]}/${total} (${Math.round(percentage)}%)`)

        console.log("\n\n");
    }
}