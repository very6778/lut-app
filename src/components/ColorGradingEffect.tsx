import { useMemo, useEffect } from 'react';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';
import { colorGradingFragmentShader } from '../lib/colorShaders';

interface ColorGradingEffectProps {
    exposure?: number;
    contrast?: number;
    saturation?: number;
    vibrance?: number;
    temperature?: number;
    tint?: number;
    highlights?: number;
    shadows?: number;
}

// Custom postprocessing Effect implementation
class ColorGradingEffectImpl extends Effect {
    constructor({
        exposure = 0,
        contrast = 0,
        saturation = 0,
        vibrance = 0,
        temperature = 0,
        tint = 0,
        highlights = 0,
        shadows = 0,
    }: ColorGradingEffectProps = {}) {
        super('ColorGradingEffect', colorGradingFragmentShader, {
            uniforms: new Map<string, Uniform>([
                ['exposure', new Uniform(exposure * 0.13)],      // 0.13x Sensitivity (Increased by 40%)
                ['contrast', new Uniform(contrast)],
                ['saturation', new Uniform(saturation)],
                ['vibrance', new Uniform(vibrance)],
                ['temperature', new Uniform(temperature)],
                ['tint', new Uniform(tint)],
                ['highlights', new Uniform(highlights * 2.0)], // x2 Sensitivity
                ['shadows', new Uniform(shadows * 0.1)],       // 0.1x Sensitivity (Increased from 0.08)
            ]),
        });
    }
}

// React component wrapper for the effect
export function ColorGradingEffect({
    exposure = 0,
    contrast = 0,
    saturation = 0,
    vibrance = 0,
    temperature = 0,
    tint = 0,
    highlights = 0,
    shadows = 0,
}: ColorGradingEffectProps) {
    const effect = useMemo(
        () =>
            new ColorGradingEffectImpl({
                exposure, contrast, saturation, vibrance,
                temperature, tint, highlights, shadows,
            }),
        []
    );

    useEffect(() => {
        effect.uniforms.get('exposure')!.value = exposure * 0.13; // 0.13x Sensitivity
        effect.uniforms.get('contrast')!.value = contrast;
        effect.uniforms.get('saturation')!.value = saturation;
        effect.uniforms.get('vibrance')!.value = vibrance;
        effect.uniforms.get('temperature')!.value = temperature;
        effect.uniforms.get('tint')!.value = tint;
        effect.uniforms.get('highlights')!.value = highlights * 2.0; // x2 Sensitivity
        effect.uniforms.get('shadows')!.value = shadows * 0.1;       // 0.1x Sensitivity
    }, [exposure, contrast, saturation, vibrance, temperature, tint, highlights, shadows, effect]);

    return <primitive object={effect} dispose={null} />;
}
