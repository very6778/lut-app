// Video State
export interface VideoState {
    file: File | null;
    url: string | null;
    duration: number;
    width: number;
    height: number;
    fps: number;
    audioTrack: ArrayBuffer | null;
}

// Color Settings
export interface ColorSettings {
    exposure: number;      // -2 to +2
    contrast: number;      // -100 to +100
    saturation: number;    // -100 to +100
    vibrance: number;      // -100 to +100
    temperature: number;   // -100 to +100
    tint: number;          // -100 to +100 (green to magenta)
    highlights: number;    // -100 to +100
    shadows: number;       // -100 to +100
}

export const DEFAULT_COLOR_SETTINGS: ColorSettings = {
    exposure: 0,
    contrast: 0,
    saturation: 0,
    vibrance: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
};

// LUT
export interface LUTPreset {
    id: string;
    name: string;
    path: string;
    thumbnail?: string;
}

export interface LUTState {
    selectedLUT: LUTPreset | null;
    customLUT: File | null;
    intensity: number; // 0-100
}

export const DEFAULT_LUT_STATE: LUTState = {
    selectedLUT: null,
    customLUT: null,
    intensity: 100,
};

// Export Settings
export type ExportQuality = 'low' | 'medium' | 'high' | 'custom';

export interface ExportSettings {
    quality: ExportQuality;
    bitrate: number; // bps
}

export const BITRATE_PRESETS: Record<ExportQuality, number> = {
    low: 5_000_000,     // 5 Mbps
    medium: 10_000_000, // 10 Mbps
    high: 20_000_000,   // 20 Mbps
    custom: 15_000_000, // Default for custom
};

export const FPS_OPTIONS = [24, 25, 30, 60] as const;
export type ExportFPS = typeof FPS_OPTIONS[number];

export interface ExportProgress {
    status: 'idle' | 'encoding' | 'muxing' | 'complete' | 'error';
    currentFrame: number;
    totalFrames: number;
    estimatedTimeRemaining: number; // seconds
}

// App State
export interface AppState {
    video: VideoState;
    color: ColorSettings;
    lut: LUTState;
    export: ExportSettings;
    showBefore: boolean;
    isPlaying: boolean;
}

// Built-in LUT Presets
export const BUILTIN_LUTS: LUTPreset[] = [
    { id: 'apple-log-rec709', name: 'Apple Log → Rec709', path: '/luts/Conversion LUT - Apple Log to Rec709.cube' },
    { id: 'apple-log-high-contrast', name: 'Apple Log → High Contrast', path: '/luts/Apple Log - High Contrast.cube' },
    { id: 'apple-log-cn2', name: 'Apple Log → CN2 (Soft)', path: '/luts/Apple Log - CN2.cube' },
];
