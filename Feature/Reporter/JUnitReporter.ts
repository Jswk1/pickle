import { encodeXmlString, ISerializabjeJsonNode, jsonToXML, stubify } from "../../Utils/JsonToXML";
import { IFeatureOutcome, OutcomeStatus } from "../Executor";
import * as Path from "path";
import { FsAsync } from "../../Utils/FsAsync";
import { IRunnerOptions } from "../../Options";

function toSeconds(milliseconds: number) {
    return milliseconds / 1000;
}

export async function reportFeatureToJUnitXml(featureOutcome: IFeatureOutcome, options: IRunnerOptions) {

    const rootJson: ISerializabjeJsonNode = {
        name: "testsuites",
        children: []
    }

    for (const scenarioOutcome of featureOutcome.scenarioOutcomes) {
        const scenarioJson: ISerializabjeJsonNode = {
            name: "testsuite",
            attributes: [
                {
                    name: "name",
                    value: `${stubify(featureOutcome.feature.name)};${stubify(scenarioOutcome.scenario.name)}`
                },
                {
                    name: "tests",
                    value: scenarioOutcome.scenario.steps.length.toString()
                },
                {
                    name: "errors",
                    value: "0" // Not used
                }
            ],
            children: [
                { name: "properties" }
            ]
        }

        let
            failureCount = 0,
            skippedCount = 0,
            timeMs = 0;

        for (const stepOutcome of scenarioOutcome.stepOutcomes) {
            const stepJson: ISerializabjeJsonNode = {
                name: "testcase",
                attributes: [
                    { name: "classname", value: stubify(stepOutcome.step.name) },
                    { name: "name", value: encodeXmlString(stepOutcome.step.name) },
                    { name: "time", value: toSeconds(stepOutcome.durationMs).toString() }
                ],
                children: []
            };

            if (stepOutcome.status === OutcomeStatus.Error) {
                failureCount++;
                stepJson.children.push({
                    name: "failure",
                    attributes: [{ name: "message", value: "Error" }],
                    value: encodeXmlString(stepOutcome.error.stack)
                });
            }

            if (stepOutcome.status === OutcomeStatus.Skipped) {
                skippedCount++;
                stepJson.children.push({
                    name: "skipped"
                });
            }

            timeMs += stepOutcome.durationMs;

            scenarioJson.children.push(stepJson);
        }

        scenarioJson.attributes.push(...[
            {
                name: "failures",
                value: failureCount.toString()
            },
            {
                name: "skipped",
                value: skippedCount.toString()
            },
            {
                name: "time",
                value: toSeconds(timeMs).toString()
            }
        ]);

        rootJson.children.push(scenarioJson);
    }

    const xml = jsonToXML(rootJson);
    const outFullPath = Path.normalize(Path.join(process.cwd(), options.jUnitXmlOutputPath));
    await FsAsync.mkdir(Path.dirname(outFullPath), { recursive: true });
    await FsAsync.writeFile(outFullPath, xml);
}