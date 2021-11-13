import { IFeatureOutcome, IScenarioOutcome, IStepOutcome } from "../Feature/Executor";
import { IFeature, IScenario } from "../Feature/Loader";
import { IStepExpression, stepExpressionFactory } from "./Expression";

export type TContext<T = { [key: string]: any }> = {
    variables: {
        [key: string]: any;
    }
} & T;

type TPromisable<T> = Promise<T> | T;

export type TCallbackFuntion = (this: TContext, ...args: any[]) => TPromisable<void>;
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

export type TStepKeyword = "given" | "when" | "then" | "and" | "but";

export interface IStep {
    id: number;
    type: StepType;
    keyword: TStepKeyword;
    name: string;
    definition: IStepDefinition;

    nextStepId?: number;
}

export const stepDefinitions = new Map<string | RegExp, IStepDefinition>();

export function defineStep(pattern: string, cb: TCallbackFuntion): void;
export function defineStep(regexp: RegExp, cb: TCallbackFuntion): void;
export function defineStep(pattern: string, options: IStepOptions, cb?: TCallbackFuntion): void;
export function defineStep(regexp: RegExp, options: IStepOptions, cb?: TCallbackFuntion): void;
export function defineStep(firstArg: TPattern, secondArg: IStepOptions | TCallbackFuntion, thirdArg?: TCallbackFuntion): void;
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

export const Given = defineStep;
export const When = defineStep;
export const Then = defineStep;
export const And = defineStep;
export const But = defineStep;

/** Hooks */

export let beforeFeatureFn: (feature: IFeature) => TPromisable<void>;
export let afterFeatureFn: (feature: IFeature, outcome: IFeatureOutcome) => TPromisable<void>;

export function beforeFeature(fn: typeof beforeFeatureFn) {
    beforeFeatureFn = fn;
}
export function afterFeature(fn: typeof afterFeatureFn) {
    afterFeatureFn = fn;
}

export let beforeScenarioFn: (scenario: IScenario) => TPromisable<void>;
export let afterScenarioFn: (scenario: IScenario, outcome: IScenarioOutcome) => TPromisable<void>;

export function beforeScenario(fn: typeof beforeScenarioFn) {
    beforeScenarioFn = fn;
}
export function afterScenario(fn: typeof afterScenarioFn) {
    afterScenarioFn = fn;
}

export let beforeStepFn: (scenario: IScenario, step: IStep) => TPromisable<void>;
export let afterStepFn: (scenario: IScenario, step: IStep, outcome: IStepOutcome) => TPromisable<void>;

export function beforeStep(fn: typeof beforeStepFn) {
    beforeStepFn = fn;
}
export function afterStep(fn: typeof afterStepFn) {
    afterStepFn = fn;
}