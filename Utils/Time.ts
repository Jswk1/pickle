import { performance } from "perf_hooks";

export async function measureMiliseconds(fn: () => Promise<any>) {
    const startTime = performance.now();

    await fn();

    const finishTime = performance.now();

    return Math.round(finishTime - startTime);
}

export function logDuration(durationMs: number) {
    if (durationMs === 0)
        return "0ms";

    const logParts: string[] = [];
    const finalizeFn = () => logParts.join(" ");

    const dateParts = [
        { suffix: "h", multiplier: 3600000 },
        { suffix: "m", multiplier: 60000 },
        { suffix: "s", multiplier: 1000 },
        { suffix: "ms", multiplier: 1 }
    ]

    for (const part of dateParts) {
        const count = Math.floor(durationMs / part.multiplier);
        durationMs -= count * part.multiplier;

        if (count > 0)
            logParts.push(count + part.suffix);

        if (durationMs === 0)
            return finalizeFn();
    }

    return finalizeFn();
}