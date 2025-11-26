import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface SentencePronunciationAudioPlayerProps {
  sentence: string;
  onPronounce?: (sentence: string) => void;
  className?: string;
  accent?: 'us' | 'uk' | 'au' | 'ca';
  rate?: number;
  pitch?: number;
  volume?: number;
  autoPlay?: boolean;
}

/**
 * Sentence Pronunciation Audio Player Component
 * Phát âm câu với các tùy chọn tùy chỉnh và hiển thị trạng thái
 */
export const SentencePronunciationAudioPlayer: React.FC<SentencePronunciationAudioPlayerProps> = ({
  sentence,
  onPronounce,
  className,
  accent = 'us',
  rate = 0.8,
  pitch = 1,
  volume = 1,
  autoPlay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check speech synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      setIsSupported(true);
    } else {
      setIsSupported(false);
      setError('Trình duyệt của bạn không hỗ trợ phát âm');
    }
  }, []);

  // Auto play if enabled
  useEffect(() => {
    if (autoPlay && sentence && isSupported) {
      handlePronounce();
    }
  }, [autoPlay, sentence, isSupported]);

  const handlePronounce = useCallback(async () => {
    if (!isSupported || !speechSynthesisRef.current) {
      setError('Tính năng phát âm không khả dụng');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      // Cancel any ongoing speech
      speechSynthesisRef.current.cancel();
      
      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      
      // Set voice based on accent preference
      const voices = speechSynthesisRef.current.getVoices();
      const preferredVoice = voices.find(voice => {
        const langCode = accent === 'uk' ? 'en-GB' : 'en-US';
        return voice.lang.includes(langCode);
      });
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
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
        setError('Không thể phát âm. Vui lòng thử lại.');
        console.error('Speech synthesis error:', event);
      };
      
      utteranceRef.current = utterance;
      
      // Call custom onPronounce if provided
      if (onPronounce) {
        onPronounce(sentence);
      } else {
        // Use built-in speech synthesis
        speechSynthesisRef.current.speak(utterance);
      }
    } catch (error) {
      setIsLoading(false);
      setError('Không thể phát âm. Vui lòng thử lại.');
      console.error('Pronunciation error:', error);
    }
  }, [sentence, rate, pitch, volume, accent, onPronounce, isSupported]);

  const handleStop = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsPlaying(false);
      setIsLoading(false);
      utteranceRef.current = null;
    }
  }, []);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isPlaying) {
        handleStop();
      } else {
        handlePronounce();
      }
    }
  }, [isPlaying, handlePronounce, handleStop]);

  if (!isSupported) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <VolumeX className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Phát âm không khả dụng</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={isPlaying ? handleStop : handlePronounce}
        onKeyDown={handleKeyPress}
        disabled={isLoading}
        className="h-8 px-3 min-w-[80px]"
        aria-label={isPlaying ? `Dừng phát âm câu` : `Phát âm câu`}
        title={isPlaying ? 'Dừng phát âm' : 'Phát âm câu'}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            <span className="text-xs">Đang phát...</span>
          </>
        ) : isPlaying ? (
          <>
            <VolumeX className="h-4 w-4 mr-1" />
            <span className="text-xs">Dừng</span>
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4 mr-1" />
            <span className="text-xs">Phát âm</span>
          </>
        )}
      </Button>
      
      {error && (
        <span 
          className="text-xs text-destructive" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default SentencePronunciationAudioPlayer;