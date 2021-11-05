import { FsAsync } from "./FsAsync";
import * as Path from "path";

export function createRegexFromPattern(globPattern: string) {
    let regexpString = "^";

    for (let i = 0; i < globPattern.length; i++) {
        const char = globPattern[i];

        switch (char) {
            case ".":
                if (i === 0 && globPattern[i + 1] === "/")
                    i++;
                else
                    regexpString += `\\${char}`;

                break;
            case "(":
            case ")":
            case "+":
            case ":":
                regexpString += `\\${char}`;
                break;
            case "/":
                const charRange = globPattern.slice(i, i + 4);
                if (charRange === "/**/") {
                    i += 3; // check was done at first star -> advance to skip the whole sequence
                    regexpString += "((?:[^/]*(?:\/|$))*)";
                }
                else
                    regexpString += `\\${char}`;
                break;
            case "?": // Convert to any char in regex
                regexpString += ".";
                break;
            case "*":
                regexpString += ".*";

                break;
            default:
                regexpString += char;
        }
    }

    return new RegExp(regexpString + "$");
}

// Calculate entry directory:
// /some/path/**/* -> /some/path
// ./some/path/*.js -> ./some/path
// ./some/path/te*st/*.exe -> ./some/path etc
export function extractEntryDirectory(globPattern: string) {
    const parts = globPattern.split("/");
    const entryPath: string[] = [];

    for (const part of parts) {
        if (["*", "?"].some(e => part.indexOf(e) !== -1))
            break;

        entryPath.push(part);
    }

    let finalPath = entryPath.join("/");

    if (finalPath.startsWith("."))
        return finalPath;

    if (!finalPath.startsWith("/"))
        return "/" + finalPath;

    return finalPath;
}

function toPosix(path: string) {
    return path.split(Path.sep).join(Path.posix.sep);
}

export async function queryFiles(path: string) {
    const entryPoint = Path.isAbsolute(path) ? path : extractEntryDirectory(path);
    const regexp = createRegexFromPattern(toPosix(path));
    const allFilePaths = await FsAsync.deepReaddir(entryPoint);
    const filteredFilePaths = allFilePaths.filter(e => regexp.test(e));

    return filteredFilePaths;
}