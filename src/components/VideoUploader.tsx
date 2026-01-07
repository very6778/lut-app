import { useCallback, useState, useRef } from 'react';
import { Upload, Film, AlertCircle } from 'lucide-react';
import { cn, haptic } from '../lib/utils';

interface VideoUploaderProps {
    onVideoSelect: (file: File) => Promise<boolean>;
    isLoading: boolean;
    error: string | null;
}

export function VideoUploader({ onVideoSelect, isLoading, error }: VideoUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                haptic('medium');
                await onVideoSelect(file);
            }
        },
        [onVideoSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                haptic('medium');
                await onVideoSelect(file);
            }
        },
        [onVideoSelect]
    );

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    return (
        <div
            className={cn(
                'drop-zone flex flex-col items-center justify-center w-full h-full min-h-[300px] cursor-pointer transition-all p-8',
                isDragging && 'active',
                isLoading && 'opacity-50 pointer-events-none'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
        >
            <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={handleFileSelect}
            />

            {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-surface-light border-t-accent rounded-full animate-spin" />
                    <p className="text-muted">Loading video...</p>
                </div>
            ) : (
                <>
                    <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-6">
                        <Film className="w-10 h-10 text-accent" />
                    </div>

                    <h2 className="text-xl font-semibold mb-2">
                        {isDragging ? 'Drop to import' : 'Tap to select video'}
                    </h2>

                    <p className="text-muted text-center mb-4">or drag & drop</p>

                    <div className="flex items-center gap-2 text-sm text-muted">
                        <Upload className="w-4 h-4" />
                        <span>Supports MP4, WebM • Up to 3 minutes</span>
                    </div>

                    {error && (
                        <div className="mt-6 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
