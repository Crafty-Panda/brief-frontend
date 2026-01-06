import { useCallback, useRef, useState } from 'react';

interface TextToSpeechHook {
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  speakChunk: (chunk: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Hook for browser Text-to-Speech API
 * Supports streaming chunks that are queued and spoken in order
 */
export const useTextToSpeech = (): TextToSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    while (queueRef.current.length > 0) {
      const chunk = queueRef.current.shift();
      if (!chunk) continue;

      await new Promise<void>((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          utteranceRef.current = utterance;
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
          resolve();
        };

        utterance.onerror = (event) => {
          setIsSpeaking(false);
          utteranceRef.current = null;
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        window.speechSynthesis.speak(utterance);
      });
    }

    isProcessingQueueRef.current = false;
  }, []);

  const speakChunk = useCallback((chunk: string) => {
    if (!chunk || chunk.trim().length === 0) return;
    
    // Add chunk to queue
    queueRef.current.push(chunk.trim());
    
    // Start processing queue if not already processing
    if (!isProcessingQueueRef.current) {
      processQueue();
    }
  }, [processQueue]);

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Stop any current speech and clear queue
      window.speechSynthesis.cancel();
      queueRef.current = [];
      isProcessingQueueRef.current = false;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        utteranceRef.current = utterance;
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    queueRef.current = [];
    isProcessingQueueRef.current = false;
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, []);

  return {
    isSpeaking,
    speak,
    speakChunk,
    stop,
    pause,
    resume,
  };
};

