// Regression cases for the release job gate. They run offline with the GitHub
// expression evaluator. They do not start a workflow, push a tag, or release.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { data, Evaluator, Lexer, Parser } from "@actions/expressions";
import { truthy } from "@actions/expressions/result";
import { parse } from "yaml";

const root = new URL("../../", import.meta.url);
const workflow = (name) => parse(readFileSync(new URL(`.github/workflows/${name}`, root), "utf8"));
const release = workflow("release.yml");
const job = release.jobs.tag_and_release;

function gate(github) {
  const tree = new Parser(new Lexer(job.if).lex().tokens, ["github"], []).parse();
  const context = new data.Dictionary();
  context.add("github", JSON.parse(JSON.stringify(github ?? null), data.reviver));
  return truthy(new Evaluator(tree, context).evaluate());
}

const trusted = () => ({
  repository: "shabo/codeman",
  event_name: "workflow_run",
  event: {
    workflow_run: {
      conclusion: "success",
      event: "push",
      head_branch: "main",
      path: ".github/workflows/ci.yml",
      repository: { full_name: "shabo/codeman" },
      head_repository: { full_name: "shabo/codeman" },
    },
  },
});

function withRun(change) {
  const github = trusted();
  change(github.event.workflow_run);
  return github;
}

test("trusted push on main opens the gate", () => {
  assert.equal(gate(trusted()), true);
});

const untrustedValues = {
  conclusion: ["failure", "cancelled", "skipped", "", null],
  event: ["pull_request", "pull_request_target", "workflow_dispatch", "schedule", "", null],
  head_branch: ["develop", "refs/heads/main", "", null],
  path: [".github/workflows/other.yml", "", null],
};

for (const [field, values] of Object.entries(untrustedValues)) {
  for (const value of values) {
    test(`${field}=${JSON.stringify(value)} closes the gate`, () => {
      assert.equal(gate(withRun((run) => { run[field] = value; })), false);
    });
  }
  test(`missing ${field} closes the gate`, () => {
    assert.equal(gate(withRun((run) => { delete run[field]; })), false);
  });
}

for (const field of ["repository", "head_repository"]) {
  for (const value of [{ full_name: "attacker/codeman" }, { full_name: "" }, { full_name: null }, {}, null]) {
    test(`${field}=${JSON.stringify(value)} closes the gate`, () => {
      assert.equal(gate(withRun((run) => { run[field] = value; })), false);
    });
  }
  test(`missing ${field} closes the gate`, () => {
    assert.equal(gate(withRun((run) => { delete run[field]; })), false);
  });
}

test("fork pull request from a branch named main closes the gate", () => {
  assert.equal(gate(withRun((run) => {
    run.event = "pull_request";
    run.head_repository = { full_name: "attacker/codeman" };
  })), false);
});

test("fork identity with a push event closes the gate", () => {
  assert.equal(gate(withRun((run) => { run.head_repository = { full_name: "attacker/codeman" }; })), false);
});

test("same repository pull request closes the gate", () => {
  assert.equal(gate(withRun((run) => { run.event = "pull_request"; })), false);
});

for (const [name, github] of [
  ["empty workflow_run", { repository: "shabo/codeman", event: { workflow_run: {} } }],
  ["null workflow_run", { repository: "shabo/codeman", event: { workflow_run: null } }],
  ["missing workflow_run", { repository: "shabo/codeman", event: {} }],
  ["missing event", { repository: "shabo/codeman" }],
  ["empty github context", {}],
  ["null github context", null],
]) {
  test(`${name} closes the gate`, () => {
    assert.equal(gate(github), false);
  });
}

test("a missing github.repository cannot match missing run repositories", () => {
  const github = withRun((run) => {
    run.repository = null;
    run.head_repository = null;
  });
  delete github.repository;
  assert.equal(gate(github), false);
});

test("the trigger stays limited to completed CI runs on main", () => {
  assert.deepEqual(release.on, {
    workflow_run: { workflows: ["CI"], branches: ["main"], types: ["completed"] },
  });
});

test("CI push trigger stays limited to main", () => {
  // Expression == ignores case, so MAIN passes the gate. This filter is case sensitive.
  assert.deepEqual(workflow("ci.yml").on.push.branches, ["main"]);
});

test("the gate is on the job, so no step runs when it closes", () => {
  assert.equal(typeof job.if, "string");
  assert.equal(job.steps[0].uses?.startsWith("actions/checkout@"), true);
  assert.equal(job.steps.some((step) => step.if?.includes("workflow_run")), false);
});

test("VERSION validation and tag existence checks stay", () => {
  const scripts = job.steps.map((step) => step.run ?? "").join("\n");
  assert.ok(scripts.includes("^[0-9]+\\.[0-9]+\\.[0-9]+$"));
  assert.ok(scripts.includes('git rev-parse -q --verify "refs/tags/$tag"'));
  assert.equal(job.steps.at(-1).if, "${{ steps.tag.outputs.created == 'true' }}");
});
