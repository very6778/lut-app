import { useState, useCallback } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import type { ExportQuality, ExportProgress } from '../types';
import { BITRATE_PRESETS } from '../types';
import { cn, haptic, formatFileSize, estimateFileSize, estimateExportTime } from '../lib/utils';

interface ExportPanelProps {
    videoDuration: number;
    progress: ExportProgress;
    onExport: (quality: ExportQuality, bitrate: number) => void;
    onCancel: () => void;
}

export function ExportPanel({
    videoDuration,
    progress,
    onExport,
    onCancel,
}: ExportPanelProps) {
    const [quality, setQuality] = useState<ExportQuality>('medium');
    const [customBitrate, setCustomBitrate] = useState(15);

    const bitrate = quality === 'custom' ? customBitrate * 1_000_000 : BITRATE_PRESETS[quality];
    const estimatedSize = estimateFileSize(videoDuration, bitrate);
    const estimatedTime = estimateExportTime(videoDuration);

    const handleExport = useCallback(() => {
        haptic('heavy');
        onExport(quality, bitrate);
    }, [quality, bitrate, onExport]);

    const handleQualityChange = useCallback((q: ExportQuality) => {
        haptic('light');
        setQuality(q);
    }, []);

    const isExporting = progress.status === 'encoding' || progress.status === 'muxing';
    const progressPercent = progress.totalFrames > 0
        ? Math.round((progress.currentFrame / progress.totalFrames) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Quality Selector */}
            <div>
                <h3 className="text-sm font-medium text-muted mb-3">Quality</h3>
                <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as ExportQuality[]).map((q) => (
                        <button
                            key={q}
                            onClick={() => handleQualityChange(q)}
                            disabled={isExporting}
                            className={cn(
                                'flex-1 py-2 px-4 rounded-lg text-sm font-medium capitalize transition-colors',
                                quality === q
                                    ? 'bg-accent text-white'
                                    : 'bg-surface-light text-muted hover:bg-surface-light/80',
                                isExporting && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Bitrate */}
            {quality === 'custom' && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-muted">Bitrate (Mbps)</label>
                        <span className="text-sm font-mono">{customBitrate}</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={50}
                        value={customBitrate}
                        onChange={(e) => setCustomBitrate(parseInt(e.target.value, 10))}
                        disabled={isExporting}
                        className="w-full h-2 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                </div>
            )}

            {/* Estimates */}
            <div className="bg-surface rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted">Estimated size</span>
                    <span className="font-mono">~{formatFileSize(estimatedSize)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted">Estimated time</span>
                    <span className="font-mono">~{estimatedTime}s</span>
                </div>
            </div>

            {/* Export Button / Progress */}
            {isExporting ? (
                <div className="space-y-3">
                    {/* Progress Bar */}
                    <div className="relative h-12 bg-surface-light rounded-xl overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-accent transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="font-medium">{progressPercent}%</span>
                        </div>
                    </div>

                    {/* Frame Counter */}
                    <p className="text-center text-sm text-muted">
                        Processing frame {progress.currentFrame.toLocaleString()} / {progress.totalFrames.toLocaleString()}
                    </p>

                    {/* Cancel Button */}
                    <button
                        onClick={onCancel}
                        className="flex items-center justify-center gap-2 w-full py-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                </div>
            ) : progress.status === 'complete' ? (
                <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Download className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-green-400 font-medium">Video saved!</p>
                </div>
            ) : (
                <button
                    onClick={handleExport}
                    disabled={videoDuration <= 0}
                    className="btn-primary flex items-center justify-center gap-2"
                >
                    <Download className="w-5 h-5" />
                    Export Video
                </button>
            )}

            {/* Error State */}
            {progress.status === 'error' && (
                <p className="text-center text-sm text-red-400">
                    Export failed. Try again or lower the quality.
                </p>
            )}
        </div>
    );
}
