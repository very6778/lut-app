import { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface SplitViewDividerProps {
    position: number; // 0-100 percentage
    onPositionChange: (position: number) => void;
    minPosition?: number;
    maxPosition?: number;
}

export function SplitViewDivider({
    position,
    onPositionChange,
    minPosition = 10,
    maxPosition = 90,
}: SplitViewDividerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDoubleClick = useCallback(() => {
        onPositionChange(50);
    }, [onPositionChange]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = containerRef.current?.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            let percent = (x / rect.width) * 100;

            // Clamp position
            percent = Math.max(minPosition, Math.min(maxPosition, percent));

            onPositionChange(percent);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onPositionChange, minPosition, maxPosition]);

    return (
        <div
            ref={containerRef}
            className="split-divider"
            style={{ left: `${position}%` }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            <div className={`split-handle ${isDragging ? 'bg-[var(--accent)]' : ''}`}>
                <GripVertical size={12} />
            </div>
        </div>
    );
}

interface SplitViewProps {
    beforeContent: React.ReactNode;
    afterContent: React.ReactNode;
    initialPosition?: number;
}

export function SplitView({ beforeContent, afterContent, initialPosition = 50 }: SplitViewProps) {
    const [position, setPosition] = useState(initialPosition);

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Before (left side) */}
            <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${position}%` }}
            >
                <div
                    className="absolute inset-0"
                    style={{ width: `${100 / (position / 100)}%` }}
                >
                    {beforeContent}
                </div>
                <div className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 rounded text-xs text-white/80">
                    Before
                </div>
            </div>

            {/* After (right side) */}
            <div
                className="absolute inset-y-0 right-0 overflow-hidden"
                style={{ width: `${100 - position}%` }}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        width: `${100 / ((100 - position) / 100)}%`,
                        right: 0,
                        left: 'auto'
                    }}
                >
                    {afterContent}
                </div>
                <div className="absolute bottom-4 right-4 bg-black/60 px-2 py-1 rounded text-xs text-white/80">
                    After
                </div>
            </div>

            {/* Divider */}
            <SplitViewDivider position={position} onPositionChange={setPosition} />
        </div>
    );
}
