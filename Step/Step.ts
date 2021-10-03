import { IStepExpression, stepConvertExpressions } from "./Expression";

type TContext = {
    variables: {
        [key: string]: any;
    }
}
export type TCallbackFuntion = (this: TContext, ...args: any[]) => Promise<void>;

export interface IStepDefinition {
    pattern: string;
    options: IStepOptions;
    cb: TCallbackFuntion;
    expression: IStepExpression;
}

interface IStepOptions {
    timeoutMS?: number;
}

export interface IStep {
    description: string;
    definition: IStepDefinition;
}

export const stepDefinitions = new Map<string, IStepDefinition>();

export function defineStep(pattern: string, cb: TCallbackFuntion): void;
export function defineStep(pattern: string, options: any, cb?: any) {
    if (stepDefinitions.has(pattern))
        throw new Error(`Step '${pattern}' is defined multiple times.`);

    if (typeof options === "function") {
        cb = options;
        options = <IStepOptions>{ timeoutMS: 10000 };
    }

    const expression = stepConvertExpressions(pattern);

    stepDefinitions.set(pattern, { pattern, options, cb, expression });
}

export function findStepDefinition(step: string) {
    const stepDef = Array.from(stepDefinitions.values()).find(e => e.expression.regexp.test(step));

    if (!stepDef)
        throw new Error(`Unsupported step '${step}'`);

    return stepDef;
}