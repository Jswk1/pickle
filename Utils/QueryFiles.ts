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
// C:\some\path\*.js -> C:/some/path
export function extractEntryDirectory(globPattern: string) {
    const parts = toPosix(globPattern).split("/");
    const entryPath: string[] = [];

    for (const part of parts) {
        if (["*", "?"].some(e => part.includes(e)))
            break;

        entryPath.push(part);
    }

    let finalPath = entryPath.join("/");

    if (finalPath.startsWith("."))
        return finalPath;

    // Windows absolute path (drive letter). A bare "C:" would mean "current directory on drive C", so use the drive root.
    if (/^[A-Za-z]:$/.test(finalPath))
        return finalPath + "/";

    if (/^[A-Za-z]:\//.test(finalPath))
        return finalPath;

    if (globPattern.startsWith("/"))
        return finalPath || "/";

    // Anything else is relative to the working directory ("Tests/**/*.js" -> "Tests", "**/*.js" -> ".").
    return finalPath || ".";
}

export function toPosix(path: string) {
    return path.split(Path.sep).join(Path.posix.sep);
}

export async function queryFilesByGlob(path: string) {
    const entryPoint = extractEntryDirectory(path);
    const regexp = createRegexFromPattern(toPosix(path));

    // A path without wildcards may point straight at a single file.
    if ((await FsAsync.stat(entryPoint)).isFile())
        return [toPosix(entryPoint)];

    const allFilePaths = await FsAsync.deepReaddir(entryPoint);
    const filteredFilePaths = allFilePaths.filter(e => regexp.test(e));

    return filteredFilePaths;
}