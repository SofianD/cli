import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Import Third-party Dependencies
import tap from "tap";
import stripAnsi from "strip-ansi";
import * as i18n from "@nodesecure/i18n";
import cliRunner from "../../../cliRunner/dist/buildCliRunnerClass.js";

// Import Internal Dependencies
import * as summary from "../../src/commands/summary.js";

// CONSTANTS
const MockCli = new cliRunner.MockCliBuilder(fileURLToPath(import.meta.url));

tap.test("summary should execute summary command on fixtures 'result-test1.json'", async(tape) => {
  MockCli.mark("1");

  const givenLines = await MockCli.run({
    fn: function main() {
      summary.main(join("test", "fixtures", "result-test1.json"));
    }
  });

  await i18n.setLocalLang("english");
  const lines = [
    /Global Stats: express.*$/,
    /.*/,
    /Total of packages:.*65.*$/,
    /Total size:.*1.62 MB.*$/,
    /Packages with indirect dependencies:.*6.*$/,
    /.*/,
    /Extensions:.*$/,
    /\(48\) {2}- \(50\) \.md - \(50\) \.json - \(50\) \.js - \(5\) \.ts - \(2\) \.yml.*$/,
    /.*/,
    /Licenses:.*$/,
    /\(47\) MIT - \(2\) ISC.*$/,
    /.*/
  ];
  tape.plan(lines.length * 2);

  for (const line of givenLines) {
    const regexp = lines.shift();
    tape.ok(regexp, "we are expecting this line");
    tape.ok(regexp.test(stripAnsi(line)), `line (${line}) matches ${regexp}`);
  }

  tape.end();
});
