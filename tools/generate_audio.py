import numpy as np
import soundfile as sf
import os

SR = 44100

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "android/app/src/main/res/raw")

os.makedirs(OUT_DIR, exist_ok=True)

def fade(wave, sr, ms=10):
    n = int(sr * ms / 1000)
    ramp = np.linspace(0, 1, n)
    wave[:n] *= ramp
    wave[-n:] *= ramp[::-1]
    return wave

def tone(freq, seconds, name):
    t = np.linspace(0, seconds, int(SR * seconds), False)
    wave = np.sin(2 * np.pi * freq * t)
    wave = fade(wave, SR)
    sf.write(os.path.join(OUT_DIR, f"{name}.wav"), wave, SR)
    print(f"✔ tone {freq}Hz")

def sweep(f_start, f_end, seconds, name):
    t = np.linspace(0, seconds, int(SR * seconds))
    freqs = np.linspace(f_start, f_end, len(t))
    wave = np.sin(2 * np.pi * freqs * t)
    wave = fade(wave, SR)
    sf.write(os.path.join(OUT_DIR, f"{name}.wav"), wave, SR)
    print(f"✔ sweep {f_start}-{f_end}Hz")

# 🔹 Tonos manuales
for hz in [200, 400, 800, 1200, 2000, 3000]:
    tone(hz, 5, f"tone_{hz}")

# 🔹 Limpieza rápida (30s)
sweep(200, 2500, 30, "clean_quick")

# 🔹 Limpieza profunda (2 min)
sweep(150, 3500, 120, "clean_deep")

print("\n🎵 Audios generados en:", OUT_DIR)
