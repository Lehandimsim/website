# backend/: where drawings go

The website is static, so it cannot receive anything itself. Paint drawings are posted to a **Google
Apps Script web app** that runs in Lehan's own Google account, free:

| What arrives | What happens |
|---|---|
| A drawing (Paint: **Save and send**) | The PNG is saved in a Drive folder `lehanzhang.com drawings`, a row is added to the `Drawings` tab of the Sheet `lehanzhang.com inbox`, and Lehan gets an email with the picture, the name and the message. Above 30 drawings an hour, they are still saved but not emailed. |

Overleaf edits are **not** sent (Lehan, 2026-10-06). They stay in the visitor's browser tab, where the
Overleaf version's History panel shows them; the script answers anything other than a drawing with
`unknown kind`.

This folder is **not** part of the website (only `site/` is published).

## Set it up (about 10 minutes, once)

1. Go to <https://script.google.com>, signed in to the Google account that should own the drawings.
   **New project**. Name it `lehanzhang.com inbox`.
2. Delete what is in `Code.gs` and paste in the whole of `backend/apps-script/Code.gs`.
   Check `NOTIFY_EMAIL` near the top (the address that gets the emails). Save (Ctrl+S).
3. In the toolbar, choose the function **setup** and press **Run**. Google asks for permission
   (Drive, Sheets, sending email as you). Because the script is your own and unpublished, Google
   shows "Google hasn't verified this app": click **Advanced** › **Go to lehanzhang.com inbox
   (unsafe)** › **Allow**. The log at the bottom then shows the links to the new Drive folder and
   Sheet.
4. **Deploy › New deployment**. Click the gear › **Web app**. Description `v1`.
   **Execute as: Me**. **Who has access: Anyone**. **Deploy**. Copy the **Web app URL** (it ends in
   `/exec`).
5. Open that URL in a browser: it should show `{"ok":true,"service":"lehanzhang.com inbox"}`.
6. In `site/config.js`, put the URL in `endpoints.drawings`:
   ```js
   endpoints: {
     drawings: "https://script.google.com/macros/s/.../exec"
   },
   ```
   (Or send Claude the URL.) Then test: on the live site (or `python -m http.server` in `site/`),
   send a drawing from Paint; the email arrives within a minute and the Sheet gets a row.

## Changing the script later

Edit the code at script.google.com, then **Deploy › Manage deployments › (pencil) › Version: New
version › Deploy**. The URL stays the same, so `config.js` does not change. (A *New deployment* would
make a new URL.)

## Limits and abuse

- A free Google account can send about 100 emails a day from a script; the script sends at most 30
  drawing emails an hour.
- The endpoint is public by necessity. The script accepts only a PNG (up to 4 MB), stores visitor
  text as plain text (never as a spreadsheet formula), and escapes it in emails. The Paint form also
  has a hidden spam trap.
- To stop everything at once: **Deploy › Manage deployments › Archive**, and set
  `endpoints.drawings` in `config.js` back to `null` (the site then says sending is off and still lets
  visitors save drawings).

## Tested

`Code.gs` was run in a browser against mock Google services (2026-10-02): setup, a drawing, refusing
a non-PNG, garbage and unknown input, formula-looking names stored as text, HTML escaped in emails,
the hourly email cap. After the edit logs were removed (2026-10-06) it was run again against mocks:
setup, a drawing, a non-PNG, and an edit log (now refused as `unknown kind`). Not yet tested against
real Google services: that happens at step 6.
