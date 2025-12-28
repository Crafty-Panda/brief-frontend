import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import AudioWaveform from '@/components/AudioWaveform';
import { Pause, Play, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
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
  const realtime = useRealtimeSession({
    onMessage: (message) => {
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
      // Speak the response
      setState('speaking');
      textToSpeech.speak(message).then(() => {
        setState('listening');
        speechRecognition.startListening();
      });
    },
    onError: (error) => {
      setState('error');
      console.error('Realtime error:', error);
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
      await realtime.connect();
      setState('listening');
    } catch (err: any) {
      setState('error');
      console.error('Failed to start session:', err);
    }
  };

  // Handle speech recognition - process when user stops speaking
  useEffect(() => {
    if (!speechRecognition.isListening && state === 'listening' && speechRecognition.finalTranscript) {
      const userMessage = speechRecognition.finalTranscript.trim();
      if (userMessage.length > 0) {
        handleUserInput(userMessage);
      }
    }
  }, [speechRecognition.isListening, speechRecognition.finalTranscript, state]);

  const handleUserInput = async (utterance: string) => {
    try {
      setState('processing');
      speechRecognition.stopListening();
      speechRecognition.resetTranscript();

      setMessages(prev => [...prev, { role: 'user', content: utterance }]);
      realtime.sendMessage(utterance);
    } catch (err: any) {
      setState('error');
      console.error('Error processing input:', err);
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
    textToSpeech.stop();
    speechRecognition.stopListening();
    realtime.disconnect();
    onEnd();
  };

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
      {/* Messages
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
      </div> */}

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
