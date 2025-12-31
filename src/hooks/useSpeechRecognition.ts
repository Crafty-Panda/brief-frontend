import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  finalTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Hook for browser Speech Recognition API (ASR)
 */
export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update final transcript when we have final results
      if (finalText) {
        const newFinalText = (finalTranscriptRef.current + ' ' + finalText).trim();
        finalTranscriptRef.current = newFinalText;
        setFinalTranscript(newFinalText);
        console.log('✅ Final transcript updated:', newFinalText);
      }
      
      // Show combined final + interim for real-time feedback
      const combinedTranscript = (finalTranscriptRef.current + ' ' + interimTranscript).trim();
      setTranscript(combinedTranscript);
      console.log('📝 Transcript update - final:', finalTranscriptRef.current, 'interim:', interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Keep the final transcript available
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    console.log('listening...');
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setFinalTranscript('');
      finalTranscriptRef.current = '';
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        // Already started or other error
        console.error('Failed to start recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

