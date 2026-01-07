import { useState, useCallback } from 'react';
import type { LUTPreset, LUTState } from '../types';
import { DEFAULT_LUT_STATE, BUILTIN_LUTS } from '../types';

export interface LUTData {
    data: Float32Array;
    size: number;
}

export function useLUT() {
    const [state, setState] = useState<LUTState>(DEFAULT_LUT_STATE);
    const [lutData, setLutData] = useState<LUTData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Parse .cube file content
    const parseCubeFile = useCallback((content: string): LUTData | null => {
        try {
            const lines = content.split('\n');
            const data: number[] = [];
            let size = 0;

            for (const line of lines) {
                const trimmed = line.trim();

                // Skip comments and empty lines
                if (trimmed.startsWith('#') || trimmed === '') continue;

                // Get LUT size
                if (trimmed.startsWith('LUT_3D_SIZE')) {
                    size = parseInt(trimmed.split(/\s+/)[1], 10);
                    continue;
                }

                // Skip other metadata
                if (trimmed.startsWith('TITLE') || trimmed.startsWith('DOMAIN')) continue;

                // Parse RGB values
                const values = trimmed.split(/\s+/).map(parseFloat);
                if (values.length === 3 && !values.some(isNaN)) {
                    data.push(...values);
                }
            }

            if (data.length === 0 || size === 0) return null;

            // Convert RGB to RGBA for WebGL 2 compatibility
            // WebGL 2 doesn't properly support RGB format for 3D textures
            const rgbaData = new Float32Array((data.length / 3) * 4);
            for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
                rgbaData[j] = data[i];       // R
                rgbaData[j + 1] = data[i + 1]; // G
                rgbaData[j + 2] = data[i + 2]; // B
                rgbaData[j + 3] = 1.0;         // A
            }

            return {
                data: rgbaData,
                size
            };
        } catch (e) {
            console.error('Failed to parse cube file', e);
            return null;
        }
    }, []);

    // Load LUT from file or URL
    const loadLUT = useCallback(async (source: string | File): Promise<boolean> => {
        setIsLoading(true);

        try {
            let content: string;

            if (typeof source === 'string') {
                // Load from URL
                const response = await fetch(source);
                content = await response.text();
            } else {
                // Load from File
                content = await source.text();
            }

            const parsed = parseCubeFile(content);
            if (parsed) {
                setLutData(parsed);
                setIsLoading(false);
                return true;
            }

            setIsLoading(false);
            return false;
        } catch (err) {
            console.error('Failed to load LUT:', err);
            setIsLoading(false);
            return false;
        }
    }, [parseCubeFile]);

    // Select a preset LUT
    const selectPreset = useCallback(async (preset: LUTPreset | null) => {
        setState(prev => ({ ...prev, selectedLUT: preset, customLUT: null }));

        if (preset) {
            await loadLUT(preset.path);
        } else {
            setLutData(null);
        }
    }, [loadLUT]);

    // Upload custom LUT
    const uploadCustomLUT = useCallback(async (file: File) => {
        setState(prev => ({ ...prev, selectedLUT: null, customLUT: file }));
        await loadLUT(file);
    }, [loadLUT]);

    // Set intensity
    const setIntensity = useCallback((intensity: number) => {
        setState(prev => ({ ...prev, intensity }));
    }, []);

    // Clear LUT
    const clearLUT = useCallback(() => {
        setState(DEFAULT_LUT_STATE);
        setLutData(null);
    }, []);

    return {
        state,
        lutData,
        isLoading,
        presets: BUILTIN_LUTS,
        selectPreset,
        uploadCustomLUT,
        setIntensity,
        clearLUT,
    };
}
