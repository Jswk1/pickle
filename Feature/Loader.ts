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
    description: string;
    backgroundSteps: IStep[];
    scenarios: IScenario[];
}

export async function loadFeature(featurePath: string) {
    let scenarioId = 1;

    const exists = await FsAsync.exists(featurePath);

    if (!exists)
        throw new Error(`Feature not found: ${featurePath}`);

    const fileContent = (await FsAsync.readFile(featurePath)).replace(/^(?:\s*|\s*#.*?)$/mgs, ""); // Clear comments and empty lines

    const gherkinSectionExpr = /(?:(Feature|Background|Scenario Outline|Scenario)):([\S ]*)(.*?)(?=Background|Scenario Outline|Scenario|$)/gsi;
    const gherkinSectionList = Array.from(fileContent.matchAll(gherkinSectionExpr));

    if (gherkinSectionList.length === 0)
        throw new Error("Could not parse feature file.");

    type TSectionType = "feature" | "scenario" | "background" | "scenario outline";

    const feature: IFeature = {
        name: null,
        description: null,
        backgroundSteps: [],
        scenarios: []
    };

    for (const match of gherkinSectionList) {
        const sectionType: TSectionType = match[1].trim().toLowerCase() as TSectionType;
        const sectionName = match[2]?.trim();
        const sectionContent = match[3]?.trim();

        switch (sectionType) {
            case "feature":
                feature.name = sectionName;
                feature.description = sectionContent;
                break;
            case "scenario":
                const scenario: IScenario = {
                    id: ++scenarioId,
                    name: sectionName,
                    steps: loadSteps(sectionContent.split("\n"), StepType.Scenario)
                }

                const lastScenario = feature.scenarios.last();
                if (lastScenario)
                    lastScenario.nextScenarioId = scenario.id;

                feature.scenarios.push(scenario);
                break;
            case "background":
                feature.backgroundSteps = loadSteps(sectionContent.split("\n"), StepType.Background)
                break;
            case "scenario outline":
                break;
            default:
                throw new Error("Unknown section: " + sectionType);
        }
    }

    return feature;
}

let stepId = 1;

function loadSteps(lines: string[], type: StepType) {
    const steps: IStep[] = [];

    for (const line of lines) {
        const step = parseStep(++stepId, type, line);

        const lastStep = steps.last();
        if (lastStep)
            lastStep.nextStepId = step.id;

        steps.push(step);
    }

    return steps;
}

function parseStep(stepId: number, type: StepType, line: string) {
    const stepMatch = /^(?:given|when|then|and|but)(.*)$/i.exec(line.trim());
    if (!stepMatch)
        throw new Error("Incorrect step format: " + line);

    const stepName = stepMatch[1].trim();
    const stepDef = findStepDefinition(stepName);

    const step: IStep = { id: stepId, type, name: line, definition: stepDef };

    return step;
}