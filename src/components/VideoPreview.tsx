import { useCallback, useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn, haptic } from '../lib/utils';

interface VideoPreviewProps {
    videoElement: HTMLVideoElement | null;
    videoUrl: string | null;
    showBefore: boolean;
    onShowBeforeChange: (show: boolean) => void;
}

export function VideoPreview({
    videoElement,
    videoUrl,
    showBefore,
    onShowBeforeChange,
}: VideoPreviewProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hideControlsTimeout = useRef<number>();

    // Sync with video element
    useEffect(() => {
        if (!videoElement) return;

        const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
        const handleDurationChange = () => setDuration(videoElement.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('durationchange', handleDurationChange);
        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);

        // Initial values
        setDuration(videoElement.duration || 0);
        setCurrentTime(videoElement.currentTime || 0);

        return () => {
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            videoElement.removeEventListener('durationchange', handleDurationChange);
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
        };
    }, [videoElement]);

    // Draw video frame to canvas (for now just display, Three.js integration later)
    useEffect(() => {
        if (!videoElement || !canvasRef.current || !videoUrl) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const draw = () => {
            if (videoElement.readyState >= 2) {
                // Set canvas size to match video
                if (canvas.width !== videoElement.videoWidth) {
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;
                }
                ctx.drawImage(videoElement, 0, 0);
            }
            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [videoElement, videoUrl]);

    // Hide controls after 3 seconds of inactivity
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        clearTimeout(hideControlsTimeout.current);
        if (isPlaying) {
            hideControlsTimeout.current = window.setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying]);

    const togglePlay = useCallback(() => {
        if (!videoElement) return;
        haptic('light');

        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
        resetControlsTimer();
    }, [videoElement, resetControlsTimer]);

    const handleSeek = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!videoElement) return;
            videoElement.currentTime = parseFloat(e.target.value);
        },
        [videoElement]
    );

    const handleBeforeAfterStart = useCallback(() => {
        haptic('light');
        onShowBeforeChange(true);
    }, [onShowBeforeChange]);

    const handleBeforeAfterEnd = useCallback(() => {
        onShowBeforeChange(false);
    }, [onShowBeforeChange]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!videoUrl) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black rounded-xl overflow-hidden"
            onClick={togglePlay}
            onMouseMove={resetControlsTimer}
            onTouchStart={resetControlsTimer}
        >
            {/* Video Canvas */}
            <canvas
                ref={canvasRef}
                className={cn(
                    'w-full h-full object-contain transition-opacity duration-200',
                    showBefore && 'opacity-50'
                )}
            />

            {/* Before label */}
            {showBefore && (
                <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full text-sm font-medium">
                    Before
                </div>
            )}

            {/* Controls Overlay */}
            <div
                className={cn(
                    'video-overlay',
                    showControls && 'visible'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Play/Pause Button */}
                <button
                    className="play-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        togglePlay();
                    }}
                >
                    {isPlaying ? (
                        <Pause className="w-8 h-8 text-black" />
                    ) : (
                        <Play className="w-8 h-8 text-black ml-1" />
                    )}
                </button>
            </div>

            {/* Bottom Controls */}
            <div
                className={cn(
                    'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300',
                    !showControls && 'opacity-0'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Seek Bar */}
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer mb-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />

                {/* Time & Before/After */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    {/* Before/After Toggle */}
                    <button
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm transition-colors"
                        onMouseDown={handleBeforeAfterStart}
                        onMouseUp={handleBeforeAfterEnd}
                        onMouseLeave={handleBeforeAfterEnd}
                        onTouchStart={handleBeforeAfterStart}
                        onTouchEnd={handleBeforeAfterEnd}
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Hold for Before</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
