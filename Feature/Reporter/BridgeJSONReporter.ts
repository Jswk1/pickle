import { IRunnerOptions } from "../../Options";
import { FsAsync } from "../../Utils/FsAsync";
import { Log } from "../../Utils/Log";
import { OutcomeStatus, IFeatureOutcome } from "../Executor";
import * as Path from "path";

export interface IStepReport {
    name: string,
    status: OutcomeStatus,
    filePath: string,
    durationMs: number,
    errorStack: string
}

export interface IScenarioReport {
    status: OutcomeStatus,
    name: string,
    steps: IStepReport[]
}

export interface IFeatureReport {
    name: string;
    description: string;
    featureFileContent: string
    statusCount: {
        ok: number,
        error: number,
        warning: number,
        skipped: number
    }
    scenarios: IScenarioReport[]
}

export async function reportFeatureToBridgeJSON(featureOutcome: IFeatureOutcome, options: IRunnerOptions) {
    const count: {
        [key: number]: number
    } = {
        [OutcomeStatus.Ok]: 0,
        [OutcomeStatus.Error]: 0,
        [OutcomeStatus.Warning]: 0,
        [OutcomeStatus.Skipped]: 0
    };

    const featureContent = await FsAsync.readFile(options.featureFullPath)

    const report: IFeatureReport = {
        name: featureOutcome.feature.name,
        description: featureOutcome.feature.description,
        featureFileContent: featureContent,
        statusCount: {
            ok: 0,
            error: 0,
            warning: 0,
            skipped: 0
        },
        scenarios: [],
    }

    let totalDurationMs = 0;

    for (const scenarioOutcome of featureOutcome.scenarioOutcomes) {
        const reportScenario: IScenarioReport = {
            status: OutcomeStatus.Ok,
            name: scenarioOutcome.scenario.name,
            steps: []
        }

        for (const stepOutcome of scenarioOutcome.stepOutcomes) {
            totalDurationMs += stepOutcome.durationMs;
            count[stepOutcome.status]++;

            const reportScenarioStep: IStepReport = {
                name: `${stepOutcome.step.keyword} ${stepOutcome.step.name}`,
                status: stepOutcome.status,
                filePath: stepOutcome.step.definition.filePath,
                durationMs: stepOutcome.durationMs,
                errorStack: stepOutcome.error.stack
            }

            if (stepOutcome.status === OutcomeStatus.Error)
                reportScenario.status = OutcomeStatus.Error;

            reportScenario.steps.push(reportScenarioStep);
        }

        report.scenarios.push(reportScenario);
    }

    report.statusCount = {
        ok: count[OutcomeStatus.Ok],
        error: count[OutcomeStatus.Error],
        warning: count[OutcomeStatus.Warning],
        skipped: count[OutcomeStatus.Skipped]
    }

    const json = JSON.stringify(report);
    const outFullPath = Path.normalize(options.bridgeJSONOutputPath);

    Log.info(`Writing BridgeJSON output to: ${outFullPath}`);

    await FsAsync.mkdir(Path.dirname(outFullPath), { recursive: true });
    await FsAsync.writeFile(outFullPath, json);
}