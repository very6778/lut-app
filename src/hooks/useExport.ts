import { useState, useCallback, useRef } from 'react';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { ExportProgress, ExportQuality, ColorSettings } from '../types';
import { BITRATE_PRESETS } from '../types';

interface UseExportOptions {
    videoElement: HTMLVideoElement | null;
    canvas: HTMLCanvasElement | null;
    colorSettings: ColorSettings;
    lutIntensity: number;
}

export function useExport({
    videoElement,
    canvas,
    colorSettings,
    lutIntensity,
}: UseExportOptions) {
    const [progress, setProgress] = useState<ExportProgress>({
        status: 'idle',
        currentFrame: 0,
        totalFrames: 0,
        estimatedTimeRemaining: 0,
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const muxerRef = useRef<Muxer<ArrayBufferTarget> | null>(null);

    const startExport = useCallback(
        async (quality: ExportQuality, customBitrate?: number) => {
            if (!videoElement || !canvas) {
                console.error('Video element or canvas not available');
                return;
            }

            // Reset abort controller
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            try {
                const bitrate = customBitrate || BITRATE_PRESETS[quality];
                const fps = 30; // Target FPS
                const width = videoElement.videoWidth;
                const height = videoElement.videoHeight;
                const duration = videoElement.duration;
                const totalFrames = Math.ceil(duration * fps);

                // Check WebCodecs support
                if (typeof VideoEncoder === 'undefined') {
                    throw new Error('WebCodecs not supported in this browser');
                }

                setProgress({
                    status: 'encoding',
                    currentFrame: 0,
                    totalFrames,
                    estimatedTimeRemaining: duration * 1.5,
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
                muxerRef.current = muxer;

                // Create video encoder
                const encodedChunks: EncodedVideoChunk[] = [];

                const encoder = new VideoEncoder({
                    output: (chunk, meta) => {
                        muxer.addVideoChunk(chunk, meta);
                    },
                    error: (e) => {
                        console.error('Encoder error:', e);
                        setProgress(prev => ({ ...prev, status: 'error' }));
                    },
                });

                encoder.configure({
                    codec: 'avc1.42001f', // H.264 Baseline
                    width,
                    height,
                    bitrate,
                    framerate: fps,
                });

                // Get canvas context
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Could not get canvas context');

                // Process frames
                const frameInterval = 1 / fps;

                for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
                    if (signal.aborted) {
                        encoder.close();
                        setProgress({ status: 'idle', currentFrame: 0, totalFrames: 0, estimatedTimeRemaining: 0 });
                        return;
                    }

                    const time = frameIndex * frameInterval;
                    videoElement.currentTime = time;

                    // Wait for seek to complete
                    await new Promise<void>((resolve) => {
                        const onSeeked = () => {
                            videoElement.removeEventListener('seeked', onSeeked);
                            resolve();
                        };
                        videoElement.addEventListener('seeked', onSeeked);
                    });

                    // Draw current frame to canvas (with effects applied)
                    ctx.drawImage(videoElement, 0, 0, width, height);

                    // Create VideoFrame from canvas
                    const frame = new VideoFrame(canvas, {
                        timestamp: frameIndex * frameInterval * 1_000_000, // microseconds
                        duration: frameInterval * 1_000_000,
                    });

                    // Encode frame
                    encoder.encode(frame, { keyFrame: frameIndex % 30 === 0 });
                    frame.close();

                    // Update progress
                    setProgress(prev => ({
                        ...prev,
                        currentFrame: frameIndex + 1,
                        estimatedTimeRemaining: ((totalFrames - frameIndex) / fps) * 1.5,
                    }));

                    // Yield to main thread periodically
                    if (frameIndex % 5 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                // Flush encoder
                await encoder.flush();
                encoder.close();

                // Finalize muxer
                setProgress(prev => ({ ...prev, status: 'muxing' }));
                muxer.finalize();

                // Get the final buffer
                const { buffer } = muxer.target;

                // Create download
                const blob = new Blob([buffer], { type: 'video/mp4' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `graded-video-${Date.now()}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setProgress({
                    status: 'complete',
                    currentFrame: totalFrames,
                    totalFrames,
                    estimatedTimeRemaining: 0,
                });

            } catch (error) {
                console.error('Export error:', error);
                setProgress(prev => ({ ...prev, status: 'error' }));
            }
        },
        [videoElement, canvas, colorSettings, lutIntensity]
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
