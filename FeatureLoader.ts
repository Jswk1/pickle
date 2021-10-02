import { FsAsync } from "./FsAsync";

interface IFeature {
    name: string;
    backgroundSteps: string[];
    scenarios: Array<{
        name: string;
        steps: string[];
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
        const line = featureLines[i].trim();

        console.log("Gherkin line: ", line);

        if (line === "")
            continue;

        const sectionMatch = gherkinSectionExpr.exec(line);
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
                    const lastFeature = getLastFeature();
                    lastFeature.backgroundSteps.push(line);
                    break;

                case GherkinScope.Scenario:
                    const lastScenario = getLastScenario();
                    lastScenario.steps.push(line);
                    break;

                default:
                    throw new Error("Unexpected scope: " + currentScope);
            }
        }
    }

    console.log(features);
}