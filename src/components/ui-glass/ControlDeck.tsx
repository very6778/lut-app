import { ReactNode } from 'react';

interface ControlDeckProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    isVisible: boolean;
}

export function ControlDeck({ title, icon, children, isVisible }: ControlDeckProps) {
    if (!isVisible) return null;

    return (
        <div
            className="fixed right-6 top-1/2 -translate-y-1/2 w-[320px] z-[20]"
        >
            <div
                className="w-full flex flex-col rounded-[24px] border border-[var(--glass-border)] backdrop-blur-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300"
                style={{ background: 'rgba(30, 30, 30, 0.4)' }}
            >
                {/* Header */}
                <div className="h-14 px-6 flex items-center justify-between border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        {icon}
                        <span className="font-medium text-[15px]">{title}</span>
                    </div>

                    <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                </div>

                {/* Content Area - Adaptive Height */}
                <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
