export const stepExpressions = new Map<string, IStepExpressionDef>();

type TResolver = (value: any) => any;

interface IStepExpressionDef {
    key: string;
    pattern: RegExp;
    resolver: TResolver;
}

export interface IStepExpression {
    regexp: RegExp;
    resolvers: TResolver[];
}

export function defineExpression(expr: IStepExpressionDef) {
    if (stepExpressions.has(expr.key))
        throw new Error(`Expression {${expr.key}} already exists.`);

    stepExpressions.set(expr.key, expr);
}

defineExpression({
    key: "int",
    pattern: /\-?\d*/,
    resolver: v => Number(v)
});

defineExpression({
    key: "decimal",
    pattern: /\-?\d*\.?\d*/,
    resolver: v => Number(v)
});

defineExpression({
    key: "string",
    pattern: /\"(.*)\"/,
    resolver: v => String(v)
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
        resolvers.push(expression.resolver);

        return `(${expression.pattern.toString().slice(1, -1)})`; // Escape regex boundary characters / ... /
    });

    return {
        regexp: new RegExp(stepExpr),
        resolvers
    }
}