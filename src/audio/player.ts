import { Platform } from "react-native";
import Sound from "react-native-sound";

// Mejor en Android: allowMix = true
Sound.setCategory("Playback", true);

let current: Sound | null = null;
let currentName: string | null = null;

export type LoadResult = { durationSec: number };

export function unload() {
    if (current) {
        try {
            current.stop();
        } catch { }
        try {
            current.release();
        } catch { }
        current = null;
        currentName = null;
    }
}

export function isLoaded() {
    return !!current;
}

export function getDurationSec(): number {
    return current ? current.getDuration() : 0;
}

export function getCurrentName() {
    return currentName;
}

export function getCurrentTimeSec(): Promise<number> {
    return new Promise((resolve) => {
        if (!current) return resolve(0);
        current.getCurrentTime((sec) => resolve(sec ?? 0));
    });
}

export function setCurrentTimeSec(sec: number) {
    if (!current) return;
    try {
        current.setCurrentTime(sec);
    } catch { }
}

export async function loadRaw(name: string): Promise<LoadResult> {
    if (current && currentName === name) {
        return { durationSec: current.getDuration() };
    }

    unload();

    return new Promise((resolve, reject) => {
        // ✅ Android (res/raw): basePath vacío/undefined
        // ✅ iOS: MAIN_BUNDLE
        const basePath = Platform.OS === "android" ? undefined : Sound.MAIN_BUNDLE;

        const s = new Sound(name, basePath as any, (error) => {
            if (error) return reject(error);

            current = s;
            currentName = name;

            resolve({ durationSec: s.getDuration() });
        });
    });
}

export function play(opts?: {
    loop?: boolean;
    volume?: number;
    onEnd?: () => void;
    resetToStart?: boolean; // ✅ clave para "reanudar"
}) {
    if (!current) return;

    if (typeof opts?.volume === "number") current.setVolume(opts.volume);
    current.setNumberOfLoops(opts?.loop ? -1 : 0);

    // ✅ SOLO resetea si lo pedimos (inicio / cambio de tono).
    if (opts?.resetToStart) {
        try {
            current.setCurrentTime(0);
        } catch { }
    }

    current.play((success) => {
        if (success) opts?.onEnd?.();
    });
}

export function pause() {
    if (!current) return;
    current.pause();
}

export function stop() {
    if (!current) return;
    current.stop();
}

export function release() {
    unload();
}

export async function playRaw(
    name: string,
    loop = false,
    volume = 1,
    onEnd?: () => void,
    resetToStart = true
) {
    await loadRaw(name);
    play({ loop, volume, onEnd, resetToStart });
}
