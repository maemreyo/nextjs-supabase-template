import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface PhrasePronunciationAudioPlayerProps {
  phrase: string;
  onPronounce?: (phrase: string) => void;
  autoPlay?: boolean;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  accent?: 'us' | 'uk' | 'au' | 'ca';
  className?: string;
  showControls?: boolean;
  compact?: boolean;
}

/**
 * Phrase Pronunciation Audio Player Component
 * Cung cấp chức năng phát âm cụm từ với các tùy chọn tùy chỉnh
 */
export const PhrasePronunciationAudioPlayer: React.FC<PhrasePronunciationAudioPlayerProps> = ({
  phrase,
  onPronounce,
  autoPlay = false,
  rate = 0.8,
  pitch = 1,
  volume = 1,
  voice,
  accent = 'us',
  className,
  showControls = true,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if speech synthesis is supported
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.speechSynthesis) {
      setIsSupported(false);
      setError('Trình duyệt của bạn không hỗ trợ phát âm.');
    }
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && phrase && isSupported && !isPlaying) {
      handlePronounce();
    }
  }, [autoPlay, phrase, isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePronounce = useCallback(() => {
    if (!isSupported || !phrase) return;

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      setIsLoading(true);
      setError(null);

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(phrase);
      utteranceRef.current = utterance;

      // Configure utterance
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Set voice based on accent preference
      if (voice) {
        const selectedVoice = window.speechSynthesis.getVoices().find(v => v.name === voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        // Auto-select voice based on accent
        const voices = window.speechSynthesis.getVoices();
        const accentVoice = voices.find(v => 
          v.lang.includes(getAccentLocale(accent)) && v.localService
        );
        if (accentVoice) {
          utterance.voice = accentVoice;
        }
      }

      // Event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        setIsPlaying(false);
        setIsLoading(false);
        setError('Không thể phát âm cụm từ. Vui lòng thử lại.');
        utteranceRef.current = null;
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);

      // Call custom pronunciation handler if provided
      onPronounce?.(phrase);

    } catch (err) {
      setIsLoading(false);
      setError('Lỗi khi khởi tạo phát âm.');
    }
  }, [phrase, rate, pitch, volume, voice, accent, onPronounce, isSupported]);

  const handleStop = useCallback(() => {
    if (window.speechSynthesis && utteranceRef.current) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      utteranceRef.current = null;
    }
  }, []);

  const getAccentLocale = (accent: string): string => {
    const accentMap: Record<string, string> = {
      'us': 'en-US',
      'uk': 'en-GB',
      'au': 'en-AU',
      'ca': 'en-CA',
    };
    return accentMap[accent] || 'en-US';
  };

  if (!isSupported) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <VolumeX className="h-4 w-4" />
        <span>Không hỗ trợ phát âm</span>
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={isPlaying ? handleStop : handlePronounce}
        disabled={isLoading || !phrase}
        className={cn('h-8 px-2', className)}
        aria-label={isPlaying ? `Dừng phát âm ${phrase}` : `Phát âm ${phrase}`}
        data-testid="compact-pronounce-button"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} data-testid="pronunciation-player">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={isPlaying ? handleStop : handlePronounce}
          disabled={isLoading || !phrase}
          className="flex items-center gap-2"
          aria-label={isPlaying ? `Dừng phát âm ${phrase}` : `Phát âm ${phrase}`}
          data-testid="pronounce-button"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {isPlaying ? 'Dừng' : 'Phát âm'}
        </Button>
        
        {showControls && (
          <span className="text-sm text-muted-foreground">
            {isPlaying ? 'Đang phát...' : phrase}
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive" role="alert" data-testid="pronunciation-error">
          {error}
        </div>
      )}

      {showControls && (
        <div className="text-xs text-muted-foreground">
          Giọng: {accent.toUpperCase()} | Tốc độ: {rate} | Cao độ: {pitch}
        </div>
      )}
    </div>
  );
};

export default PhrasePronunciationAudioPlayer;