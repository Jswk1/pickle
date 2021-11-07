import * as Express from "express";
import { executeStep } from "../Feature/Executor";
import { IFeature } from "../Feature/Loader";

export function getApiRouter(feature: IFeature) {
    const apiRouter = Express.Router();

    const context = { variables: {} };

    apiRouter.get("/feature", (req, res) => {
        res.send(feature);
    });

    apiRouter.get("/feature/variables", (req, res) => {
        res.send(context.variables);
    });

    apiRouter.post("/feature/variables", (req, res) => {
        if (typeof req.body.variables !== "object")
            res.sendStatus(400);

        context.variables = Object.assign({}, context.variables, req.body.variables);
        res.sendStatus(200);
    });

    apiRouter.post("/step/:id", async (req, res) => {
        const stepId: number = Number(req.params.id);

        const step = feature.scenarios.find(e => e.steps.some(e => e.id === stepId)).steps.find(e => e.id === stepId);
        const stepOutcome = await executeStep(step, context);

        res.send({ status: stepOutcome.status });
    });

    return apiRouter;
}
