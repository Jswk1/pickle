

import { argv } from "process";
import * as Path from "path";
import "./Step/Expression";
import { executeFeature, OutcomeStatus } from "./Feature/Executor";
import { loadFeature } from "./Feature/Loader";
import { queryFiles } from "./Utils/QueryFiles";
import { Log } from "./Utils/Log";
import { ReporterType, reportFeature } from "./Feature/Reporter/Factory";

export interface IRunnerOptions {
    path: string;
    featureName: string;
    headless?: boolean;
    jUnitXmlOutputPath?: string;
}

function parseArgs(): IRunnerOptions {
    const options: IRunnerOptions = { path: null, featureName: null };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const nextArg = argv[i + 1]; // It's argument value most of the time

        if (["-r", "--require"].some(e => e === arg)) {
            if (!nextArg?.length)
                throw new Error(`[Arg '${arg}'] Expected path.`);

            options.path = nextArg;
            continue;
        }

        if (["-j", "--junit"].some(e => e === arg)) {
            if (!nextArg?.length)
                throw new Error(`[Arg '${arg}'] Expected output xml path.`);

            options.jUnitXmlOutputPath = nextArg;
            continue;
        }

        // Is last argument
        if (i === argv.length - 1) {
            if (!arg.endsWith(".feature"))
                throw new Error("Expected feature name.");

            options.featureName = arg;
        }
    }

    if (!options.path)
        throw new Error("Path to step definitions is required. (-r, --require <path> parameter)");

    if (!options.featureName)
        throw new Error("Feature name is required. (last parameter)");

    return options;
}

export default async function execute() {
    try {
        const options = parseArgs();

        const stepDefinitionFiles = await queryFiles(options.path);
        const executionDirectory = process.cwd();

        for (const file of stepDefinitionFiles) {
            const fullPath = Path.join(executionDirectory, file);
            require(fullPath);
        }

        Log.info(`${stepDefinitionFiles.length} files loaded.`);

        const featureFileFullPath = Path.join(executionDirectory, options.featureName);
        const feature = await loadFeature(featureFileFullPath);
        const featureOutcome = await executeFeature(feature);

        /** Report results */
        await reportFeature(ReporterType.Stdout, featureOutcome, options);

        if (options.jUnitXmlOutputPath)
            await reportFeature(ReporterType.JUnit, featureOutcome, options);

        process.exit(featureOutcome.status === OutcomeStatus.Ok ? 0 : 1);
    } catch (ex) {
        Log.error(ex);
        process.exit(1);
    }
}

export { defineStep } from "./Step/Step";
export { defineExpression } from "./Step/Expression";