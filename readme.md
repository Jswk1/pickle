[![Node.js CI](https://github.com/Jswk1/pickle/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/Jswk1/pickle/actions/workflows/node.js.yml)


# About

Lightweight version of CucumberJS library. Supports real-time test debugging.

See [CHANGELOG.md](CHANGELOG.md) for what changed in each version.

# Requirements

Node.js 22.22 or newer.

# API

## defineStep(pattern: string, options: IOptions, cb: Function)
## defineStep(pattern: string, cb: Function)
---

#### IOptions:
```typescript
{
    timeout?: number; // in milliseconds (default 60000ms)
}
```

Examples:
```typescript
defineStep("It should open a browser.", { timeout: 5000 }, async function () {
    // step body
});

defineStep("It should open a browser.", async function () {
    // step body
});

defineStep("It should open a browser {int} times.", async function (count: number) {
    /**
     * For 'It should open a browser 5 times.'
     * count will be '5'
     */
});

defineStep("It should open a display message {string}.", async function (message: string) {
    /**
     * For 'It should open a display message "An error has occured!".'
     * message will be 'An error has occured!'
     */

    this.variables["message"] = message; // Transfer variables between steps
});

defineStep(/It can also use regexes\. Look what I found\: ([a-z]+)\./, async function (message: string) {
    /**
     * For 'It can also use regexes. Look what I found: test.'
     * message will be 'test'
     */

    this.variables["message"] = message; // Transfer variables between steps
});
```

#### Default variable types
* int - {int}
* decimal - {decimal}
* string - {string}

## defineExpression(expr: IStepExpressionDef)
---
IStepExpressionDef:
```typescript
{
    key: string; // Unique
    pattern: RegExp;
    parser: (value: any) => any; // Used to convert to target type
}
```

Example:
```typescript
// Definition
defineExpression({
    key: "bool",
    pattern: /true|false/,
    parser: v => v === "true" ? true : v === "false" ? false : new Error("Value is in incorrect format.")
});

// Usage
defineStep("Checkbox state is set to {bool}.", async function (state: boolean) {
    /**
     * For 'Checkbox state is set to true.'
     * state will be 'true'
     */
});
```

## Given, When, Then, And, But
---
Aliases of `defineStep`. Use whichever reads best; the keyword in the feature file does not have to match the function used to define the step.

```typescript
import { Given, When, Then } from "pickle-test-runner";

Given("the user is logged in", async function () { /* ... */ });
```

## Step context: `this.variables`
---
Steps share data through `this.variables`. Each scenario starts with an empty `variables` object; Background steps run as part of each scenario and write into the same object.

Define steps with `function`, not arrow functions: arrow functions do not receive `this`.

```typescript
Given("the user {string} exists", async function (name: string) {
    this.variables.user = await createUser(name);
});

When("the user logs in", async function () {
    await login(this.variables.user);
});
```

## How a step is matched
---
*  String patterns match the whole step text. Values for `{int}`, `{decimal}`, `{string}` and custom expressions are converted and passed to the step function in order.
*  For a regular expression, its capturing groups are passed as strings.
*  If several definitions match, the one with the most `{...}` placeholders wins (a regular expression counts as none). If that is still a tie, the earliest definition wins.
*  A step that matches nothing fails when the feature is loaded: `Unsupported step '...'`.

## Hooks
---
```typescript
import { beforeFeature, afterFeature, beforeScenario, afterScenario, beforeStep, afterStep } from "pickle-test-runner";

beforeFeature(async (feature) => { });
afterFeature(async (feature, outcome) => { });
beforeScenario(async (scenario) => { });
afterScenario(async (scenario, outcome) => { });
beforeStep(async (scenario, step) => { });
afterStep(async (scenario, step, outcome) => { });
```
*  Each hook holds one function: calling `beforeScenario` again replaces the previous function. With several step files, the one loaded last wins.
*  `outcome.status` is `1` (ok), `2` (warning), `4` (error) or `8` (skipped); a step outcome also has `error` and `durationMs`.
*  An error thrown in `beforeStep` fails that step. An error thrown in any other hook currently stops the whole run with exit code 1, without writing reports.
*  In the debugger, only `beforeStep` and `afterStep` run.

# CLI

Command line usage:
```
pickle [(-r, --require <glob_expr>), (-j, --junit <xml_path>), (-o, --output <log_path>), (-d [port])] <feature_path>
```

Parameters:
*  `-r <glob_expr>` `--require <glob_expr>` - Path to directory with all step definitions. Should end with *.js or (preferably) *.ts
*  `-j <xml_path>` `--junit <xml_path>` - Path to save the JUnit xml with test execution summary
*  `-o <log_path>` `--output <log_path>` - Path to save the test execution log. Default is `./Log/Log.log`.
*  `--bridge-json <json_path>` - Path to save the Bridge JSON report
*  `--bridge-json-area <name>` - Area name to include in the Bridge JSON report
*  `-d [port]` `--debug [port]` - Execute test in debug mode. Default port is 3001. For details please take a look at the `Debugger` section.
*  `--dont-kill` - Don't exit the process when the run finishes
*  `--duplicate-warn` - Log a warning when the same step pattern is defined more than once
*  `--trace-size <number>` - Increase the error stack trace size. Default is 20.
*  `--build-step-maps` - Write a step map next to every feature instead of running tests. Requires `--always`. See `Step maps`.
*  `--always <glob_expr>` - With `--build-step-maps`: the step files that are loaded for every feature.
*  `--use-step-map` - Load only the `-r` files plus the step files listed in the feature's step map. See `Step maps`.

Examples:

#### Run only
```
pickle -r ./Flows/**/*.js ./test.feature
```

#### Run + generate junit xml + generate log file
```
pickle -r ./Flows/**/*.js -j ./junit.xml -o ./Output.log ./test.feature
```

#### Same as above but more verbose
```
pickle --require ./Flows/**/*.js --junit ./junit.xml --output ./Output.log ./test.feature
```

# Reports

Every run prints its results and exits with code `0` when all steps pass, otherwise `1`. Optionally:
*  `-j <path>` writes a JUnit XML report.
*  `-o <path>` writes the run log (default `./Log/Log.log`).
*  `--bridge-json <path>` writes a JSON report:

```json
{
    "name": "Login",
    "area": "Accounts",
    "description": "Feature description",
    "featureFileContent": "Feature: Login\n...",
    "featureFullPath": "./features/login.feature",
    "statusCount": { "ok": 3, "error": 0, "warning": 0, "skipped": 0 },
    "scenarios": [
        {
            "name": "Log in",
            "status": 1,
            "steps": [
                {
                    "name": "Given the user is logged in",
                    "status": 1,
                    "filePath": "/app/steps/login.js:12:1",
                    "durationMs": 35,
                    "errorStack": "Error: ... (only for failed steps)"
                }
            ]
        }
    ]
}
```
`status` is `1` (ok), `2` (warning), `4` (error) or `8` (skipped). `area` is set with `--bridge-json-area <name>` (empty otherwise), and `featureFullPath` is the feature path as given on the command line.

# Step maps

By default pickle loads every step file matched by `-r` for every feature, along with everything those files import. When many features run in parallel, each process pays for the whole step library even though a feature uses only a few steps.

Step maps record, for each feature, which step files it needs, so a run can load only those. Build them once (for example when building the test image), then run with `--use-step-map`. Local development needs neither: without the flags pickle loads everything, as before.

#### 1. Put shared files in one folder

Files that every feature needs go in one folder, loaded for every run:
*  files that register hooks (`beforeFeature`, `beforeScenario`, ...),
*  files that register custom expressions (`defineExpression`),
*  shared setup that other step files depend on being loaded.

Building the maps fails if a file that registers hooks or expressions is outside this folder.

#### 2. Build the maps
```
pickle --build-step-maps -r "./steps/**/*.js" --always "./steps/common/**/*.js" "./features/**/*.feature"
```
pickle loads all step files (without running anything), resolves every feature, and writes `<feature>.stepmap.json` next to each one: a hash of the feature, the `--always` files, and the other step files the feature needs. Paths are relative to the map file, so the project can be moved after building, e.g. built in `/src` and run from `/app`.

The build writes no maps and exits with an error listing every problem if:
*  a file that registers hooks or expressions is not matched by `--always`,
*  a step used by a feature is defined in more than one file (which definition wins depends on load order, and the always-loaded files load first in step-map runs),
*  a feature uses a step that is not defined, or a step would resolve differently with only the mapped files loaded.

#### 3. Run with the maps
```
pickle -r "./steps/common/**/*.js" --use-step-map ./features/login.feature
```
`-r` points at the always-loaded files (the same files as `--always` when building); pickle adds the files from `login.feature.stepmap.json`. The run fails before executing anything, asking to rebuild the maps, if:
*  the feature has no step map, or the map is from a different pickle map version,
*  the feature changed after its map was built,
*  a file listed in the map does not exist,
*  `-r` does not load all of the files that were `--always` when the map was built.

`--use-step-map` cannot be combined with `--debug`.

Step maps only reduce the memory of the Node.js process. If your steps drive a browser (e.g. Puppeteer), the browser processes are not affected.

# Debugger

Pickle test runner is delivered with web based debugging tool which allows running features in step by step mode.

```
pickle -r "./steps/**/*.js" -d ./features/login.feature        # port 3001
pickle -r "./steps/**/*.js" -d 4000 ./features/login.feature   # custom port
```
pickle loads the feature, starts the debugger and opens it in the browser. It is only reachable from the local machine (`http://localhost:<port>/`), and keeps running until you stop the process. Features:
*  Run feature steps and pause at any time
*  Step Breakpoints
*  Ability to edit test variables during execution. Variables start empty when you move to another scenario, as in a normal run.
*  On-demand reload of source files. Useful when step definitions are adjusted and you want to continue the test where it failed.
*  Optional automatic reload: when switched on in the UI, pickle reloads step files from the `-r` path as they change.

Only `beforeStep` and `afterStep` hooks run in the debugger, no reports are written, and `--use-step-map` cannot be used with it.

The source for Pickle Debugger is available in separate repository. The compiled bundle.js and index.html file is built and included in Pickle Test Runner.

https://github.com/Jswk1/pickle-debugger