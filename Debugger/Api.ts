import * as Express from "express";
import { executeStep } from "../Feature/Executor";
import { resetId } from "../Feature/Loader";
import { IRunnerOptions } from "../Options";
import { feature, initFeature, reloadScripts, requireScripts } from "../Runner";
import { IStep } from "../Step/Step";
import { queryFilesByGlob } from "../Utils/QueryFiles";
import { stopWatching, watchForChanges } from "./Watcher";

export function getApiRouter(options: IRunnerOptions) {
    const router = Express.Router();
    const context = { variables: {} };

    router.get("/feature", (req, res) => {
        res.send(JSON.stringify(feature, (k, v) => {
            if (v instanceof RegExp)
                return "__REGEXP" + v.toString();
            return v;
        }));
    });

    router.post("/reload", async (req: Express.Request<{}, {}, { path?: string }>, res) => {
        const path = req.body?.path ?? options.scriptsPath;
        await reloadScripts(path);
        res.sendStatus(200);
    });

    router.post("/reload/watch", async (req: Express.Request<{}, {}, { enable: boolean }>, res) => {
        if (req.body.enable)
            watchForChanges(options);
        else
            stopWatching();

        res.sendStatus(200);
    });

    router.get("/feature/variables", (req, res) => {
        res.send(context.variables);
    });

    router.post("/feature/variables", (req: Express.Request<{}, {}, { variables: object }>, res) => {
        try {
            context.variables = Object.assign({}, req.body.variables);
            res.status(200).send(context.variables);
        } catch (ex) {
            res.status(500).send(ex);
        }
    });

    let lastScenarioId: number = null;

    router.post("/scenario/:scenarioId/step/:stepId", async (req, res) => {
        const scenarioId = Number(req.params.scenarioId);

        if (scenarioId !== lastScenarioId) {
            context.variables = {};
            lastScenarioId = scenarioId;
        }

        const stepId = Number(req.params.stepId);
        const scenario = feature.scenarios.find(e => e.id === scenarioId);
        if (!scenario)
            return res.sendStatus(404);

        const step: IStep = feature.backgroundSteps.find(e => e.id === stepId) || scenario.steps.find(e => e.id === stepId);
        if (!step)
            return res.sendStatus(404);

        try {
            const stepOutcome = await executeStep(scenario, step, context);

            if (stepOutcome.error)
                console.error(stepOutcome.error);

            return res.send({ status: stepOutcome.status, error: stepOutcome.error?.stack || stepOutcome.error?.message });
        } catch (ex) {
            console.error(ex);
            return res.status(500).send(ex);
        }
    });

    return router;
}
