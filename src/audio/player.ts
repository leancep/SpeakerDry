import Sound from "react-native-sound";

Sound.setCategory("Playback");

let current: Sound | null = null;
let currentName: string | null = null;

export type LoadResult = { durationSec: number };

export function unload() {
  if (current) {
    current.stop();
    current.release();
    current = null;
    currentName = null;
  }
}

export async function loadRaw(name: string): Promise<LoadResult> {
  // Si ya está cargado ese mismo, reutilizamos
  if (current && currentName === name) {
    return { durationSec: current.getDuration() };
  }

  unload();

  return new Promise((resolve, reject) => {
    // Android: archivos en res/raw -> nombre sin extensión
    // iOS: luego ajustamos a bundle; por ahora Android OK
    const s = new Sound(name, Sound.MAIN_BUNDLE, (error) => {
      if (error) return reject(error);

      current = s;
      currentName = name;

      const durationSec = s.getDuration(); // duración real del wav
      resolve({ durationSec });
    });
  });
}

export function play(opts?: { loop?: boolean; volume?: number; onEnd?: () => void }) {
  if (!current) return;

  if (typeof opts?.volume === "number") current.setVolume(opts.volume);
  if (opts?.loop) current.setNumberOfLoops(-1);
  else current.setNumberOfLoops(0);

  current.play((success) => {
    // `play` termina al finalizar el archivo o si falla
    if (success) opts?.onEnd?.();
  });
}

export function pause() {
  if (!current) return;
  current.pause();
}

export function stop() {
  if (!current) return;
  current.stop(() => {
    // no release acá si querés reanudar rápido; pero para limpieza solemos liberar
  });
}

export function release() {
  unload();
}

export function getDurationSec(): number {
  return current ? current.getDuration() : 0;
}

export function getCurrentTimeSec(): Promise<number> {
  return new Promise((resolve) => {
    if (!current) return resolve(0);
    current.getCurrentTime((sec) => resolve(sec));
  });
}

export function isLoaded() {
  return !!current;
}

export async function playRaw(
  name: string,
  loop = false,
  volume = 1,
  onEnd?: () => void
) {
  await loadRaw(name);
  play({ loop, volume, onEnd });
}
