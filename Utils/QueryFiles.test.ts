import { expect } from "chai";
import { extractEntryDirectory, createRegexFromPattern } from "./QueryFiles";

describe("Glob Pattern Tests", () => {
    describe("extractEntryDirectory", () => {
        it("should find entry point for paths without glob pattern", () => {
            expect(extractEntryDirectory("/some/path")).to.equal("/some/path");
            expect(extractEntryDirectory("./some/path")).to.equal("./some/path");
            expect(extractEntryDirectory("some")).to.equal("some");
        });

        it("should find entry point for paths with glob pattern", () => {
            expect(extractEntryDirectory("/some/path/**/*")).to.equal("/some/path");
            expect(extractEntryDirectory("./some/path/*.js")).to.equal("./some/path");
            expect(extractEntryDirectory("./some/pa*th/te*st/*.exe")).to.equal("./some");
            expect(extractEntryDirectory("./**/*")).to.equal(".");
        });

        it("should treat paths without a leading './' or '/' as relative", () => {
            expect(extractEntryDirectory("some/path/*.js")).to.equal("some/path");
            expect(extractEntryDirectory("Tests/**/*.js")).to.equal("Tests");
            expect(extractEntryDirectory("**/*.js")).to.equal(".");
        });

        it("should keep the root for absolute patterns that start with a wildcard", () => {
            expect(extractEntryDirectory("/**/*.js")).to.equal("/");
        });

        it("should keep Windows absolute paths as they are", () => {
            expect(extractEntryDirectory("C:/some/path/**/*.js")).to.equal("C:/some/path");
            expect(extractEntryDirectory("c:/some/path")).to.equal("c:/some/path");
            expect(extractEntryDirectory("C:/*.js")).to.equal("C:/");
        });

        if (process.platform === "win32") {
            it("should accept Windows absolute paths with backslashes", () => {
                expect(extractEntryDirectory("C:\\some\\path\\*.js")).to.equal("C:/some/path");
            });
        }
    });

    describe("createRegexFromPattern", () => {
        it("should create regex for path without glob pattern", () => {
            expect(createRegexFromPattern("/some/path/ass.js").toString()).to.equal("/^\\/some\\/path\\/ass\\.js$/");
            expect(createRegexFromPattern("./some/path/ass.js").toString()).to.equal("/^some\\/path\\/ass\\.js$/");
            expect(createRegexFromPattern("./some/path/").toString()).to.equal("/^some\\/path\\/$/");
            expect(createRegexFromPattern("./some/path").toString()).to.equal("/^some\\/path$/");
        });

        it("should create regex for path with glob pattern", () => {
            expect(createRegexFromPattern("/some/path/**/*").toString()).to.equal("/^\\/some\\/path((?:[^/]*(?:\\/|$))*).*$/");
            expect(createRegexFromPattern("./some/path/*.js").toString()).to.equal("/^some\\/path\\/.*\\.js$/");
            expect(createRegexFromPattern("./some/pa*th/te*st/*.exe").toString()).to.equal("/^some\\/pa.*th\\/te.*st\\/.*\\.exe$/");
        });

        it("should create regex that tests paths correctly", () => {
            const regexpNoGlob = createRegexFromPattern("/some/path/ass.js");
            expect(regexpNoGlob.test("/some/path/ass.js")).to.be.true;
            expect(regexpNoGlob.test("/some/path")).to.be.false;
            expect(regexpNoGlob.test("/some/path/ass")).to.be.false;

            const regexpGlob = createRegexFromPattern("/some/path/**/*");
            expect(regexpGlob.test("/some/path/a/b/c/d.js")).to.be.true;
            expect(regexpGlob.test("/some/path/some/path")).to.be.true;
            expect(regexpGlob.test("/path/some/some/path")).to.be.false;

            const regexpGlob2 = createRegexFromPattern("/some/path/**/some2/path2/*test*.exe");
            expect(regexpGlob2.test("/some/path/a/b/c/some2/path2/ffffffftestsssss.exe")).to.be.true;
            expect(regexpGlob2.test("/some/path/some2/path2/test.exe")).to.be.true;
            expect(regexpGlob2.test("/some2/path2/some2/path2/test.exe")).to.be.false;

            const regexpGlob3 = createRegexFromPattern("./Flows/**/*.js");
            expect(regexpGlob3.test("Flows/App.js")).to.be.true;

            const regexpGlob4 = createRegexFromPattern("Flows/**/*.js");
            expect(regexpGlob4.test("Flows/App.js")).to.be.true;
            expect(regexpGlob4.test("Flows/a/b/App.js")).to.be.true;
            expect(regexpGlob4.test("Other/App.js")).to.be.false;
        });
    });
});