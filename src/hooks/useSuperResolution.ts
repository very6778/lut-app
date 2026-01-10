import { useState, useCallback, useRef } from 'react';
import * as ort from 'onnxruntime-web';

export interface SuperResolutionState {
    isModelLoaded: boolean;
    isProcessing: boolean;
    error: string | null;
    modelName: string;
}

// Configure ONNX Runtime for WebGPU/WebGL
const isDev = import.meta.env.DEV;
ort.env.wasm.wasmPaths = isDev
    ? '/node_modules/onnxruntime-web/dist/'
    : '/assets/onnx/';

export function useSuperResolution() {
    const [state, setState] = useState<SuperResolutionState>({
        isModelLoaded: false,
        isProcessing: false,
        error: null,
        modelName: 'FSRCNN_x2',
    });

    const sessionRef = useRef<ort.InferenceSession | null>(null);
    const scaleFactorRef = useRef<number>(2);

    // Load the ONNX model
    // Using a reliable remote URL to avoid large file issues in repo
    const loadModel = useCallback(async (modelPath: string = 'https://huggingface.co/ai-forever/Real-ESRGAN/resolve/main/RealESRGAN_x2.onnx') => {
        try {
            setState(prev => ({ ...prev, isProcessing: true, error: null }));

            // Try WebGPU first, then WebGL, then WASM
            const executionProviders: ort.InferenceSession.ExecutionProviderConfig[] = [];

            // Check WebGPU support
            if ('gpu' in navigator) {
                executionProviders.push('webgpu');
            }
            executionProviders.push('webgl');
            executionProviders.push('wasm');

            const session = await ort.InferenceSession.create(modelPath, {
                executionProviders,
                graphOptimizationLevel: 'all',
            });

            sessionRef.current = session;

            console.log('Super Resolution model loaded successfully');
            console.log('Input names:', session.inputNames);
            console.log('Output names:', session.outputNames);

            setState(prev => ({
                ...prev,
                isModelLoaded: true,
                isProcessing: false,
            }));

            return true;
        } catch (error) {
            console.error('Failed to load SR model:', error);
            setState(prev => ({
                ...prev,
                isProcessing: false,
                error: `Model loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }));
            return false;
        }
    }, []);

    // Convert ImageData to ONNX Tensor (NCHW format)
    const imageDataToTensor = useCallback((imageData: ImageData): ort.Tensor => {
        const { data, width, height } = imageData;
        const channels = 3; // RGB

        // Create Float32Array for NCHW format
        const float32Data = new Float32Array(1 * channels * height * width);

        // Convert from RGBA (HWC) to RGB (CHW) and normalize to 0-1
        for (let c = 0; c < channels; c++) {
            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    const srcIdx = (h * width + w) * 4 + c; // RGBA offset
                    const dstIdx = c * height * width + h * width + w; // CHW offset
                    float32Data[dstIdx] = data[srcIdx] / 255.0;
                }
            }
        }

        return new ort.Tensor('float32', float32Data, [1, channels, height, width]);
    }, []);

    // Convert ONNX Tensor back to ImageData
    const tensorToImageData = useCallback((tensor: ort.Tensor, width: number, height: number): ImageData => {
        const data = tensor.data as Float32Array;
        const channels = 3;

        const outputWidth = width * scaleFactorRef.current;
        const outputHeight = height * scaleFactorRef.current;

        const imageData = new ImageData(outputWidth, outputHeight);
        const pixels = imageData.data;

        // Convert from CHW to RGBA (HWC)
        for (let h = 0; h < outputHeight; h++) {
            for (let w = 0; w < outputWidth; w++) {
                const dstIdx = (h * outputWidth + w) * 4;

                for (let c = 0; c < channels; c++) {
                    const srcIdx = c * outputHeight * outputWidth + h * outputWidth + w;
                    // Denormalize and clamp
                    pixels[dstIdx + c] = Math.max(0, Math.min(255, Math.round(data[srcIdx] * 255)));
                }
                pixels[dstIdx + 3] = 255; // Alpha
            }
        }

        return imageData;
    }, []);

    // Upscale a single frame
    const upscaleFrame = useCallback(async (imageData: ImageData): Promise<ImageData | null> => {
        if (!sessionRef.current) {
            console.error('Model not loaded');
            return null;
        }

        setState(prev => ({ ...prev, isProcessing: true }));

        try {
            const inputTensor = imageDataToTensor(imageData);

            // Run inference
            const inputName = sessionRef.current.inputNames[0];
            const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

            const results = await sessionRef.current.run(feeds);

            const outputName = sessionRef.current.outputNames[0];
            const outputTensor = results[outputName];

            // Convert tensor to ImageData
            let upscaledImageData = tensorToImageData(
                outputTensor,
                imageData.width,
                imageData.height
            );

            // Apply Aggressive Sharpening (Post-Processing)
            // Increased strength significantly based on user feedback (2.5x)
            upscaledImageData = applySharpening(upscaledImageData, 2.5);

            setState(prev => ({ ...prev, isProcessing: false }));

            return upscaledImageData;
        } catch (error) {
            console.error('Upscale failed:', error);
            setState(prev => ({
                ...prev,
                isProcessing: false,
                error: `Upscale failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }));
            return null;
        }
    }, [imageDataToTensor, tensorToImageData]);

    // Upscale using Canvas (fallback - bicubic-like)
    const upscaleWithCanvas = useCallback((
        sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
        targetWidth: number,
        targetHeight: number
    ): ImageData => {
        const outputCanvas = new OffscreenCanvas(targetWidth, targetHeight);
        const ctx = outputCanvas.getContext('2d');

        if (!ctx) throw new Error('Could not get canvas context');

        // Enable smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

        return ctx.getImageData(0, 0, targetWidth, targetHeight);
    }, []);

    // Dispose model
    const dispose = useCallback(async () => {
        if (sessionRef.current) {
            await sessionRef.current.release();
            sessionRef.current = null;
        }
        setState({
            isModelLoaded: false,
            isProcessing: false,
            error: null,
            modelName: 'FSRCNN_x2',
        });
    }, []);

    return {
        state,
        loadModel,
        upscaleFrame,
        upscaleWithCanvas,
        dispose,
        scaleFactor: scaleFactorRef.current,
    };
}

