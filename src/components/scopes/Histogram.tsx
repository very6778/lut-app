import { useRef, useEffect, useCallback } from 'react';

interface HistogramProps {
    videoElement?: HTMLVideoElement | null;
}

export function Histogram({ videoElement }: HistogramProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    // Process video frame and draw histogram
    const updateHistogram = useCallback(() => {
        if (!videoElement || !canvasRef.current || videoElement.paused || videoElement.ended) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Use a small internal size for performance (downsampling)
        // 160px width is enough resolution for histogram while being very fast
        const WIDTH = 256;
        const HEIGHT = 144;

        // Draw video frame to small canvas first
        // We use a temporary canvas for this to avoid clearing the histogram display
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = WIDTH;
        tempCanvas.height = HEIGHT;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

        if (!tempCtx) return;

        tempCtx.drawImage(videoElement, 0, 0, WIDTH, HEIGHT);
        const imageData = tempCtx.getImageData(0, 0, WIDTH, HEIGHT);
        const data = imageData.data;

        // Initialize frequency arrays
        const rHist = new Float32Array(256);
        const gHist = new Float32Array(256);
        const bHist = new Float32Array(256);
        const lHist = new Float32Array(256); // Luminance

        let maxCount = 0;

        // Calculate histograms
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Rec. 709 Luminance
            const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

            rHist[r]++;
            gHist[g]++;
            bHist[b]++;
            lHist[l]++;
        }

        // Find max value for normalization
        for (let i = 0; i < 256; i++) {
            maxCount = Math.max(maxCount, rHist[i], gHist[i], bHist[i]);
        }

        // Prevent division by zero and extremely flat graphs
        maxCount = Math.max(maxCount, WIDTH * HEIGHT * 0.05);

        // Clear display canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw settings
        ctx.globalCompositeOperation = 'screen'; // Additive blending for colors
        const startY = canvas.height;
        const scaleY = canvas.height * 0.9; // Leave some headroom

        // Helper to draw a channel
        const drawChannel = (hist: Float32Array, color: string) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, startY);

            for (let i = 0; i < 256; i++) {
                const height = (hist[i] / maxCount) * scaleY;
                const x = (i / 255) * canvas.width;
                ctx.lineTo(x, startY - height);
            }

            ctx.lineTo(canvas.width, startY);
            ctx.closePath();
            ctx.fill();
        };

        // Draw RGB channels
        drawChannel(rHist, 'rgba(239, 68, 68, 0.5)');   // Red
        drawChannel(gHist, 'rgba(34, 197, 94, 0.5)');   // Green
        drawChannel(bHist, 'rgba(59, 130, 246, 0.5)');  // Blue

        // Optional: Draw Luma outline
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 256; i++) {
            const height = (lHist[i] / maxCount) * scaleY;
            const x = (i / 255) * canvas.width;
            if (i === 0) ctx.moveTo(x, startY - height);
            else ctx.lineTo(x, startY - height);
        }
        ctx.stroke();

    }, [videoElement]);

    // Animation Loop
    useEffect(() => {
        if (!videoElement) return;

        const loop = () => {
            updateHistogram();

            if ('requestVideoFrameCallback' in videoElement) {
                // @ts-ignore
                videoElement.requestVideoFrameCallback(loop);
            } else {
                requestRef.current = requestAnimationFrame(loop);
            }
        };

        if ('requestVideoFrameCallback' in videoElement) {
            // @ts-ignore
            videoElement.requestVideoFrameCallback(loop);
        } else {
            requestRef.current = requestAnimationFrame(loop);
        }

        updateHistogram();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [videoElement, updateHistogram]);

    // Handle resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width * window.devicePixelRatio;
                canvas.height = height * window.devicePixelRatio;
            }
            updateHistogram();
        });

        resizeObserver.observe(canvas);
        return () => resizeObserver.disconnect();
    }, [updateHistogram]);

    return (
        <div className="histogram relative w-full h-full flex items-center justify-center">
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
                    backgroundSize: '25% 25%'
                }}
            />

            <canvas
                ref={canvasRef}
                className="w-full h-full block opacity-90"
            />

            {/* Labels */}
            <div className="absolute bottom-1 left-2 text-[10px] text-white/40 font-mono">0</div>
            <div className="absolute bottom-1 right-2 text-[10px] text-white/40 font-mono">255</div>
        </div>
    );
}
