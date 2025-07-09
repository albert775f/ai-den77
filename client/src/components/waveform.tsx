import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface WaveformProps {
  audioUrl: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  className?: string;
  showControls?: boolean;
  autoplay?: boolean;
}

export function Waveform({
  audioUrl,
  height = 60,
  waveColor = "#3b82f6",
  progressColor = "#1d4ed8",
  backgroundColor = "#f8fafc",
  className = "",
  showControls = true,
  autoplay = false,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState([0.5]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      backgroundColor,
      height,
      barWidth: 2,
      barGap: 1,
      responsive: true,
      normalize: true,
      backend: 'WebAudio',
      mediaControls: false,
    });

    wavesurferRef.current = ws;

    // Event listeners
    ws.on('ready', () => {
      setIsLoading(false);
      setDuration(ws.getDuration());
      ws.setVolume(volume[0]);
      if (autoplay) {
        ws.play();
        setIsPlaying(true);
      }
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      setError('Failed to load audio file');
      setIsLoading(false);
    });

    // Load the audio file
    try {
      ws.load(audioUrl);
    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load audio file');
      setIsLoading(false);
    }

    return () => {
      ws.destroy();
    };
  }, [audioUrl, height, waveColor, progressColor, backgroundColor, autoplay, volume]);

  const togglePlayPause = () => {
    if (!wavesurferRef.current) return;
    
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <span className="text-red-600 text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Waveform */}
      <div className="relative">
        <div ref={containerRef} className="w-full" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && !isLoading && !error && (
        <div className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            disabled={isLoading}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-gray-600 min-w-[40px]">
              {formatTime(currentTime)}
            </span>
            <div className="text-xs text-gray-400">/</div>
            <span className="text-xs text-gray-600 min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              max={1}
              min={0}
              step={0.1}
              className="w-20"
            />
          </div>
        </div>
      )}
    </div>
  );
}