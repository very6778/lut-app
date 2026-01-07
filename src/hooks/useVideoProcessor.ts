import { useState, useCallback, useRef, useEffect } from 'react';
import type { VideoState } from '../types';
import { validateVideo } from '../lib/utils';

const initialVideoState: VideoState = {
    file: null,
    url: null,
    duration: 0,
    width: 0,
    height: 0,
    fps: 30,
    audioTrack: null,
};

export function useVideoProcessor() {
    const [video, setVideo] = useState<VideoState>(initialVideoState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Create video element once
    useEffect(() => {
        if (!videoRef.current) {
            videoRef.current = document.createElement('video');
            videoRef.current.playsInline = true;
            videoRef.current.muted = false;
            videoRef.current.loop = true;
        }

        const video = videoRef.current;

        // Listen to play/pause events to sync state
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);

            // Note: We don't nullify videoRef.current here to persist the element across re-renders
            // But we pause it on unmount
            if (videoRef.current) {
                videoRef.current.pause();
                // videoRef.current.src = ''; // Keeping src might be better for strict mode unless we really want to unload
            }
        };
    }, []);

    const loadVideo = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);

        try {
            // Validate video
            const validation = await validateVideo(file);
            if (!validation.valid) {
                setError(validation.error || 'Invalid video');
                setIsLoading(false);
                return false;
            }

            // Create object URL
            const url = URL.createObjectURL(file);

            // Load video metadata
            await new Promise<void>((resolve, reject) => {
                const video = videoRef.current!;
                video.onloadedmetadata = () => resolve();
                video.onerror = () => reject(new Error('Failed to load video'));
                video.src = url;
            });

            const videoEl = videoRef.current!;

            setVideo({
                file,
                url,
                duration: videoEl.duration,
                width: videoEl.videoWidth,
                height: videoEl.videoHeight,
                fps: 30, // Default assumption, can be refined
                audioTrack: null, // Will be extracted separately
            });

            setIsLoading(false);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load video');
            setIsLoading(false);
            return false;
        }
    }, []);

    const clearVideo = useCallback(() => {
        if (video.url) {
            URL.revokeObjectURL(video.url);
        }
        setVideo(initialVideoState);
        setError(null);
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = '';
        }
    }, [video.url]);

    const play = useCallback(() => {
        videoRef.current?.play();
    }, []);

    const pause = useCallback(() => {
        videoRef.current?.pause();
    }, []);

    const playPause = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    }, []);

    const seek = useCallback((time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    }, []);

    const getCurrentTime = useCallback(() => {
        return videoRef.current?.currentTime || 0;
    }, []);

    const setFps = useCallback((fps: number) => {
        setVideo(prev => ({ ...prev, fps }));
    }, []);

    return {
        video,
        videoElement: videoRef.current,
        isLoading,
        error,
        isPlaying,
        loadVideo,
        clearVideo,
        play,
        pause,
        playPause,
        seek,
        getCurrentTime,
        setFps,
    };
}
