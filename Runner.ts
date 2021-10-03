

import { argv } from "process";
import * as Path from "path";
import { queryFiles } from "./QueryFiles";
import { loadedSteps } from "./Step";
import { loadFeature } from "./FeatureLoader";
import "./StepExpression";

interface IOptions {
    path: string;
    featureName: string;
}

function parseArgs(): IOptions {
    const options: IOptions = { path: null, featureName: null };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const nextArg = argv[i + 1]; // It's argument value most of the time

        if (["-r", "--require"].some(e => e === arg)) {
            if (!nextArg?.length)
                throw new Error(`[Arg '${arg}'] Expected path.`);

            options.path = nextArg;
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

async function execute() {
    const options = parseArgs();

    const stepDefinitionFiles = await queryFiles(options.path);
    const executionDirectory = process.cwd();

    for (const file of stepDefinitionFiles) {
        const fullPath = Path.join(executionDirectory, file);
        console.log(`Loading file: ${fullPath}`);
        require(fullPath);
    }

    console.log("Loaded steps");
    for (const [key, stepDefinition] of loadedSteps)
        console.log(key);

    const featureFileFullPath = Path.join(executionDirectory, options.featureName);
    await loadFeature(featureFileFullPath);
}

(async () => {
    await execute();
})();

export { defineStep } from "./Step";