#!/usr/bin/env node

Error.stackTraceLimit = 20;

if (process.argv.some(e => e === "-d" || e === "--debug"))
    require("ts-node").register();

require("../Runner").default();