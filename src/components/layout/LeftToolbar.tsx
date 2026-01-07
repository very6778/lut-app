import { Palette, BarChart3, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToolbarView = 'color' | 'scopes' | 'settings';

interface LeftToolbarProps {
    activeView: ToolbarView;
    onViewChange: (view: ToolbarView) => void;
}

export function LeftToolbar({ activeView, onViewChange }: LeftToolbarProps) {
    const tools = [
        { id: 'color' as const, icon: Palette, label: 'Color Tools' },
        { id: 'scopes' as const, icon: BarChart3, label: 'Scopes' },
        { id: 'settings' as const, icon: Settings, label: 'Settings' },
    ];

    return (
        <>
            {tools.map(({ id, icon: Icon, label }) => (
                <button
                    key={id}
                    className={cn('toolbar-btn', activeView === id && 'active')}
                    onClick={() => onViewChange(id)}
                    title={label}
                >
                    <Icon size={20} />
                </button>
            ))}
        </>
    );
}
