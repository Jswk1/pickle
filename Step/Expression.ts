import { IStep } from "./Step";

export const stepExpressions = new Map<string, IStepExpressionDef>();

type TParser = (value: any) => any;

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
    if (stepExpressions.has(expr.key))
        throw new Error(`Expression {${expr.key}} already exists.`);

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
    pattern: /\"(.*)\"/,
    parser: v => String(v)
});

function escapeRegexp(text: string) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
}

export function stepConvertExpressions(step: string): IStepExpression {
    const resolvers = [];
    const escapedStep = escapeRegexp(step);
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
        regexp: new RegExp(stepExpr),
        parsers: resolvers
    }
}

export function extractVariables(step: IStep) {
    const variables = [];
    const match = step.definition.expression.regexp.exec(step.name);
    if (!match)
        throw new Error(`Couldn't extract variables from step '${step.definition}'.`);

    for (let i = 1; i < match.length; i++) {
        const rawValue = match[i];
        const parser = step.definition.expression.parsers[i - 1];

        variables.push(parser(rawValue));
    }

    return variables;
}