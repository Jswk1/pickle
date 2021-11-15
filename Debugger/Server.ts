import * as Express from "express";
import * as Path from "path";
import { IFeature } from "../Feature/Loader";
import { IRunnerOptions } from "../Options";
import { Log } from "../Utils/Log";
import { getApiRouter } from "./Api";

export function startDebugger(port = 3001, feature: IFeature, options: IRunnerOptions) {
    const server = Express();

    server.use(Express.json());
    server.use("/static", Express.static(Path.join(__dirname, "./Public")));

    server.use("/api", getApiRouter(feature, options));

    server.get("/", (req, res) => {
        res.sendFile(Path.join(__dirname, "./Public/Index.html"));
    });

    server.on("error", (err) => {
        Log.error(err);
    });

    server.listen(port, () => {
        Log.info(`Navigate to http://localhost:${port}/`);
    });
}
