type TCallbackFuntion = (...args: any[]) => void | Promise<void>;

interface IStepDefinition {
    pattern: string;
    options: IStepOptions;
    cb: TCallbackFuntion;
}

interface IStepOptions {
    timeoutMS?: number;
}

export const loadedSteps = new Map<string, IStepDefinition>();


export function defineStep(pattern: string, cb: TCallbackFuntion): void;
export function defineStep(pattern: string, options: any, cb?: any) {
    if (loadedSteps.has(pattern))
        throw new Error(`Step '${pattern}' is defined multiple times.`);

    if (typeof options === "function") {
        cb = options;
        options = { timeoutMS: 10000 };
    }

    loadedSteps.set(pattern, { pattern, options, cb });
}