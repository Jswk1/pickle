import { IStepExpression, stepExpressionFactory } from "./Expression";

export type TContext = {
    variables: {
        [key: string]: any;
    }
}

export type TCallbackFuntion = (this: TContext, ...args: any[]) => Promise<void>;
export type TPattern = string | RegExp;

export interface IStepDefinition {
    pattern: TPattern;
    options: IStepOptions;
    cb: TCallbackFuntion;
    expression: IStepExpression;
}

interface IStepOptions {
    /** in milliseconds */
    timeout?: number;
}

export enum StepType {
    Background = 1,
    Scenario = 2
}

export interface IStep {
    id: number;
    type: StepType;
    name: string;
    definition: IStepDefinition;

    nextStepId?: number;
}

export const stepDefinitions = new Map<string | RegExp, IStepDefinition>();

export function defineStep(pattern: string, cb: TCallbackFuntion): void;
export function defineStep(regexp: RegExp, cb: TCallbackFuntion): void;
export function defineStep(pattern: string, options: IStepOptions, cb?: TCallbackFuntion): void
export function defineStep(regexp: RegExp, options: IStepOptions, cb?: TCallbackFuntion): void
export function defineStep(firstArg: TPattern, secondArg: IStepOptions | TCallbackFuntion, thirdArg?: TCallbackFuntion) {
    if (stepDefinitions.has(firstArg))
        throw new Error(`Step '${firstArg}' is defined multiple times.`);

    if (typeof secondArg === "function") {
        thirdArg = secondArg;
        secondArg = <IStepOptions>{ timeout: 10000 };
    }

    const expression = stepExpressionFactory(firstArg);
    stepDefinitions.set(firstArg, { pattern: firstArg, options: secondArg, cb: thirdArg, expression });
}

export function findStepDefinition(step: string) {
    const stepDef = Array.from(stepDefinitions.values()).find(e => e.expression.regexp.test(step));

    if (!stepDef)
        throw new Error(`Unsupported step '${step}'`);

    return stepDef;
}