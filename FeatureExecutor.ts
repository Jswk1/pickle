import { IFeature } from "./FeatureLoader";
import { IStep } from "./Step";
import { extractVariables } from "./StepExpression";

export async function executeFeature(feature: IFeature) {

    for (const scenario of feature.scenarios) {
        const stepList: IStep[] = [...feature.backgroundSteps, ...scenario.steps];


        for (const step of stepList) {
            console.log(`Step: ${step.description}`);

            const variables = extractVariables(step);
            await step.definition.cb.call({}/*todo*/, variables);
        }
    }

}