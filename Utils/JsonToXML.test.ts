import { expect } from "chai";
import { ISerializabjeJsonNode, jsonToXML } from "./JsonToXML";
import { logDuration } from "./Time";

describe("JsonToXML tests", () => {
    describe("jsonToXML", () => {
        it("should generate xml nodes with values", () => {
            const json1: ISerializabjeJsonNode = {
                name: "root-node",
                value: 123
            }
            const json1Output = `<?xml version="1.0" encoding="UTF-8"?><root-node>123</root-node>`;

            expect(jsonToXML(json1)).to.equal(json1Output);
        });

        it("should generate self closing tags", () => {
            const json1: ISerializabjeJsonNode = {
                name: "root",
                selfClose: true
            }
            const json1Output = `<?xml version="1.0" encoding="UTF-8"?><root />`;

            expect(jsonToXML(json1)).to.equal(json1Output);
        });

        it("should generate xml nodes with children", () => {
            const json1: ISerializabjeJsonNode = {
                name: "root-node",
                children: [
                    {
                        name: "child-1",
                        value: "test"
                    },
                    {
                        name: "child-2",
                        selfClose: true
                    },
                ]
            }
            const json1Output = `<?xml version="1.0" encoding="UTF-8"?><root-node><child-1>test</child-1><child-2 /></root-node>`;

            expect(jsonToXML(json1)).to.equal(json1Output);
        });

        it("should generate xml nodes with attributes", () => {
            const json1: ISerializabjeJsonNode = {
                name: "root-node",
                value: "root-value",
                attributes: [
                    {
                        name: "attr1",
                        value: "attr1value"
                    },
                    {
                        name: "attr2",
                        nameOnly: true
                    }
                ]
            }
            const json1Output = `<?xml version="1.0" encoding="UTF-8"?><root-node attr1="attr1value" attr2>root-value</root-node>`;

            expect(jsonToXML(json1)).to.equal(json1Output);
        });
    });
});