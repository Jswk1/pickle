import * as Fs from "fs";
import * as Path from "path";

export class FsAsync {

    static async readdir(path: string) {
        return new Promise<string[]>((resolve, reject) => {
            Fs.readdir(path, (err, files) => {
                if (err)
                    reject(err);
                resolve(files);
            });
        });
    }

    static async exists(path: string) {
        return new Promise<boolean>((resolve) => {
            Fs.access(path, (err) => {
                resolve(err == null);
            });
        })
    }

    static async stat(path: string) {
        return new Promise<Fs.Stats>((resolve, reject) => {
            Fs.stat(path, (err, stat) => {
                if (err)
                    reject(err);
                resolve(stat);
            })
        })
    }

    static async readFile(path: string, encoding: BufferEncoding = "utf-8") {
        return new Promise<string>((resolve, reject) => {
            Fs.readFile(path, { encoding }, (err, content) => {
                if (err)
                    reject(err);

                resolve(content);
            });
        });
    }

    static async writeFile(path: string, data: string | Buffer, encoding: BufferEncoding = "utf-8") {
        return new Promise<void>((resolve, reject) => {
            Fs.writeFile(path, data, { encoding }, (err) => {
                if (err)
                    reject(err);

                resolve();
            });
        });
    }

    static async mkdir(path: string, options: Fs.MakeDirectoryOptions & { recursive: true; }) {
        return new Promise<void>((resolve, reject) => {
            Fs.mkdir(path, options, (err) => {
                if (err)
                    reject(err);

                resolve();
            });
        });
    }

    static async deepReaddir(path: string) {
        const temp: string[] = [];

        const fileNames = await this.readdir(path);
        for (const fileName of fileNames) {
            const fullPath = Path.join(path, fileName);
            const stat = await this.stat(fullPath);

            if (stat.isDirectory())
                temp.push(...await this.deepReaddir(fullPath));
            else
                temp.push(fullPath.split(Path.sep).join(Path.posix.sep));
        }

        return temp;
    }
}