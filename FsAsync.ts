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

    static async stat(path: string) {
        return new Promise<Fs.Stats>((resolve, reject) => {
            Fs.stat(path, (err, stat) => {
                if (err)
                    reject(err);
                resolve(stat);
            })
        })
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