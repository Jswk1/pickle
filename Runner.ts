

import { argv } from "process";
import * as Path from "path";
import { steps } from "./Step";
import { queryFiles } from "./QueryFiles";

interface IOptions {
    path: string;
}

function parseArgs(): IOptions {
    const options: IOptions = { path: null };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const nextArg = argv[i + 1]; // It's argument value most of the time

        if (["-r", "--require"].some(e => e === arg)) {
            if (!nextArg?.length)
                throw new Error(`[Arg '${arg}'] Expected path.`);

            options.path = nextArg;
        }
    }

    return options;
}

async function execute() {
    const options = parseArgs();

    const files = await queryFiles(options.path);
    const executionDirectory = process.cwd();

    for (const file of files) {
        const fullPath = Path.join(executionDirectory, file);
        console.log(`Loading file: ${fullPath}`);
        require(fullPath);
    }

    console.log("Loaded steps", steps);
}

(async () => {
    await execute();
})();

export { defineStep } from "./Step";