import numpy as np
import soundfile as sf
import os

SR = 44100

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "android/app/src/main/res/raw")
os.makedirs(OUT_DIR, exist_ok=True)

def fade_in_out(wave, sr, ms=30):
    n = int(sr * ms / 1000)
    if n <= 0 or n * 2 > len(wave):
        return wave
    ramp = np.linspace(0, 1, n, dtype=np.float32)
    wave[:n] *= ramp
    wave[-n:] *= ramp[::-1]
    return wave

def normalize_peak(wave, peak=0.95):
    m = np.max(np.abs(wave)) + 1e-9
    return (wave / m) * peak

def silence(seconds):
    return np.zeros(int(SR * seconds), dtype=np.float32)

def fit_to_seconds(wave, seconds):
    target = int(SR * seconds)
    if len(wave) > target:
        return wave[:target]
    if len(wave) < target:
        return np.concatenate([wave, np.zeros(target - len(wave), dtype=np.float32)])
    return wave

def tone(freq, seconds, name, amp=0.85, fade_ms=50, am_rate=None, am_depth=0.6):
    n = int(SR * seconds)
    t = np.arange(n, dtype=np.float32) / SR
    wave = np.sin(2 * np.pi * freq * t).astype(np.float32)

    # AM opcional: “sacude” más (sin cambiar frecuencia)
    if am_rate is not None:
        # AM entre (1-depth) y 1
        am = (1 - am_depth) + am_depth * (0.5 * (1 + np.sin(2 * np.pi * am_rate * t)))
        wave *= am.astype(np.float32)

    wave *= amp
    wave = fade_in_out(wave, SR, ms=fade_ms)
    wave = normalize_peak(wave, peak=0.95)
    sf.write(os.path.join(OUT_DIR, f"{name}.wav"), wave, SR)
    print(f"✔ tone {freq}Hz -> {name}.wav")

def sweep_linear(f_start, f_end, seconds, name, amp=0.85, fade_ms=40):
    n = int(SR * seconds)
    freqs = np.linspace(f_start, f_end, n, dtype=np.float32)

    # ✅ sweep correcto: integrar frecuencia -> fase acumulada
    phase = np.cumsum(2 * np.pi * freqs / SR).astype(np.float32)
    wave = np.sin(phase).astype(np.float32)

    wave *= amp
    wave = fade_in_out(wave, SR, ms=fade_ms)
    wave = normalize_peak(wave, peak=0.95)
    sf.write(os.path.join(OUT_DIR, f"{name}.wav"), wave, SR)
    print(f"✔ sweep {f_start}-{f_end}Hz -> {name}.wav")

# -------------------------
# 1) Manual tones (5s)
#    AM suave para “sacudida” en frecuencias bajas
for hz in [200, 400, 800, 1200, 2000, 3000]:
    am = 4.0 if hz <= 1200 else None
    tone(hz, 5, f"tone_{hz}", amp=0.85, fade_ms=50, am_rate=am, am_depth=0.6)

# -------------------------
# 2) Quick (30s): sin silencios largos al final
#    armamos un bloque ~5s y lo repetimos hasta 30s

def make_quick_block():
    parts = []
    parts.append(silence(0.03))

    # burst 220Hz (0.32s) con AM 6Hz
    n = int(SR * 0.32)
    t = np.arange(n, dtype=np.float32) / SR
    burst = np.sin(2 * np.pi * 220 * t).astype(np.float32)
    am = 0.35 + 0.65 * (0.5 * (1 + np.sin(2 * np.pi * 6 * t)))
    burst *= am.astype(np.float32)
    burst = fade_in_out(burst, SR, ms=18)
    parts.append(burst)

    parts.append(silence(0.08))

    # mini-sweep 180 -> 420 (1.55s)
    n = int(SR * 1.55)
    freqs = np.linspace(180, 420, n, dtype=np.float32)
    phase = np.cumsum(2 * np.pi * freqs / SR).astype(np.float32)
    sw1 = np.sin(phase).astype(np.float32)
    sw1 = fade_in_out(sw1, SR, ms=28)
    parts.append(sw1)

    parts.append(silence(0.10))

    # sweep 300 -> 750 (1.65s)
    n = int(SR * 1.65)
    freqs = np.linspace(300, 750, n, dtype=np.float32)
    phase = np.cumsum(2 * np.pi * freqs / SR).astype(np.float32)
    sw2 = np.sin(phase).astype(np.float32)
    sw2 = fade_in_out(sw2, SR, ms=28)
    parts.append(sw2)

    parts.append(silence(0.10))

    # pequeño “kick” final (0.35s) para que no se perciba repetitivo
    n = int(SR * 0.35)
    t = np.arange(n, dtype=np.float32) / SR
    kick = np.sin(2 * np.pi * 260 * t).astype(np.float32)
    am2 = 0.25 + 0.75 * (0.5 * (1 + np.sin(2 * np.pi * 7 * t)))
    kick *= am2.astype(np.float32)
    kick = fade_in_out(kick, SR, ms=18)
    parts.append(kick)

    block = np.concatenate(parts).astype(np.float32)
    return block

block = make_quick_block()

# repetir hasta pasar 30s (sin relleno de silencio)
reps = int(np.ceil((SR * 30) / len(block)))
quick = np.tile(block, reps).astype(np.float32)

# recortar exacto y hacer fade-out final para cierre prolijo
quick = quick[: int(SR * 30)]
quick = fade_in_out(quick, SR, ms=60)  # fade-out un poco más largo al final
quick = normalize_peak(quick, peak=0.95)

sf.write(os.path.join(OUT_DIR, "clean_quick.wav"), quick, SR)
print(f"✔ built -> clean_quick.wav ({len(quick)/SR:.1f}s)")


# -------------------------
# 3) Deep (120s): fases repetidas centradas 180-900
deep_parts = []
for _ in range(10):  # 10 bloques ~12s => 120s
    # A: 180-350 (4.0s)
    n = int(SR * 4.0)
    freqs = np.linspace(180, 350, n, dtype=np.float32)
    phase = np.cumsum(2 * np.pi * freqs / SR).astype(np.float32)
    a = np.sin(phase).astype(np.float32)
    a = fade_in_out(a, SR, ms=40)
    deep_parts.append(a)

    deep_parts.append(silence(0.15))

    # B: pulsos 250Hz (3.0s) gate 300ms on / 120ms off
    n = int(SR * 3.0)
    t = np.arange(n, dtype=np.float32) / SR
    b = np.sin(2 * np.pi * 250 * t).astype(np.float32)
    gate = (np.mod(t, 0.42) < 0.30).astype(np.float32)
    gate = np.clip(gate + 0.15, 0, 1)  # suaviza
    b *= gate
    b = fade_in_out(b, SR, ms=30)
    deep_parts.append(b)

    deep_parts.append(silence(0.20))

    # C: 350-900 (4.3s)
    n = int(SR * 4.3)
    freqs = np.linspace(350, 900, n, dtype=np.float32)
    phase = np.cumsum(2 * np.pi * freqs / SR).astype(np.float32)
    c = np.sin(phase).astype(np.float32)
    c = fade_in_out(c, SR, ms=40)
    deep_parts.append(c)

    deep_parts.append(silence(0.35))

deep = np.concatenate(deep_parts).astype(np.float32)
deep = fit_to_seconds(deep, 120)
deep = normalize_peak(deep, peak=0.95)
sf.write(os.path.join(OUT_DIR, "clean_deep.wav"), deep, SR)
print(f"✔ built -> clean_deep.wav ({len(deep)/SR:.1f}s)")

print("\n🎵 Audios generados en:", OUT_DIR)
