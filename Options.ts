import { argv } from "process";

export interface IRunnerOptions {
    scriptsPath?: string;
    featurePath?: string;
    jUnitXmlOutputPath?: string;
    bridgeJSONOutputPath?: string;
    logOutputPath?: string;
    debug?: boolean;
    debugPort?: number;
    watchForChanges?: boolean;
    warnForDuplicatedSteps?: boolean;

    featureFullPath?: string;

    killOnFinish?: boolean;
}

export function parseArgs(): IRunnerOptions {
    const options: IRunnerOptions = { scriptsPath: null, featurePath: null };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const nextArg = argv[i + 1]; // It's argument value most of the time

        if (!options.featurePath && /["']?(.*\.feature)["']?/.test(arg))
            options.featurePath = arg;

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
                    throw new Error(`[Arg '${arg}'] Expected output file path.`);

                options.jUnitXmlOutputPath = nextArg;
                break;
            case "-o":
            case "--output":
                if (!nextArg?.length)
                    throw new Error(`[Arg '${arg}'] Expected output log path.`);

                options.logOutputPath = nextArg;
                break;
            case "--bridge-json":
                if (!nextArg?.length)
                    throw new Error(`[Arg '${arg}'] Expected output file path.`);

                options.bridgeJSONOutputPath = nextArg;
                break;
            case "-d":
            case "--debug":
                if (nextArg && !isNaN(Number(nextArg)))
                    options.debugPort = Number(nextArg);

                options.debug = true;
                break;

            case "-w":
                options.watchForChanges = true;
                break;

            case "--dont-kill":
                options.killOnFinish = false;
                break;

            case "--duplicate-warn":
                options.warnForDuplicatedSteps = true;
                break;
            case "--trace-size":
                if (!nextArg?.length)
                    throw new Error(`[Arg '${arg}'] Expected trace size.`);
                Error.stackTraceLimit = Number(nextArg);
                break;
        }
    }

    if (!options.scriptsPath)
        throw new Error("Path to step definitions is required. (-r, --require <path> parameter)");

    if (!options.featurePath)
        throw new Error("Feature file path is required.");

    return options;
}