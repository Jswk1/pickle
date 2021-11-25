import { FsAsync } from "./FsAsync";
import * as Path from "path";

export enum LogSeverity {
    Error = 1,
    Warning = 2,
    Info = 4,
    Debug = 8
}

export enum LogColor {
    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",

    // Font color
    FgBlack = "\x1b[30m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
    FgBlue = "\x1b[34m",
    FgMagenta = "\x1b[35m",
    FgCyan = "\x1b[36m",
    FgWhite = "\x1b[37m",

    //Background color
    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m"
}

function clearColor(text: string) {
    text = text.replace(/\x1b\[[0-9]+m/g, "");

    return text;
}

export class Log {

    static severity = LogSeverity.Debug | LogSeverity.Info | LogSeverity.Warning | LogSeverity.Error;
    private static _logHistory: { severity: LogSeverity, timeStamp: Date, message: string }[] = [];

    private static log(severity: LogSeverity, message: any) {
        const timeStamp = new Date();

        this._logHistory.push({ severity, timeStamp, message });

        console.log(message);
    }

    static color(color: LogColor, text: string) {
        return `${color}${text}${LogColor.Reset}`;
    }

    static error(text: any) {
        if (this.severity & LogSeverity.Error) {
            this.log(LogSeverity.Error, this.color(LogColor.FgRed, text));
        }
    }

    static warn(text: any) {
        if (this.severity & LogSeverity.Warning) {
            this.log(LogSeverity.Warning, this.color(LogColor.FgYellow, text));
        }
    }

    static info(text: any) {
        if (this.severity & LogSeverity.Info) {
            this.log(LogSeverity.Info, this.color(LogColor.FgWhite, text));
        }
    }

    static debug(text: any) {
        if (this.severity & LogSeverity.Debug) {
            this.log(LogSeverity.Debug, this.color(LogColor.FgCyan, text));
        }
    }

    static async save(path: string) {
        this.info(`Writing log output to: ${path}`);

        const fullPath = Path.normalize(path);
        await FsAsync.mkdir(Path.dirname(fullPath), { recursive: true });
        await FsAsync.writeFile(fullPath, clearColor(this._logHistory.map(e => `${e.timeStamp.toISOString()}: ${e.message}`).join("\n")));
    }
}