[![Node.js CI](https://github.com/Jswk1/pickle/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/Jswk1/pickle/actions/workflows/node.js.yml)


# About

Lightweight version of CucumberJS library. Supports real-time test debugging.

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

# Debugger

Pickle test runner is delivered with web based debugging tool which allows running features in step by step mode. It is only reachable from the local machine (`http://localhost:<port>/`). Features:
*  Run feature steps and pause at any time
*  Step Breakpoints
*  Ability to edit test variables during execution
*  On-demand reload of source files. Useful when step definitions are adjusted and you want to continue the test where it failed.

The source for Pickle Debugger is available in separate repository. The compiled bundle.js and index.html file is built and included in Pickle Test Runner.

https://github.com/Jswk1/pickle-debugger