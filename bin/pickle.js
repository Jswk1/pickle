#!/usr/bin/env node
if (process.argv.some(e => e === "-d"))
    require("ts-node").register();
require("../Runner").default();
//# sourceMappingURL=pickle.js.map