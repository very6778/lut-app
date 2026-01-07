import { useRef, useEffect, useCallback } from 'react';

interface VectorscopeProps {
    videoElement?: HTMLVideoElement | null;
}

export function Vectorscope({ videoElement }: VectorscopeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    const drawGraticule = (ctx: CanvasRenderingContext2D, width: number, height: number, radius: number) => {
        const cx = width / 2;
        const cy = height / 2;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        // Circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy);
        ctx.lineTo(cx + radius, cy);
        ctx.moveTo(cx, cy - radius);
        ctx.lineTo(cx, cy + radius);
        ctx.stroke();

        // Skin Tone Line (I line)
        // In Rec.709 CbCr plane, skin tone is at ~123 degrees (if 0 is right, counter-clockwise)
        // or around 10:30 - 11:00 on a clock face.
        // It's technically the "I" axis in YIQ, which is often approximated.
        const skinAngle = (143 * Math.PI) / 180; // Standard approximation
        const skinLength = radius;

        ctx.strokeStyle = 'rgba(255, 200, 150, 0.6)'; // Skin-ish color
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(-skinAngle) * skinLength, cy + Math.sin(-skinAngle) * skinLength);
        ctx.stroke();
    };

    const updateVectorscope = useCallback(() => {
        if (!videoElement || !canvasRef.current || videoElement.paused || videoElement.ended) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const WIDTH = 256;
        const HEIGHT = 256; // Vectorscope is square
        const DOWNSAMPLE = 128; // Analyze at lower res for performance

        // Draw video frame to small canvas first
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = DOWNSAMPLE;
        tempCanvas.height = DOWNSAMPLE * (videoElement.videoHeight / videoElement.videoWidth);
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!tempCtx) return;

        tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        // Clear and draw background
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Accumulation buffer (simple heatmap)
        // We render points directly but use low opacity to build up density
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(0, 255, 128, 0.15)'; // Traditional green scope color

        const cx = WIDTH / 2;
        const cy = HEIGHT / 2;
        const radius = (Math.min(WIDTH, HEIGHT) / 2) * 0.9;
        const scale = radius / 128; // Scale -128..128 to radius

        // Plot points
        // Using Path2D for batch drawing is much faster than filling individual rects
        // Or we can draw directly to pixel buffer if we want max perf, 
        // but Path2D with small rects is "okay" for this resolution.
        // Actually, drawing 10,000+ tiny rects is slow.
        // Better approach: Create a density map and render that.

        const density = new Float32Array(WIDTH * HEIGHT);
        let maxDensity = 1;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // RGB to CbCr (Rec. 601 simplified for speed, enough for visual)
            // Cb = -0.1687R - 0.3313G + 0.5000B + 128
            // Cr =  0.5000R - 0.4187G - 0.0813B + 128

            // Removing the +128 offset to get -128..128 range
            const cb = -0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 0.5 * r - 0.418688 * g - 0.081312 * b;

            // Map to canvas coordinates
            const x = Math.floor(cx + (cb * scale));
            const y = Math.floor(cy - (cr * scale)); // Flip Y because canvas Y is down

            if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                const idx = y * WIDTH + x;
                density[idx]++;
                if (density[idx] > maxDensity) maxDensity = density[idx];
            }
        }

        // Draw density map to canvas
        const scopeImg = ctx.createImageData(WIDTH, HEIGHT);
        const buf = scopeImg.data;

        for (let i = 0; i < density.length; i++) {
            const val = density[i];
            if (val > 0) {
                // Logarithmic scaling for better visibility of faint signals
                const intensity = Math.min(255, Math.log(val + 1) * 40);

                const ptr = i * 4;
                buf[ptr] = 0;   // R
                buf[ptr + 1] = intensity; // G
                buf[ptr + 2] = Math.max(0, intensity - 100); // B (slight tint)
                buf[ptr + 3] = 255; // Alpha
            }
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.putImageData(scopeImg, 0, 0);

        // Draw UI Overlay
        drawGraticule(ctx, WIDTH, HEIGHT, radius);

    }, [videoElement]);

    // Animation Loop
    useEffect(() => {
        if (!videoElement) return;

        const loop = () => {
            updateVectorscope();
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

        updateVectorscope();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [videoElement, updateVectorscope]);

    return (
        <div className="vectorscope relative w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={256}
                height={256}
                className="w-full h-full object-contain opacity-90"
            />
            {/* Labels */}
            <div className="absolute top-2 text-[10px] text-white/40 font-mono">R</div>
            <div className="absolute bottom-2 right-2 text-[10px] text-white/40 font-mono">B</div>
            <div className="absolute bottom-2 left-2 text-[10px] text-white/40 font-mono">G</div>
        </div>
    );
}
