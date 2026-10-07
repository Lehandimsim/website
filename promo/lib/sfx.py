"""Sound effects, synthesised with NumPy (no recordings, so nothing to license).

Each function returns a mono float32 array at RATE. mix() places them on a timeline.
Levels are set so a busy trailer peaks around -3 dBFS; nothing here is meant to be loud.
"""
import wave

import numpy as np

RATE = 48000


def _t(sec):
    return np.arange(int(RATE * sec)) / RATE


def _env(n, attack=0.002, decay=0.1, sustain=0.0, release=None):
    """Attack then exponential decay (time constant `decay` seconds)."""
    t = np.arange(n) / RATE
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-np.maximum(t - attack, 0) / max(decay, 1e-4))
    e = a * (sustain + (1 - sustain) * d)
    if release:
        e *= np.clip((n / RATE - t) / release, 0, 1)
    return e


def _band(x, lo, hi):
    """Band-pass by FFT (fine for short sounds)."""
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / RATE)
    X = np.fft.rfft(x)
    m = np.clip((hi * 1.15 - f) / (hi * 0.15), 0, 1)        # soft edges, so it does not ring
    if lo > 0:
        m *= np.clip((f - lo * 0.85) / (lo * 0.15), 0, 1)
    return np.fft.irfft(X * m, n)


def _noise(sec, seed=0):
    return np.random.default_rng(seed).standard_normal(int(RATE * sec))


def _norm(x, peak):
    m = np.max(np.abs(x)) or 1
    return (x / m * peak).astype(np.float32)


def _sine(freq, sec, phase=0.0):
    t = _t(sec)
    if callable(freq):
        ph = 2 * np.pi * np.cumsum(freq(t)) / RATE
    else:
        ph = 2 * np.pi * freq * t
    return np.sin(ph + phase)


# ---------- UI ----------
def click(seed=0):
    n = _noise(0.03, seed)
    x = _band(n, 1800, 7000) * _env(len(n), 0.0005, 0.004) + 0.6 * _sine(2600, 0.03) * _env(len(n), 0.0005, 0.003)
    thump = _sine(180, 0.03) * _env(len(n), 0.001, 0.01)
    return _norm(x + 0.5 * thump, 0.22)


def key(seed=0):
    rng = np.random.default_rng(seed)
    n = _noise(0.05, seed)
    hi = _band(n, 2000 + rng.uniform(-400, 400), 6000) * _env(len(n), 0.0005, 0.006)
    lo = _sine(140 + rng.uniform(-20, 20), 0.05) * _env(len(n), 0.001, 0.015)
    return _norm(hi + 0.8 * lo, 0.16 + rng.uniform(-0.03, 0.03))


def blip(freq=880, sec=0.09, peak=0.15):
    x = _sine(lambda t: freq * (1 + 0.25 * np.exp(-t / 0.02)), sec) * _env(int(RATE * sec), 0.002, sec / 3)
    return _norm(x, peak)


def whoosh(sec=0.45, lo=300, hi=3200, peak=0.2, seed=1):
    """A noise sweep (transitions, a page sliding in)."""
    n = _noise(sec, seed)
    out = np.zeros_like(n)
    steps = 12
    edges = np.linspace(0, len(n), steps + 1).astype(int)
    for k in range(steps):
        u = (k + 0.5) / steps
        c = lo * (hi / lo) ** u
        seg = _band(n, c * 0.6, c * 1.6)
        out[edges[k]:edges[k + 1]] = seg[edges[k]:edges[k + 1]]
    t = np.linspace(0, 1, len(n))
    env = np.sin(np.pi * t) ** 1.5
    return _norm(out * env, peak)


def chime(freqs=(1046.5, 1318.5, 1568.0), gap=0.08, decay=0.35, peak=0.22):
    """Bell-like notes one after another (a ding, a little fanfare)."""
    total = gap * (len(freqs) - 1) + decay * 4
    out = np.zeros(int(RATE * total))
    for k, f in enumerate(freqs):
        sec = decay * 4
        tone = (_sine(f, sec) + 0.35 * _sine(f * 2.01, sec) + 0.12 * _sine(f * 3.02, sec)) * _env(int(RATE * sec), 0.002, decay)
        s = int(RATE * gap * k)
        out[s:s + len(tone)] += tone[:len(out) - s]
    return _norm(out, peak)


def ding(peak=0.2):
    return chime((1318.5,), decay=0.4, peak=peak)


def bonk(peak=0.25):
    """A soft 'nope' (an error)."""
    sec = 0.32
    x = _sine(lambda t: 220 * np.exp(-t * 1.2), sec)
    x = np.tanh(2.5 * x) * _env(int(RATE * sec), 0.003, 0.09)
    y = _sine(lambda t: 165 * np.exp(-t * 1.2), sec) * _env(int(RATE * sec), 0.003, 0.09)
    out = np.concatenate([x, np.zeros(int(RATE * 0.06)), y])
    return _norm(_band(out, 60, 2500), peak)


