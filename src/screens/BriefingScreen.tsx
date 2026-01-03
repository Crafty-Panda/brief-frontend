import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import AudioWaveform from '@/components/AudioWaveform';
import { Pause, Play, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';

interface BriefingScreenProps {
  onEnd: () => void;
  onDraftCreated?: () => void;
}

type BriefingState = 'idle' | 'connecting' | 'speaking' | 'listening' | 'processing' | 'error';

const BriefingScreen: React.FC<BriefingScreenProps> = ({ onEnd }) => {
  const [state, setState] = useState<BriefingState>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const hasStartedRef = useRef(false);

  const speechRecognition = useSpeechRecognition();
  const textToSpeech = useTextToSpeech();
  const streamingMessageRef = useRef<string>('');
  const isStreamingRef = useRef<boolean>(false);
  const lastAssistantIndexRef = useRef<number>(-1);
  const uiUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChunksRef = useRef<string>('');

  const session = useSession({
    onChunk: (chunk: string) => {
      // Handle streaming chunks - accumulate and speak immediately
      console.log('📨 Received chunk:', chunk);
      streamingMessageRef.current += chunk;
      pendingChunksRef.current += chunk;
      isStreamingRef.current = true;
      
      // Transition to speaking state when streaming starts
      setState(prevState => {
        if (prevState === 'connecting' || prevState === 'processing') {
          return 'speaking';
        }
        return prevState;
      });
      
      // Speak chunk immediately as it arrives
      if (chunk.trim().length > 0) {
        textToSpeech.speakChunk(chunk);
      }
      
      // Throttle UI updates to match speech pace
      // Calculate delay based on chunk size - smaller chunks update faster, larger ones slower
      // Average speech rate is ~150 words/min = ~2.5 words/sec = ~12.5 chars/sec
      // So we update UI roughly every 100-200ms depending on chunk size
      const chunkLength = chunk.length;
      const baseDelay = 1000; // Base delay in ms
      const delay = Math.min(baseDelay + (chunkLength * 5), 200); // Max 200ms delay
      
      if (uiUpdateTimeoutRef.current) {
        clearTimeout(uiUpdateTimeoutRef.current);
      }
      
      uiUpdateTimeoutRef.current = setTimeout(() => {
        // Update UI with accumulated message
        setMessages(prev => {
          if (lastAssistantIndexRef.current >= 0 && lastAssistantIndexRef.current < prev.length) {
            // Update existing streaming message
            const updated = [...prev];
            updated[lastAssistantIndexRef.current] = {
              role: 'assistant',
              content: streamingMessageRef.current
            };
            return updated;
          } else {
            // Create new message
            lastAssistantIndexRef.current = prev.length;
            return [...prev, { role: 'assistant', content: streamingMessageRef.current }];
          }
        });
        pendingChunksRef.current = '';
      }, delay);
    },
    onMessage: (message) => {
      // Handle final complete message (after streaming or non-streaming)
      console.log('📨 Received final message from session:', message);
      
      // Clear any pending UI update timeout
      if (uiUpdateTimeoutRef.current) {
        clearTimeout(uiUpdateTimeoutRef.current);
        uiUpdateTimeoutRef.current = null;
      }
      
      if (isStreamingRef.current) {
        // Final response after streaming - chunks have already been spoken
        const finalMessage = streamingMessageRef.current || message;
        streamingMessageRef.current = '';
        isStreamingRef.current = false;
        
        // Update final message in UI
        setMessages(prev => {
          if (lastAssistantIndexRef.current >= 0 && lastAssistantIndexRef.current < prev.length) {
            const updated = [...prev];
            updated[lastAssistantIndexRef.current] = {
              role: 'assistant',
              content: finalMessage
            };
            return updated;
          }
          return [...prev, { role: 'assistant', content: finalMessage }];
        });
        lastAssistantIndexRef.current = -1;
        
        // Wait for TTS queue to finish, then transition to listening
        // Since chunks were already spoken, we just need to wait for the queue to empty
        const checkTTSComplete = setInterval(() => {
          if (!textToSpeech.isSpeaking) {
            clearInterval(checkTTSComplete);
            setState(prevState => {
              if (prevState !== 'error') {
                return 'listening';
              }
              return prevState;
            });
            speechRecognition.startListening();
          }
        }, 100);
        
        // Fallback timeout in case TTS doesn't properly signal completion
        setTimeout(() => {
          clearInterval(checkTTSComplete);
          setState(prevState => {
            if (prevState !== 'error') {
              return 'listening';
            }
            return prevState;
          });
          speechRecognition.startListening();
        }, 5000);
      } else {
        // Regular non-streaming message
        setMessages(prev => [...prev, { role: 'assistant', content: message }]);
        
        // Transition from connecting to speaking when greeting arrives
        setState(prevState => {
          if (prevState === 'connecting') {
            return 'speaking';
          }
          return 'speaking';
        });
        
        // Speak the response
        textToSpeech.speak(message).then(() => {
          setState(prevState => {
            if (prevState !== 'error') {
              return 'listening';
            }
            return prevState;
          });
          speechRecognition.startListening();
        }).catch((err) => {
          console.error('TTS error:', err);
          setState('error');
        });
      }
    },
    onError: (error) => {
      console.error('Session error:', error);
      setState('error');
    }
  });
  const { user } = useAuth();

  // Start session on mount
  useEffect(() => {
    if (!hasStartedRef.current && user?.id) {
      hasStartedRef.current = true;
      handleStartSession();
    }
  }, [user?.id]);

  const handleStartSession = async () => {
    try {
      setState('connecting');
      await session.connect();
      // Don't change state - wait for greeting/summary from server
    } catch (err: any) {
      setState('error');
      console.error('Failed to start session:', err);
    }
  };

  // Track previous final transcript to detect changes
  const prevFinalTranscriptRef = useRef<string>('');
  const processingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle speech recognition - process when we get a final transcript
  useEffect(() => {
    const currentFinalTranscript = speechRecognition.finalTranscript;
    
    console.log('🔍 Speech recognition effect:', {
      isListening: speechRecognition.isListening,
      state,
      finalTranscript: currentFinalTranscript,
      transcript: speechRecognition.transcript,
      prevFinalTranscript: prevFinalTranscriptRef.current,
      isProcessing: processingRef.current
    });

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Process when:
    // 1. We're in listening state
    // 2. We have a final transcript that's different from what we've already processed
    // 3. We're not already processing
    if (
      state === 'listening' && 
      currentFinalTranscript && 
      currentFinalTranscript.trim().length > 0 &&
      currentFinalTranscript !== prevFinalTranscriptRef.current &&
      !processingRef.current
    ) {
      console.log('⏳ Setting debounce timeout for:', currentFinalTranscript);
      
      // Debounce: wait a moment to see if more speech comes in
      debounceTimeoutRef.current = setTimeout(() => {
        // Double-check conditions after timeout
        const stillListening = state === 'listening';
        const transcriptUnchanged = currentFinalTranscript === speechRecognition.finalTranscript;
        
        console.log('⏰ Debounce timeout fired:', {
          stillListening,
          transcriptUnchanged,
          currentFinalTranscript,
          currentState: state
        });
        
        if (stillListening && transcriptUnchanged && !processingRef.current) {
          const userMessage = currentFinalTranscript.trim();
          console.log('✅ Processing user input:', userMessage);
          
          processingRef.current = true;
          prevFinalTranscriptRef.current = currentFinalTranscript;
          
          handleUserInput(userMessage).finally(() => {
            processingRef.current = false;
          });
        }
        
        debounceTimeoutRef.current = null;
      }, 800); // Wait 800ms of silence before processing
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [speechRecognition.finalTranscript, state]);

  const handleUserInput = async (utterance: string) => {
    try {
      console.log('🔄 handleUserInput called with:', utterance);
      setState('processing');
      speechRecognition.stopListening();
      
      // Add user message to UI
      setMessages(prev => [...prev, { role: 'user', content: utterance }]);
      
      // Send to backend
      session.sendMessage(utterance);
      
      // Reset transcript after a brief delay to allow UI update
      setTimeout(() => {
        speechRecognition.resetTranscript();
        prevFinalTranscriptRef.current = '';
      }, 100);
    } catch (err: any) {
      setState('error');
      console.error('Error processing input:', err);
      processingRef.current = false;
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      if (state === 'speaking') {
        textToSpeech.resume();
      } else if (state === 'listening') {
        speechRecognition.startListening();
      }
    } else {
      setIsPaused(true);
      if (state === 'speaking') {
        textToSpeech.pause();
      } else if (state === 'listening') {
        speechRecognition.stopListening();
      }
    }
  };

  const handleEnd = () => {
    // Clear any pending UI update timeout
    if (uiUpdateTimeoutRef.current) {
      clearTimeout(uiUpdateTimeoutRef.current);
      uiUpdateTimeoutRef.current = null;
    }
    textToSpeech.stop();
    speechRecognition.stopListening();
    session.disconnect();
    onEnd();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uiUpdateTimeoutRef.current) {
        clearTimeout(uiUpdateTimeoutRef.current);
      }
    };
  }, []);

  const getStatusText = () => {
    if (state === 'error') return 'Connection error';
    if (isPaused) return 'Paused';
    
    switch (state) {
      case 'connecting':
        return 'Connecting...';
      case 'speaking':
        return 'Brief is speaking';
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'idle':
        return 'Starting...';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 animate-fade-in">
      Messages
      <div className="w-full max-w-md mb-8 h-48 overflow-y-auto rounded-lg bg-slate-50 p-4 border border-slate-200">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 p-2 rounded ${
              msg.role === 'user'
                ? 'bg-blue-100 text-blue-900 ml-8'
                : 'bg-slate-100 text-slate-900 mr-8'
            }`}
          >
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
        {speechRecognition.finalTranscript && (
          <div className="mb-3 p-2 rounded bg-slate-100 text-slate-700 italic ml-8">
            <p className="text-sm">{speechRecognition.finalTranscript}</p>
          </div>
        )}
      </div>

      {/* Audio visualization */}
      <div className="mb-8">
        <AudioWaveform 
          isActive={!isPaused && (state === 'listening' || state === 'speaking')} 
          variant={state === 'listening' ? 'listening' : 'speaking'} 
        />
      </div>
      
      {/* Status text */}
      <p className="text-lg text-brief-text-secondary mb-16 h-7 text-center">
        {getStatusText()}
      </p>
      
      {/* Controls */}
      <div className="flex items-center gap-6">
        <Button
          variant="brief-secondary"
          size="icon"
          className="w-14 h-14 rounded-full"
          onClick={handlePauseResume}
          disabled={state === 'connecting' || state === 'processing' || state === 'error'}
        >
          {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
        </Button>
        
        <Button
          variant="brief"
          onClick={handleEnd}
          className="px-8"
        >
          {state === 'error' ? 'Close' : 'End session'}
        </Button>
      </div>
    </div>
  );
};

export default BriefingScreen;
