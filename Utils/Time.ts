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
        { suffix: "h", msMultiplier: 3600000 },
        { suffix: "m", msMultiplier: 60000 },
        { suffix: "s", msMultiplier: 1000 },
        { suffix: "ms", msMultiplier: 1 }
    ]

    for (const part of dateParts) {
        const count = Math.floor(durationMs / part.msMultiplier);
        durationMs -= count * part.msMultiplier;

        if (count > 0)
            logParts.push(count + part.suffix);

        if (durationMs === 0)
            return finalizeFn();
    }

    return finalizeFn();
}