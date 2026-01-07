import { Camera, Mic, Music, Wand2, Sliders, User, Type, Palette, Activity } from 'lucide-react';
import { useState } from 'react';

type ToolId = 'video' | 'audio' | 'music' | 'magic' | 'adjust' | 'avatar' | 'text' | 'lut' | 'scope';

interface ToolRailProps {
    activeTool: ToolId;
    onToolChange: (tool: ToolId) => void;
}

export function ToolRail({ activeTool, onToolChange }: ToolRailProps) {
    const tools = [
        { id: 'video', icon: Camera, label: 'Source' },
        { id: 'lut', icon: Palette, label: 'LUT Library' },
        { id: 'adjust', icon: Sliders, label: 'Color Grading' },
        { id: 'scope', icon: Activity, label: 'Scopes' },
        { id: 'magic', icon: Wand2, label: 'AI Enhance' },
        // { id: 'mic', icon: Mic, label: 'Audio' },
        // { id: 'music', icon: Music, label: 'Music' },
        // { id: 'avatar', icon: User, label: 'Avatar' },
        // { id: 'text', icon: Type, label: 'Text' },
    ] as const;

    return (
        <div
            className="fixed left-6 top-1/2 -translate-y-1/2 z-[20] flex flex-col gap-4 p-3 rounded-full border border-[var(--glass-border)] backdrop-blur-[14px] transition-all duration-300 hover:scale-[1.02]"
            style={{
                background: 'rgba(40, 40, 40, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
        >
            {tools.map((tool) => {
                const isActive = activeTool === tool.id;
                const Icon = tool.icon;

                return (
                    <button
                        key={tool.id}
                        onClick={() => onToolChange(tool.id)}
                        className={`
                            relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 group
                            ${isActive ? 'text-black' : 'text-white/60 hover:text-white hover:bg-white/10'}
                        `}
                        style={{
                            background: isActive ? 'var(--accent)' : 'transparent',
                            boxShadow: isActive ? 'var(--glow-accent)' : 'none'
                        }}
                    >
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                        {/* Tooltip */}
                        <div className="absolute left-full ml-4 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 mb-10 translate-x-[-10px] group-hover:translate-x-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                            {tool.label}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
