/* forge.js — the Companion Forge engine. Zero dependencies.
 *
 * Pure functions over a bundled snapshot of the drsamonline Forge system:
 * the queue, the state, the kit graph and the repo fleet. The same file runs
 * in the browser (window.Forge) and under Node (module.exports), so it can be
 * unit-tested headlessly.
 *
 * MIT License. (c) 2026 Dr Sohil Momin.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.Forge = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var Forge = { version: "0.1.0" };

  var STATUSES = ["done", "doing", "blocked", "todo"];

  /* The status of one queue item, from the state's lists. */
  Forge.statusOf = function (item, state) {
    state = state || {};
    var id = typeof item === "string" ? item : (item && item.id);
    if (!id) return "todo";
    if ((state.done || []).indexOf(id) !== -1) return "done";
    if ((state.doing || []).indexOf(id) !== -1) return "doing";
    if ((state.blocked || []).indexOf(id) !== -1) return "blocked";
    return "todo";
  };

  /* A kit is "live" when its status says so. */
  Forge.kitLive = function (kit) {
    return !!kit && kit.status === "live";
  };

  /* Is an item runnable right now? Not done/doing/blocked, and every declared
   * dependency is a live kit (or a done queue item). */
  Forge.isRunnable = function (item, data) {
    data = data || {};
    var state = data.state || {};
    var st = Forge.statusOf(item, state);
    if (st !== "todo") return false;
    var liveKits = {};
    (data.kits || []).forEach(function (k) { if (Forge.kitLive(k)) liveKits[k.id] = true; });
    var doneIds = {};
    (state.done || []).forEach(function (d) { doneIds[d] = true; });
    var deps = item.deps || [];
    for (var i = 0; i < deps.length; i++) {
      var d = deps[i];
      if (!liveKits[d] && !doneIds[d]) return false;
    }
    return true;
  };

  /* The next runnable items, in queue order, capped at a budget. */
  Forge.nextRunnable = function (data, budget) {
    budget = budget || (data.state && data.state.budget && data.state.budget.max_items_per_run) || 3;
    var out = [];
    (data.queue || []).forEach(function (item) {
      if (out.length < budget && Forge.isRunnable(item, data)) out.push(item.id);
    });
    return out;
  };

  /* A one-glance summary of the whole system. */
  Forge.summarize = function (data) {
    data = data || {};
    var state = data.state || {};
    var queue = data.queue || [];
    var repos = data.repos || [];
    var todo = 0;
    queue.forEach(function (it) { if (Forge.statusOf(it, state) === "todo") todo++; });
    var scores = repos.map(function (r) { return typeof r.score === "number" ? r.score : null; })
                      .filter(function (s) { return s !== null; });
    var avg = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : 0;
    return {
      done: (state.done || []).length,
      todo: todo,
      doing: (state.doing || []).length,
      blocked: (state.blocked || []).length,
      kits: (data.kits || []).filter(Forge.kitLive).length,
      kitsTotal: (data.kits || []).length,
      repos: repos.length,
      privateRepos: repos.filter(function (r) { return !!r.private; }).length,
      avgScore: Math.round(avg * 100) / 100
    };
  };

  /* The queue as display rows. */
  Forge.queueRows = function (data) {
    var state = (data || {}).state || {};
    return (data.queue || []).map(function (it) {
      return {
        id: it.id,
        label: it.label || it.id,
        kind: it.kind || "item",
        deps: (it.deps || []).join(", ") || "none",
        status: Forge.statusOf(it, state),
        runnable: Forge.isRunnable(it, data) ? "yes" : ""
      };
    });
  };

  /* The kits as display rows, with their consumer count. */
  Forge.kitRows = function (data) {
    return (data.kits || []).map(function (k) {
      var consumers = k.consumers || [];
      return {
        id: k.id,
        type: k.type || "runtime",
        status: k.status || "unknown",
        consumers: consumers.length,
        repos: consumers.join(", ")
      };
    });
  };

  /* The repo fleet as display rows. */
  Forge.repoRows = function (data) {
    return (data.repos || []).map(function (r) {
      return {
        name: r.name,
        role: r.role || "-",
        score: (typeof r.score === "number" ? r.score : "-"),
        visibility: r.private ? "private" : "public",
        homepage: r.homepage || ""
      };
    });
  };

  /* Case-insensitive search across every field of a row. */
  Forge.search = function (rows, q) {
    q = String(q || "").trim().toLowerCase();
    if (!q) return rows.slice();
    return rows.filter(function (row) {
      var s = "";
      for (var k in row) if (Object.prototype.hasOwnProperty.call(row, k)) s += " " + row[k];
      return s.toLowerCase().indexOf(q) !== -1;
    });
  };

  /* CSV of an array of objects, using the first object's keys as the header. */
  Forge.toCSV = function (rows) {
    if (!rows || !rows.length) return "";
    var keys = Object.keys(rows[0]);
    function cell(v) {
      var s = v === undefined || v === null ? "" : String(v);
      if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    }
    var lines = [keys.join(",")];
    rows.forEach(function (row) {
      lines.push(keys.map(function (k) { return cell(row[k]); }).join(","));
    });
    return lines.join("\n") + "\n";
  };

  Forge.STATUSES = STATUSES;
  return Forge;
});
