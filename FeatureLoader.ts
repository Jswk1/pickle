import { FsAsync } from "./FsAsync";
import { findStepDefinition, IStep } from "./Step";

export interface IFeature {
    name: string;
    backgroundSteps: IStep[];
    scenarios: Array<{
        name: string;
        steps: IStep[];
    }>;
}

const gherkinSectionExpr = /^([A-Za-z]+)\:\s{0,}(.*)(?:\r\n)?$/;

enum GherkinScope {
    Feature = 0,
    Background = 1,
    Scenario = 2
}

function getGherkinScope(text: string) {
    switch (text.toLowerCase()) {
        case "feature":
            return GherkinScope.Feature;
        case "background":
            return GherkinScope.Background;
        case "scenario":
            return GherkinScope.Scenario;
        default:
            throw new Error("Scope not found: " + text);
    }
}

export async function loadFeature(featurePath: string) {
    const exists = await FsAsync.exists(featurePath);

    if (!exists)
        throw new Error(`Feature not found: ${featurePath}`);

    const featureContent = await FsAsync.readFile(featurePath);
    const featureLines = featureContent.split("\n");

    const features: IFeature[] = [];
    const getLastFeature = () => features[features.length - 1];
    const getLastScenario = () => {
        const lastFeature = getLastFeature();
        return lastFeature.scenarios[lastFeature.scenarios.length - 1];
    }
    let currentScope: GherkinScope;

    for (let i = 0; i < featureLines.length; i++) {
        const step = featureLines[i].trim();

        console.log("Gherkin line: ", step);

        if (step === "")
            continue;

        const sectionMatch = gherkinSectionExpr.exec(step);
        if (sectionMatch) {
            const scope = getGherkinScope(sectionMatch[1]);

            switch (scope) {
                case GherkinScope.Feature:
                    features.push({ name: sectionMatch[2], scenarios: [], backgroundSteps: [] });
                    currentScope = scope;
                    break;
                case GherkinScope.Scenario:
                    const lastFeature = getLastFeature();
                    lastFeature.scenarios.push({ name: sectionMatch[2], steps: [] });
                default:
                    currentScope = scope;
            }
        } else {
            switch (currentScope) {
                case GherkinScope.Feature:
                    throw new Error("Unexpected line in feature scope.");

                case GherkinScope.Background:
                    const backgroundStepDef = findStepDefinition(step);

                    const lastFeature = getLastFeature();
                    lastFeature.backgroundSteps.push({ description: step, definition: backgroundStepDef });
                    break;

                case GherkinScope.Scenario:
                    const scenarioStepDef = findStepDefinition(step);

                    const lastScenario = getLastScenario();
                    lastScenario.steps.push({ description: step, definition: scenarioStepDef });
                    break;
                default:
                    throw new Error("Unexpected scope: " + currentScope);
            }
        }
    }

    // Should only support single feature per file, so throw error if found more
    if (features.length > 1)
        throw new Error("Multiple features per file are not allowed.");

    return features[0];
}