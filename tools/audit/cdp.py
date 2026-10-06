"""Minimal Chrome DevTools Protocol driver for headless Edge (no extra packages beyond websocket-client).

    from cdp import Browser
    with Browser() as b:
        p = b.page()
        p.viewport(1440, 900)
        p.goto("file:///.../site/index.html")
        print(p.errors)          # JS exceptions, console.error, failed loads
        print(p.eval("document.title"))
"""
import base64
import json
import os
import shutil
import socket
import subprocess
import tempfile
import time

import requests
import websocket

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


class Page:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=60, suppress_origin=True)
        self.n = 0
        self.events = []
        self.errors = []
        self.requests = {}
        for m in ("Page.enable", "Runtime.enable", "Log.enable", "Network.enable"):
            self.send(m)

    # ---------- protocol ----------
    def send(self, method, params=None, timeout=60):
        self.n += 1
        mid = self.n
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        end = time.time() + timeout
        while True:
            self.ws.settimeout(max(0.1, end - time.time()))
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError("%s: %s" % (method, msg["error"]))
                return msg.get("result", {})
            self._event(msg)
            if time.time() > end:
                raise TimeoutError(method)

    def pump(self, seconds):
        end = time.time() + seconds
        while time.time() < end:
            self.ws.settimeout(max(0.05, end - time.time()))
            try:
                msg = json.loads(self.ws.recv())
            except (websocket.WebSocketTimeoutException, socket.timeout):
                break
            self._event(msg)

    def wait_for(self, method, seconds=20):
        end = time.time() + seconds
        for e in self.events:
            if e["method"] == method:
                return e
        while time.time() < end:
            self.ws.settimeout(max(0.05, end - time.time()))
            try:
                msg = json.loads(self.ws.recv())
            except (websocket.WebSocketTimeoutException, socket.timeout):
                break
            self._event(msg)
            if msg.get("method") == method:
                return msg
        return None

    def _event(self, msg):
        m = msg.get("method")
        if not m:
            return
        self.events.append(msg)
        p = msg.get("params", {})
        if m == "Runtime.exceptionThrown":
            d = p.get("exceptionDetails", {})
            ex = d.get("exception", {})
            self.errors.append("EXCEPTION: %s (%s:%s)" % (ex.get("description") or d.get("text"), d.get("url"), d.get("lineNumber")))
        elif m == "Runtime.consoleAPICalled" and p.get("type") in ("error", "assert"):
            args = " ".join(str(a.get("value", a.get("description", ""))) for a in p.get("args", []))
            self.errors.append("console.%s: %s" % (p.get("type"), args))
        elif m == "Log.entryAdded":
            e = p.get("entry", {})
            if e.get("level") == "error":
                self.errors.append("log: %s %s" % (e.get("text"), e.get("url", "")))
        elif m == "Network.requestWillBeSent":
            self.requests[p["requestId"]] = p["request"]["url"]
        elif m == "Network.loadingFailed":
            if p.get("canceled"):
                return
            self.errors.append("load failed: %s %s" % (p.get("errorText"), self.requests.get(p.get("requestId"), "?")))
        elif m == "Network.responseReceived":
            r = p.get("response", {})
            if r.get("status", 200) >= 400:
                self.errors.append("HTTP %s: %s" % (r.get("status"), r.get("url")))

    # ---------- helpers ----------
    def viewport(self, w, h, mobile=None, touch=None, motion="no-preference"):
        mobile = (w < 600) if mobile is None else mobile
        touch = (w <= 1024 and h > w) if touch is None else touch
        self.send("Emulation.setDeviceMetricsOverride", {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": mobile})
        self.send("Emulation.setTouchEmulationEnabled", {"enabled": bool(touch), "maxTouchPoints": 5} if touch else {"enabled": False})
        self.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": motion}]})

    def goto(self, url, settle=1.5):
        self.send("Page.navigate", {"url": "about:blank"})
        self.pump(0.2)
        self.events = []
        self.errors = []
        self.requests = {}
        self.send("Page.navigate", {"url": url})
        self.wait_for("Page.loadEventFired", 20)
        self.pump(settle)

    def eval(self, expr, await_promise=False, timeout=60):
        r = self.send("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": await_promise}, timeout=timeout)
        if "exceptionDetails" in r:
            d = r["exceptionDetails"]
            raise RuntimeError("eval failed: %s" % (d.get("exception", {}).get("description") or d.get("text")))
        return r.get("result", {}).get("value")

    def screenshot(self, path):
        r = self.send("Page.captureScreenshot", {"format": "png"})
        with open(path, "wb") as f:
            f.write(base64.b64decode(r["data"]))

    def key(self, key, code=None, keycode=None, modifiers=0, text=None):
        """Press and release one key (Tab, Enter, Escape, ArrowRight, ...)."""
        KC = {"Tab": 9, "Enter": 13, "Escape": 27, "ArrowLeft": 37, "ArrowUp": 38, "ArrowRight": 39, "ArrowDown": 40,
              " ": 32, "Home": 36, "End": 35, "PageDown": 34, "PageUp": 33, "F5": 116, "Backspace": 8}
        kc = keycode or KC.get(key, 0)
        code = code or {"Tab": "Tab", "Enter": "Enter", "Escape": "Escape", " ": "Space"}.get(key, key)
        base = {"key": key, "code": code, "windowsVirtualKeyCode": kc, "nativeVirtualKeyCode": kc, "modifiers": modifiers}
        down = dict(base, type="keyDown")
        if text is not None:
            down["text"] = text
        elif key == "Enter":
            down["text"] = "\r"
        elif key == " ":
            down["text"] = " "
        self.send("Input.dispatchKeyEvent", down)
        self.send("Input.dispatchKeyEvent", dict(base, type="keyUp"))

    def click(self, x, y):
        for t in ("mouseMoved", "mousePressed", "mouseReleased"):
            p = {"type": t, "x": x, "y": y, "button": "left" if t != "mouseMoved" else "none", "clickCount": 1}
            self.send("Input.dispatchMouseEvent", p)

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass


class Browser:
    def __init__(self):
        self.port = free_port()
        self.profile = tempfile.mkdtemp(prefix="edge-audit-")
        self.proc = subprocess.Popen([
            EDGE, "--headless=new", "--disable-gpu", "--no-first-run", "--disable-extensions",
            "--user-data-dir=" + self.profile, "--allow-file-access-from-files",
            "--remote-debugging-port=%d" % self.port, "--remote-allow-origins=*",
            "--window-size=1440,900", "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                requests.get("http://127.0.0.1:%d/json/version" % self.port, timeout=1)
                break
            except Exception:
                time.sleep(0.2)

    def page(self):
        r = requests.put("http://127.0.0.1:%d/json/new?about:blank" % self.port, timeout=10).json()
        p = Page(r["webSocketDebuggerUrl"])
        # Downloads would hang or litter: deny them.
        try:
            p.send("Browser.setDownloadBehavior", {"behavior": "deny"})
        except Exception:
            try:
                p.send("Page.setDownloadBehavior", {"behavior": "deny"})
            except Exception:
                pass
        return p

    def close(self):
        try:
            self.proc.terminate()
            self.proc.wait(10)
        except Exception:
            self.proc.kill()
        shutil.rmtree(self.profile, ignore_errors=True)

    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()
