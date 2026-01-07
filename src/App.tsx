import { useState, useEffect } from 'react';
import { GlassLayout } from './components/ui-glass/GlassLayout';
import { FullscreenCanvas } from './components/ui-glass/FullscreenCanvas';
import { ToolRail } from './components/ui-glass/ToolRail';
import { ControlDeck } from './components/ui-glass/ControlDeck';
import { DoubleIslandTimeline } from './components/ui-glass/DoubleIslandTimeline';

import { VideoUploader } from './components/VideoUploader';
import { VideoPreview } from './components/VideoPreview';
import { Adjustments } from './components/Adjustments';
import { Histogram } from './components/scopes/Histogram';
import { Vectorscope } from './components/scopes/Vectorscope';

import { useVideoProcessor } from './hooks/useVideoProcessor';
import { useColorGrading } from './hooks/useColorGrading';
import { useDualLUT } from './hooks/useDualLUT';
import { useSuperResolution } from './hooks/useSuperResolution';
import { ExportModal } from './components/ExportModal';

// Define available tool types matching ToolRail
type ToolType = 'video' | 'lut' | 'adjust' | 'scope' | 'magic';

function App() {
  const [toolbarView, setToolbarView] = useState<ToolType>('adjust');
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeScope, setActiveScope] = useState<'histogram' | 'vectorscope'>('vectorscope');
  const [upscaleEnabled, setUpscaleEnabled] = useState(false);

  // Video processing hook
  const {
    video,
    videoElement,
    isLoading: videoLoading,
    error: videoError,
    loadVideo,
    playPause,
    isPlaying,
  } = useVideoProcessor();

  // Color grading hook
  const {
    settings: colorSettings,
    updateSetting,
    resetAll: resetColorSettings,
  } = useColorGrading();

  // Dual LUT hook (Technical + Creative)
  const {
    state: lutState,
    technicalLUTData,
    creativeLUTData,
    technicalPresets,
    creativePresets,
    selectTechnicalPreset,
    selectCreativePreset,
    uploadTechnicalLUT,
    uploadCreativeLUT,
    setTechnicalIntensity,
    setCreativeIntensity,
  } = useDualLUT();

  // Super Resolution hook
  const {
    state: srState,
    loadModel: loadSRModel,
    upscaleFrame,
  } = useSuperResolution();

  /* Removed duplicate upscaleEnabled */
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(false);

  // Timeline State
  const [currentTime, setCurrentTime] = useState(0);

  // Sync video time
  useEffect(() => {
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoElement.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoElement]);

  const handleSeek = (time: number) => {
    if (videoElement) {
      videoElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const hasVideo = video.file !== null && videoElement !== null;
  const filename = video.file?.name;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (hasVideo) playPause();
          break;
        case 'r':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            resetColorSettings();
          }
          break;
        case 'e':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (hasVideo) setShowExportModal(true);
          }
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const num = parseInt(e.key);
          // Apply intensity to creative LUT
          setCreativeIntensity(num === 0 ? 100 : num * 10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasVideo, playPause, resetColorSettings, setCreativeIntensity]);

  const handleVideoSelect = async (file: File) => {
    await loadVideo(file);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  // Helper to determine Control Deck title
  const getDeckTitle = () => {
    switch (toolbarView) {
      case 'adjust': return 'Color Grading';
      case 'lut': return 'LUT Library';
      case 'scope': return 'Scopes';
      case 'video': return 'Source Info';
      case 'magic': return 'AI Enhancement';
      default: return 'Tools';
    }
  };

  return (
    <GlassLayout>
      {/* 1. Fullscreen Canvas Layer (Z-0) */}
      <FullscreenCanvas>
        {hasVideo ? (
          <VideoPreview
            videoElement={videoElement}
            videoUrl={video.url}
            showBefore={false}
            onShowBeforeChange={() => { }}
            colorSettings={colorSettings}
            technicalLUTData={technicalLUTData}
            technicalIntensity={lutState.technicalIntensity}
            creativeLUTData={creativeLUTData}
            creativeIntensity={lutState.creativeIntensity}
            livePreviewEnabled={livePreviewEnabled}
            upscaleFrame={upscaleFrame}
          />
        ) : (
          <div className="z-[20] pointer-events-auto">
            <VideoUploader
              onVideoSelect={handleVideoSelect}
              isLoading={videoLoading}
              error={videoError}
            />
          </div>
        )}
      </FullscreenCanvas>

      {/* 2. UI Layer (Z-10) */}
      {hasVideo && (
        <>
          {/* Top Bar (Minimal) */}
          <div className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-[20] pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2">
              <span className="font-bold tracking-tight text-white/90">LUMA</span>
              <span className="text-white/40">/</span>
              <span className="text-sm text-white/60">{filename}</span>
            </div>

            <div className="pointer-events-auto">
              <button
                onClick={handleExport}
                className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Export
              </button>
            </div>
          </div>

          {/* Left Tool Rail */}
          <ToolRail
            activeTool={toolbarView}
            onToolChange={(tool) => setToolbarView(tool as any)}
          />

          {/* Right Control Deck */}
          <ControlDeck
            title={getDeckTitle()}
            isVisible={true}
          >
            {toolbarView === 'adjust' && (
              <Adjustments
                settings={colorSettings}
                onUpdate={updateSetting}
                onReset={resetColorSettings}
              />
            )}

            {toolbarView === 'lut' && (
              <div className="space-y-6">
                {/* Technical LUT (Input Transform) */}
                <div>
                  <div className="section-header mb-2">INPUT TRANSFORM</div>
                  <div className="text-xs text-white/40 mb-2">Log → Rec.709 conversion</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`p-2 rounded-lg border text-xs ${!lutState.technicalLUT ? 'bg-[var(--accent)] text-black border-transparent' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
                      onClick={() => selectTechnicalPreset(null)}
                    >
                      None
                    </button>
                    {technicalPresets.map(preset => (
                      <button
                        key={preset.id}
                        className={`p-2 rounded-lg border text-xs text-left truncate ${lutState.technicalLUT?.id === preset.id ? 'bg-[var(--accent)] text-black border-transparent' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
                        onClick={() => selectTechnicalPreset(preset)}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={lutState.technicalIntensity}
                    onChange={(e) => setTechnicalIntensity(Number(e.target.value))}
                    className="w-full mt-2 accent-[var(--accent)]"
                  />
                </div>

                {/* Creative LUT (Look) */}
                <div>
                  <div className="section-header mb-2">CREATIVE LOOK</div>
                  <div className="text-xs text-white/40 mb-2">Film emulation & style</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`p-2 rounded-lg border text-xs ${!lutState.creativeLUT && !lutState.creativeCustom ? 'bg-[var(--accent)] text-black border-transparent' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
                      onClick={() => selectCreativePreset(null)}
                    >
                      None
                    </button>
                    {creativePresets.map(preset => (
                      <button
                        key={preset.id}
                        className={`p-2 rounded-lg border text-xs text-left truncate ${lutState.creativeLUT?.id === preset.id ? 'bg-[var(--accent)] text-black border-transparent' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
                        onClick={() => selectCreativePreset(preset)}
                      >
                        {preset.name}
                      </button>
                    ))}

                    {/* Custom uploaded LUT */}
                    {lutState.creativeCustom && (
                      <div className="relative p-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-xs text-left truncate flex items-center justify-between col-span-2">
                        <span className="text-purple-300 truncate flex-1">📁 {lutState.creativeCustom.name}</span>
                        <button
                          onClick={() => selectCreativePreset(null)}
                          className="ml-2 text-white/40 hover:text-red-400 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <label className="mt-2 flex items-center justify-center gap-2 p-2 border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                    <span className="text-xs text-white/60">+ Upload .cube file</span>
                    <input
                      type="file"
                      accept=".cube"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadCreativeLUT(file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={lutState.creativeIntensity}
                    onChange={(e) => setCreativeIntensity(Number(e.target.value))}
                    className="w-full mt-2 accent-[var(--accent)]"
                  />
                </div>
              </div>
            )}

            {toolbarView === 'scope' && (
              <div className="space-y-4">
                <div className="flex bg-white/5 p-1 rounded-lg">
                  <button
                    className={`flex-1 py-1.5 text-xs rounded transition-all ${activeScope === 'vectorscope' ? 'bg-[var(--accent)] text-black font-bold' : 'text-white/60 hover:text-white'}`}
                    onClick={() => setActiveScope('vectorscope')}
                  >
                    Vectorscope
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-xs rounded transition-all ${activeScope === 'histogram' ? 'bg-[var(--accent)] text-black font-bold' : 'text-white/60 hover:text-white'}`}
                    onClick={() => setActiveScope('histogram')}
                  >
                    Histogram
                  </button>
                </div>

                <div className="aspect-square bg-black/20 rounded-xl overflow-hidden border border-white/5">
                  {activeScope === 'vectorscope' ? (
                    <Vectorscope videoElement={videoElement} />
                  ) : (
                    <Histogram videoElement={videoElement} />
                  )}
                </div>
              </div>
            )}

            {toolbarView === 'video' && (
              <div className="space-y-4 text-white/80 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span>Resolution</span>
                  <span className="font-mono">{video.width} × {video.height}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span>Frame Rate</span>
                  <span className="font-mono">{video.fps} FPS</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span>Duration</span>
                  <span className="font-mono">{Math.floor(video.duration)}s</span>
                </div>
              </div>
            )}

            {toolbarView === 'magic' && (
              <div className="space-y-4">
                {/* AI Super Resolution */}
                <div>
                  <div className="section-header mb-2">AI SUPER RESOLUTION</div>
                  <div className="text-xs text-white/40 mb-3">Upscale video with AI (2x)</div>

                  {/* Model Status */}
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-white/5">
                    <div className={`w-2 h-2 rounded-full ${srState.isModelLoaded ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-xs text-white/60">
                      {srState.isModelLoaded ? 'Model Ready' : 'Model Not Loaded'}
                    </span>
                    {!srState.isModelLoaded && (
                      <button
                        onClick={() => loadSRModel()}
                        className="ml-auto text-xs bg-[var(--accent)] text-black px-2 py-1 rounded"
                      >
                        Load Model
                      </button>
                    )}
                  </div>

                  {/* Upscale Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-white/10">
                    <div>
                      <div className="text-sm text-white">2x Upscale</div>
                      <div className="text-xs text-white/40">720p → 1440p</div>
                    </div>
                    <button
                      onClick={() => setUpscaleEnabled(!upscaleEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${upscaleEnabled ? 'bg-[var(--accent)]' : 'bg-white/20'}`}
                    >
                      <div className={`relative w-4 h-4 bg-white rounded-full transition-transform duration-200 ${upscaleEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Live Preview Toggle */}
                  {upscaleEnabled && (
                    <div className="flex items-center justify-between p-3 mt-2 rounded-lg border border-white/10 bg-white/5">
                      <div>
                        <div className="text-sm text-white">Live Preview</div>
                        <div className="text-xs text-white/40">Real-time AI (Low FPS)</div>
                      </div>
                      <button
                        onClick={() => setLivePreviewEnabled(!livePreviewEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${livePreviewEnabled ? 'bg-[var(--accent)]' : 'bg-white/20'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${livePreviewEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  )}

                  {upscaleEnabled && (
                    <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <div className="text-xs text-purple-300">⚡ AI upscale will be applied during export</div>
                    </div>
                  )}
                </div>

                {/* Enhancement Presets */}
                <div>
                  <div className="section-header mb-2">QUICK ENHANCE</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 rounded-lg border border-white/10 text-left hover:bg-white/5 transition-colors">
                      <div className="text-sm text-white">Auto Fix</div>
                      <div className="text-xs text-white/40">Auto color & exposure</div>
                    </button>
                    <button className="p-3 rounded-lg border border-white/10 text-left hover:bg-white/5 transition-colors">
                      <div className="text-sm text-white">Denoise</div>
                      <div className="text-xs text-white/40">Reduce noise</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ControlDeck>

          {/* Bottom Timeline - Wired Up */}
          <DoubleIslandTimeline
            currentTime={currentTime}
            duration={video.duration || 60}
            isPlaying={isPlaying}
            onPlayPause={playPause}
            onSeek={handleSeek}
            videoElement={videoElement}
          />
        </>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          video={video}
          videoElement={videoElement}
          colorSettings={colorSettings}
          lutData={creativeLUTData}
          lutIntensity={lutState.creativeIntensity}
          upscaleEnabled={upscaleEnabled}
          upscaleFrame={upscaleFrame}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </GlassLayout>
  );
}

export default App;
