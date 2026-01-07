// Color Grading GLSL Fragment Shader for postprocessing Effect
// Uses mainImage function format required by postprocessing library

export const colorGradingFragmentShader = /* glsl */ `
uniform float exposure;
uniform float contrast;
uniform float saturation;
uniform float vibrance;
uniform float temperature;
uniform float tint;
uniform float highlights;
uniform float shadows;

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

// Apply vibrance (smart saturation - affects less saturated colors more)
vec3 applyVibrance(vec3 color, float amount) {
  float lum = luminance(color);
  float sat = length(color - vec3(lum));
  float vibranceAmount = amount / 100.0;
  float factor = 1.0 + vibranceAmount * (1.0 - sat);
  return mix(vec3(lum), color, factor);
}

// Apply temperature (simplified Kelvin shift)
vec3 applyTemperature(vec3 color, float amount) {
  float shift = amount / 100.0;
  color.r += shift * 0.1;
  color.b -= shift * 0.1;
  return color;
}

// Apply tint (green to magenta shift)
vec3 applyTint(vec3 color, float amount) {
  float shift = amount / 100.0;
  color.g -= shift * 0.1;
  color.r += shift * 0.05;
  color.b += shift * 0.05;
  return color;
}

// Apply highlights adjustment
vec3 applyHighlights(vec3 color, float amount) {
  float lum = luminance(color);
  float highlightMask = smoothstep(0.2, 1.0, lum); // Lowered threshold to 0.2
  float adjustment = amount / 100.0 * 0.5;
  return color + adjustment * highlightMask;
}

// Apply shadows adjustment
vec3 applyShadows(vec3 color, float amount) {
  float lum = luminance(color);
  float shadowMask = 1.0 - smoothstep(0.0, 0.5, lum); // Keep shadows focused on reduced range
  float adjustment = amount / 100.0 * 0.5;
  return color + adjustment * shadowMask;
}

// Main function required by postprocessing Effect
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 color = inputColor.rgb;
  
  // Apply adjustments in order
  color = applyExposure(color, exposure);
  color = applyContrast(color, contrast);
  color = applySaturation(color, saturation);
  color = applyVibrance(color, vibrance);
  color = applyTemperature(color, temperature);
  color = applyTint(color, tint);
  color = applyHighlights(color, highlights);
  color = applyShadows(color, shadows);
  
  // Clamp to valid range
  color = clamp(color, 0.0, 1.0);
  
  outputColor = vec4(color, inputColor.a);
}
`;
