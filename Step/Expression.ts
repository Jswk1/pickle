import { IStep, TPattern } from "./Step";

export const stepExpressions = new Map<string, IStepExpressionDef>();

type TParser = (...value: any[]) => any | any[];

interface IStepExpressionDef {
    key: string;
    pattern: RegExp;
    parser: TParser;
}

export interface IStepExpression {
    regexp: RegExp;
    parsers: TParser[];
}

export function defineExpression(expr: IStepExpressionDef) {
    stepExpressions.set(expr.key, expr);
}

defineExpression({
    key: "int",
    pattern: /\-?\d*/,
    parser: v => Number(v)
});

defineExpression({
    key: "decimal",
    pattern: /\-?\d*\.?\d*/,
    parser: v => Number(v)
});

defineExpression({
    key: "string",
    pattern: /(?:'|")(.*?)(?:'|")/,
    parser: v => String(v)
});

function escapeRegexp(text: string) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
}

export function expressionFromString(stepPattern: string): IStepExpression {
    const resolvers: TParser[] = [];
    const escapedStep = escapeRegexp(stepPattern);
    const stepExpr = escapedStep.replace(/\\\{(.*?)\\\}/g, (match, key) => {
        if (!stepExpressions.has(key))
            throw new Error(`Unsupported expression {${key}}.`);

        const expression = stepExpressions.get(key);
        resolvers.push(expression.parser);

        const pattern = expression.pattern.toString().slice(1, -1); // Escape regex boundary characters / ... /
        const hasCapturingGroup = /[^\\]\(/g.test(pattern);

        if (hasCapturingGroup)
            return `(?:${pattern})`;

        return `(${pattern})`;
    });

    return {
        regexp: new RegExp("^" + stepExpr + "$"),
        parsers: resolvers
    }
}

export function expressionFromRegexp(stepPattern: RegExp): IStepExpression {
    return {
        regexp: stepPattern,
        parsers: []
    }
}

export function extractVariables(step: IStep) {
    const variables: any[] = [];
    const match = step.definition.expression.regexp.exec(step.name);

    if (!match)
        throw new Error(`Couldn't extract variables from step '${step.name}'.`);
    if (typeof step.definition.pattern === "string") {
        for (let i = 1; i < match.length; i++) {
            const rawValue = match[i];
            const parser = step.definition.expression.parsers[i - 1];

            variables.push(parser(rawValue));
        }
    } else if (step.definition.pattern instanceof RegExp) {
        const capturedGroups = match.slice(1);
        if (capturedGroups.length > 0)
            variables.push(...capturedGroups);
    }

    return variables;
}

export function stepExpressionFactory(pattern: TPattern) {
    if (typeof pattern === "string")
        return expressionFromString(pattern);
    else if (pattern instanceof RegExp) {
        return expressionFromRegexp(pattern);
    }
    else
        throw new Error(`Pattern type not supported: ${pattern}`);
}