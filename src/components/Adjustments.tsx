import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import type { ColorSettings } from '../types';
import { DEFAULT_COLOR_SETTINGS } from '../types';
import { haptic } from '../lib/utils';

interface AdjustmentsProps {
    settings: ColorSettings;
    onUpdate: <K extends keyof ColorSettings>(key: K, value: ColorSettings[K]) => void;
    onReset: () => void;
}

interface SliderConfig {
    key: keyof ColorSettings;
    label: string;
    min: number;
    max: number;
    step: number;
    gradient?: string;
}

// Basic adjustments
const leftSliders: SliderConfig[] = [
    { key: 'exposure', label: 'Exposure', min: -2, max: 2, step: 0.1 },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
    { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1 },
    { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, step: 1 },
];

const rightSliders: SliderConfig[] = [
    { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1 },
    { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1 },
    { key: 'temperature', label: 'Temp', min: -100, max: 100, step: 1, gradient: 'temp-track' },
    { key: 'tint', label: 'Tint', min: -100, max: 100, step: 1, gradient: 'tint-track' },
];



function SliderRow({
    config,
    value,
    onChange
}: {
    config: SliderConfig;
    value: number;
    onChange: (value: number) => void;
}) {
    const handleDoubleClick = useCallback(() => {
        haptic('light');
        onChange(DEFAULT_COLOR_SETTINGS[config.key]);
    }, [config.key, onChange]);

    const formatValue = (val: number) => {
        if (config.key === 'exposure') {
            return val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
        }
        if (config.min === 0) {
            return Math.round(val).toString();
        }
        return val >= 0 ? `+${Math.round(val)}` : Math.round(val).toString();
    };

    return (
        <div className="adjustment-row">
            <span className="adjustment-label">{config.label}</span>
            <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                onDoubleClick={handleDoubleClick}
                className={`adjustment-slider ${config.gradient || ''}`}
                title="Double-click to reset"
            />
            <span className="adjustment-value">{formatValue(value)}</span>
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-3 mb-1 first:mt-0">
            {title}
        </div>
    );
}

export function Adjustments({ settings, onUpdate, onReset }: AdjustmentsProps) {
    const handleReset = useCallback(() => {
        haptic('medium');
        onReset();
    }, [onReset]);

    return (
        <div className="space-y-1 overflow-y-auto max-h-[calc(var(--bottom-panel-height)-40px)]">
            <div className="flex justify-between items-center mb-2">
                <span className="section-header">Adjustments</span>
                <button
                    onClick={handleReset}
                    className="btn-ghost p-1 rounded"
                    title="Reset all [R]"
                >
                    <RotateCcw size={14} />
                </button>
            </div>

            {/* Basic Adjustments - 2 Column */}
            <div className="adjustments-grid">
                <div className="space-y-0">
                    {leftSliders.map((config) => (
                        <SliderRow
                            key={config.key}
                            config={config}
                            value={settings[config.key]}
                            onChange={(value) => onUpdate(config.key, value)}
                        />
                    ))}
                </div>
                <div className="space-y-0">
                    {rightSliders.map((config) => (
                        <SliderRow
                            key={config.key}
                            config={config}
                            value={settings[config.key]}
                            onChange={(value) => onUpdate(config.key, value)}
                        />
                    ))}
                </div>
            </div>


        </div>
    );
}
