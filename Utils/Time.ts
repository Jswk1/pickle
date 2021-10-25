import { performance } from "perf_hooks";

export async function measureMiliseconds(fn: () => Promise<any>) {
    const startTime = performance.now();

    await fn();

    const finishTime = performance.now();

    return Math.round(finishTime - startTime);
}

// TODO: remove copypasta
export function logDuration(durationMs: number) {
    if (durationMs === 0)
        return "0ms";

    const logParts: string[] = [];
    const finalizeFn = () => logParts.join(" ");

    const hours = Math.floor(durationMs / 3600000);
    durationMs -= hours * 3600000;

    if (hours > 0)
        logParts.push(`${hours}h`);

    if (durationMs === 0)
        return finalizeFn();

    const minutes = Math.floor(durationMs / 60000);
    durationMs -= minutes * 60000;

    if (minutes > 0)
        logParts.push(`${minutes}m`);

    if (durationMs === 0)
        return finalizeFn();

    const seconds = Math.floor(durationMs / 1000);
    durationMs -= seconds * 1000;

    if (seconds > 0)
        logParts.push(`${seconds}s`);

    if (durationMs === 0)
        return finalizeFn();

    logParts.push(`${durationMs}ms`);

    return finalizeFn();
}