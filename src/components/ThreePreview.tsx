import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, LUT } from '@react-three/postprocessing';
import { VideoTexture, LinearFilter, RGBAFormat, Data3DTexture, FloatType, DataTexture, Texture } from 'three';
import { ColorGradingEffect } from './ColorGradingEffect';
import type { ColorSettings } from '../types';
import type { LUTData } from '../hooks/useLUT';

interface SceneProps {
    videoElement: HTMLVideoElement;
    colorSettings: ColorSettings;
    // Dual LUT Support
    technicalLUTData: LUTData | null;
    technicalIntensity: number;
    creativeLUTData: LUTData | null;
    creativeIntensity: number;
    // Live Preview Support
    livePreviewEnabled: boolean;
    upscaleFrame?: (frame: ImageData) => Promise<ImageData | null>;
}

function VideoScene({
    videoElement,
    colorSettings,
    technicalLUTData,
    technicalIntensity,
    creativeLUTData,
    creativeIntensity,
    livePreviewEnabled,
    upscaleFrame
}: SceneProps) {
    const textureRef = useRef<Texture | null>(null);
    const upscaledTextureRef = useRef<DataTexture | null>(null);
    const { viewport, gl } = useThree();
    const [textureMap, setTextureMap] = useState<Texture | null>(null);

    // Live Preview State
    const isProcessingRef = useRef(false);
    const frameCountRef = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    // Initialize Canvas for capture
    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvasRef.current = canvas;
        ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });
    }, []);

    // Create Video Texture (Default)
    useEffect(() => {
        if (!videoElement) return;

        const texture = new VideoTexture(videoElement);
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.format = RGBAFormat;
        textureRef.current = texture;

        // Default to video texture
        if (!livePreviewEnabled) {
            setTextureMap(texture);
        }

        return () => {
            texture.dispose();
        };
    }, [videoElement]);

    // Update Texture Map when mode changes
    useEffect(() => {
        if (!livePreviewEnabled && textureRef.current) {
            setTextureMap(textureRef.current);
            isProcessingRef.current = false;
        }
    }, [livePreviewEnabled]);

    // Live Preview Loop
    useFrame(() => {
        if (!videoElement || videoElement.paused || videoElement.ended) return;

        // Normal Mode: VideoTexture auto-updates
        if (!livePreviewEnabled) return;

        // Live Preview Mode: Intercept frames
        // Skip frames to prevent overload (process every 2nd frame if busy, but logic handles busy state)
        frameCountRef.current++;

        if (upscaleFrame && !isProcessingRef.current && canvasRef.current && ctxRef.current) {
            isProcessingRef.current = true;

            // Capture current frame
            const width = videoElement.videoWidth;
            const height = videoElement.videoHeight;

            if (canvasRef.current.width !== width) canvasRef.current.width = width;
            if (canvasRef.current.height !== height) canvasRef.current.height = height;

            ctxRef.current.drawImage(videoElement, 0, 0, width, height);
            const imageData = ctxRef.current.getImageData(0, 0, width, height);

            // Run Async Upscale
            upscaleFrame(imageData).then((upscaledData) => {
                if (upscaledData) {
                    // Update Upscaled Texture
                    if (!upscaledTextureRef.current || upscaledTextureRef.current.image.width !== upscaledData.width) {
                        // Create new texture if dimensions verified
                        if (upscaledTextureRef.current) upscaledTextureRef.current.dispose();
                        upscaledTextureRef.current = new CanvasTexture(upscaledData as any); // Type cast for ImageData compat
                        upscaledTextureRef.current.minFilter = LinearFilter;
                        upscaledTextureRef.current.magFilter = LinearFilter;
                    } else {
                        // Update existing texture
                        upscaledTextureRef.current.image = upscaledData;
                        upscaledTextureRef.current.needsUpdate = true;
                    }

                    // Force React re-render only if texture changed reference (optimization)
                    // But here we rely on Three.js internal update.
                    // We need to set the map state to this upscaled texture if not already
                    setTextureMap(upscaledTextureRef.current);
                }

                isProcessingRef.current = false;
            }).catch(err => {
                console.error("Preview upscale error:", err);
                isProcessingRef.current = false;
            });
        }
    });

    // Create Technical LUT Texture (Input Transform: Log → Rec.709)
    const technicalLUTTexture = useMemo(() => {
        if (!technicalLUTData) return null;

        const { data, size } = technicalLUTData;
        const texture = new Data3DTexture(data, size, size, size);
        texture.format = RGBAFormat;
        texture.type = FloatType;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        return texture;
    }, [technicalLUTData]);

    // Create Creative LUT Texture (Look/Style)
    const creativeLUTTexture = useMemo(() => {
        if (!creativeLUTData) return null;

        const { data, size } = creativeLUTData;
        const texture = new Data3DTexture(data, size, size, size);
        texture.format = RGBAFormat;
        texture.type = FloatType;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        return texture;
    }, [creativeLUTData]);

    if (!textureMap && !textureRef.current) return null;
    const activeTexture = textureMap || textureRef.current;

    // Render a full-screen plane with the video texture
    const videoAspect = videoElement.videoWidth / videoElement.videoHeight;

    // Cover logic (fill entire viewport, crop edges if needed)
    let planeWidth = viewport.width;
    let planeHeight = viewport.height;

    if (planeWidth / planeHeight < videoAspect) {
        planeWidth = planeHeight * videoAspect;
    } else {
        planeHeight = planeWidth / videoAspect;
    }

    return (
        <>
            <mesh>
                <planeGeometry args={[planeWidth, planeHeight]} />
                <meshBasicMaterial map={activeTexture} />
            </mesh>

            {/* Post Processing Pipeline */}
            <EffectComposer disableNormalPass>
                {/* 1. Technical LUT: Log → Rec.709 (applied first) */}
                {technicalLUTTexture && (
                    <LUT
                        lut={technicalLUTTexture}
                        // @ts-ignore
                        intensity={technicalIntensity / 100}
                        tetrahedralInterpolation={true}
                    />
                )}

                {/* 2. Color Grading (exposure, contrast, saturation, etc.) */}
                <ColorGradingEffect {...colorSettings} />

                {/* 3. Creative LUT: Film look, style (applied last) */}
                {creativeLUTTexture && (
                    <LUT
                        lut={creativeLUTTexture}
                        // @ts-ignore
                        intensity={creativeIntensity / 100}
                        tetrahedralInterpolation={true}
                    />
                )}
            </EffectComposer>
        </>
    );
}

