import { useCallback, useRef, useEffect, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import type { LUTPreset } from '../types';
import { cn, haptic } from '../lib/utils';

interface LUTSelectorProps {
    presets: LUTPreset[];
    selectedLUT: LUTPreset | null;
    customLUT: File | null;
    intensity: number;
    onSelectPreset: (preset: LUTPreset | null) => void;
    onUploadCustom: (file: File) => void;
    onIntensityChange: (value: number) => void;
    videoElement?: HTMLVideoElement | null;
}

// Helper to capture video frame as ImageData
// Helper to capture video frame as ImageData efficiently using ImageBitmap (GPU accelerated)
async function captureVideoFrameAsync(video: HTMLVideoElement): Promise<ImageData | null> {
    if (!video || video.videoWidth === 0) return null;

    try {
        const size = 64; // thumbnail size

        // Calculate center crop logic
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const srcSize = Math.min(vw, vh);
        const sx = (vw - srcSize) / 2;
        const sy = (vh - srcSize) / 2;

        // Use createImageBitmap for efficient GPU-side cropping and resizing
        const bitmap = await createImageBitmap(video, sx, sy, srcSize, srcSize, {
            resizeWidth: size,
            resizeHeight: size,
            resizeQuality: 'medium',
        });

        // Draw bitmap to a small canvas to extract pixel data
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(bitmap, 0, 0);
        bitmap.close(); // Release memory

        return ctx.getImageData(0, 0, size, size);
    } catch (e) {
        console.warn('createImageBitmap failed, falling back to synchronous draw', e);
        // Fallback to synchronous draw if createImageBitmap fails
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const srcSize = Math.min(vw, vh);
        const sx = (vw - srcSize) / 2;
        const sy = (vh - srcSize) / 2;

        ctx.drawImage(video, sx, sy, srcSize, srcSize, 0, 0, size, size);
        return ctx.getImageData(0, 0, size, size);
    }
}

// Simple LUT application for thumbnail preview
function applyLUTToImageData(
    imageData: ImageData,
    lutData: Float32Array,
    lutSize: number
): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const result = new ImageData(data, imageData.width, imageData.height);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;

        // Trilinear interpolation
        const rIdx = r * (lutSize - 1);
        const gIdx = g * (lutSize - 1);
        const bIdx = b * (lutSize - 1);

        const r0 = Math.floor(rIdx);
        const g0 = Math.floor(gIdx);
        const b0 = Math.floor(bIdx);

        const r1 = Math.min(r0 + 1, lutSize - 1);
        const g1 = Math.min(g0 + 1, lutSize - 1);
        const b1 = Math.min(b0 + 1, lutSize - 1);

        const rFrac = rIdx - r0;
        const gFrac = gIdx - g0;
        const bFrac = bIdx - b0;

        const getColor = (ri: number, gi: number, bi: number) => {
            const idx = (bi * lutSize * lutSize + gi * lutSize + ri) * 4;
            return [lutData[idx], lutData[idx + 1], lutData[idx + 2]];
        };

        const c000 = getColor(r0, g0, b0);
        const c100 = getColor(r1, g0, b0);
        const c010 = getColor(r0, g1, b0);
        const c110 = getColor(r1, g1, b0);
        const c001 = getColor(r0, g0, b1);
        const c101 = getColor(r1, g0, b1);
        const c011 = getColor(r0, g1, b1);
        const c111 = getColor(r1, g1, b1);

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        const c00 = c000.map((v, j) => lerp(v, c100[j], rFrac));
        const c01 = c001.map((v, j) => lerp(v, c101[j], rFrac));
        const c10 = c010.map((v, j) => lerp(v, c110[j], rFrac));
        const c11 = c011.map((v, j) => lerp(v, c111[j], rFrac));

        const c0 = c00.map((v, j) => lerp(v, c10[j], gFrac));
        const c1 = c01.map((v, j) => lerp(v, c11[j], gFrac));

        const c = c0.map((v, j) => lerp(v, c1[j], bFrac));

        result.data[i] = Math.round(c[0] * 255);
        result.data[i + 1] = Math.round(c[1] * 255);
        result.data[i + 2] = Math.round(c[2] * 255);
    }

    return result;
}

// LUT Thumbnail with preview
function LUTThumbnail({
    preset,
    isSelected,
    videoFrame,
    onClick,
}: {
    preset: LUTPreset;
    isSelected: boolean;
    videoFrame: ImageData | null;
    onClick: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [lutData, setLutData] = useState<{ data: Float32Array; size: number } | null>(null);

    useEffect(() => {
        const loadLUT = async () => {
            try {
                const response = await fetch(preset.path);
                const content = await response.text();

                const lines = content.split('\n');
                const data: number[] = [];
                let size = 0;

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('#') || trimmed === '') continue;
                    if (trimmed.startsWith('LUT_3D_SIZE')) {
                        size = parseInt(trimmed.split(/\s+/)[1], 10);
                        continue;
                    }
                    if (trimmed.startsWith('TITLE') || trimmed.startsWith('DOMAIN')) continue;

                    const values = trimmed.split(/\s+/).map(parseFloat);
                    if (values.length === 3 && !values.some(isNaN)) {
                        data.push(...values, 1.0); // Add alpha
                    }
                }

                if (data.length > 0 && size > 0) {
                    setLutData({ data: new Float32Array(data), size });
                }
            } catch (e) {
                console.error('Failed to load LUT for thumbnail:', e);
            }
        };

        loadLUT();
    }, [preset.path]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !videoFrame || !lutData) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = videoFrame.width;
        canvas.height = videoFrame.height;

        const processedFrame = applyLUTToImageData(videoFrame, lutData.data, lutData.size);
        ctx.putImageData(processedFrame, 0, 0);
    }, [videoFrame, lutData]);

    return (
        <button onClick={onClick} className={cn('lut-thumbnail', isSelected && 'selected')}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
            {!videoFrame && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
            )}
            {isSelected && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-[var(--accent)] rounded-full flex items-center justify-center z-10">
                    <Check className="w-2.5 h-2.5 text-white" />
                </div>
            )}
            <span className="lut-thumbnail-label">{preset.name}</span>
        </button>
    );
}

