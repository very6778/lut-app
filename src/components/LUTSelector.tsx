import { useCallback, useRef } from 'react';
import { Plus, Check } from 'lucide-react';
import type { LUTPreset } from '../types';
import { cn, haptic } from '../lib/utils';

interface LUTSelectorProps {
    presets: LUTPreset[];
    selectedLUT: LUTPreset | null;
    customLUT: File | null;
    intensity: number;
    onSelectPreset: (preset: LUTPreset | null) => void;
    onUploadCustom: (file: File) => void;
    onIntensityChange: (value: number) => void;
}

export function LUTSelector({
    presets,
    selectedLUT,
    customLUT,
    intensity,
    onSelectPreset,
    onUploadCustom,
    onIntensityChange,
}: LUTSelectorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePresetClick = useCallback(
        (preset: LUTPreset) => {
            haptic('light');
            if (selectedLUT?.id === preset.id) {
                onSelectPreset(null);
            } else {
                onSelectPreset(preset);
            }
        },
        [selectedLUT, onSelectPreset]
    );

    const handleCustomUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file && file.name.endsWith('.cube')) {
                haptic('medium');
                onUploadCustom(file);
            }
        },
        [onUploadCustom]
    );

    const handleIntensityChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onIntensityChange(parseInt(e.target.value, 10));
        },
        [onIntensityChange]
    );

    const handleSliderDoubleClick = useCallback(() => {
        haptic('light');
        onIntensityChange(100);
    }, [onIntensityChange]);

    return (
        <div className="space-y-6">
            {/* LUT Presets */}
            <div>
                <h3 className="text-sm font-medium text-muted mb-3">Presets</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
                    {presets.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => handlePresetClick(preset)}
                            className={cn(
                                'lut-thumbnail flex-shrink-0 flex flex-col items-center justify-center bg-surface-light relative',
                                selectedLUT?.id === preset.id && 'selected'
                            )}
                        >
                            {selectedLUT?.id === preset.id && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                            <span className="text-xs text-muted mt-1">{preset.name}</span>
                        </button>
                    ))}

                    {/* Custom LUT Upload */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            'lut-thumbnail flex-shrink-0 flex flex-col items-center justify-center bg-surface-light border-2 border-dashed border-surface-light hover:border-muted',
                            customLUT && 'selected'
                        )}
                    >
                        <Plus className="w-5 h-5 text-muted" />
                        <span className="text-xs text-muted mt-1">
                            {customLUT ? 'Custom' : 'Add'}
                        </span>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".cube"
                        className="hidden"
                        onChange={handleCustomUpload}
                    />
                </div>
            </div>

            {/* Intensity Slider */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-muted">Intensity</h3>
                    <span className="text-sm font-mono text-white">{intensity}%</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={intensity}
                    onChange={handleIntensityChange}
                    onDoubleClick={handleSliderDoubleClick}
                    disabled={!selectedLUT && !customLUT}
                    className="w-full h-2 bg-surface-light rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                />
            </div>
        </div>
    );
}
