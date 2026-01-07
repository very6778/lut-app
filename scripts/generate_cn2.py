import os

# Configuration
INPUT_PATH = '/Users/sait/Documents/lut-app/public/luts/Conversion LUT - Apple Log to Rec709.cube'
OUTPUT_PATH = '/Users/sait/Documents/lut-app/public/luts/Apple Log - CN2.cube'
# Contrast Factor: 0.6 means "reduce contrast by 40%". 
# This roughly matches "reduce highlights and shadows impact".
CONTRAST_FACTOR = 0.6 

def apply_soft_contrast(value, contrast):
    """
    Applies a soft contrast reduction (flattening).
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
    data_count = 0
    
    print("Processing data...")
    
    for line in lines:
        stripped = line.strip()
        
        # Skip comments and metadata
        if stripped.startswith('#') or stripped.startswith('TITLE') or stripped.startswith('LUT_3D_SIZE') or stripped.startswith('DOMAIN') or not stripped:
            if stripped.startswith('TITLE'):
                output_lines.append('TITLE "Apple Log CN2 (Soft)"\n')
            else:
                output_lines.append(line)
            continue
            
        # Parse RGB
        try:
            parts = stripped.split()
            if len(parts) == 3:
                r = float(parts[0])
                g = float(parts[1])
                b = float(parts[2])
                
                # Apply soft contrast (flattening)
                r_new = apply_soft_contrast(r, CONTRAST_FACTOR)
                g_new = apply_soft_contrast(g, CONTRAST_FACTOR)
                b_new = apply_soft_contrast(b, CONTRAST_FACTOR)
                
                output_lines.append(f"{r_new:.6f} {g_new:.6f} {b_new:.6f}\n")
                data_count += 1
            else:
                output_lines.append(line)
        except ValueError:
            output_lines.append(line)

    print(f"Processed {data_count} data points.")
    
    with open(OUTPUT_PATH, 'w') as f:
        f.writelines(output_lines)
        
    print(f"Success! CN2 LUT saved to: {OUTPUT_PATH}")

if __name__ == "__main__":
    process_lut()
