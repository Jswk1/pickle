import * as Express from "express";
import * as Path from "path";
import { IFeature, resetId } from "../Feature/Loader";
import { IRunnerOptions } from "../Options";
import { Log } from "../Utils/Log";
import { getApiRouter } from "./Api";
import * as Chokidar from "chokidar";
import { createRegexFromPattern, extractEntryDirectory, toPosix } from "../Utils/QueryFiles";
import { loadStepDefinitions } from "../Step/Step";
import { initFeature } from "../Runner";

export function startDebugger(port = 3001, feature: IFeature, options: IRunnerOptions) {
    const server = Express();

    server.use(Express.json());
    server.use("/static", Express.static(Path.join(__dirname, "./Public")));

    server.use("/api", getApiRouter(options));

    server.get("/", (req, res) => {
        res.sendFile(Path.join(__dirname, "./Public/Index.html"));
    });

    server.on("error", (err) => {
        Log.error(err);
    });

    if (options.watchForChanges)
        watchForChanges(options);

    server.listen(port, () => {
        const url = `http://localhost:${port}/`;
        Log.info(`Debugger running on ${url}`);

        // https://stackoverflow.com/a/49013356
        const start = (process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open");
        require("child_process").exec(start + ' ' + url);
    });
}

function watchForChanges(options: IRunnerOptions) {
    const pathToWatch = extractEntryDirectory(options.scriptsPath);
    const fileNameRegexp = createRegexFromPattern(toPosix(options.scriptsPath));
    const watcher = Chokidar.watch(pathToWatch);

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