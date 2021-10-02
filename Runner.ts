

import { argv } from "process";
import * as Path from "path";
import { steps } from "./Step";
import { queryFiles } from "./QueryFiles";

(async () => {
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (["-r", "--require"].some(e => e === arg)) {
            const argValue = argv[i + 1];
            if (!argValue || argValue === "")
                throw new Error("Missing path.");

            console.log("path", argValue);
            const files = await queryFiles(argValue);
            const executionDirectory = process.cwd();

            for (const file of files) {
                const fullPath = Path.join(executionDirectory, file);
                console.log(`Loading file: ${fullPath}`);
                require(fullPath);
            }
        }
    }

    console.log("loaded steps");
    console.log(steps);
})();

export { defineStep } from "./Step";