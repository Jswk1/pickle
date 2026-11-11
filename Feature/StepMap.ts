import { createHash } from "crypto";
import * as Path from "path";
import { IRunnerOptions } from "../Options";
import { requireScripts } from "../Runner";
import { globalRegistrations } from "../Step/ScriptOrigin";
import { findStepDefinition, IStep, IStepDefinition, TPattern } from "../Step/Step";
import { FsAsync } from "../Utils/FsAsync";
import { Log } from "../Utils/Log";
import { queryFilesByGlob, toPosix } from "../Utils/QueryFiles";
import { IFeature, loadFeature } from "./Loader";

/**
 * Step maps let a run load only the step files a feature needs.
 *
 * Build (CI, once per image):  pickle --build-step-maps -r <all step files> --always <always-loaded files> <features glob>
 *   writes <feature>.stepmap.json next to every feature.
 * Run:                         pickle -r <always-loaded files> --use-step-map <feature>
 */

export const STEP_MAP_SUFFIX = ".stepmap.json";
export const STEP_MAP_VERSION = 1;

export interface IStepMap {
    version: number;
    /** Hash of the feature file the map was built from. */
    featureHash: string;
    /** The --always files the map was built with, relative to the map file. A run must load all of them via -r. */
    alwaysFiles: string[];
    /** Step files to load in addition to the always-loaded ones, relative to the map file, in load order. */
    files: string[];
}

export function getStepMapPath(featureFullPath: string) {
    return featureFullPath + STEP_MAP_SUFFIX;
}

export function hashFeature(content: string) {
    return "sha256:" + createHash("sha256").update(content).digest("hex");
}

function featureSteps(feature: IFeature): IStep[] {
    return [...feature.backgroundSteps, ...feature.scenarios.flatMap(e => e.steps)];
}

function patternKey(pattern: TPattern) {
    return typeof pattern === "string" ? `string:${pattern}` : `regexp:${pattern.toString()}`;
}

function relative(filePath: string) {
    return toPosix(Path.relative(process.cwd(), filePath));
}

function describe(definition: IStepDefinition) {
    return `'${definition.pattern}' in ${definition.scriptFile ? relative(definition.scriptFile) : "<unknown file>"}`;
}

/**
 * Works out which step files (besides the always-loaded ones) a feature needs, and checks that loading
 * only those files resolves every step exactly as loading all step files does.
 *
 * @param feature      Feature loaded with all step files registered.
 * @param registrations Every step definition in registration order (always-loaded files first), including
 *                     definitions later overwritten by a duplicate pattern.
 * @param alwaysFiles  Absolute paths of the always-loaded step files.
 * @returns The needed files in load order, and problems that make the map unsafe (empty when it is safe).
 */
export function computeStepMapFiles(feature: IFeature, registrations: IStepDefinition[], alwaysFiles: Set<string>) {
    const problems: string[] = [];
    const steps = featureSteps(feature);
    const needed = new Set<string>();

    for (const step of steps) {
        const scriptFile = step.definition.scriptFile;

        if (!scriptFile) {
            problems.push(`Step '${step.name}': cannot tell which step file defines it (it was not registered while pickle was loading the --require files).`);
            continue;
        }

        if (!alwaysFiles.has(scriptFile))
            needed.add(scriptFile);
    }

    // The same pattern in several files resolves by load order, which differs between a full run and a
    // step-map run (always-loaded files first). Refuse rather than risk running a different implementation.
    const filesByPattern = new Map<string, Set<string>>();
    for (const definition of registrations) {
        const key = patternKey(definition.pattern);
        const files = filesByPattern.get(key) ?? new Set<string>();
        files.add(definition.scriptFile ?? "<unknown file>");
        filesByPattern.set(key, files);
    }

    const reportedDuplicates = new Set<string>();
    for (const step of steps) {
        const key = patternKey(step.definition.pattern);
        const files = filesByPattern.get(key);

        if (files && files.size > 1 && !reportedDuplicates.has(key)) {
            reportedDuplicates.add(key);
            problems.push(`Step pattern '${step.definition.pattern}' is defined in more than one file: ${Array.from(files).map(e => e.startsWith("<") ? e : relative(e)).join(", ")}.`);
        }
    }

    // Simulate the step-map run: only definitions from the always-loaded and needed files, in the same
    // registration order, with later duplicates overwriting earlier ones as in a normal run.
    const subset = new Map<TPattern, IStepDefinition>();
    for (const definition of registrations) {
        if (alwaysFiles.has(definition.scriptFile) || needed.has(definition.scriptFile))
            subset.set(definition.pattern, definition);
    }

    for (const step of steps) {
        if (!step.definition.scriptFile)
            continue; // already reported

        let resolved: IStepDefinition = null;
        try {
            resolved = findStepDefinition(step.name, subset.values());
        } catch {
            // reported below
        }

        if (resolved !== step.definition)
            problems.push(`Step '${step.name}' resolves to ${describe(step.definition)} with all step files loaded, but to ${resolved ? describe(resolved) : "nothing"} with only this feature's step files.`);
    }

    // Load order: the order in which the files registered their first definition.
    const files: string[] = [];
    for (const definition of registrations) {
        if (needed.has(definition.scriptFile) && !files.includes(definition.scriptFile))
            files.push(definition.scriptFile);
    }

    return { files, problems };
}

