# Changelog

All notable changes to pickle-test-runner. Versions follow [Semantic Versioning](https://semver.org/).

## 3.1.2 - 2026-11-11
### Changed
- The npm package contains only runtime files (#10, #22). Tests, `tsconfig` files, logs, sample reports and editor/CI configuration are no longer published (109 files / 801 KB unpacked → 74 files / 629 KB).

## 3.1.1 - 2026-11-11
### Fixed
- Gherkin keywords (`Feature:`, `Background:`, `Scenario:`, `Scenario Outline:`, `Examples:`) are only recognised at the start of a line (#9, #21). Previously a step such as `Then the title is "Scenario: test"` was split into a new scenario, and a description containing `Background:` was cut off.
- Feature files saved with a UTF-8 byte order mark keep their feature name and description.

## 3.1.0 - 2026-11-11
### Added
- Step maps (#20): `--build-step-maps` records which step files each feature needs, and `--use-step-map` loads only those files (plus the `-r` files) for a run. Reduces memory when many features run in parallel. See "Step maps" in the README.

## 3.0.0 - 2026-11-11
### Breaking
- Requires Node.js 22.22 or newer.
- The debugger only listens on `127.0.0.1` (no longer reachable from other machines).

### Security
- The debugger's `POST /api/reload` loaded whatever path the request sent, so anyone who could reach the debugger port could run code on the machine (introduced in 2.2.3). It now always reloads from the `-r` path.
- Upgraded express to 5.x. `npm audit` reports no vulnerabilities in runtime dependencies (was 10, including 1 critical).

### Fixed
- A step defined with options but no `timeout` (`defineStep("x", {}, fn)`) failed after about 1 ms. It now gets the 60 s default.
- `-r` paths:
  - Absolute Windows paths (`C:\steps\**\*.js`) now work.
  - Paths without a leading `./` (`steps/**/*.js`) are relative to the working directory instead of the drive root (#6).
  - A path to a single file now loads that file.
- The debugger's file watcher noticed no changes when `-r` was an absolute path.
- If the debugger cannot start (e.g. the port is in use), it reports an error instead of claiming it is running.

### Changed
- Upgraded dependencies:
  - express 4 → 5;
  - chokidar 3 → 6;
  - TypeScript 5 → 7;
  - mocha 10 → 12;
  - chai 4 → 6.
- README: documented the CLI flags that were missing and corrected the `timeout` step option.

## 2.2.4 - 2.2.5 - 2024-04-18
### Fixed
- Type declarations (`.d.ts`) are generated again (2.2.5). 2.0.0 to 2.2.4 shipped outdated declarations left over from 1.x builds, missing the modules added in 2.x.

## 2.2.3 - 2024-04-18
### Added
- The debugger's reload endpoint accepts a path to reload from. **Removed in 3.0.0 for security reasons.**

## 2.2.2 - 2024-04-08
### Added
- `--bridge-json-area <name>` adds an area name to the Bridge JSON report (#18).

## 2.2.1 - 2024-01-13
### Changed
- The debugger's file watcher is switched on and off from the debugger UI. The `-w` flag was removed.

## 2.2.0 - 2024-01-10
### Changed
- The warning for a step pattern defined more than once is only logged with `--duplicate-warn`. In 2.0.0 and 2.1.0 it was always logged, and the flag had no effect.
- The file watcher waits for changes to settle (250 ms) before reloading.

## 2.1.0 - 2024-01-08
### Added
- `--bridge-json <path>` writes a Bridge JSON report.

## 2.0.0 - 2024-01-05
### Breaking
- `ts-node` is no longer a dependency, so `.ts` step files are not compiled automatically. Compile them first, or load them with your own TypeScript loader.
- The default step timeout changed from 10 s to 60 s.
- A step pattern defined more than once logs a warning instead of failing.

### Added
- `--trace-size <number>` sets the error stack trace length.
- Debugger: reloads step files when they change (`-w`; moved to the UI in 2.2.1).

## 1.x - 2021-11 to 2023-08
The first releases. Included:
- the `pickle` CLI;
- the web debugger;
- Scenario Outlines;
- JUnit output;
- log files;
- custom expressions;
- matching the most specific step when several match;
- single-quoted `{string}` values;
- a stack trace length of 20 (#13).
