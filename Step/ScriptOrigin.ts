/**
 * Tracks which step-definition file the runner is currently requiring, so that every step,
 * hook and expression registration can record the file whose loading produced it.
 * Used to build per-feature step maps (see Feature/StepMap.ts).
 */

let currentScriptFile: string = null;

export function setCurrentScriptFile(filePath: string) {
    currentScriptFile = filePath;
}

export function getCurrentScriptFile() {
    return currentScriptFile;
}

/**
 * Files that registered hooks or custom expressions while being required, with what they registered.
 * These affect every feature, so they must always be loaded.
 */
export const globalRegistrations = new Map<string, string[]>();

export function recordGlobalRegistration(description: string) {
    if (!currentScriptFile)
        return;

    const list = globalRegistrations.get(currentScriptFile) ?? [];
    list.push(description);
    globalRegistrations.set(currentScriptFile, list);
}