// "None" thumbnail (original frame)
function NoneThumbnail({
    isSelected,
    videoFrame,
    onClick,
}: {
    isSelected: boolean;
    videoFrame: ImageData | null;
    onClick: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !videoFrame) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = videoFrame.width;
        canvas.height = videoFrame.height;
        ctx.putImageData(videoFrame, 0, 0);
    }, [videoFrame]);

    return (
        <button onClick={onClick} className={cn('lut-thumbnail', isSelected && 'selected')}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
            {!videoFrame && (
                <div className="absolute inset-0 bg-[var(--bg-l2)]" />
            )}
            {isSelected && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-[var(--accent)] rounded-full flex items-center justify-center z-10">
                    <Check className="w-2.5 h-2.5 text-white" />
                </div>
            )}
            <span className="lut-thumbnail-label">None</span>
        </button>
    );
}

export function LUTSelector({
    presets,
    selectedLUT,
    customLUT,
    intensity,
    onSelectPreset,
    onUploadCustom,
    onIntensityChange,
    videoElement,
}: LUTSelectorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [videoFrame, setVideoFrame] = useState<ImageData | null>(null);

    useEffect(() => {
        if (!videoElement) return;

        let isMounted = true;
        let retryCount = 0;

        const captureFrame = async () => {
            if (!isMounted) return;

            // Check if video is ready
            if (videoElement.readyState < 2) return;

            const frame = await captureVideoFrameAsync(videoElement);

            if (isMounted) {
                if (frame) {
                    // Check if frame is not empty/transparent
                    const hasData = frame.data.some(channel => channel > 0);
                    if (hasData) {
                        setVideoFrame(frame);
                    } else if (retryCount < 3) {
                        // Retry if frame is empty (browser decoding delay)
                        retryCount++;
                        setTimeout(captureFrame, 500);
                    }
                } else if (retryCount < 3) {
                    retryCount++;
                    setTimeout(captureFrame, 500);
                }
            }
        };

        // Try immediately if ready
        if (videoElement.readyState >= 2) {
            captureFrame();
        }

        const handleLoad = () => {
            retryCount = 0;
            // Add a small delay for 4K videos to ensure decoding started
            setTimeout(captureFrame, 100);
        };

        videoElement.addEventListener('seeked', handleLoad);
        videoElement.addEventListener('loadeddata', handleLoad);
        // 'canplay' is often safer for display ready
        videoElement.addEventListener('canplay', handleLoad);

        return () => {
            isMounted = false;
            videoElement.removeEventListener('seeked', handleLoad);
            videoElement.removeEventListener('loadeddata', handleLoad);
            videoElement.removeEventListener('canplay', handleLoad);
        };
    }, [videoElement]);

    const handlePresetClick = useCallback(
        (preset: LUTPreset | null) => {
            haptic('light');
            onSelectPreset(preset);
        },
        [onSelectPreset]
    );

    const handleCustomUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file && file.name.endsWith('.cube')) {
                haptic('medium');
                onUploadCustom(file);
            }
        },
        [onUploadCustom]
    );

    const handleIntensityChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onIntensityChange(parseInt(e.target.value, 10));
        },
        [onIntensityChange]
    );

    const isNoneSelected = selectedLUT === null && customLUT === null;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="section-header">LUTs</span>
            </div>

            {/* LUT Grid */}
            <div className="lut-grid scrollbar-none">
                <NoneThumbnail
                    isSelected={isNoneSelected}
                    videoFrame={videoFrame}
                    onClick={() => handlePresetClick(null)}
                />

                {presets.map((preset) => (
                    <LUTThumbnail
                        key={preset.id}
                        preset={preset}
                        isSelected={selectedLUT?.id === preset.id}
                        videoFrame={videoFrame}
                        onClick={() => handlePresetClick(preset)}
                    />
                ))}

                {/* Custom Upload */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn('lut-thumbnail lut-thumbnail-add', customLUT && 'selected')}
                >
                    <Plus size={16} />
                    <span className="text-[10px]">{customLUT ? 'Custom' : 'Add'}</span>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".cube"
                    className="hidden"
                    onChange={handleCustomUpload}
                />
            </div>

            {/* Intensity Slider */}
            <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-secondary)] w-14">Intensity</span>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={intensity}
                    onChange={handleIntensityChange}
                    disabled={isNoneSelected}
                    className="adjustment-slider flex-1"
                />
                <span className="adjustment-value">{intensity}%</span>
            </div>
        </div>
    );
}