/**
 * Reads the step map of a feature for a --use-step-map run and returns the absolute paths of the step files
 * it lists. Throws if the map is missing, was built from a different version of the feature, or expects
 * always-loaded files that this run does not load.
 *
 * @param alwaysLoadedFiles Absolute paths of the files this run loads through -r.
 */
export async function readStepMapFiles(featureFullPath: string, featureContent: string, alwaysLoadedFiles: string[]) {
    const mapPath = getStepMapPath(featureFullPath);
    const rebuildHint = "Rebuild the step maps with --build-step-maps.";

    if (!await FsAsync.exists(mapPath))
        throw new Error(`No step map for ${relative(featureFullPath)}: expected ${relative(mapPath)}. ${rebuildHint}`);

    let map: IStepMap;
    try {
        map = JSON.parse(await FsAsync.readFile(mapPath));
    } catch (ex) {
        throw new Error(`Step map ${relative(mapPath)} is not valid JSON: ${ex.message}. ${rebuildHint}`);
    }

    if (map.version !== STEP_MAP_VERSION)
        throw new Error(`Step map ${relative(mapPath)} has version ${map.version}, but this pickle reads version ${STEP_MAP_VERSION}. ${rebuildHint}`);

    if (map.featureHash !== hashFeature(featureContent))
        throw new Error(`Step map ${relative(mapPath)} was built from a different version of ${relative(featureFullPath)}. ${rebuildHint}`);

    const fromMap = (filePath: string) => Path.resolve(Path.dirname(mapPath), filePath);

    const loaded = new Set(alwaysLoadedFiles.map(e => Path.resolve(e)));
    const notLoaded = map.alwaysFiles.map(fromMap).filter(e => !loaded.has(e));
    if (notLoaded.length)
        throw new Error(`Step map ${relative(mapPath)} was built with always-loaded files that -r does not load in this run: ${notLoaded.map(relative).join(", ")}. Use the same files for -r here as for --always when building the maps.`);

    const files = map.files.map(fromMap);
    for (const filePath of files) {
        if (!await FsAsync.exists(filePath))
            throw new Error(`Step map ${relative(mapPath)} lists ${relative(filePath)}, which does not exist. ${rebuildHint}`);
    }

    return files;
}

/** Builds and writes a step map next to every feature matched by options.featurePath. */
export async function buildStepMaps(options: IRunnerOptions) {
    const toAbsolute = (filePath: string) => Path.resolve(process.cwd(), filePath);

    const alwaysFiles = (await queryFilesByGlob(options.alwaysLoadPath)).map(toAbsolute);
    const allFiles = (await queryFilesByGlob(options.scriptsPath)).map(toAbsolute);
    const featureFiles = (await queryFilesByGlob(options.featurePath)).map(toAbsolute);

    if (!featureFiles.length)
        throw new Error(`No feature files match '${options.featurePath}'.`);

    // Load in the same order a step-map run will: always-loaded files first.
    const alwaysSet = new Set(alwaysFiles);
    const loadOrder = [...alwaysFiles, ...allFiles.filter(e => !alwaysSet.has(e))];

    const registrations: IStepDefinition[] = [];
    requireScripts(options, loadOrder, definition => registrations.push(definition));

    Log.info(`${loadOrder.length} step files loaded (${alwaysFiles.length} always loaded).`);

    const problems: string[] = [];

    for (const [filePath, registered] of globalRegistrations) {
        if (!alwaysSet.has(filePath))
            problems.push(`${relative(filePath)} registers ${Array.from(new Set(registered)).join(", ")} but is not matched by --always, so step-map runs would not load it.`);
    }

    const maps: { path: string, map: IStepMap }[] = [];

    for (const featurePath of featureFiles) {
        const content = await FsAsync.readFile(featurePath);

        let feature: IFeature;
        try {
            feature = loadFeature(content);
        } catch (ex) {
            problems.push(`${relative(featurePath)}: ${ex.message}`);
            continue;
        }

        const result = computeStepMapFiles(feature, registrations, alwaysSet);
        problems.push(...result.problems.map(e => `${relative(featurePath)}: ${e}`));

        const mapPath = getStepMapPath(featurePath);
        const relativeToMap = (filePath: string) => toPosix(Path.relative(Path.dirname(mapPath), filePath));
        maps.push({
            path: mapPath,
            map: {
                version: STEP_MAP_VERSION,
                featureHash: hashFeature(content),
                alwaysFiles: alwaysFiles.map(relativeToMap),
                files: result.files.map(relativeToMap)
            }
        });
    }

    if (problems.length)
        throw new Error(`Step maps were not written. Fix these problems:\n${problems.map(e => `  - ${e}`).join("\n")}`);

    for (const { path, map } of maps)
        await FsAsync.writeFile(path, JSON.stringify(map, null, 2) + "\n");

    const counts = maps.map(e => e.map.files.length);
    const average = counts.reduce((a, b) => a + b, 0) / counts.length;

    Log.info(`Wrote ${maps.length} step maps. Per feature: ${average.toFixed(1)} step files on average, ${Math.max(...counts)} at most (plus ${alwaysFiles.length} always loaded), out of ${loadOrder.length}.`);
}
