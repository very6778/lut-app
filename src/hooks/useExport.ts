import { useState, useCallback, useRef } from 'react';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { ExportProgress, ColorSettings, VideoState } from '../types';
import type { LUTData } from './useLUT';

// Helper: Apply color grading effects to ImageData (CPU-based)
function applyColorGrading(imageData: ImageData, settings: ColorSettings): ImageData {
    const data = imageData.data;
    const { exposure = 0, contrast = 0, saturation = 0, temperature = 0, highlights = 0, shadows = 0 } = settings;

    // Pre-calculate factors
    const exposureFactor = Math.pow(2.0, exposure * 0.13);
    const contrastFactor = 1.0 + contrast / 100.0;
    const saturationFactor = 1.0 + saturation / 100.0;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i] / 255;
        let g = data[i + 1] / 255;
        let b = data[i + 2] / 255;

        // Exposure
        r *= exposureFactor;
        g *= exposureFactor;
        b *= exposureFactor;

        // Contrast
        r = (r - 0.5) * contrastFactor + 0.5;
        g = (g - 0.5) * contrastFactor + 0.5;
        b = (b - 0.5) * contrastFactor + 0.5;

        // Saturation
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lum + (r - lum) * saturationFactor;
        g = lum + (g - lum) * saturationFactor;
        b = lum + (b - lum) * saturationFactor;

        // Temperature
        const tempShift = temperature / 1000.0;
        r += tempShift;
        b -= tempShift;

        // Highlights
        const highlightMask = Math.max(0, Math.min(1, (lum - 0.2) / 0.8));
        const highlightAdj = (highlights * 2.0) / 100.0 * 0.5;
        r += highlightAdj * highlightMask;
        g += highlightAdj * highlightMask;
        b += highlightAdj * highlightMask;

        // Shadows
        const shadowMask = 1.0 - Math.max(0, Math.min(1, lum / 0.5));
        const shadowAdj = (shadows * 0.1) / 100.0 * 0.5;
        r += shadowAdj * shadowMask;
        g += shadowAdj * shadowMask;
        b += shadowAdj * shadowMask;

        // Clamp and write back
        data[i] = Math.max(0, Math.min(255, Math.round(r * 255)));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
        data[i + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
    }

    return imageData;
}

// Helper: Apply LUT to ImageData
function applyLUT(imageData: ImageData, lutData: LUTData, intensity: number): ImageData {
    const data = imageData.data;
    const { data: lut, size } = lutData;
    const scale = (size - 1) / 255;
    const blend = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate LUT indices
        const rIdx = r * scale;
        const gIdx = g * scale;
        const bIdx = b * scale;

        // Trilinear interpolation (simplified - nearest neighbor for speed)
        const r0 = Math.floor(rIdx);
        const g0 = Math.floor(gIdx);
        const b0 = Math.floor(bIdx);

        // LUT index (RGBA format, 4 channels per entry)
        const lutIdx = ((b0 * size + g0) * size + r0) * 4;

        // Get LUT values (normalized 0-1 in LUT, need to convert)
        const lutR = lut[lutIdx] * 255;
        const lutG = lut[lutIdx + 1] * 255;
        const lutB = lut[lutIdx + 2] * 255;

        // Blend original with LUT result
        data[i] = Math.round(r + (lutR - r) * blend);
        data[i + 1] = Math.round(g + (lutG - g) * blend);
        data[i + 2] = Math.round(b + (lutB - b) * blend);
    }

    return imageData;
}

