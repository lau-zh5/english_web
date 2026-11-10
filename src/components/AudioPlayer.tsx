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

    // 鼠标与触摸共用一份定位逻辑：iPhone / iPad 上也能拖动进度条。
    // 轨道视觉高度 8px，实际可点区域 28px，满足触屏最小目标。
    const seekFromClientX = (clientX: number) => {
      if (!progressRef.current || !audioRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = percentage * actualDuration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeChange?.(newTime);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => seekFromClientX(e.clientX);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      isDraggingRef.current = true;
      seekFromClientX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      seekFromClientX(e.clientX);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      isDraggingRef.current = true;
      if (e.touches[0]) seekFromClientX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !e.touches[0]) return;
      seekFromClientX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      seekToTime(currentTime + (e.key === 'ArrowRight' ? 5 : -5));
    };

    useEffect(() => {
      const handleGlobalUp = () => {
        isDraggingRef.current = false;
      };
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchend', handleGlobalUp);
      window.addEventListener('touchcancel', handleGlobalUp);
      return () => {
        window.removeEventListener('mouseup', handleGlobalUp);
        window.removeEventListener('touchend', handleGlobalUp);
        window.removeEventListener('touchcancel', handleGlobalUp);
      };
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
      <div className="glass rounded-2xl p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? '暂停' : '播放'}
            className="w-12 h-12 rounded-full bg-accent-500 text-white flex items-center justify-center hover:bg-accent-600 transition-colors shadow-md flex-shrink-0"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          <div className="flex-1 min-w-[8rem]">
            <div
              ref={progressRef}
              data-lq-scrub
              role="slider"
              tabIndex={0}
              aria-label="播放进度"
              aria-valuemin={0}
              aria-valuemax={Math.round(actualDuration)}
              aria-valuenow={Math.round(currentTime)}
              className="h-7 flex items-center cursor-pointer relative touch-none select-none"
              onClick={handleProgressClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onKeyDown={handleProgressKeyDown}
            >
              <div
                className="h-2 w-full rounded-full overflow-hidden"
                style={{ background: 'var(--lq-stroke-2)' }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-150"
                  style={{ width: `${progress}%`, background: 'var(--accent)' }}
                />
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md border-2"
                style={{
                  left: `calc(${progress}% - 8px)`,
                  background: 'var(--surface-solid)',
                  borderColor: 'var(--accent)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-tertiary">
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span>{formatDuration(Math.floor(actualDuration))}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={cyclePlaybackRate}
              aria-label="切换播放速度"
              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
            >
              {playbackRate}x
            </button>
            <button
              onClick={reset}
              aria-label="重新开始"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <RotateCcw size={18} />
            </button>
            <div className="relative group">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? '取消静音' : '静音'}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                {isMuted ? <Volume2 size={18} className="opacity-40" /> : <Volume2 size={18} />}
              </button>
              {/* 触屏没有 hover：用 focus-within 让点按后也能展开音量滑块 */}
              <div className="absolute bottom-full right-0 mb-2 w-28 glass rounded-2xl shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
                <input
                  type="range"
                  min="0"
                  max="100"
                  aria-label="音量"
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

AudioPlayer.displayName = 'AudioPlayer';
