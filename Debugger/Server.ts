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

    server.listen(port, () => {
        const url = `http://localhost:${port}/`;
        Log.info(`Debugger running on ${url}`);

        // https://stackoverflow.com/a/49013356
        const start = (process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open");
        require("child_process").exec(start + ' ' + url);
    });
}