/* test-node.js — headless tests for the Companion Forge engine.
 * Run: node test-node.js
 */
"use strict";
var Forge = require("./docs/play/forge.js");
var DATA = require("./docs/play/data.js");

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (extra ? "  (" + extra + ")" : "")); }
}

console.log("Companion Forge engine " + Forge.version + " — tests");

/* ---- 1. statusOf reads the state lists ---- */
(function () {
  var st = { done: ["a"], doing: ["b"], blocked: ["c"] };
  ok("done item", Forge.statusOf("a", st) === "done");
  ok("doing item", Forge.statusOf("b", st) === "doing");
  ok("blocked item", Forge.statusOf("c", st) === "blocked");
  ok("unknown item is todo", Forge.statusOf("z", st) === "todo");
  ok("accepts an object", Forge.statusOf({ id: "a" }, st) === "done");
  ok("null-safe", Forge.statusOf(null, null) === "todo");
})();

/* ---- 2. runnability needs the deps to be live kits ---- */
(function () {
  var data = {
    state: { done: [], doing: [], blocked: [] },
    kits: [{ id: "web-kit", status: "live" }, { id: "lan-kit", status: "planned" }],
    queue: [
      { id: "ok-app", deps: ["web-kit"] },
      { id: "blocked-by-kit", deps: ["lan-kit"] },
      { id: "no-deps", deps: [] }
    ]
  };
  ok("web-kit item is runnable", Forge.isRunnable(data.queue[0], data) === true);
  ok("planned-kit item is not runnable", Forge.isRunnable(data.queue[1], data) === false);
  ok("no-dep item is runnable", Forge.isRunnable(data.queue[2], data) === true);
})();

/* ---- 3. nextRunnable respects queue order and budget ---- */
(function () {
  var data = {
    state: { done: ["already"], doing: [], blocked: ["stuck"], budget: { max_items_per_run: 3 } },
    kits: [{ id: "web-kit", status: "live" }],
    queue: [
      { id: "already", deps: ["web-kit"] },
      { id: "stuck", deps: ["web-kit"] },
      { id: "first", deps: ["web-kit"] },
      { id: "second", deps: ["web-kit"] },
      { id: "third", deps: ["web-kit"] },
      { id: "fourth", deps: ["web-kit"] }
    ]
  };
  var next = Forge.nextRunnable(data);
  ok("skips done and blocked", next.indexOf("already") === -1 && next.indexOf("stuck") === -1);
  ok("takes the first three runnable", next.join(",") === "first,second,third", next.join(","));
  ok("honours a tighter budget", Forge.nextRunnable(data, 1).join(",") === "first");
})();

/* ---- 4. summarize over the bundled snapshot ---- */
(function () {
  var s = Forge.summarize(DATA);
  ok("counts done items", s.done === (DATA.state.done || []).length);
  ok("counts live kits", s.kits > 0 && s.kits <= s.kitsTotal);
  ok("counts the fleet", s.repos === DATA.repos.length);
  ok("average score is sane", s.avgScore >= 0 && s.avgScore <= 5);
})();

/* ---- 5. row builders produce the expected columns ---- */
(function () {
  var q = Forge.queueRows(DATA);
  ok("queue rows have a status", q.every(function (r) { return Forge.STATUSES.indexOf(r.status) !== -1; }));
  var k = Forge.kitRows(DATA);
  ok("kit rows carry a consumer count", k.every(function (r) { return typeof r.consumers === "number"; }));
  var r = Forge.repoRows(DATA);
  ok("repo rows carry a visibility", r.every(function (x) { return x.visibility === "public" || x.visibility === "private"; }));
})();

/* ---- 6. search is case-insensitive and field-wide ---- */
(function () {
  var rows = [{ name: "web-kit", role: "runtime" }, { name: "seance", role: "product" }];
  ok("matches a name", Forge.search(rows, "SEANCE").length === 1);
  ok("matches a role", Forge.search(rows, "runtime").length === 1);
  ok("empty query returns all", Forge.search(rows, "  ").length === 2);
  ok("no match returns none", Forge.search(rows, "zzz").length === 0);
})();

/* ---- 7. CSV quoting ---- */
(function () {
  var csv = Forge.toCSV([{ a: "plain", b: "has,comma" }, { a: 'has"quote', b: "line\nbreak" }]);
  ok("header first", csv.split("\n")[0] === "a,b");
  ok("quotes commas", csv.indexOf('"has,comma"') !== -1);
  ok("escapes quotes", csv.indexOf('"has""quote"') !== -1);
  ok("empty input -> empty", Forge.toCSV([]) === "");
})();

/* ---- 8. the bundled snapshot is well-formed ---- */
(function () {
  ok("snapshot has a generated date", /^\d{4}-\d{2}-\d{2}$/.test(DATA.generated));
  ok("snapshot has kits and repos", DATA.kits.length > 0 && DATA.repos.length > 0);
  ok("every queue item declares deps", DATA.queue.every(function (x) { return Array.isArray(x.deps); }));
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
