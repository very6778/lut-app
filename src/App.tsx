import { useState, useCallback } from 'react';
import { Palette, Sliders, Download } from 'lucide-react';
import { VideoUploader } from './components/VideoUploader';
import { VideoPreview } from './components/VideoPreview';
import { LUTSelector } from './components/LUTSelector';
import { ColorControls } from './components/ColorControls';
import { ExportPanel } from './components/ExportPanel';
import { useVideoProcessor } from './hooks/useVideoProcessor';
import { useColorGrading } from './hooks/useColorGrading';
import { useLUT } from './hooks/useLUT';
import type { ExportProgress, ExportQuality } from './types';
import { cn } from './lib/utils';
import './index.css';

type Tab = 'lut' | 'color' | 'export';

const initialExportProgress: ExportProgress = {
  status: 'idle',
  currentFrame: 0,
  totalFrames: 0,
  estimatedTimeRemaining: 0,
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('lut');
  const [showBefore, setShowBefore] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>(initialExportProgress);

  // Hooks
  const {
    video,
    videoElement,
    isLoading: videoLoading,
    error: videoError,
    loadVideo,
    clearVideo,
  } = useVideoProcessor();

  const {
    settings: colorSettings,
    updateSetting,
    resetAll: resetColorSettings,
  } = useColorGrading();

  const {
    state: lutState,
    presets: lutPresets,
    selectPreset,
    uploadCustomLUT,
    setIntensity,
  } = useLUT();

  // Handlers
  const handleVideoSelect = useCallback(async (file: File) => {
    return await loadVideo(file);
  }, [loadVideo]);

  const handleExport = useCallback(async (quality: ExportQuality, bitrate: number) => {
    // TODO: Implement actual export with WebCodecs
    console.log('Export started:', { quality, bitrate });

    // Simulate export progress for now
    const totalFrames = Math.floor(video.duration * video.fps);
    setExportProgress({
      status: 'encoding',
      currentFrame: 0,
      totalFrames,
      estimatedTimeRemaining: video.duration * 1.5,
    });

    // Simulate progress
    let frame = 0;
    const interval = setInterval(() => {
      frame += 30;
      if (frame >= totalFrames) {
        clearInterval(interval);
        setExportProgress({
          status: 'complete',
          currentFrame: totalFrames,
          totalFrames,
          estimatedTimeRemaining: 0,
        });
      } else {
        setExportProgress(prev => ({
          ...prev,
          currentFrame: frame,
        }));
      }
    }, 100);
  }, [video.duration, video.fps]);

  const handleCancelExport = useCallback(() => {
    setExportProgress(initialExportProgress);
  }, []);

  const hasVideo = video.url !== null;

  return (
    <div className="h-full flex flex-col lg:flex-row bg-background">
      {/* Video Preview Section */}
      <div className="flex-1 flex flex-col min-h-[40vh] lg:min-h-0">
        <div className="flex-1 p-4 lg:p-6">
          {hasVideo ? (
            <VideoPreview
              videoElement={videoElement}
              videoUrl={video.url}
              showBefore={showBefore}
              onShowBeforeChange={setShowBefore}
            />
          ) : (
            <VideoUploader
              onVideoSelect={handleVideoSelect}
              isLoading={videoLoading}
              error={videoError}
            />
          )}
        </div>
      </div>

      {/* Controls Section */}
      {hasVideo && (
        <div className="lg:w-96 flex flex-col bg-surface border-t lg:border-t-0 lg:border-l border-surface-light">
          {/* Tab Bar */}
          <div className="flex border-b border-surface-light">
            <button
              onClick={() => setActiveTab('lut')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors',
                activeTab === 'lut'
                  ? 'text-white border-b-2 border-accent'
                  : 'text-muted hover:text-white'
              )}
            >
              <Palette className="w-4 h-4" />
              LUT
            </button>
            <button
              onClick={() => setActiveTab('color')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors',
                activeTab === 'color'
                  ? 'text-white border-b-2 border-accent'
                  : 'text-muted hover:text-white'
              )}
            >
              <Sliders className="w-4 h-4" />
              Color
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors',
                activeTab === 'export'
                  ? 'text-white border-b-2 border-accent'
                  : 'text-muted hover:text-white'
              )}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'lut' && (
              <LUTSelector
                presets={lutPresets}
                selectedLUT={lutState.selectedLUT}
                customLUT={lutState.customLUT}
                intensity={lutState.intensity}
                onSelectPreset={selectPreset}
                onUploadCustom={uploadCustomLUT}
                onIntensityChange={setIntensity}
              />
            )}

            {activeTab === 'color' && (
              <ColorControls
                settings={colorSettings}
                onUpdate={updateSetting}
                onReset={resetColorSettings}
              />
            )}

            {activeTab === 'export' && (
              <ExportPanel
                videoDuration={video.duration}
                progress={exportProgress}
                onExport={handleExport}
                onCancel={handleCancelExport}
              />
            )}
          </div>

          {/* Video Info Footer */}
          <div className="p-4 border-t border-surface-light text-xs text-muted">
            <div className="flex justify-between">
              <span>{video.width}×{video.height}</span>
              <span>{video.fps} fps</span>
              <span>{Math.floor(video.duration / 60)}:{Math.floor(video.duration % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
