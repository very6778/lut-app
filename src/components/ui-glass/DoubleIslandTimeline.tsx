import { Play, Pause, SkipBack, SkipForward, Maximize2, Settings, Grid, Scissors, ChevronLeft, ChevronRight, Clock, Sliders } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface TimelineProps {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    videoElement?: HTMLVideoElement | null;
}

export function DoubleIslandTimeline({ currentTime, duration, isPlaying, onPlayPause, onSeek, videoElement }: TimelineProps) {
    const scrubberRef = useRef<HTMLDivElement>(null);
    const progressFillRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    // Format time (00:00)
    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 60FPS Smooth Scrubber Animation
    useEffect(() => {
        let animationFrameId: number;

        const updateScrubber = () => {
            if (!videoElement || !duration) return;

            // Get precise time directly from video element
            const time = videoElement.currentTime;
            const percent = (time / duration) * 100;

            // Direct DOM manipulation for performance
            if (progressFillRef.current) {
                progressFillRef.current.style.width = `${percent}%`;
            }
            if (thumbRef.current) {
                thumbRef.current.style.left = `${percent}%`;
            }

            if (isPlaying) {
                animationFrameId = requestAnimationFrame(updateScrubber);
            }
        };

        if (isPlaying) {
            updateScrubber();
        } else {
            // When paused, sync one last time with props to ensure accuracy
            const percent = (currentTime / duration) * 100;
            if (progressFillRef.current) {
                progressFillRef.current.style.width = `${percent}%`;
            }
            if (thumbRef.current) {
                thumbRef.current.style.left = `${percent}%`;
            }
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, videoElement, duration, currentTime]);

    const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!scrubberRef.current) return;
        const rect = scrubberRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        onSeek(Math.max(0, Math.min(1, percent)) * duration);
    };



    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(900px,calc(100vw-48px))] z-[30] flex flex-col items-center">

            {/* ═══════════════════════════════════════════════════════════════════════════
               ISLAND 1: RULER SCRUBBER (The "Precision" Layer)
               ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="relative w-full h-[60px] flex flex-col justify-end mb-2 group select-none">
                <div
                    ref={scrubberRef}
                    className="relative w-full h-10 cursor-pointer flex items-end"
                    onClick={handleScrubberClick}
                >
                    {/* Time Ruler Ticks */}
                    <div className="absolute top-0 left-0 right-0 h-4 flex justify-between px-[2px] opacity-40 transition-opacity duration-300 group-hover:opacity-80">
                        {Array.from({ length: 11 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className="w-[1px] h-2 bg-white" />
                                <span className="text-[9px] font-mono text-white/80">{Math.floor((duration / 10) * i)}s</span>
                            </div>
                        ))}
                    </div>

                    {/* Secondary Ticks (Dots) */}
                    <div className="absolute top-3 left-0 right-0 h-4 flex justify-between px-[2%] opacity-20 group-hover:opacity-40">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div key={i} className="w-[1px] h-1 bg-white" />
                        ))}
                    </div>

                    {/* Track Line */}
                    <div className="absolute bottom-1 w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                        <div
                            ref={progressFillRef}
                            className="h-full bg-white/40 will-change-[width]"
                        />
                    </div>

                    {/* The Scrubber Handle */}
                    <div
                        ref={thumbRef}
                        className="absolute bottom-[-14px] top-6 w-[2px] bg-white z-10 pointer-events-none will-change-[left]"
                    >
                        <div className="absolute top-[-4px] left-[-6px] w-[14px] h-[14px] bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transform transition-transform group-hover:scale-125" />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
               ISLAND 2: CONTROL PILL (The "Command" Layer)
               ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-center gap-4">

                {/* Group 1: Transport Controls */}
                <div
                    className="h-[52px] px-2 rounded-full border border-[var(--glass-border)] flex items-center gap-1 backdrop-blur-[40px] shadow-lg"
                    style={{ background: 'rgba(20, 20, 20, 0.8)' }}
                >
                    <button className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <SkipBack size={18} fill="currentColor" />
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <Scissors size={18} />
                    </button>

                    <button
                        onClick={onPlayPause}
                        className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all mx-1"
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>

                    <button className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <SkipForward size={18} fill="currentColor" />
                    </button>
                </div>

                {/* Group 2: Status Pills */}
                <div
                    className="h-[52px] px-2 rounded-full border border-[var(--glass-border)] flex items-center gap-2 backdrop-blur-[40px] shadow-lg"
                    style={{ background: 'rgba(20, 20, 20, 0.8)' }}
                >
                    {/* Meta 1: Aspect */}
                    <div className="hidden md:flex h-9 px-4 items-center gap-2 bg-white/5 rounded-full border border-white/5">
                        <Maximize2 size={13} className="text-white/60" />
                        <span className="text-xs font-mono text-white/80">9:16</span>
                    </div>

                    {/* Meta 2: Quality (Active Accent) */}
                    <div className="flex h-9 px-4 items-center gap-2 bg-[var(--accent)] text-black rounded-full border border-transparent shadow-[var(--glow-accent)]">
                        <span className="text-xs font-bold">1080p</span>
                    </div>

                    {/* Meta 3: Time */}
                    <div className="flex h-9 px-4 items-center gap-2 bg-white/5 rounded-full border border-white/5 min-w-[100px] justify-center">
                        <Clock size={13} className="text-white/60" />
                        <span className="text-xs font-mono text-white/90">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                </div>

                {/* Group 3: Tools */}
                <div
                    className="h-[52px] px-2 rounded-full border border-[var(--glass-border)] flex items-center gap-1 backdrop-blur-[40px] shadow-lg"
                    style={{ background: 'rgba(20, 20, 20, 0.8)' }}
                >
                    <button className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <Grid size={18} />
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <Sliders size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
}
