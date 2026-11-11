import { expect } from "chai";
import { execFileSync } from "child_process";
import * as Fs from "fs";
import * as Os from "os";
import * as Path from "path";
import { setCurrentScriptFile } from "../Step/ScriptOrigin";
import { defineStep, IStepDefinition, loadStepDefinitions } from "../Step/Step";
import { loadFeature } from "./Loader";
import { computeStepMapFiles, hashFeature, IStepMap, STEP_MAP_SUFFIX } from "./StepMap";

/** Registers steps as if they were defined while pickle was loading the given file. */
function defineIn(file: string, ...patterns: string[]) {
    setCurrentScriptFile(file);
    try {
        for (const pattern of patterns)
            defineStep(pattern, () => { });
    } finally {
        setCurrentScriptFile(null);
    }
}

function register() {
    const registrations: IStepDefinition[] = [];
    loadStepDefinitions({}, e => registrations.push(e));
    return registrations;
}

describe("Step maps", () => {
    describe("computeStepMapFiles", () => {
        it("should list only the non-always files whose steps the feature uses, in load order", () => {
            defineIn("/steps/common.js", "stepmap common step");
            defineIn("/steps/login.js", "stepmap user logs in");
            defineIn("/steps/cart.js", "stepmap user adds {int} items");
            defineIn("/steps/unused.js", "stepmap something unused");
            const registrations = register();

            const feature = loadFeature(`
            Feature: Map
                Background:
                    Given stepmap common step
                Scenario: S
                    When stepmap user adds 2 items
                    And stepmap user logs in
            `);

            const result = computeStepMapFiles(feature, registrations, new Set(["/steps/common.js"]));

            expect(result.problems).to.deep.equal([]);
            expect(result.files).to.deep.equal(["/steps/login.js", "/steps/cart.js"]);
        });

        it("should report steps whose file is unknown", () => {
            defineStep("stepmap step defined outside loading", () => { });
            const registrations = register();

            const feature = loadFeature(`
            Feature: Map
                Scenario: S
                    Given stepmap step defined outside loading
            `);

            const result = computeStepMapFiles(feature, registrations, new Set());

            expect(result.problems).to.have.length(1);
            expect(result.problems[0]).to.contain("cannot tell which step file defines it");
        });

        it("should report a used pattern that is defined in more than one file", () => {
            defineIn("/steps/a.js", "stepmap duplicated step");
            defineIn("/steps/b.js", "stepmap duplicated step");
            const registrations = register();

            const feature = loadFeature(`
            Feature: Map
                Scenario: S
                    Given stepmap duplicated step
            `);

            const result = computeStepMapFiles(feature, registrations, new Set());

            expect(result.problems.some(e => e.includes("is defined in more than one file"))).to.be.true;
        });
    });

    describe("pickle --build-step-maps (CLI)", function () {
        this.timeout(30000);

        const pickleBin = Path.join(__dirname, "..", "bin", "pickle.js");
        const runnerPath = toForwardSlashes(Path.join(__dirname, "..", "Runner"));
        let root: string;

        function toForwardSlashes(path: string) {
            return path.split(Path.sep).join("/");
        }

        function write(relativePath: string, content: string) {
            const fullPath = Path.join(root, relativePath);
            Fs.mkdirSync(Path.dirname(fullPath), { recursive: true });
            Fs.writeFileSync(fullPath, content);
        }

        function run(...args: string[]) {
            try {
                return { status: 0, output: execFileSync(process.execPath, [pickleBin, ...args], { cwd: root, encoding: "utf-8", stdio: "pipe" }) };
            } catch (ex) {
                return { status: ex.status as number, output: `${ex.stdout}${ex.stderr}` };
            }
        }

        beforeEach(() => {
            root = Fs.mkdtempSync(Path.join(Os.tmpdir(), "pickle-stepmap-"));

            write("steps/common/hooks.js", `
                const { beforeScenario, Given } = require("${runnerPath}");
                beforeScenario(() => { });
                Given("the app is open", () => { });
            `);
            write("steps/login.js", `
                const { When } = require("${runnerPath}");
                When("the user logs in", () => { });
            `);
            write("steps/cart.js", `
                const { When } = require("${runnerPath}");
                When("the user adds {int} items", () => { });
            `);
            write("features/login.feature", `
Feature: Login
    Scenario: Log in
        Given the app is open
        When the user logs in
`);
            write("features/cart/cart.feature", `
Feature: Cart
    Scenario: Add items
        Given the app is open
        When the user adds 2 items
`);
        });

        afterEach(() => {
            Fs.rmSync(root, { recursive: true, force: true });
        });

        it("should write a step map next to every feature", () => {
            const result = run("--build-step-maps", "-r", "steps/**/*.js", "--always", "steps/common/**/*.js", "features/**/*.feature");
            expect(result.status, result.output).to.equal(0);

            const loginMap: IStepMap = JSON.parse(Fs.readFileSync(Path.join(root, "features", "login.feature" + STEP_MAP_SUFFIX), "utf-8"));
            const loginContent = Fs.readFileSync(Path.join(root, "features", "login.feature"), "utf-8");
            expect(loginMap.files).to.deep.equal(["../steps/login.js"]);
            expect(loginMap.featureHash).to.equal(hashFeature(loginContent));

            const cartMap: IStepMap = JSON.parse(Fs.readFileSync(Path.join(root, "features", "cart", "cart.feature" + STEP_MAP_SUFFIX), "utf-8"));
            expect(cartMap.files).to.deep.equal(["../../steps/cart.js"]);
        });

        it("should fail without writing maps when a file with hooks is not always loaded", () => {
            const result = run("--build-step-maps", "-r", "steps/**/*.js", "--always", "steps/login.js", "features/**/*.feature");

            expect(result.status).to.equal(1);
            expect(result.output).to.contain("registers beforeScenario hook but is not matched by --always");
            expect(Fs.existsSync(Path.join(root, "features", "login.feature" + STEP_MAP_SUFFIX))).to.be.false;
        });

        it("should fail when a feature uses an undefined step", () => {
            write("features/broken.feature", `
Feature: Broken
    Scenario: S
        Given a step nobody defined
`);
            const result = run("--build-step-maps", "-r", "steps/**/*.js", "--always", "steps/common/**/*.js", "features/**/*.feature");

            expect(result.status).to.equal(1);
            expect(result.output).to.contain("features/broken.feature: Unsupported step 'a step nobody defined'");
        });

        it("should require --always", () => {
            const result = run("--build-step-maps", "-r", "steps/**/*.js", "features/**/*.feature");

            expect(result.status).to.equal(1);
            expect(result.output).to.contain("--build-step-maps requires --always");
        });
    });
});
