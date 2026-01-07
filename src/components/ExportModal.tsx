import { useState, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import type { VideoState, ColorSettings } from '../types';
import type { LUTData } from '../hooks/useLUT';
import { useExport } from '../hooks/useExport';
import { FPS_OPTIONS, type ExportFPS } from '../types';

interface ExportModalProps {
    video: VideoState;
    videoElement: HTMLVideoElement | null;
    colorSettings: ColorSettings;
    lutData: LUTData | null;
    lutIntensity: number;
    upscaleEnabled: boolean;
    upscaleFrame?: (frame: ImageData) => Promise<ImageData | null>;
    onClose: () => void;
}

type Quality = 'low' | 'medium' | 'high';

const qualityOptions: { id: Quality; label: string; desc: string }[] = [
    { id: 'low', label: 'Low', desc: '720p' },
    { id: 'medium', label: 'Medium', desc: '1080p' },
    { id: 'high', label: 'High', desc: 'Original' },
];

export function ExportModal({
    video,
    videoElement,
    colorSettings,
    lutData,
    lutIntensity,
    upscaleEnabled,
    upscaleFrame,
    onClose,
}: ExportModalProps) {
    const [quality, setQuality] = useState<Quality>('high');
    const [fps, setFps] = useState<ExportFPS>(30);
    const { progress, startExport, cancelExport } = useExport();

    const estimatedSize = quality === 'low' ? '~15 MB' : quality === 'medium' ? '~30 MB' : '~45 MB';
    const estimatedTime = quality === 'low' ? '~10 sec' : quality === 'medium' ? '~20 sec' : '~30 sec';

    const handleStartExport = useCallback(async () => {
        if (!videoElement) return;

        const settings = {
            quality: quality as 'low' | 'medium' | 'high' | 'custom',
            bitrate: quality === 'low' ? 5_000_000 : quality === 'medium' ? 10_000_000 : 20_000_000,
        };

        const upscale = upscaleEnabled && upscaleFrame ? { enabled: true, fn: upscaleFrame } : undefined;

        await startExport(video, videoElement, settings, colorSettings, lutData, lutIntensity, fps, upscale);
    }, [videoElement, video, quality, fps, colorSettings, lutData, lutIntensity, startExport, upscaleEnabled, upscaleFrame]);

    const isExporting = progress.status === 'encoding' || progress.status === 'muxing';
    const isComplete = progress.status === 'complete';
    const progressPercent = progress.totalFrames > 0
        ? Math.round((progress.currentFrame / progress.totalFrames) * 100)
        : 0;

    return (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && !isExporting && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isComplete ? 'Export Complete' : isExporting ? 'Exporting...' : 'Export Video'}
                    </h2>
                    {!isExporting && (
                        <button className="modal-close" onClick={onClose}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="modal-body space-y-4">
                    {/* Idle State - Quality Selection */}
                    {progress.status === 'idle' && (
                        <>
                            <div>
                                <label className="section-header block mb-2">Quality</label>
                                <div className="segment-control">
                                    {qualityOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            className={`segment-option ${quality === opt.id ? 'active' : ''}`}
                                            onClick={() => setQuality(opt.id)}
                                        >
                                            <div>{opt.label}</div>
                                            <div className="text-[10px] opacity-70">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>


                            <div>
                                <label className="section-header block mb-2">Frame Rate</label>
                                <div className="segment-control">
                                    {FPS_OPTIONS.map((option) => (
                                        <button
                                            key={option}
                                            className={`segment-option ${fps === option ? 'active' : ''}`}
                                            onClick={() => setFps(option)}
                                        >
                                            <div>{option}</div>
                                            <div className="text-[10px] opacity-70">FPS</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[var(--bg-l2)] rounded-lg p-3 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">Estimated size</span>
                                    <span>{estimatedSize}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">Estimated time</span>
                                    <span>{estimatedTime}</span>
                                </div>
                            </div>

                            <button className="btn btn-primary w-full py-3" onClick={handleStartExport}>
                                Start Export
                            </button>
                        </>
                    )}

                    {/* Exporting State */}
                    {isExporting && (
                        <>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <div className="text-center text-sm text-[var(--text-secondary)]">
                                <div>Processing frame {progress.currentFrame} / {progress.totalFrames}</div>
                                {progress.estimatedTimeRemaining > 0 && (
                                    <div>Estimated time remaining: {Math.round(progress.estimatedTimeRemaining)} sec</div>
                                )}
                            </div>
                            <button className="btn btn-secondary w-full" onClick={cancelExport}>
                                Cancel
                            </button>
                        </>
                    )}

                    {/* Complete State */}
                    {isComplete && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-[var(--success)] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-white" />
                            </div>
                            <div className="text-lg font-medium mb-1">Video exported successfully</div>
                            <div className="text-sm text-[var(--text-secondary)] mb-4">
                                Check your downloads folder
                            </div>
                            <button className="btn btn-primary w-full" onClick={onClose}>
                                Done
                            </button>
                        </div>
                    )}

                    {/* Error State */}
                    {progress.status === 'error' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-[var(--error)] rounded-full flex items-center justify-center mx-auto mb-4">
                                <X size={32} className="text-white" />
                            </div>
                            <div className="text-lg font-medium mb-1">Export failed</div>
                            <div className="text-sm text-[var(--text-secondary)] mb-4">
                                Something went wrong during export. Try again or use a lower quality.
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-secondary flex-1" onClick={() => setQuality('low')}>
                                    Lower Quality
                                </button>
                                <button className="btn btn-primary flex-1" onClick={handleStartExport}>
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
