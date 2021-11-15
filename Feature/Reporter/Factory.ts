import { IRunnerOptions } from "../../Options";
import { IFeatureOutcome } from "../Executor";
import { reportFeatureToJUnitXml } from "./JUnitReporter";
import { reportFeatureToStdout } from "./StdoutReporter";

export enum ReporterType {
    Stdout = 0,
    JUnit = 1
}

export async function reportFeature(type: ReporterType, featureOutcome: IFeatureOutcome, options: IRunnerOptions) {
    switch (type) {
        case ReporterType.Stdout:
            await reportFeatureToStdout(featureOutcome);
            break;
        case ReporterType.JUnit:
            await reportFeatureToJUnitXml(featureOutcome, options);
            break;
        default:
            throw new Error("Reporter type not supported.");
    }
}