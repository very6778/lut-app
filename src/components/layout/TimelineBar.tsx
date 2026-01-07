import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

interface TimelineBarProps {
    videoElement: HTMLVideoElement | null;
    isPlaying: boolean;
    onPlayPause: () => void;
}

export function TimelineBar({ videoElement, isPlaying, onPlayPause }: TimelineBarProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const scrubberRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!videoElement) return;

        const updateTime = () => {
            if (!isDragging) {
                setCurrentTime(videoElement.currentTime);
            }
        };

        const updateDuration = () => {
            setDuration(videoElement.duration);
        };

        videoElement.addEventListener('timeupdate', updateTime);
        videoElement.addEventListener('loadedmetadata', updateDuration);
        videoElement.addEventListener('durationchange', updateDuration);

        return () => {
            videoElement.removeEventListener('timeupdate', updateTime);
            videoElement.removeEventListener('loadedmetadata', updateDuration);
            videoElement.removeEventListener('durationchange', updateDuration);
        };
    }, [videoElement, isDragging]);

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleScrub = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!scrubberRef.current || !videoElement) return;

        const rect = scrubberRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percent * duration;

        videoElement.currentTime = newTime;
        setCurrentTime(newTime);
    }, [duration, videoElement]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        handleScrub(e);

        const handleMouseMove = (e: MouseEvent) => handleScrub(e);
        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [handleScrub]);

    const toggleMute = () => {
        if (videoElement) {
            videoElement.muted = !videoElement.muted;
            setIsMuted(!isMuted);
        }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="timeline-bar">
            {/* Play/Pause */}
            <button
                className="timeline-btn"
                onClick={onPlayPause}
                title={isPlaying ? 'Pause [Space]' : 'Play [Space]'}
            >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* Current Time */}
            <span className="timeline-time">{formatTime(currentTime)}</span>

            {/* Scrubber */}
            <div
                ref={scrubberRef}
                className="timeline-scrubber"
                onMouseDown={handleMouseDown}
            >
                <div
                    className="timeline-scrubber-fill"
                    style={{ width: `${progress}%` }}
                >
                    <div className="timeline-scrubber-thumb" />
                </div>
            </div>

            {/* Duration */}
            <span className="timeline-time">{formatTime(duration)}</span>

            {/* Volume */}
            <button
                className="timeline-btn"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
            >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
        </div>
    );
}
