// Import Node.js Dependencies
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import tap from "tap";
import esmock from "esmock";
import { API_URL } from "@nodesecure/ossf-scorecard-sdk";
import { Ok } from "@openally/result";
import { MockAgent, setGlobalDispatcher } from "undici";
import cliRunner from "../../../cliRunner/dist/buildCliRunnerClass.js";

// Import Internal Dependencies
import { getExpectedScorecardLines } from "../helpers/utils.js";
import * as scorecard from "../../src/commands/scorecard.js";

// CONSTANTS
const MockCli = new cliRunner.MockCliBuilder(fileURLToPath(import.meta.url));

function scenario() {
  const { baseUrl, intercept, response } = undiciMockAgentOptions;
  const mockAgent = new MockAgent();
  const pool = mockAgent.get(baseUrl);

  mockAgent.disableNetConnect();
  pool.intercept(intercept).reply(response.status, () => response.body);
  setGlobalDispatcher(mockAgent);

  scorecard.main(packageName).then(() => process.exit(0));
}

tap.test("scorecard should display fastify scorecard", async(tape) => {
  MockCli.mark("KEKW");

  const packageName = "fastify/fastifyyyyyy";
  const undiciMockAgentOptions = {
    baseUrl: API_URL,
    intercept: {
      path: `/projects/github.com/${packageName}`,
      method: "GET"
    },
    response: {
      status: 200,
      body: {
        date: "2222-12-31",
        repo: {
          name: `github.com/${packageName}`
        },
        score: 5.2,
        checks: [
          {
            name: "Maintained",
            score: -1,
            reason: "Package is maintained"
          }
        ]
      }
    }
  };

  const expectedLines = getExpectedScorecardLines(packageName, undiciMockAgentOptions.response.body);
  const givenLines = await MockCli.run({
    fn: scenario,
    constants: ["mockBody", "packageName", "undiciMockAgentOptions"]
  });

  tape.same(givenLines, expectedLines, `lines should be ${expectedLines}`);
  tape.end();
});

tap.test("should not display scorecard for unknown repository", async(tape) => {
  MockCli.mark("KEKWAIT");
  const packageName = "unkown/repository";
  const undiciMockAgentOptions = {
    baseUrl: API_URL,
    intercept: {
      path: `/projects/github.com/${packageName}`,
      method: "GET"
    },
    response: {
      body: {},
      status: 500
    }
  };

  const expectedLines = [
    `${packageName} is not part of the OSSF Scorecard BigQuery public dataset.`
  ];
  const givenLines = await MockCli.run({
    fn: scenario,
    constants: ["mockBody", "packageName", "undiciMockAgentOptions"]
  });

  tape.same(givenLines, expectedLines, `lines should be ${expectedLines}`);
  tape.end();
});

tap.test("should retrieve repository whithin git config", async(tape) => {
  const testingModule = await esmock("../../src/commands/scorecard.js", {
    fs: {
      readFileSync: () => [
        "[remote \"origin\"]",
        "\turl = git@github.com:myawesome/repository.git"
      ].join("\n")
    }
  });
  tape.same(testingModule.getCurrentRepository(), Ok("myawesome/repository"));
  tape.end();
});

tap.test("should not find origin remote", async(tape) => {
  const testingModule = await esmock("../../src/commands/scorecard.js", {
    fs: {
      readFileSync: () => "just one line"
    }
  });
  const result = testingModule.getCurrentRepository();
  tape.equal(result.err, true);
  tape.equal(result.val, "Cannot find origin remote.");
});

tap.test("should support github only", async(tape) => {
  const testingModule = await esmock("../../src/commands/scorecard.js", {
    fs: {
      readFileSync: () => [
        "[remote \"origin\"]",
        "\turl = git@gitlab.com:myawesome/repository.git"
      ].join("\n")
    }
  });
  const result = testingModule.getCurrentRepository();
  tape.equal(result.err, true);
  tape.equal(result.val, "OSSF Scorecard supports projects hosted on Github only.");
});
