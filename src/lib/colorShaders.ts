// Color Grading GLSL Shader
// Applies exposure, contrast, saturation, temperature, highlights, and shadows

export const colorGradingShader = {
    uniforms: {
        tDiffuse: { value: null },
        exposure: { value: 0.0 },
        contrast: { value: 0.0 },
        saturation: { value: 0.0 },
        temperature: { value: 0.0 },
        highlights: { value: 0.0 },
        shadows: { value: 0.0 },
    },

    vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

    fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float exposure;
    uniform float contrast;
    uniform float saturation;
    uniform float temperature;
    uniform float highlights;
    uniform float shadows;
    
    varying vec2 vUv;
    
    // sRGB to Linear
    vec3 sRGBToLinear(vec3 color) {
      return pow(color, vec3(2.2));
    }
    
    // Linear to sRGB
    vec3 linearToSRGB(vec3 color) {
      return pow(color, vec3(1.0 / 2.2));
    }
    
    // RGB to Luminance
    float luminance(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }
    
    // Apply exposure (stops)
    vec3 applyExposure(vec3 color, float ev) {
      return color * pow(2.0, ev);
    }
    
    // Apply contrast
    vec3 applyContrast(vec3 color, float amount) {
      float factor = (1.0 + amount / 100.0);
      return (color - 0.5) * factor + 0.5;
    }
    
    // Apply saturation
    vec3 applySaturation(vec3 color, float amount) {
      float lum = luminance(color);
      float factor = 1.0 + amount / 100.0;
      return mix(vec3(lum), color, factor);
    }
    
    // Apply temperature (simplified Kelvin shift)
    vec3 applyTemperature(vec3 color, float amount) {
      // Positive = warmer (more orange), Negative = cooler (more blue)
      float shift = amount / 100.0;
      color.r += shift * 0.1;
      color.b -= shift * 0.1;
      return color;
    }
    
    // Apply highlights adjustment
    vec3 applyHighlights(vec3 color, float amount) {
      float lum = luminance(color);
      float highlightMask = smoothstep(0.5, 1.0, lum);
      float adjustment = amount / 100.0 * 0.5;
      return color + adjustment * highlightMask;
    }
    
    // Apply shadows adjustment
    vec3 applyShadows(vec3 color, float amount) {
      float lum = luminance(color);
      float shadowMask = 1.0 - smoothstep(0.0, 0.5, lum);
      float adjustment = amount / 100.0 * 0.5;
      return color + adjustment * shadowMask;
    }
    
    void main() {
      vec4 texColor = texture2D(tDiffuse, vUv);
      vec3 color = texColor.rgb;
      
      // Apply adjustments in order
      color = applyExposure(color, exposure);
      color = applyContrast(color, contrast);
      color = applySaturation(color, saturation);
      color = applyTemperature(color, temperature);
      color = applyHighlights(color, highlights);
      color = applyShadows(color, shadows);
      
      // Clamp to valid range
      color = clamp(color, 0.0, 1.0);
      
      gl_FragColor = vec4(color, texColor.a);
    }
  `,
};

// Simple pass-through shader for before/after comparison
export const passthroughShader = {
    uniforms: {
        tDiffuse: { value: null },
    },

    vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

    fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    
    void main() {
      gl_FragColor = texture2D(tDiffuse, vUv);
    }
  `,
};
