
import { argv } from "process";
import * as Path from "path";
import "./Step/Expression";
import "./Step/Step";
import "./Utils/Array";
import { executeFeature, OutcomeStatus } from "./Feature/Executor";
import { loadFeature } from "./Feature/Loader";
import { queryFiles } from "./Utils/QueryFiles";
import { Log } from "./Utils/Log";
import { ReporterType, reportFeature } from "./Feature/Reporter/Factory";
import { startDebugger } from "./Debugger/Server";

export interface IRunnerOptions {
    scriptsPath: string;
    featurePath: string;
    jUnitXmlOutputPath?: string;
    logOutputPath?: string;
    debug?: boolean;
    debugPort?: number;
    featureFullPath?: string;
}

function parseArgs(): IRunnerOptions {
    const options: IRunnerOptions = { scriptsPath: null, featurePath: null };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const nextArg = argv[i + 1]; // It's argument value most of the time

        switch (arg) {
            case "-r":
            case "--require":
                if (!nextArg?.length)
                    throw new Error(`[Arg '${arg}'] Expected path.`);

                options.scriptsPath = nextArg;
                break;
            case "-j":
            case "--junit":
                if (!nextArg?.length)
                    throw new Error(`[Arg '${arg}'] Expected output xml path.`);

                options.jUnitXmlOutputPath = nextArg;
                break;
            case "-o":
            case "--output":
                if (!nextArg?.length)
                    throw new Error(`[Arg '${arg}'] Expected output log path.`);

                options.logOutputPath = nextArg;
            case "-d":
            case "--debug":
                if (nextArg && !isNaN(Number(nextArg)))
                    options.debugPort = Number(nextArg);

                options.debug = true;
                break;
        }

        // Is last argument
        if (i === argv.length - 1) {
            if (!arg.endsWith(".feature"))
                throw new Error("Expected feature name.");

            options.featurePath = arg;
            break;
        }
    }

    if (!options.scriptsPath)
        throw new Error("Path to step definitions is required. (-r, --require <path> parameter)");

    if (!options.featurePath)
        throw new Error("Feature name is required. (last parameter)");

    return options;
}

export default async function execute(options?: IRunnerOptions) {
    try {
        const runnerOptions = options || parseArgs();

        const stepDefinitionFiles = await queryFiles(runnerOptions.scriptsPath);
        const executionDirectory = process.cwd();

        for (const file of stepDefinitionFiles) {
            const fullPath = Path.isAbsolute(file) ? file : Path.join(executionDirectory, file);
            require(fullPath);
        }

        Log.info(`${stepDefinitionFiles.length} files loaded.`);

        const featureFullPath = Path.isAbsolute(runnerOptions.featurePath) ? runnerOptions.featurePath : Path.join(executionDirectory, runnerOptions.featurePath);
        runnerOptions.featureFullPath = featureFullPath;
        const feature = await loadFeature(featureFullPath);

        if (runnerOptions.debug) {
            startDebugger(runnerOptions.debugPort || 3001, feature, runnerOptions);
        } else {
            const featureOutcome = await executeFeature(feature);

            /** Report results */
            await reportFeature(ReporterType.Stdout, featureOutcome, runnerOptions);

            if (runnerOptions.jUnitXmlOutputPath)
                await reportFeature(ReporterType.JUnit, featureOutcome, runnerOptions);

            if (runnerOptions.logOutputPath)
                await Log.save(runnerOptions.logOutputPath);

            process.exit(featureOutcome.status === OutcomeStatus.Ok ? 0 : 1);
        }
    } catch (ex) {
        Log.error(ex);
        process.exit(1);
    }
}

export { execute };
export { defineStep } from "./Step/Step";
export { defineExpression } from "./Step/Expression";