import * as Koa from "koa";
import * as KoaStatic from "koa-static"
import { Log } from "../Utils/Log";

export function startDebugger(port = 3001) {
    const server = new Koa();

    // Serve static files
    server.use(KoaStatic("./Client"));

    server.on("error", (err) => {
        Log.error(err);
    });

    server.listen(port, () => {
        Log.info(`Navigate to http://localhost:${port}/`);
    });
}
