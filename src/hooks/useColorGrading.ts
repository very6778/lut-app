import { useState, useCallback } from 'react';
import type { ColorSettings } from '../types';
import { DEFAULT_COLOR_SETTINGS } from '../types';

export function useColorGrading() {
    const [settings, setSettings] = useState<ColorSettings>(DEFAULT_COLOR_SETTINGS);
    const [previousSettings, setPreviousSettings] = useState<ColorSettings | null>(null);

    const updateSetting = useCallback(<K extends keyof ColorSettings>(
        key: K,
        value: ColorSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetSetting = useCallback(<K extends keyof ColorSettings>(key: K) => {
        setSettings(prev => ({ ...prev, [key]: DEFAULT_COLOR_SETTINGS[key] }));
    }, []);

    const resetAll = useCallback(() => {
        setPreviousSettings(settings);
        setSettings(DEFAULT_COLOR_SETTINGS);
        return true; // Return true to signal undo is available
    }, [settings]);

    const undoReset = useCallback(() => {
        if (previousSettings) {
            setSettings(previousSettings);
            setPreviousSettings(null);
            return true;
        }
        return false;
    }, [previousSettings]);

    return {
        settings,
        updateSetting,
        resetSetting,
        resetAll,
        undoReset,
        canUndo: previousSettings !== null,
    };
}
