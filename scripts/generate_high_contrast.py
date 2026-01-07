import os

# Configuration
INPUT_PATH = '/Users/sait/Documents/lut-app/public/luts/Conversion LUT - Apple Log to Rec709.cube'
OUTPUT_PATH = '/Users/sait/Documents/lut-app/public/luts/Apple Log - High Contrast.cube'
CONTRAST_FACTOR = 1.3  # Increase contrast by 30%

def apply_contrast(value, contrast):
    """
    Applies contrast curve to a normalized value (0.0 - 1.0).
    Formula: (value - 0.5) * contrast + 0.5
    """
    # Apply contrast
    new_val = (value - 0.5) * contrast + 0.5
    # Clamp to 0.0 - 1.0
    return max(0.0, min(1.0, new_val))

def process_lut():
    print(f"Reading LUT from: {INPUT_PATH}")
    
    if not os.path.exists(INPUT_PATH):
        print("Error: Input file not found!")
        return

    with open(INPUT_PATH, 'r') as f:
        lines = f.readlines()

    output_lines = []
    
    print("Processing data...")
    data_count = 0
    
    for line in lines:
        stripped = line.strip()
        
        # Skip comments and metadata for processing, but keep them in output
        if stripped.startswith('#') or stripped.startswith('TITLE') or stripped.startswith('LUT_3D_SIZE') or stripped.startswith('DOMAIN') or not stripped:
            if stripped.startswith('TITLE'):
                output_lines.append('TITLE "Apple Log High Contrast"\n')
            else:
                output_lines.append(line)
            continue
            
        # Try to parse RGB values
        try:
            parts = stripped.split()
            if len(parts) == 3:
                r = float(parts[0])
                g = float(parts[1])
                b = float(parts[2])
                
                # Apply contrast
                r_new = apply_contrast(r, CONTRAST_FACTOR)
                g_new = apply_contrast(g, CONTRAST_FACTOR)
                b_new = apply_contrast(b, CONTRAST_FACTOR)
                
                # Format with 6 decimal places standard
                output_lines.append(f"{r_new:.6f} {g_new:.6f} {b_new:.6f}\n")
                data_count += 1
            else:
                output_lines.append(line)
        except ValueError:
            # If not a recognized data line, preserve it
            output_lines.append(line)

    print(f"Processed {data_count} data points.")
    
    with open(OUTPUT_PATH, 'w') as f:
        f.writelines(output_lines)
        
    print(f"Success! High contrast LUT saved to: {OUTPUT_PATH}")

if __name__ == "__main__":
    process_lut()
