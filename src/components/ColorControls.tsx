import { useCallback } from 'react';
import { RotateCcw, ChevronDown } from 'lucide-react';
import type { ColorSettings } from '../types';
import { DEFAULT_COLOR_SETTINGS } from '../types';
import { cn, haptic } from '../lib/utils';

interface ColorControlsProps {
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
    format: (value: number) => string;
}

const MAIN_SLIDERS: SliderConfig[] = [
    { key: 'exposure', label: 'Exposure', min: -2, max: 2, step: 0.1, format: (v) => v.toFixed(1) },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1, format: (v) => v.toFixed(0) },
    { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1, format: (v) => v.toFixed(0) },
    { key: 'temperature', label: 'Temperature', min: -100, max: 100, step: 1, format: (v) => v.toFixed(0) },
];

const ADVANCED_SLIDERS: SliderConfig[] = [
    { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1, format: (v) => v.toFixed(0) },
    { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1, format: (v) => v.toFixed(0) },
];

export function ColorControls({ settings, onUpdate, onReset }: ColorControlsProps) {
    const [showAdvanced, setShowAdvanced] = React.useState(false);

    const handleChange = useCallback(
        (key: keyof ColorSettings, value: number) => {
            onUpdate(key, value);
        },
        [onUpdate]
    );

    const handleDoubleClick = useCallback(
        (key: keyof ColorSettings) => {
            haptic('light');
            onUpdate(key, DEFAULT_COLOR_SETTINGS[key]);
        },
        [onUpdate]
    );

    const renderSlider = (config: SliderConfig) => {
        const value = settings[config.key];
        const isDefault = value === DEFAULT_COLOR_SETTINGS[config.key];
        const percentage = ((value - config.min) / (config.max - config.min)) * 100;
        const centerPercentage = ((0 - config.min) / (config.max - config.min)) * 100;

        return (
            <div key={config.key} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-muted">{config.label}</label>
                    <span
                        className={cn(
                            'text-sm font-mono tabular-nums w-12 text-right',
                            !isDefault && 'text-accent'
                        )}
                    >
                        {value > 0 && config.min < 0 ? '+' : ''}
                        {config.format(value)}
                    </span>
                </div>
                <div className="relative h-2">
                    {/* Track Background */}
                    <div className="absolute inset-0 bg-surface-light rounded-full" />

                    {/* Center line for bipolar sliders */}
                    {config.min < 0 && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-muted/50"
                            style={{ left: `${centerPercentage}%` }}
                        />
                    )}

                    {/* Active range */}
                    {config.min < 0 ? (
                        <div
                            className="absolute top-0 bottom-0 bg-accent/50 rounded-full"
                            style={{
                                left: `${Math.min(centerPercentage, percentage)}%`,
                                right: `${100 - Math.max(centerPercentage, percentage)}%`,
                            }}
                        />
                    ) : (
                        <div
                            className="absolute top-0 bottom-0 left-0 bg-accent rounded-full"
                            style={{ width: `${percentage}%` }}
                        />
                    )}

                    {/* Input */}
                    <input
                        type="range"
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        value={value}
                        onChange={(e) => handleChange(config.key, parseFloat(e.target.value))}
                        onDoubleClick={() => handleDoubleClick(config.key)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {/* Thumb */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md pointer-events-none"
                        style={{ left: `calc(${percentage}% - 8px)` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Main Sliders */}
            <div>
                {MAIN_SLIDERS.map(renderSlider)}
            </div>

            {/* Advanced Section */}
            <div>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
                >
                    <ChevronDown
                        className={cn(
                            'w-4 h-4 transition-transform',
                            showAdvanced && 'rotate-180'
                        )}
                    />
                    Advanced
                </button>

                {showAdvanced && (
                    <div className="mt-4 pt-4 border-t border-surface-light">
                        {ADVANCED_SLIDERS.map(renderSlider)}
                    </div>
                )}
            </div>

            {/* Reset Button */}
            <button
                onClick={() => {
                    haptic('medium');
                    onReset();
                }}
                className="flex items-center justify-center gap-2 w-full py-3 text-muted hover:text-white hover:bg-surface-light rounded-lg transition-colors"
            >
                <RotateCcw className="w-4 h-4" />
                Reset All
            </button>
        </div>
    );
}

// React import is needed for useState
import React from 'react';
