import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Haptic feedback helper
export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        const duration = { light: 10, medium: 25, heavy: 50 }[type];
        navigator.vibrate(duration);
    }
}

// Format time as MM:SS
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format file size
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Clamp value between min and max
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

// Map value from one range to another
export function mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

// Check WebCodecs support
export function isWebCodecsSupported(): boolean {
    return (
        typeof VideoEncoder !== 'undefined' &&
        typeof VideoDecoder !== 'undefined'
    );
}

// Validate video file
export async function validateVideo(
    file: File
): Promise<{ valid: boolean; error?: string; duration?: number }> {
    // Check file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Unsupported format. Use MP4, MOV or WebM.' };
    }

    // Check duration
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            if (video.duration > 180) {
                resolve({
                    valid: false,
                    error: 'Video must be under 3 minutes.',
                });
            } else {
                resolve({ valid: true, duration: video.duration });
            }
        };
        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            resolve({ valid: false, error: 'Failed to load video.' });
        };
        video.src = URL.createObjectURL(file);
    });
}

// Estimate export file size
export function estimateFileSize(
    duration: number,
    bitrate: number,
    audioBitrate: number = 128000
): number {
    // Duration in seconds * total bitrate in bps / 8 to get bytes
    return Math.round((duration * (bitrate + audioBitrate)) / 8);
}

// Estimate export time (rough: ~1.5x realtime)
export function estimateExportTime(duration: number): number {
    return Math.round(duration * 1.5);
}
