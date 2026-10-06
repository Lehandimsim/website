/* ==========================================================================
   fun/overleaf/edit-log.js — what each recompile changed, for the History
   panel.

     var files = EditLog.changes(current, original, order);
         // [{ name, diff, added, removed, ops }] for every file that differs
         // from its original (current/original: { "research.tex": "..." })

   Nothing is sent anywhere: the edits stay in the visitor's browser tab
   (Lehan, 2026-10-06; until then each recompile was sent to Lehan).
   ========================================================================== */

(function () {
  "use strict";

  var CONTEXT = 2;   // unchanged lines shown around each change

  // Line diff (longest common subsequence). ops: [{ op: " " | "-" | "+", text, a, b }]
  // where a / b are line numbers in the old / new text.
  function diffLines(oldText, newText) {
    var A = String(oldText).split("\n"), B = String(newText).split("\n");
    var pre = 0;
    while (pre < A.length && pre < B.length && A[pre] === B[pre]) pre++;
    var suf = 0;
    while (suf < A.length - pre && suf < B.length - pre && A[A.length - 1 - suf] === B[B.length - 1 - suf]) suf++;
    var a = A.slice(pre, A.length - suf), b = B.slice(pre, B.length - suf);
    var mid = [], i, j;

    if (a.length * b.length > 4000000) {                 // huge paste: report it as replaced
      a.forEach(function (t) { mid.push({ op: "-", text: t }); });
      b.forEach(function (t) { mid.push({ op: "+", text: t }); });
    } else {
      var n = a.length, m = b.length, dp = [];
      for (i = 0; i <= n; i++) dp.push(new Uint32Array(m + 1));
      for (i = n - 1; i >= 0; i--) {
        for (j = m - 1; j >= 0; j--) {
          dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
      i = 0; j = 0;
      while (i < n && j < m) {
        if (a[i] === b[j]) { mid.push({ op: " ", text: a[i] }); i++; j++; }
        else if (dp[i + 1][j] >= dp[i][j + 1]) { mid.push({ op: "-", text: a[i] }); i++; }
        else { mid.push({ op: "+", text: b[j] }); j++; }
      }
      for (; i < n; i++) mid.push({ op: "-", text: a[i] });
      for (; j < m; j++) mid.push({ op: "+", text: b[j] });
    }

    var ops = [];
    for (i = 0; i < pre; i++) ops.push({ op: " ", text: A[i] });
    ops = ops.concat(mid);
    for (i = A.length - suf; i < A.length; i++) ops.push({ op: " ", text: A[i] });
    var la = 0, lb = 0;
    ops.forEach(function (o) {
      if (o.op !== "+") o.a = ++la;
      if (o.op !== "-") o.b = ++lb;
    });
    return ops;
  }

  // A unified diff, like `git diff`, with CONTEXT lines around each change.
  function unified(name, ops) {
    var out = ["--- a/" + name, "+++ b/" + name];
    var changed = [];
    ops.forEach(function (o, k) { if (o.op !== " ") changed.push(k); });
    var k = 0;
    while (k < changed.length) {
      var start = Math.max(0, changed[k] - CONTEXT), end = changed[k];
      while (k < changed.length && changed[k] - end <= 2 * CONTEXT + 1) { end = changed[k]; k++; }
      end = Math.min(ops.length - 1, end + CONTEXT);
      var hunk = ops.slice(start, end + 1);
      var aStart = 0, aLen = 0, bStart = 0, bLen = 0;
      hunk.forEach(function (o) {
        if (o.op !== "+") { if (!aStart) aStart = o.a; aLen++; }
        if (o.op !== "-") { if (!bStart) bStart = o.b; bLen++; }
      });
      if (!aStart) aStart = (ops[start - 1] && ops[start - 1].a) || 0;
      if (!bStart) bStart = (ops[start - 1] && ops[start - 1].b) || 0;
      out.push("@@ -" + aStart + "," + aLen + " +" + bStart + "," + bLen + " @@");
      hunk.forEach(function (o) { out.push(o.op + o.text); });
    }
    return out.join("\n");
  }

  // Every file that differs from its original.
  function changes(current, original, order) {
    var names = (order || Object.keys(current)).slice();
    Object.keys(current).forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); });
    var files = [];
    names.forEach(function (name) {
      var now = current[name], was = original[name];
      if (now === was) return;
      var ops = diffLines(was == null ? "" : was, now == null ? "" : now);
      var added = 0, removed = 0;
      ops.forEach(function (o) { if (o.op === "+") added++; else if (o.op === "-") removed++; });
      files.push({ name: name, diff: unified(name, ops), added: added, removed: removed, ops: ops });
    });
    return files;
  }

  window.EditLog = { diffLines: diffLines, unified: unified, changes: changes };
})();
