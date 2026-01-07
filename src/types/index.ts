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
    temperature: number;   // -100 to +100
    highlights: number;    // -100 to +100
    shadows: number;       // -100 to +100
}

export const DEFAULT_COLOR_SETTINGS: ColorSettings = {
    exposure: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
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
    { id: 'cinematic', name: 'Cinematic', path: '/luts/cinematic.cube' },
    { id: 'vintage', name: 'Vintage', path: '/luts/vintage.cube' },
    { id: 'natural', name: 'Natural', path: '/luts/natural.cube' },
    { id: 'bw-contrast', name: 'B&W', path: '/luts/bw-contrast.cube' },
    { id: 'muted', name: 'Muted', path: '/luts/muted.cube' },
    { id: 'vibrant', name: 'Vibrant', path: '/luts/vibrant.cube' },
];
