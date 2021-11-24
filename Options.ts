import { argv } from "process";

export interface IRunnerOptions {
    scriptsPath: string;
    featurePath: string;
    jUnitXmlOutputPath?: string;
    logOutputPath?: string;
    debug?: boolean;
    debugPort?: number;

    featureFullPath?: string;
    requiredFilePaths?: string[];
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
    }

    if (!options.scriptsPath)
        throw new Error("Path to step definitions is required. (-r, --require <path> parameter)");

    if (!options.featurePath)
        throw new Error("Feature file path is required.");

    return options;
}