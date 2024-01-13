import { resetId } from "../Feature/Loader";
import { IRunnerOptions } from "../Options";
import { initFeature } from "../Runner";
import { loadStepDefinitions } from "../Step/Step";
import { Log } from "../Utils/Log";
import { extractEntryDirectory, createRegexFromPattern, toPosix } from "../Utils/QueryFiles";
import * as Chokidar from "chokidar";
import * as Path from "path";

let watcher: Chokidar.FSWatcher;

export function watchForChanges(options: IRunnerOptions) {
    const pathToWatch = extractEntryDirectory(options.scriptsPath);
    const fileNameRegexp = createRegexFromPattern(toPosix(options.scriptsPath));

    stopWatching();
    watcher = Chokidar.watch(pathToWatch);

    const reloadFn = async () => {
        resetId();
        loadStepDefinitions(options);
        await initFeature(options);
        Log.info(`Test source reloaded.`);
    }

    let timeout: NodeJS.Timeout;

    watcher.on("change", async (changedFilePath, stats) => {
        if (!fileNameRegexp.test(changedFilePath))
            return;

        const absolutePath = Path.resolve(changedFilePath);
        const modulePath = require.resolve(absolutePath);

        if (require.cache[modulePath])
            delete require.cache[modulePath];

        require(modulePath);
        Log.info(`Reloading file: ${modulePath}`);

        clearTimeout(timeout);
        timeout = setTimeout(() => reloadFn(), 250);
    });
}

export function stopWatching() {
    watcher?.close();
}