import { useState, useCallback, useRef } from 'react';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { ColorSettings } from '../types';
import type { LUTData } from './useLUT';

// Quality presets
const QUALITY_PRESETS = {
    low: { videoBitrate: 2_000_000, audioBitrate: 128_000, maxWidth: 1280 },
    medium: { videoBitrate: 5_000_000, audioBitrate: 192_000, maxWidth: 1920 },
    high: { videoBitrate: 10_000_000, audioBitrate: 256_000, maxWidth: null },
    max: { videoBitrate: 20_000_000, audioBitrate: 320_000, maxWidth: null },
} as const;

export type ExportQuality = keyof typeof QUALITY_PRESETS;

export interface ExportProgress {
    stage: 'preparing' | 'encoding' | 'muxing' | 'done' | 'error';
    progress: number; // 0-100
    message: string;
}

interface UseVideoExportOptions {
    videoElement: HTMLVideoElement | null;
    colorSettings: ColorSettings;
    lutData: LUTData | null;
    lutIntensity: number;
}

export function useVideoExport({ videoElement, colorSettings, lutData, lutIntensity }: UseVideoExportOptions) {
    const [progress, setProgress] = useState<ExportProgress>({ stage: 'preparing', progress: 0, message: '' });
    const [isExporting, setIsExporting] = useState(false);
    const cancelRef = useRef(false);

    const exportVideo = useCallback(async (quality: ExportQuality = 'high'): Promise<Blob | null> => {
        if (!videoElement || isExporting) return null;

        // Check WebCodecs support
        if (!('VideoEncoder' in window)) {
            setProgress({ stage: 'error', progress: 0, message: 'WebCodecs not supported. Use Chrome or Edge.' });
            return null;
        }

        cancelRef.current = false;
        setIsExporting(true);
        setProgress({ stage: 'preparing', progress: 0, message: 'Preparing...' });

        const preset = QUALITY_PRESETS[quality];
        const sourceWidth = videoElement.videoWidth;
        const sourceHeight = videoElement.videoHeight;

        // Calculate output dimensions
        let outputWidth = sourceWidth;
        let outputHeight = sourceHeight;
        if (preset.maxWidth && sourceWidth > preset.maxWidth) {
            const scale = preset.maxWidth / sourceWidth;
            outputWidth = preset.maxWidth;
            outputHeight = Math.round(sourceHeight * scale);
        }
        // Ensure even dimensions (required by H.264)
        outputWidth = Math.round(outputWidth / 2) * 2;
        outputHeight = Math.round(outputHeight / 2) * 2;

        const fps = 30; // Use fixed 30fps for export
        const duration = videoElement.duration;
        const totalFrames = Math.ceil(duration * fps);

        try {
            // Setup MP4 Muxer
            const muxer = new Muxer({
                target: new ArrayBufferTarget(),
                video: {
                    codec: 'avc',
                    width: outputWidth,
                    height: outputHeight,
                },
                audio: {
                    codec: 'aac',
                    numberOfChannels: 2,
                    sampleRate: 48000,
                },
                fastStart: 'in-memory',
            });

            // Setup VideoEncoder
            const videoEncoder = new VideoEncoder({
                output: (chunk, meta) => {
                    muxer.addVideoChunk(chunk, meta);
                },
                error: (e) => {
                    console.error('VideoEncoder error:', e);
                    setProgress({ stage: 'error', progress: 0, message: `Encoding error: ${e.message}` });
                },
            });

            await videoEncoder.configure({
                codec: 'avc1.640028', // H.264 High Profile Level 4.0
                width: outputWidth,
                height: outputHeight,
                bitrate: preset.videoBitrate,
                framerate: fps,
                hardwareAcceleration: 'prefer-hardware',
            });

            // Create offscreen canvas for rendering
            const offscreenCanvas = new OffscreenCanvas(outputWidth, outputHeight);
            const ctx = offscreenCanvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get 2D context');

            // TODO: Integrate WebGL shader for LUT/grading
            // For now, we'll do a simple copy (shader integration requires more setup)
            // In production, we'd render through Three.js or custom WebGL here

            setProgress({ stage: 'encoding', progress: 0, message: 'Encoding video...' });

            // Encode frames
            for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
                if (cancelRef.current) {
                    videoEncoder.close();
                    setProgress({ stage: 'error', progress: 0, message: 'Export cancelled' });
                    setIsExporting(false);
                    return null;
                }

                const timestamp = (frameIndex / fps) * 1_000_000; // microseconds
                videoElement.currentTime = frameIndex / fps;

                // Wait for frame to be ready
                await new Promise<void>((resolve) => {
                    const checkReady = () => {
                        if (videoElement.readyState >= 2) {
                            resolve();
                        } else {
                            requestAnimationFrame(checkReady);
                        }
                    };
                    checkReady();
                });

                // Draw frame (simple copy for now - shader integration TODO)
                ctx.drawImage(videoElement, 0, 0, outputWidth, outputHeight);

                // Create VideoFrame and encode
                const frame = new VideoFrame(offscreenCanvas, {
                    timestamp,
                    duration: (1 / fps) * 1_000_000,
                });

                const isKeyFrame = frameIndex % (fps * 2) === 0; // Keyframe every 2 seconds
                videoEncoder.encode(frame, { keyFrame: isKeyFrame });
                frame.close();

                // Update progress
                const progressPercent = Math.round((frameIndex / totalFrames) * 100);
                setProgress({
                    stage: 'encoding',
                    progress: progressPercent,
                    message: `Encoding frame ${frameIndex + 1}/${totalFrames}`,
                });
            }

            // Flush encoder
            await videoEncoder.flush();
            videoEncoder.close();

            // Handle audio - extract and re-encode
            setProgress({ stage: 'muxing', progress: 95, message: 'Processing audio...' });

            // Note: Full audio extraction requires AudioContext + decoding
            // For MVP, we'll skip audio (add in next iteration)
            // TODO: Extract audio from source video and add to muxer

            // Finalize
            muxer.finalize();
            const { buffer } = muxer.target as ArrayBufferTarget;

            setProgress({ stage: 'done', progress: 100, message: 'Export complete!' });
            setIsExporting(false);

            return new Blob([buffer], { type: 'video/mp4' });

        } catch (error) {
            console.error('Export error:', error);
            setProgress({
                stage: 'error',
                progress: 0,
                message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
            setIsExporting(false);
            return null;
        }
    }, [videoElement, isExporting, colorSettings, lutData, lutIntensity]);

    const cancel = useCallback(() => {
        cancelRef.current = true;
    }, []);

    const downloadBlob = useCallback((blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    return {
        exportVideo,
        progress,
        isExporting,
        cancel,
        downloadBlob,
    };
}
