
import * as Path from "path";
import "./Step/Expression";
import "./Step/Step";
import "./Utils/Array";
import { executeFeature, OutcomeStatus } from "./Feature/Executor";
import { IFeature, loadFeature, loadFeatureFile, resetId } from "./Feature/Loader";
import { queryFilesByGlob } from "./Utils/QueryFiles";
import { Log } from "./Utils/Log";
import { ReporterType, reportFeature } from "./Feature/Reporter/Factory";
import { startDebugger } from "./Debugger/Server";
import { loadStepDefinitions, stepDefinitions } from "./Step/Step";
import { IRunnerOptions, parseArgs } from "./Options";

export function requireScripts(options: IRunnerOptions, fileNames: string[]) {
    // stepDefinitions.clear();

    const executionDirectory = process.cwd();
    const fullPaths = fileNames.map(e => Path.isAbsolute(e) ? e : Path.join(executionDirectory, e));

    for (const filePath of fullPaths) {
        const modulePath = require.resolve(filePath);

        if (require.cache[modulePath])
            delete require.cache[modulePath];
    }

    for (const filePath of fullPaths)
        require(filePath);

    loadStepDefinitions(options);
}

export let feature: IFeature;

export async function initFeature(options: IRunnerOptions) {
    const featureFileContent = await loadFeatureFile(options.featureFullPath);
    feature = loadFeature(featureFileContent);
}

export let options: IRunnerOptions;

export default async function execute(initialOptions: IRunnerOptions = { killOnFinish: true }) {
    try {
        options = Object.assign({}, initialOptions, parseArgs());

        if (!options.logOutputPath)
            options.logOutputPath = "./Log/Log.log";

        const stepDefinitionFileNames = await queryFilesByGlob(options.scriptsPath);
        requireScripts(options, stepDefinitionFileNames);

        Log.info(`${stepDefinitionFileNames.length} files loaded.`);

        const featureFullPath = Path.isAbsolute(options.featurePath) ? options.featurePath : Path.join(process.cwd(), options.featurePath);
        options.featureFullPath = featureFullPath;

        await initFeature(options);

        if (options.debug) {
            startDebugger(options.debugPort || 3001, feature, options);
        } else {
            const featureOutcome = await executeFeature(feature);

            /** Report results */
            await reportFeature(ReporterType.Stdout, featureOutcome, options);

            if (options.jUnitXmlOutputPath)
                await reportFeature(ReporterType.JUnit, featureOutcome, options);

            if (options.bridgeJSONOutputPath)
                await reportFeature(ReporterType.BridgeJSON, featureOutcome, options);

            if (options.logOutputPath)
                await Log.save(options.logOutputPath);

            if (options.killOnFinish)
                process.exit(featureOutcome.status === OutcomeStatus.Ok ? 0 : 1);
        }
    } catch (ex) {
        Log.error(ex?.stack || ex);
        process.exit(1);
    }
}

async function reloadScripts(path: string) {
    const stepDefinitionNames = await queryFilesByGlob(path);

    requireScripts(options, stepDefinitionNames);
    resetId();

    await initFeature(options);
}

export { execute, reloadScripts };
export { defineStep, Given, Then, When, And, But, TContext, beforeScenario, afterScenario, beforeFeature, afterFeature, beforeStep, afterStep } from "./Step/Step";
export { defineExpression } from "./Step/Expression";