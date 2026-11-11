import { argv } from "process";

export interface IRunnerOptions {
    scriptsPath?: string;
    featurePath?: string;
    jUnitXmlOutputPath?: string;
    bridgeJSONOutputPath?: string;
    bridgeJSONArea?: string;
    logOutputPath?: string;
    debug?: boolean;
    debugPort?: number;
    warnForDuplicatedSteps?: boolean;

    featureFullPath?: string;

    killOnFinish?: boolean;

    /** Build a step map next to every feature matched by featurePath (a glob) instead of running tests. */
    buildStepMaps?: boolean;
    /** Glob of step files that are loaded for every feature (hooks, expressions, shared setup). Required with buildStepMaps. */
    alwaysLoadPath?: string;
    /** Load the feature's step map and only the step files it lists (in addition to scriptsPath). */
    useStepMap?: boolean;
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
                case "--bridge-json-area":
                    if (!nextArg?.length)
                        throw new Error(`[Arg '${arg}'] Expected area name.`);
    
                    options.bridgeJSONArea = nextArg;
                    break;                
            case "-d":
            case "--debug":
                if (nextArg && !isNaN(Number(nextArg)))
                    options.debugPort = Number(nextArg);

                options.debug = true;
                break;

            case "--dont-kill":
                options.killOnFinish = false;
                break;

            case "--duplicate-warn":
                options.warnForDuplicatedSteps = true;
                break;
            case "--build-step-maps":
                options.buildStepMaps = true;
                break;
            case "--always":
                if (!nextArg?.length)
                    throw new Error(`[Arg '${arg}'] Expected path.`);

                options.alwaysLoadPath = nextArg;
                break;
            case "--use-step-map":
                options.useStepMap = true;
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

    if (options.buildStepMaps && !options.alwaysLoadPath)
        throw new Error("--build-step-maps requires --always <glob> (step files loaded for every feature).");

    if (options.buildStepMaps && options.useStepMap)
        throw new Error("--build-step-maps and --use-step-map cannot be used together.");

    if (options.useStepMap && options.debug)
        throw new Error("--use-step-map cannot be used with --debug; the debugger needs all step files loaded.");

    return options;
}