def pop(peak=0.22, seed=3):
    sec = 0.12
    x = _sine(lambda t: 600 * np.exp(-t * 25) + 120, sec) * _env(int(RATE * sec), 0.001, 0.03)
    n = _band(_noise(sec, seed), 800, 5000) * _env(int(RATE * sec), 0.0005, 0.008)
    return _norm(x + 0.4 * n, peak)


def boing(freq=440, peak=0.16):
    """The Paint start button changing colour on hover."""
    sec = 0.22
    x = _sine(lambda t: freq * (1 + 0.5 * np.exp(-t / 0.03) + 0.04 * np.sin(2 * np.pi * 18 * t)), sec)
    return _norm(x * _env(int(RATE * sec), 0.003, 0.07), peak)


# ---------- Kitchen ----------
def rice_cooker(peak=0.18):
    """The little three-note tune of a rice cooker."""
    out = []
    for f in (1568.0, 1318.5, 1760.0):
        sec = 0.14
        out.append(_sine(f, sec) * _env(int(RATE * sec), 0.004, 0.06, sustain=0.5, release=0.03))
        out.append(np.zeros(int(RATE * 0.04)))
    return _norm(np.concatenate(out), peak)


def crack(peak=0.3, seed=5):
    rng = np.random.default_rng(seed)
    out = np.zeros(int(RATE * 0.16))
    for k in range(5):        # a few tiny snaps of shell
        s = int(RATE * (0.004 * k + rng.uniform(0, 0.02)))
        n = _band(_noise(0.02, seed + k), 1500, 9000) * _env(int(RATE * 0.02), 0.0003, 0.003)
        out[s:s + len(n)] += n * rng.uniform(0.4, 1)
    tap = _sine(320, 0.16) * _env(len(out), 0.001, 0.02)
    return _norm(out + 0.5 * tap, peak)


def chop(peak=0.3, seed=7):
    sec = 0.15
    thud = _sine(lambda t: 160 * np.exp(-t * 6), sec) * _env(int(RATE * sec), 0.001, 0.035)
    knock = _band(_noise(sec, seed), 400, 3500) * _env(int(RATE * sec), 0.0005, 0.01)
    return _norm(thud + 0.7 * knock, peak)


def slice_(peak=0.18, seed=9):
    sec = 0.18
    n = _band(_noise(sec, seed), 3000, 11000)
    t = np.linspace(0, 1, len(n))
    return _norm(n * np.sin(np.pi * t) ** 2, peak)


def shake(peak=0.14, seed=11):
    """Salt and sugar shaken in."""
    out = np.zeros(int(RATE * 0.4))
    for k in range(4):
        n = _band(_noise(0.06, seed + k), 2500, 10000) * _env(int(RATE * 0.06), 0.004, 0.02)
        s = int(RATE * 0.09 * k)
        out[s:s + len(n)] += n
    return _norm(out, peak)


def sizzle(sec=1.5, peak=0.16, seed=13):
    rng = np.random.default_rng(seed)
    base = _band(_noise(sec, seed), 2500, 12000) * 0.35
    pops = np.zeros_like(base)
    for _ in range(int(sec * 40)):
        s = rng.integers(0, len(base) - 400)
        pops[s:s + 400] += _band(_noise(400 / RATE, int(s)), 1500, 9000)[:400] * _env(400, 0.0002, 0.002) * rng.uniform(0.3, 1)
    t = np.linspace(0, 1, len(base))
    env = np.clip(t / 0.08, 0, 1) * np.clip((1 - t) / 0.2, 0, 1)
    return _norm((base + pops) * env * (0.8 + 0.2 * np.sin(2 * np.pi * 3 * t * sec)), peak)


def confetti(peak=0.24):
    return _norm(np.concatenate([pop(1.0), np.zeros(int(RATE * 0.02))]) + 0, peak)


def fanfare(peak=0.2):
    return chime((523.25, 659.25, 783.99, 1046.5), gap=0.09, decay=0.45, peak=peak)


# ---------- Paint ----------
def scribble(sec=1.0, peak=0.07, seed=17):
    """A marker on paper, for a stroke of this length."""
    n = _band(_noise(sec, seed), 1200, 6000)
    t = np.arange(len(n)) / RATE
    rng = np.random.default_rng(seed)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(5, 9) * t + rng.uniform(0, 6))
    edge = np.clip(t / 0.03, 0, 1) * np.clip((sec - t) / 0.04, 0, 1)
    return _norm(n * am * edge, peak)


def fill(peak=0.16):
    """The paint bucket: a soft gloop."""
    sec = 0.25
    x = _sine(lambda t: 220 + 500 * (1 - np.exp(-t * 18)), sec) * _env(int(RATE * sec), 0.004, 0.07)
    return _norm(x, peak)


def sent(peak=0.2):
    return _norm(np.concatenate([whoosh(0.35, 500, 4000, 1.0), chime((1318.5, 1760.0), gap=0.07, decay=0.3, peak=0.8)]), peak)


