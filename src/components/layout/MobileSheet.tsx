import { useState, useRef, useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomSheetProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export function BottomSheet({ children, isOpen, onClose, title }: BottomSheetProps) {
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);

    useEffect(() => {
        if (!isDragging) {
            // Snap to position or close
            if (dragY > 150) {
                onClose();
            }
            setDragY(0);
        }
    }, [isDragging, dragY, onClose]);

    const handleTouchStart = (e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const delta = currentY - startY.current;
        setDragY(Math.max(0, delta)); // Only allow dragging down
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                className={cn(
                    "absolute bottom-0 left-0 right-0 bg-[var(--bg-l1)] rounded-t-2xl max-h-[80vh] overflow-hidden",
                    !isDragging && "transition-transform duration-200"
                )}
                style={{ transform: `translateY(${dragY}px)` }}
            >
                {/* Drag Handle */}
                <div
                    className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-10 h-1 bg-[var(--bg-l3)] rounded-full" />
                </div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-4 pb-3 border-b border-[var(--border)]">
                        <span className="font-medium">{title}</span>
                        <button
                            className="p-2 hover:bg-[var(--bg-l3)] rounded-full"
                            onClick={onClose}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

// Mobile-specific controls layout
interface MobileControlsProps {
    lutSection: ReactNode;
    adjustmentsSection: ReactNode;
    activeTab: 'lut' | 'adjustments';
    onTabChange: (tab: 'lut' | 'adjustments') => void;
}

export function MobileControls({
    lutSection,
    adjustmentsSection,
    activeTab,
    onTabChange
}: MobileControlsProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Tab Switcher */}
            <div className="flex border-b border-[var(--border)]">
                <button
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors",
                        activeTab === 'lut'
                            ? "text-[var(--text-primary)] border-b-2 border-[var(--accent)]"
                            : "text-[var(--text-secondary)]"
                    )}
                    onClick={() => onTabChange('lut')}
                >
                    LUTs
                </button>
                <button
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors",
                        activeTab === 'adjustments'
                            ? "text-[var(--text-primary)] border-b-2 border-[var(--accent)]"
                            : "text-[var(--text-secondary)]"
                    )}
                    onClick={() => onTabChange('adjustments')}
                >
                    Adjustments
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'lut' ? lutSection : adjustmentsSection}
            </div>
        </div>
    );
}
