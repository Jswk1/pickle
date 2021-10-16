import { performance } from "perf_hooks";

export async function measureMiliseconds(fn: () => Promise<any>) {
    const startTime = performance.now();

    await fn();

    const finishTime = performance.now();

    return Math.round(finishTime - startTime);
}