# ---------- PowerPoint ----------
def drumroll(sec=0.9, peak=0.22, seed=19):
    rng = np.random.default_rng(seed)
    out = np.zeros(int(RATE * (sec + 0.9)))
    t = 0.0
    while t < sec:
        hit = _band(_noise(0.05, int(t * 1e4)), 900, 7000) * _env(int(RATE * 0.05), 0.0005, 0.012)
        s = int(RATE * t)
        out[s:s + len(hit)] += hit * (0.5 + 0.5 * t / sec) * rng.uniform(0.7, 1)
        t += 0.045
    crash = _band(_noise(0.8, seed), 3000, 14000) * _env(int(RATE * 0.8), 0.002, 0.25)
    s = int(RATE * sec)
    out[s:s + len(crash)] += crash * 1.3
    return _norm(out, peak)


def applause(sec=2.2, peak=0.2, seed=23):
    """Polite seminar-room applause."""
    rng = np.random.default_rng(seed)
    out = np.zeros(int(RATE * sec))
    for _ in range(int(sec * 70)):
        s = rng.integers(0, len(out) - 1200)
        lo = rng.uniform(700, 1400)
        c = _band(_noise(0.025, int(s)), lo, lo * 3)[:1200] * _env(1200, 0.0005, 0.004)
        out[s:s + 1200] += c * rng.uniform(0.4, 1)
    t = np.linspace(0, 1, len(out))
    env = np.clip(t / 0.15, 0, 1) * np.clip((1 - t) / 0.45, 0, 1)
    return _norm(out * env, peak)


# ---------- Minesweeper ----------
def boom(peak=0.32, seed=29):
    sec = 0.9
    n = _band(_noise(sec, seed), 30, 400) * _env(int(RATE * sec), 0.004, 0.22)
    thump = _sine(lambda t: 90 * np.exp(-t * 2.5) + 30, sec) * _env(int(RATE * sec), 0.002, 0.18)
    crackle = _band(_noise(sec, seed + 1), 1500, 6000) * _env(int(RATE * sec), 0.001, 0.04)
    return _norm(np.tanh(1.5 * (n + thump + 0.3 * crackle)), peak)


def womp(peak=0.16):
    out = []
    for f0 in (392.0, 370.0, 349.2, 311.1):
        sec = 0.18 if f0 != 311.1 else 0.5
        tone = _sine(lambda t, f0=f0: f0 * (1 - (0.03 * t / sec if f0 == 311.1 else 0)), sec)
        tone = np.tanh(1.8 * tone) * _env(int(RATE * sec), 0.01, sec, release=0.05)
        out.append(_band(tone, 100, 2200))
    return _norm(np.concatenate(out), peak)


def cascade(n=8, peak=0.14):
    out = np.zeros(int(RATE * (0.025 * n + 0.1)))
    for k in range(n):
        b = blip(900 + 60 * k, 0.05, 1.0)
        s = int(RATE * 0.025 * k)
        out[s:s + len(b)] += b * 0.5
    return _norm(out, peak)


def flag(peak=0.15):
    return _norm(np.concatenate([blip(1200, 0.06, 1.0), blip(1600, 0.07, 1.0)]), peak)


def win(peak=0.2):
    return chime((659.25, 783.99, 1046.5, 1318.5), gap=0.08, decay=0.4, peak=peak)


SOUNDS = {
    "click": click, "key": key, "blip": blip, "whoosh": whoosh, "chime": chime, "ding": ding, "bonk": bonk,
    "pop": pop, "boing": boing, "rice_cooker": rice_cooker, "crack": crack, "chop": chop, "slice": slice_,
    "shake": shake, "sizzle": sizzle, "confetti": confetti, "fanfare": fanfare, "scribble": scribble,
    "fill": fill, "sent": sent, "drumroll": drumroll, "applause": applause, "boom": boom, "womp": womp,
    "cascade": cascade, "flag": flag, "win": win,
}


def make(name, **kw):
    return SOUNDS[name](**kw)


def mix(events, seconds, path):
    """events: [(time, mono array, gain, pan -1..1)] -> 16-bit stereo WAV."""
    n = int(RATE * seconds)
    out = np.zeros((n, 2), dtype=np.float64)
    for t, x, gain, pan in events:
        s = int(RATE * t)
        if s >= n or s + len(x) <= 0:
            continue
        x = x[max(0, -s):]
        s = max(0, s)
        e = min(n, s + len(x))
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        out[s:e, 0] += x[:e - s] * gain * l * 1.414
        out[s:e, 1] += x[:e - s] * gain * r * 1.414
    peak = np.max(np.abs(out))
    if peak > 0:
        out *= 0.8 / peak                          # loudest moment at about -3 dBFS after the limiter
    out = np.tanh(out * 1.1) / np.tanh(1.1)       # gentle limiter
    fade = int(RATE * 0.05)
    out[-fade:] *= np.linspace(1, 0, fade)[:, None]
    pcm = (np.clip(out, -1, 1) * 32767 * 0.9).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())