// Helper: Apply Sharpening Kernel
// Kernel:
// [ 0, -k,  0 ]
// [-k, 1+4k, -k]
// [ 0, -k,  0 ]
function applySharpening(imageData: ImageData, amount: number = 0.5): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    // Copy source to destination first to handle borders and alpha channel correctly
    const dst = new Uint8ClampedArray(src);

    // Amount determines the strength. 
    // If amount is 1, center weight is 5, neighbors are -1. standard sharp.
    // User asked for "aggressive", so we can tune this.
    // Let's use a standard 3x3 sharpening kernel logic:
    // val = pixel + amount * (pixel - neighbors_avg)
    // Simplified kernel approach:

    const w = width;
    const h = height;

    // Mix safe implementation (skips borders)
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;

            // Neighbor offsets
            const up = ((y - 1) * w + x) * 4;
            const down = ((y + 1) * w + x) * 4;
            const left = (y * w + (x - 1)) * 4;
            const right = (y * w + (x + 1)) * 4;

            for (let c = 0; c < 3; c++) { // RGB only
                const val = src[idx + c];
                const neighbors = src[up + c] + src[down + c] + src[left + c] + src[right + c];

                // Convolution formula for sharpening: 5*center - sum(neighbors)
                // We can blend it with original for strength control.
                // High pass = 4*center - neighbors
                // Sharpened = center + amount * High Pass

                const highPass = (4 * val) - neighbors;
                dst[idx + c] = val + (amount * highPass);
            }
            // Alpha channel (dst[idx+3]) is already copied from src
        }
    }

    // Let's iterate borders to copy original just in case

    return new ImageData(dst, width, height);
}
