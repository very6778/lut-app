import { useCallback, useState, useRef } from 'react';
import { ThreePreview } from './ThreePreview';
import type { ColorSettings } from '../types';
import type { LUTData } from '../hooks/useLUT';

interface VideoPreviewProps {
    videoElement: HTMLVideoElement | null;
    videoUrl: string | null;
    showBefore: boolean;
    onShowBeforeChange: (show: boolean) => void;
    colorSettings?: ColorSettings;
    // Dual LUT Support
    technicalLUTData?: LUTData | null;
    technicalIntensity?: number;
    creativeLUTData?: LUTData | null;
    creativeIntensity?: number;
    // Live Preview Support
    livePreviewEnabled?: boolean;
    upscaleFrame?: (frame: ImageData) => Promise<ImageData | null>;
}

export function VideoPreview({
    videoElement,
    videoUrl,
    showBefore,
    onShowBeforeChange,
    colorSettings,
    technicalLUTData,
    technicalIntensity = 100,
    creativeLUTData,
    creativeIntensity = 100,
    livePreviewEnabled = false,
    upscaleFrame,
}: VideoPreviewProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const togglePlay = useCallback(() => {
        if (!videoElement) return;

        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
    }, [videoElement]);

    // Handle container click for play/pause
    const handleContainerClick = useCallback(() => {
        togglePlay();
    }, [togglePlay]);

    if (!videoElement || !videoUrl || !colorSettings) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="text-white/40 text-sm">No video loaded</div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black cursor-pointer"
            onClick={handleContainerClick}
        >
            {/* Three.js Preview with Dual LUT Stack */}
            <ThreePreview
                videoElement={videoElement}
                colorSettings={colorSettings}
                technicalLUTData={technicalLUTData || null}
                technicalIntensity={technicalIntensity}
                creativeLUTData={creativeLUTData || null}
                creativeIntensity={creativeIntensity}
                livePreviewEnabled={livePreviewEnabled}
                upscaleFrame={upscaleFrame}
            />
        </div>
    );
}