interface ThreePreviewProps {
    videoElement: HTMLVideoElement;
    colorSettings: ColorSettings;
    // Dual LUT Support
    technicalLUTData: LUTData | null;
    technicalIntensity: number;
    creativeLUTData: LUTData | null;
    creativeIntensity: number;
    // Live Preview Support
    livePreviewEnabled?: boolean;
    upscaleFrame?: (frame: ImageData) => Promise<ImageData | null>;
}

export function ThreePreview({
    videoElement,
    colorSettings,
    technicalLUTData,
    technicalIntensity,
    creativeLUTData,
    creativeIntensity,
    livePreviewEnabled = false,
    upscaleFrame
}: ThreePreviewProps) {
    return (
        <Canvas
            gl={{ preserveDrawingBuffer: true, alpha: false }}
            camera={{ position: [0, 0, 5], near: 0.1, far: 1000 }}
            orthographic
            flat
        >
            <VideoScene
                videoElement={videoElement}
                colorSettings={colorSettings}
                technicalLUTData={technicalLUTData}
                technicalIntensity={technicalIntensity}
                creativeLUTData={creativeLUTData}
                creativeIntensity={creativeIntensity}
                livePreviewEnabled={livePreviewEnabled}
                upscaleFrame={upscaleFrame}
            />
        </Canvas>
    );
}
