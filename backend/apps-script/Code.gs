/* ==========================================================================
   lehanzhang.com inbox: a Google Apps Script web app that receives
     - drawings from the Paint version   ({ kind: "drawing", name, message, image, timestamp })
   Overleaf edits are not collected (Lehan, 2026-10-06): they stay in the visitor's browser.

   What it does with a drawing: saves the PNG in a Drive folder, adds a row to the "Drawings" tab of
   a Google Sheet, and emails Lehan the picture (with the visitor's name and message).

   Set-up (once; the steps with screenshots are in backend/README.md)
     1. script.google.com > New project; paste this file over Code.gs; set NOTIFY_EMAIL below.
     2. Run setup() once (Run button, function "setup"), and allow the permissions it asks for.
        It creates the Drive folder and the Sheet, and logs their links.
     3. Deploy > New deployment > type "Web app"; Execute as: Me; Who has access: Anyone.
        Copy the web app URL (ends in /exec) into site/config.js, endpoints.drawings.
     To change this code later: edit, then Deploy > Manage deployments > (pencil) > Version:
     New version > Deploy. The URL stays the same.
   ========================================================================== */

// ---- Settings ----
var NOTIFY_EMAIL = "lehan.zhang@gess.ethz.ch";   // where drawings go
var SITE_NAME = "lehanzhang.com";
var MAX_IMAGE_BYTES = 4 * 1024 * 1024;           // a drawing's PNG, after base64 decoding
var MAX_DRAWINGS_PER_HOUR = 30;                  // above this, drawings are still saved but not emailed

// ---- Web app entry points ----

function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents;
    if (!body || body.length > 8 * 1024 * 1024) return reply_({ ok: false, error: "empty or too large" });
    var data = JSON.parse(body);
    if (data.kind === "drawing" || data.image) return reply_(saveDrawing_(data));
    return reply_({ ok: false, error: "unknown kind" });
  } catch (err) {
    console.error(err);
    return reply_({ ok: false, error: "server error" });
  }
}

// Opening the URL in a browser shows this: a quick check that the deployment works.
function doGet() {
  return reply_({ ok: true, service: SITE_NAME + " inbox" });
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---- Drawings ----

function saveDrawing_(d) {
  var m = /^data:image\/png;base64,([A-Za-z0-9+\/=]+)$/.exec(String(d.image || ""));
  if (!m) return { ok: false, error: "not a PNG" };
  var bytes = Utilities.base64Decode(m[1]);
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, error: "image too large" };

  var name = clean_(d.name, 80), message = clean_(d.message, 600);
  var when = new Date();
  var fileName = "drawing-" + Utilities.formatDate(when, "Etc/UTC", "yyyyMMdd-HHmmss") +
    (name ? "-" + name.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 30) : "") + ".png";
  var blob = Utilities.newBlob(bytes, "image/png", fileName);

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var file = folder_().createFile(blob);
    sheet_("Drawings", ["Received (UTC)", "Name", "Message", "File", "Emailed"]);
    var emailed = underLimit_("drawings", MAX_DRAWINGS_PER_HOUR);
    sheet_("Drawings").appendRow([when, cell_(name), cell_(message), file.getUrl(), emailed ? "yes" : "no (hourly limit)"]);
    if (emailed) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: "New drawing on " + SITE_NAME + (name ? " from " + name : ""),
        htmlBody:
          "<p><b>" + (name ? esc_(name) : "Someone") + "</b> sent you a drawing from the Paint version of " + SITE_NAME + ".</p>" +
          (message ? "<blockquote>" + esc_(message).replace(/\n/g, "<br>") + "</blockquote>" : "") +
          '<p><img src="cid:drawing" style="max-width:100%;border:1px solid #ccc"></p>' +
          '<p><a href="' + file.getUrl() + '">Open in Drive</a> · <a href="' + SpreadsheetApp.openById(prop_("SHEET_ID")).getUrl() + '">All drawings</a></p>',
        inlineImages: { drawing: blob },
        name: SITE_NAME
      });
    }
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

// ---- One-time set-up ----

function setup() {
  folder_();
  sheet_("Drawings", ["Received (UTC)", "Name", "Message", "File", "Emailed"]);
  console.log("Drive folder: " + DriveApp.getFolderById(prop_("FOLDER_ID")).getUrl());
  console.log("Sheet: " + SpreadsheetApp.openById(prop_("SHEET_ID")).getUrl());
  console.log("Now deploy as a web app.");
}

// ---- Helpers ----

function prop_(key, value) {
  var p = PropertiesService.getScriptProperties();
  if (value !== undefined) p.setProperty(key, value);
  return p.getProperty(key);
}

function folder_() {
  var id = prop_("FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* deleted: make a new one */ } }
  var f = DriveApp.createFolder(SITE_NAME + " drawings");
  prop_("FOLDER_ID", f.getId());
  return f;
}

function sheet_(tab, header) {
  var id = prop_("SHEET_ID"), ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(SITE_NAME + " inbox");
    prop_("SHEET_ID", ss.getId());
    var first = ss.getSheets()[0];
    if (header) { first.setName(tab); first.appendRow(header); first.setFrozenRows(1); }
    return first;
  }
  var sh = ss.getSheetByName(tab);
  if (!sh && header) {
    sh = ss.insertSheet(tab);
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Counts events per clock hour; false once the limit is reached.
function underLimit_(what, limit) {
  var cache = CacheService.getScriptCache();
  var key = what + "-" + Utilities.formatDate(new Date(), "Etc/UTC", "yyyyMMddHH");
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 3700);
  return n <= limit;
}

function clean_(s, max) {
  return String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

// Visitor text as a plain-text cell: Sheets would read text starting with = + - @ as a formula
// (a visitor could type a formula as their name or message).
function cell_(s) {
  s = String(s == null ? "" : s);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function esc_(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
