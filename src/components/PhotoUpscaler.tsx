import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, Sparkles, X } from 'lucide-react';
import { useSuperResolution } from '../hooks/useSuperResolution';

export function PhotoUpscaler() {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

    // Hidden file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { state, loadModel, upscaleFrame } = useSuperResolution();

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            if (originalUrl) URL.revokeObjectURL(originalUrl);
            if (resultUrl) URL.revokeObjectURL(resultUrl);
        };
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset previous state
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
        setImage(null);

        const url = URL.createObjectURL(file);
        setOriginalUrl(url);

        const img = new Image();
        img.onload = () => {
            setImage(img);
            setDimensions({ w: img.width, h: img.height });
        };
        img.src = url;
    };

    const handleUpscale = async () => {
        if (!image || !state.isModelLoaded) {
            if (!state.isModelLoaded) {
                await loadModel();
                return;
            }
            return;
        }

        try {
            // Draw image to canvas to get ImageData
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, image.width, image.height);

            const upscaledData = await upscaleFrame(imageData);

            if (upscaledData) {
                const resCanvas = document.createElement('canvas');
                resCanvas.width = upscaledData.width;
                resCanvas.height = upscaledData.height;
                const resCtx = resCanvas.getContext('2d');
                resCtx?.putImageData(upscaledData, 0, 0);

                const upscaledUrl = resCanvas.toDataURL('image/png');
                setResultUrl(upscaledUrl);
            }
        } catch (error) {
            console.error("Upscale failed:", error);
        }
    };

    // Auto-load model check
    const handleLoadModel = async () => {
        await loadModel();
    };

    const handleDownload = () => {
        if (resultUrl) {
            const a = document.createElement('a');
            a.href = resultUrl;
            a.download = `upscaled-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4 text-white">
            <div className="section-header">AI PHOTO UPSCALER</div>

            {/* Main Area */}
            <div className="flex-1 rounded-xl bg-black/20 border border-white/5 overflow-hidden relative flex items-center justify-center min-h-[300px]">
                {!originalUrl ? (
                    <div
                        className="flex flex-col items-center gap-3 opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Upload size={24} />
                        </div>
                        <div className="text-sm">Click to upload photo</div>
                    </div>
                ) : (
                    <div className="relative w-full h-full p-4 flex items-center justify-center">
                        <img
                            src={resultUrl || originalUrl}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                        {resultUrl && (
                            <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded backdrop-blur">
                                Upscaled
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setOriginalUrl(null);
                                setResultUrl(null);
                                setImage(null);
                            }}
                            className="absolute top-2 left-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />

            {/* Controls */}
            {image && (
                <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex justify-between items-center text-xs opacity-70">
                        <div>Original: {dimensions?.w} x {dimensions?.h}</div>
                        {resultUrl && (
                            <div className="text-green-400">Result: {dimensions ? dimensions.w * 2 : 0} x {dimensions ? dimensions.h * 2 : 0}</div>
                        )}
                    </div>

                    {!state.isModelLoaded ? (
                        <button
                            onClick={handleLoadModel}
                            disabled={state.isProcessing}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
                        >
                            {state.isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                            Load Optimization Model
                        </button>
                    ) : !resultUrl ? (
                        <button
                            onClick={handleUpscale}
                            disabled={state.isProcessing}
                            className="w-full py-3 bg-[var(--accent)] text-black hover:opacity-90 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
                        >
                            {state.isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                            {state.isProcessing ? 'Upscaling...' : 'Scale 2x'}
                        </button>
                    ) : (
                        <button
                            onClick={handleDownload}
                            className="w-full py-3 bg-white text-black hover:bg-gray-100 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
                        >
                            <Download size={18} />
                            Download
                        </button>
                    )}

                    {state.error && (
                        <div className="text-red-400 text-xs text-center">{state.error}</div>
                    )}
                </div>
            )}
        </div>
    );
}
