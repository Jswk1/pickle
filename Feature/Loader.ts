import { IStep, findStepDefinition, stepDefinitions, StepType } from "../Step/Step";
import { FsAsync } from "../Utils/FsAsync";

export interface IScenario {
    id: number;
    name: string;
    steps: IStep[];

    isOutline?: boolean;
    nextScenarioId?: number;
}

export interface IFeature {
    name: string;
    backgroundSteps: IStep[];
    scenarios: IScenario[];
}

const gherkinSectionExpr = /^([A-Za-z ]+)\:\s{0,}(.*)(?:\r\n)?$/;
const gherkinStepExpr = /^(?:given|when|then|and|but)(.*)$/i;
const gherkinCommentExpr = /^\#(?:.*)$/;

enum GherkinScope {
    Feature = 0,
    Background = 1,
    Scenario = 2,
    ScenarioOutline = 3,
    Examples = 4
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

function parseStep(stepId: number, type: StepType, line: string) {
    const stepMatch = gherkinStepExpr.exec(line);
    if (!stepMatch)
        throw new Error("Incorrect step format: " + line);

    const stepName = stepMatch[1].trim();
    const stepDef = findStepDefinition(stepName);

    const step: IStep = { id: stepId, type, name: line, definition: stepDef };

    return step;
}

export async function loadFeature(featurePath: string) {
    let scenarioId = 1;
    let stepId = 1;

    const exists = await FsAsync.exists(featurePath);

    if (!exists)
        throw new Error(`Feature not found: ${featurePath}`);

    const featureContent = await FsAsync.readFile(featurePath);
    const featureLines = featureContent.split("\n");

    const features: IFeature[] = [];

    let currentScope: GherkinScope;

    for (let i = 0; i < featureLines.length; i++) {
        const line = featureLines[i].trim();

        if (line === "")
            continue;

        if (gherkinCommentExpr.exec(line))
            continue; // skip comments

        const sectionMatch = gherkinSectionExpr.exec(line);
        if (sectionMatch) {
            const scope = getGherkinScope(sectionMatch[1]);

            switch (scope) {
                case GherkinScope.Feature:
                    features.push({ name: sectionMatch[2], scenarios: [], backgroundSteps: [] });
                    currentScope = scope;
                    break;
                case GherkinScope.Scenario:
                    const lastFeature = features.last();
                    const scenario = { id: ++scenarioId, name: sectionMatch[2], steps: [] };

                    const lastScenario = lastFeature.scenarios.last();
                    if (lastScenario)
                        lastScenario.nextScenarioId = scenario.id;

                    lastFeature.scenarios.push(scenario);
                    currentScope = scope;
                    break;
                case GherkinScope.Background:
                    currentScope = scope;
                    break;
                default:
                    throw new Error(`Unexpected section: ${sectionMatch[1]}.`);
            }
        } else {
            switch (currentScope) {
                case GherkinScope.Feature:
                    throw new Error("Unexpected line in feature scope.");

                case GherkinScope.Background:
                    const backgroundStep = parseStep(++stepId, StepType.Background, line);
                    const lastFeature = features.last();

                    const lastBackgroundStep = lastFeature.backgroundSteps.last();
                    if (lastBackgroundStep)
                        lastBackgroundStep.nextStepId = backgroundStep.id;

                    lastFeature.backgroundSteps.push(backgroundStep);

                    break;
                case GherkinScope.Scenario:
                    const step = parseStep(++stepId, StepType.Scenario, line);
                    const lastScenario = features.last().scenarios.last();

                    const lastStep = lastScenario.steps.last();
                    if (lastStep)
                        lastStep.nextStepId = step.id;

                    lastScenario.steps.push(step);
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