export function useExport() {
    const [progress, setProgress] = useState<ExportProgress>({
        status: 'idle',
        currentFrame: 0,
        totalFrames: 0,
        estimatedTimeRemaining: 0,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const startExport = useCallback(
        async (
            _video: VideoState,
            videoElement: HTMLVideoElement,
            settings: { quality: 'low' | 'medium' | 'high' | 'custom'; bitrate: number },
            colorSettings: ColorSettings,
            lutData: LUTData | null,
            lutIntensity: number,
            fps: number = 30
        ) => {
            if (!videoElement) {
                console.error('Video element not available');
                return;
            }

            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            try {
                const bitrate = settings.bitrate || 10_000_000;
                const width = videoElement.videoWidth;
                const height = videoElement.videoHeight;
                const duration = videoElement.duration;
                const totalFrames = Math.ceil(duration * fps);

                if (typeof VideoEncoder === 'undefined') {
                    throw new Error('WebCodecs not supported');
                }

                setProgress({
                    status: 'encoding',
                    currentFrame: 0,
                    totalFrames,
                    estimatedTimeRemaining: duration * 0.5,
                });

                // Create muxer
                const muxer = new Muxer({
                    target: new ArrayBufferTarget(),
                    video: {
                        codec: 'avc',
                        width,
                        height,
                    },
                    fastStart: 'in-memory',
                });

                // Create encoder with appropriate level
                const codecLevel = (width * height) > 2097152 ? '640034' : '640028'; // Level 5.2 or 5.1

                let encodedFrames = 0;
                const encoder = new VideoEncoder({
                    output: (chunk, meta) => {
                        muxer.addVideoChunk(chunk, meta);
                        encodedFrames++;
                    },
                    error: (e) => {
                        console.error('Encoder error:', e);
                    },
                });

                encoder.configure({
                    codec: `avc1.${codecLevel}`,
                    width,
                    height,
                    bitrate,
                    framerate: fps,
                    hardwareAcceleration: 'prefer-hardware',
                    latencyMode: 'quality',
                });

                // Create offscreen canvas
                const canvas = new OffscreenCanvas(width, height);
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Could not get canvas context');

                // HIGH-SPEED APPROACH: Use playback + requestVideoFrameCallback
                // This captures frames in real-time as video plays

                const startTime = performance.now();
                let frameCount = 0;
                const frameInterval = 1000 / fps;
                let lastFrameTime = 0;
                let exportResolve: () => void;

                const exportPromise = new Promise<void>((resolve) => {
                    exportResolve = resolve;
                });

                // Frame callback for high-speed capture
                const finishExport = async () => {
                    videoElement.pause();
                    videoElement.playbackRate = 1.0;

                    await encoder.flush();
                    encoder.close();

                    setProgress(prev => ({ ...prev, status: 'muxing' }));
                    muxer.finalize();

                    const { buffer } = muxer.target;
                    const blob = new Blob([buffer], { type: 'video/mp4' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `graded-video-${Date.now()}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    const elapsed = (performance.now() - startTime) / 1000;
                    console.log(`Export complete: ${frameCount} frames in ${elapsed.toFixed(1)}s`);

                    setProgress({
                        status: 'complete',
                        currentFrame: frameCount,
                        totalFrames: frameCount,
                        estimatedTimeRemaining: 0,
                    });

                    exportResolve();
                };

                let exportFinished = false;

                const handleFinish = async () => {
                    if (exportFinished) return;
                    exportFinished = true;
                    await finishExport();
                };

                const captureFrame = (now: number, metadata: VideoFrameCallbackMetadata) => {
                    if (signal.aborted || exportFinished) return;

                    if (metadata.mediaTime >= duration - 0.1 || videoElement.ended) {
                        handleFinish();
                        return;
                    }

                    if (now - lastFrameTime >= frameInterval * 0.8) {
                        lastFrameTime = now;

                        // Draw video frame
                        ctx.drawImage(videoElement, 0, 0, width, height);

                        // Apply color grading and LUT
                        let frameData = ctx.getImageData(0, 0, width, height);
                        frameData = applyColorGrading(frameData, colorSettings);
                        if (lutData) {
                            frameData = applyLUT(frameData, lutData, lutIntensity);
                        }
                        ctx.putImageData(frameData, 0, 0);

                        const frame = new VideoFrame(canvas, {
                            timestamp: Math.round(metadata.mediaTime * 1_000_000),
                            duration: Math.round(frameInterval * 1000),
                        });

                        const isKeyFrame = frameCount % (fps * 2) === 0;
                        encoder.encode(frame, { keyFrame: isKeyFrame });
                        frame.close();

                        frameCount++;

                        setProgress({
                            status: 'encoding',
                            currentFrame: frameCount,
                            totalFrames,
                            estimatedTimeRemaining: Math.max(0, duration - metadata.mediaTime),
                        });
                    }

                    videoElement.requestVideoFrameCallback(captureFrame);
                };

                videoElement.currentTime = 0;
                videoElement.playbackRate = 1.3;

                await new Promise<void>(resolve => {
                    const onSeeked = () => {
                        videoElement.removeEventListener('seeked', onSeeked);
                        resolve();
                    };
                    videoElement.addEventListener('seeked', onSeeked);
                });

                videoElement.requestVideoFrameCallback(captureFrame);
                videoElement.play();

                await exportPromise;

            } catch (error) {
                console.error('Export error:', error);
                setProgress(prev => ({ ...prev, status: 'error' }));
            }
        },
        []
    );

    const cancelExport = useCallback(() => {
        abortControllerRef.current?.abort();
        setProgress({
            status: 'idle',
            currentFrame: 0,
            totalFrames: 0,
            estimatedTimeRemaining: 0,
        });
    }, []);

    const resetProgress = useCallback(() => {
        setProgress({
            status: 'idle',
            currentFrame: 0,
            totalFrames: 0,
            estimatedTimeRemaining: 0,
        });
    }, []);

    return {
        progress,
        startExport,
        cancelExport,
        resetProgress,
    };
}
