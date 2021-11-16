import { IStep, findStepDefinition, stepDefinitions, StepType, TStepKeyword } from "../Step/Step";
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

export async function loadFeatureFile(featurePath: string) {
    const exists = await FsAsync.exists(featurePath);
    if (!exists)
        throw new Error(`Feature not found: ${featurePath}`);

    const fileContent = await FsAsync.readFile(featurePath);

    return fileContent;
}

let stepId = 1;
let scenarioId = 1;

export function resetId() {
    stepId = scenarioId = 1;
}

export function loadFeature(featureFileContent: string) {
    featureFileContent = featureFileContent.replace(/^(?:\s*|\s*#.*?)$/mgs, ""); // Clear comments and empty lines

    const gherkinSectionExpr = /(?:(Feature|Background|Scenario Outline|Scenario)):([\S ]*)(.*?)(?=(?:Background|Scenario Outline|Scenario):|$)/gsi;
    const gherkinSectionList = Array.from(featureFileContent.matchAll(gherkinSectionExpr));

    if (gherkinSectionList.length === 0)
        throw new Error("Could not parse feature file.");

    type TSectionType = "feature" | "scenario" | "background" | "scenario outline";

    const feature: IFeature = {
        name: null,
        description: null,
        backgroundSteps: [],
        scenarios: []
    };

    const addScenario = (scenario: IScenario) => {
        const lastScenario = feature.scenarios.last();
        if (lastScenario)
            lastScenario.nextScenarioId = scenario.id;

        feature.scenarios.push(scenario);
    }

    for (const match of gherkinSectionList) {
        const sectionType: TSectionType = match[1].trim().toLowerCase() as TSectionType;
        const sectionName = match[2]?.trim();
        const sectionContent = match[3]?.trim();

        switch (sectionType) {
            case "feature":
                feature.name = sectionName;
                feature.description = sectionContent.split("\n").map(e => e.trim()).join("\n");
                break;
            case "scenario":
                const scenario = loadScenario(sectionName, sectionContent);
                addScenario(scenario);

                break;
            case "background":
                feature.backgroundSteps = loadSteps(sectionContent.split("\n"), StepType.Background)
                break;
            case "scenario outline":
                const scenarios = loadOutline(sectionName, sectionContent);

                for (const scenario of scenarios)
                    addScenario(scenario);

                break;
            default:
                throw new Error("Unknown section: " + sectionType);
        }
    }

    return feature;
}

function loadOutline(name: string, content: string) {
    const examplesSecionRegexp = /Examples:\s*(\|.*\|)/si;
    const examplesMatch = examplesSecionRegexp.exec(content);

    if (!examplesMatch)
        throw new Error("Examples section is missing in scenario outline: " + name);

    const { keys, values } = loadExamplesMap(examplesMatch[1]);
    const outlineWithoutExamples = content.replace(examplesSecionRegexp, "").trim();

    const scenarios: IScenario[] = [];

    values.forEach(v => {
        let scenarioContent = outlineWithoutExamples;

        keys.forEach((k, j) => {
            scenarioContent = scenarioContent.split(`<${k}>`).join(v[j]);
        });

        try {
            scenarios.push({ ...loadScenario(name, scenarioContent), isOutline: true });
        } catch (ex) {
            throw new Error(`Error when loading outline '${name}': ${ex.message}`);
        }
    });

    return scenarios;
}

function loadExamplesMap(content: string) {
    const keys: string[] = [];
    const values: Array<string[]> = [];

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].trim().slice(1, -1).split("|").map(e => e.trim());

        // Header with keys
        if (i === 0)
            keys.push(...parts);
        else
            values.push([...parts]);
    }

    return { keys, values };
}

function loadScenario(name: string, content: string) {
    const scenario: IScenario = {
        id: ++scenarioId,
        name: name,
        steps: loadSteps(content.split("\n"), StepType.Scenario)
    }

    return scenario;
}

function loadSteps(lines: string[], type: StepType) {
    const steps: IStep[] = [];

    for (const line of lines) {
        const step = parseStep(type, line.trim());

        const lastStep = steps.last();
        if (lastStep)
            lastStep.nextStepId = step.id;

        steps.push(step);
    }

    return steps;
}

function parseStep(type: StepType, line: string) {
    const stepMatch = /^(given|when|then|and|but)(.*)$/i.exec(line.trim());
    if (!stepMatch)
        throw new Error("Incorrect step format: " + line);

    const keyword = stepMatch[1].trim() as TStepKeyword;
    const stepName = stepMatch[2].trim();
    const stepDef = findStepDefinition(stepName);

    const step: IStep = { id: ++stepId, type, keyword, name: stepName, definition: stepDef };

    return step;
}