export interface ISerializabjeJsonNodeAttribute {
    name: string;
    value?: string;
    nameOnly?: boolean; // name="value" or just name
}

export interface ISerializabjeJsonNode {
    name: string;
    value?: string | number;
    attributes?: ISerializabjeJsonNodeAttribute[];

    children?: ISerializabjeJsonNode[];
    selfClose?: boolean; // <node></node> or <node /> ?
}

export function jsonToXML(input: ISerializabjeJsonNode, encoding: "UTF-8" = "UTF-8", version: string = "1.0") {
    const xmlLines: string[] = [
        `<?xml version="${version}" encoding="${encoding}"?>`,
        ...nodeToXmlString(input)
    ];

    return xmlLines.join("");
}

function nodeToXmlString(node: ISerializabjeJsonNode) {
    const xmlLines: string[] = [];
    const attributesString = nodeAttributesToString(node.attributes);

    if (node.name?.length == 0)
        throw new Error("Node name is required.");

    if (node.selfClose) {
        xmlLines.push(`<${node.name} ${attributesString}/>`);
    } else {
        if (attributesString)
            xmlLines.push(`<${node.name} ${attributesString}>${node.value?.toString().length > 0 ? node.value : ""}`);
        else
            xmlLines.push(`<${node.name}>${node.value?.toString().length > 0 ? node.value : ""}`);

        if (node.children?.length > 0)
            for (const children of node.children)
                xmlLines.push(...nodeToXmlString(children));

        xmlLines.push(`</${node.name}>`);
    }

    return xmlLines;
}

function nodeAttributesToString(attributes: ISerializabjeJsonNodeAttribute[]) {
    if (!Array.isArray(attributes) || attributes.length === 0)
        return "";

    let output: string[] = [];

    for (const attr of attributes) {
        if (attr.nameOnly)
            output.push(attr.name);
        else
            output.push(`${attr.name}="${attr.value}"`);
    }

    return output.join(" ");
}