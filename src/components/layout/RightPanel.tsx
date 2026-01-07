import { ChevronDown, ChevronRight, BarChart3, Target } from 'lucide-react';
import { useState } from 'react';
import { Histogram } from '../scopes/Histogram';
import { Vectorscope } from '../scopes/Vectorscope';

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="panel-section">
            <button
                className="panel-section-header w-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="section-header">{title}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {isOpen && (
                <div className="panel-section-content">
                    {children}
                </div>
            )}
        </div>
    );
}

interface VideoInfo {
    width: number;
    height: number;
    fps: number;
    duration: number;
    codec?: string;
}

interface InfoPanelProps {
    info?: VideoInfo;
    onFpsChange?: (fps: number) => void;
}

function InfoPanel({ info, onFpsChange }: InfoPanelProps) {
    if (!info) {
        return (
            <div className="text-center text-[var(--text-tertiary)] py-4 text-xs">
                No video loaded
            </div>
        );
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-1">
            <div className="info-row">
                <span className="info-label">Resolution</span>
                <span className="info-value">{info.width} × {info.height}</span>
            </div>
            <div className="info-row">
                <span className="info-label">Frame Rate</span>
                <div className="info-value">
                    {onFpsChange ? (
                        <select
                            className="bg-transparent text-right outline-none cursor-pointer hover:text-white transition-colors appearance-none"
                            value={info.fps}
                            onChange={(e) => onFpsChange(Number(e.target.value))}
                            style={{ textAlignLast: 'right' }}
                        >
                            {[24, 25, 30, 48, 50, 60].map(fps => (
                                <option key={fps} value={fps} className="bg-[var(--bg-l2)]">
                                    {fps} fps
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span>{info.fps} fps</span>
                    )}
                </div>
            </div>
            <div className="info-row">
                <span className="info-label">Duration</span>
                <span className="info-value">{formatDuration(info.duration)}</span>
            </div>
            <div className="info-row">
                <span className="info-label">Codec</span>
                <span className="info-value">{info.codec || 'H.264'}</span>
            </div>
        </div>
    );
}

interface RightPanelProps {
    videoElement?: HTMLVideoElement | null;
    videoInfo?: VideoInfo;
    onFpsChange?: (fps: number) => void;
}

type ScopeType = 'histogram' | 'vectorscope';

export function RightPanel({ videoElement, videoInfo, onFpsChange }: RightPanelProps) {
    const [activeScope, setActiveScope] = useState<ScopeType>('histogram');

    return (
        <div className="flex flex-col h-full">
            <CollapsibleSection title="Scopes">
                <div className="flex bg-[var(--bg-l2)] p-1 rounded-lg mb-3">
                    <button
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs transition-colors ${activeScope === 'histogram' ? 'bg-[var(--bg-l3)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}
                        onClick={() => setActiveScope('histogram')}
                    >
                        <BarChart3 size={12} />
                        Histogram
                    </button>
                    <button
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs transition-colors ${activeScope === 'vectorscope' ? 'bg-[var(--bg-l3)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}
                        onClick={() => setActiveScope('vectorscope')}
                    >
                        <Target size={12} />
                        Vectorscope
                    </button>
                </div>

                {activeScope === 'histogram' ? (
                    <Histogram videoElement={videoElement} />
                ) : (
                    <Vectorscope videoElement={videoElement} />
                )}
            </CollapsibleSection>

            <CollapsibleSection title="Info">
                <InfoPanel info={videoInfo} onFpsChange={onFpsChange} />
            </CollapsibleSection>

            <div className="flex-1" />
        </div>
    );
}

