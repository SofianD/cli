import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import tap from "tap";
import cliRunner from "../../../cliRunner/dist/buildCliRunnerClass.js";

// Import Internal Dependencies
import { VERIFY_EXPECTED_LINES } from "../fixtures/verifyExpectedStdout.js";
import * as verify from "../../src/commands/verify.js";

// CONSTANTS
const MockCli = new cliRunner.MockCliBuilder(fileURLToPath(import.meta.url));

tap.test("should execute verify command", async(tape) => {
  MockCli.mark("1");

  const givenLines = await MockCli.run({
    fn: function main() {
      function mockVerify(packageName) {
        return ({
          files: {
            list: ["index.js", "package.json"],
            extensions: [".js", ".json"],
            minified: ["index.min.js"]
          },
          directorySize: 2048,
          uniqueLicenseIds: ["MIT"],
          ast: {
            dependencies: {
              "index.js": {
                "node:os": {
                  unsafe: false,
                  inTry: false,
                  location: {
                    start: {
                      line: 2,
                      column: 0
                    },
                    end: {
                      line: 2,
                      column: 34
                    }
                  }
                }
              }
            },
            warnings: [
              {
                kind: "suspicious-literal",
                location: [[4, 1], [4, 8]],
                value: 5.268656716417911,
                i18n: "sast_warnings.suspicious_literal",
                severity: "Warning",
                file: "index.js"
              }
            ]
          }
        });
      }

      verify.main("myawesome/package", {}, mockVerify);
    }
  });

  tape.plan(VERIFY_EXPECTED_LINES.length);

  for (const line of givenLines) {
    const expectedLine = VERIFY_EXPECTED_LINES.shift();
    tape.equal(line.trimEnd(), expectedLine, `should be ${expectedLine}`);
  }

  tape.end();
});
