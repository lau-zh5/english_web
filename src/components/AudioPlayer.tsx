import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { formatDuration } from '../utils/helpers';

interface AudioPlayerProps {
  audioUrl?: string;
  duration?: number;
  onTimeChange?: (time: number) => void;
}

export interface AudioPlayerRef {
  seek: (time: number) => void;
}

export const AudioPlayer = React.forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ audioUrl, duration = 180, onTimeChange }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [actualDuration, setActualDuration] = useState(duration);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isDraggingRef = useRef(false);

    const seekToTime = useCallback((time: number) => {
      if (audioRef.current) {
        const clampedTime = Math.max(0, Math.min(time, actualDuration));
        audioRef.current.currentTime = clampedTime;
        setCurrentTime(clampedTime);
        onTimeChange?.(clampedTime);
      }
    }, [actualDuration, onTimeChange]);

    React.useImperativeHandle(ref, () => ({
      seek: seekToTime,
    }), [seekToTime]);

    useEffect(() => {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';

      const audio = audioRef.current;

      const handleLoadedMetadata = () => {
        if (audio.duration > 0) {
          setActualDuration(audio.duration);
        }
      };

      const handleTimeUpdate = () => {
        if (!isDraggingRef.current) {
          const time = audio.currentTime;
          setCurrentTime(time);
          onTimeChange?.(time);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleError = () => {
        setIsPlaying(false);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.pause();
        audioRef.current = null;
      };
    }, [onTimeChange]);

    useEffect(() => {
      if (audioRef.current && audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
    }, [audioUrl]);

    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.volume = isMuted ? 0 : volume;
      }
    }, [playbackRate, volume, isMuted]);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !audioRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * actualDuration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeChange?.(newTime);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      isDraggingRef.current = true;
      handleProgressClick(e);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !progressRef.current || !audioRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * actualDuration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeChange?.(newTime);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    useEffect(() => {
      const handleGlobalMouseUp = () => {
        isDraggingRef.current = false;
      };
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const togglePlay = async () => {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Playback failed:', error);
        }
      }
    };

    const reset = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.pause();
      }
      setCurrentTime(0);
      setIsPlaying(false);
    };

    const cyclePlaybackRate = () => {
      const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
      const currentIndex = rates.indexOf(playbackRate);
      const nextIndex = (currentIndex + 1) % rates.length;
      setPlaybackRate(rates[nextIndex]);
    };

    const toggleMute = () => {
      setIsMuted(!isMuted);
    };

    const progress = actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-accent-500 text-white flex items-center justify-center hover:bg-accent-600 transition-colors shadow-md"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          <div className="flex-1">
            <div
              ref={progressRef}
              className="h-2 bg-gray-200 rounded-full cursor-pointer relative"
              onClick={handleProgressClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-accent-500"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span>{formatDuration(Math.floor(actualDuration))}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cyclePlaybackRate}
              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
            >
              {playbackRate}x
            </button>
            <button
              onClick={reset}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <RotateCcw size={18} />
            </button>
            <div className="relative group">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                {isMuted ? <Volume2 size={18} className="opacity-40" /> : <Volume2 size={18} />}
              </button>
              <div className="absolute bottom-full right-0 mb-2 w-24 bg-white rounded-lg shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume * 100}
                  onChange={(e) => {
                    const newVolume = parseInt(e.target.value) / 100;
                    setVolume(newVolume);
                    setIsMuted(newVolume === 0);
                  }}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-accent-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
