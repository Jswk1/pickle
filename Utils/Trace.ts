export function getExecutionFileName() {
    const stack = new Error().stack.split("\n");

    const match = /\((.*\.(?:js|ts)\:\d+\:\d+)\)/.exec(stack[3]);

    if (match)
        return match[1];

    return null;
}