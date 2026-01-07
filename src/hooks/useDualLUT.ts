import { useState, useCallback } from 'react';
import type { LUTPreset } from '../types';
import { BUILTIN_LUTS } from '../types';

export interface LUTData {
    data: Float32Array;
    size: number;
}

// Separate presets for technical (input transform) and creative (look) LUTs
export const TECHNICAL_LUTS: LUTPreset[] = BUILTIN_LUTS.filter(lut =>
    lut.name.includes('Rec') || lut.name.includes('Log') || lut.name.includes('709')
);

export const CREATIVE_LUTS: LUTPreset[] = BUILTIN_LUTS.filter(lut =>
    !lut.name.includes('Rec') && !lut.name.includes('Log') && !lut.name.includes('709')
);

export interface DualLUTState {
    // Technical LUT (Input Transform): Log → Rec.709
    technicalLUT: LUTPreset | null;
    technicalCustom: File | null;
    technicalIntensity: number;

    // Creative LUT (Look): Film emulation, color grades
    creativeLUT: LUTPreset | null;
    creativeCustom: File | null;
    creativeIntensity: number;
}

export const DEFAULT_DUAL_LUT_STATE: DualLUTState = {
    technicalLUT: null,
    technicalCustom: null,
    technicalIntensity: 100,
    creativeLUT: null,
    creativeCustom: null,
    creativeIntensity: 100,
};

export function useDualLUT() {
    const [state, setState] = useState<DualLUTState>(DEFAULT_DUAL_LUT_STATE);
    const [technicalLUTData, setTechnicalLUTData] = useState<LUTData | null>(null);
    const [creativeLUTData, setCreativeLUTData] = useState<LUTData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Parse .cube file content
    const parseCubeFile = useCallback((content: string): LUTData | null => {
        try {
            const lines = content.split('\n');
            const data: number[] = [];
            let size = 0;

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('#') || trimmed === '') continue;
                if (trimmed.startsWith('LUT_3D_SIZE')) {
                    size = parseInt(trimmed.split(/\s+/)[1], 10);
                    continue;
                }
                if (trimmed.startsWith('TITLE') || trimmed.startsWith('DOMAIN')) continue;

                const values = trimmed.split(/\s+/).map(parseFloat);
                if (values.length === 3 && !values.some(isNaN)) {
                    data.push(...values);
                }
            }

            if (data.length === 0 || size === 0) return null;

            // Convert RGB to RGBA for WebGL 2
            const rgbaData = new Float32Array((data.length / 3) * 4);
            for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
                rgbaData[j] = data[i];
                rgbaData[j + 1] = data[i + 1];
                rgbaData[j + 2] = data[i + 2];
                rgbaData[j + 3] = 1.0;
            }

            return { data: rgbaData, size };
        } catch (e) {
            console.error('Failed to parse cube file', e);
            return null;
        }
    }, []);

    // Load LUT from file or URL
    const loadLUT = useCallback(async (source: string | File): Promise<LUTData | null> => {
        try {
            let content: string;
            if (typeof source === 'string') {
                const response = await fetch(source);
                content = await response.text();
            } else {
                content = await source.text();
            }
            return parseCubeFile(content);
        } catch (err) {
            console.error('Failed to load LUT:', err);
            return null;
        }
    }, [parseCubeFile]);

    // === TECHNICAL LUT (Input Transform) ===
    const selectTechnicalPreset = useCallback(async (preset: LUTPreset | null) => {
        setIsLoading(true);
        setState(prev => ({ ...prev, technicalLUT: preset, technicalCustom: null }));

        if (preset) {
            const data = await loadLUT(preset.path);
            setTechnicalLUTData(data);
        } else {
            setTechnicalLUTData(null);
        }
        setIsLoading(false);
    }, [loadLUT]);

    const uploadTechnicalLUT = useCallback(async (file: File) => {
        setIsLoading(true);
        setState(prev => ({ ...prev, technicalLUT: null, technicalCustom: file }));
        const data = await loadLUT(file);
        setTechnicalLUTData(data);
        setIsLoading(false);
    }, [loadLUT]);

    const setTechnicalIntensity = useCallback((intensity: number) => {
        setState(prev => ({ ...prev, technicalIntensity: intensity }));
    }, []);

    // === CREATIVE LUT (Look) ===
    const selectCreativePreset = useCallback(async (preset: LUTPreset | null) => {
        setIsLoading(true);
        setState(prev => ({ ...prev, creativeLUT: preset, creativeCustom: null }));

        if (preset) {
            const data = await loadLUT(preset.path);
            setCreativeLUTData(data);
        } else {
            setCreativeLUTData(null);
        }
        setIsLoading(false);
    }, [loadLUT]);

    const uploadCreativeLUT = useCallback(async (file: File) => {
        setIsLoading(true);
        setState(prev => ({ ...prev, creativeLUT: null, creativeCustom: file }));
        const data = await loadLUT(file);
        setCreativeLUTData(data);
        setIsLoading(false);
    }, [loadLUT]);

    const setCreativeIntensity = useCallback((intensity: number) => {
        setState(prev => ({ ...prev, creativeIntensity: intensity }));
    }, []);

    // === CLEAR ALL ===
    const clearAll = useCallback(() => {
        setState(DEFAULT_DUAL_LUT_STATE);
        setTechnicalLUTData(null);
        setCreativeLUTData(null);
    }, []);

    return {
        state,
        technicalLUTData,
        creativeLUTData,
        isLoading,

        // Technical LUT
        technicalPresets: TECHNICAL_LUTS.length > 0 ? TECHNICAL_LUTS : BUILTIN_LUTS,
        selectTechnicalPreset,
        uploadTechnicalLUT,
        setTechnicalIntensity,

        // Creative LUT
        creativePresets: CREATIVE_LUTS.length > 0 ? CREATIVE_LUTS : BUILTIN_LUTS,
        selectCreativePreset,
        uploadCreativeLUT,
        setCreativeIntensity,

        clearAll,
    };
}
