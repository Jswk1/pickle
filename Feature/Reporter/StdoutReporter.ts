import { Log, LogColor } from "../../Utils/Log";
import { logDuration } from "../../Utils/Time";
import { IFeatureOutcome, OutcomeStatus } from "../Executor";

function statusToSymbol(status: OutcomeStatus) {
    switch (status) {
        case OutcomeStatus.Ok:
            return "✔";
        case OutcomeStatus.Warning:
            return "⚠";
        case OutcomeStatus.Error:
            return "✘";
        case OutcomeStatus.Skipped:
            return "?";
    }
}

function statusToColor(status: OutcomeStatus) {
    switch (status) {
        case OutcomeStatus.Ok:
            return LogColor.FgGreen;
        case OutcomeStatus.Warning:
            return LogColor.FgYellow;
        case OutcomeStatus.Error:
            return LogColor.FgRed;
        case OutcomeStatus.Skipped:
            return LogColor.FgYellow;
    }
}

export async function reportFeatureToStdout(featureOutcome: IFeatureOutcome) {
    console.log();

    Log.info("Feature: " + featureOutcome.feature.name);

    let count: { [key: number]: number } = { [OutcomeStatus.Ok]: 0, [OutcomeStatus.Error]: 0, [OutcomeStatus.Warning]: 0, [OutcomeStatus.Skipped]: 0 };
    let totalDurationMs = 0;
    for (let i = 0; i < featureOutcome.scenarioOutcomes.length; i++) {
        const scenarioOutcome = featureOutcome.scenarioOutcomes[i];

        const isLastScenario = i === featureOutcome.scenarioOutcomes.length - 1;
        const scenarioSymbol = isLastScenario ? "└" : "├";
        const scenarioColor = statusToColor(scenarioOutcome.status);
        const featureSymbol = isLastScenario ? " " : "│";

        Log.info("│")
        Log.info(scenarioSymbol + "─ " + Log.color(scenarioColor, statusToSymbol(scenarioOutcome.status) + " Scenario: " + scenarioOutcome.scenario.name));

        for (let j = 0; j < scenarioOutcome.stepOutcomes.length; j++) {
            const stepOutcome = scenarioOutcome.stepOutcomes[j];
            const stepColor = statusToColor(stepOutcome.status);
            const isLastStep = j === scenarioOutcome.stepOutcomes.length - 1;
            const stepSymbol = isLastStep ? "└" : "├";

            totalDurationMs += stepOutcome.durationMs;
            count[stepOutcome.status]++;

            Log.info(featureSymbol
                + "  "
                + Log.color(stepColor, stepSymbol + "─ " + statusToSymbol(stepOutcome.status))
                + " "
                + Log.color(LogColor.FgBlue, stepOutcome.step.keyword)
                + " " + Log.color(stepColor, stepOutcome.step.name)
                + " " + Log.color(LogColor.FgYellow, logDuration(stepOutcome.durationMs))
                + " " + Log.color(LogColor.FgWhite, stepOutcome.step.definition.filePath));

            if (stepOutcome.status === OutcomeStatus.Error) {
                for (const stack of stepOutcome.error.stack.split("\n"))
                    Log.info(featureSymbol + "  " + Log.color(LogColor.FgRed, "│ " + stack));
            }
        }
    }

    const total = Object.values(count).reduce((p, c) => p + c, 0);
    const percentage = count[OutcomeStatus.Ok] * 100 / total;
    const resultString = `Test result: ${count[OutcomeStatus.Ok]}/${total} (${Math.round(percentage)}%) ${logDuration(totalDurationMs)}`;
    Log.info(Log.color(LogColor.Underscore, "_".repeat(resultString.length)));
    Log.info(resultString);
}