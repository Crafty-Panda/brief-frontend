import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import AudioWaveform from '@/components/AudioWaveform';
import { Pause, Play } from 'lucide-react';
import { useConversation } from '@/hooks/useConversation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useAuth } from '@/hooks/useAuth';

interface BriefingScreenProps {
  onEnd: () => void;
  onDraftCreated?: () => void;
}

type BriefingState = 'idle' | 'speaking' | 'listening' | 'processing';

const BriefingScreen: React.FC<BriefingScreenProps> = ({ onEnd }) => {
  const [state, setState] = useState<BriefingState>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const conversation = useConversation();
  const speechRecognition = useSpeechRecognition();
  const textToSpeech = useTextToSpeech();
  const { user } = useAuth();
  // Start conversation session on mount
  useEffect(() => {
    if (!hasStartedRef.current && !conversation.isLoading && !conversation.isActive) {
      hasStartedRef.current = true;
      handleStartSession();
    }
  }, [user?.id, conversation.isLoading, conversation.isActive]);

  const handleStartSession = async () => {
    try {
      setState('processing');
      setError(null);
      
      const greeting = await conversation.startSession();
      
      setState('speaking');
      await textToSpeech.speak(greeting);
      
      // After greeting, start listening
      setState('listening');
      speechRecognition.startListening();
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
      setState('idle');
    }
  };

  // Handle speech recognition - process when user stops speaking
  useEffect(() => {
    // Process when recognition stops and we have a final transcript
    if (!speechRecognition.isListening && state === 'listening' && speechRecognition.finalTranscript) {
      const transcript = speechRecognition.finalTranscript.trim();
      if (transcript.length > 0 && !conversation.isLoading) {
        handleUserInput(transcript);
      }
    }
  }, [speechRecognition.isListening, speechRecognition.finalTranscript, state, conversation.isLoading]);

  const handleUserInput = async (utterance: string) => {
    try {
      setState('processing');
      speechRecognition.stopListening();
      speechRecognition.resetTranscript();

      const response = await conversation.processTurn(utterance);

      // Check if session ended
      if (!conversation.isActive) {
        setState('idle');
        await textToSpeech.speak(response);
        setTimeout(() => {
          onEnd();
        }, 1000);
        return;
      }

      // Speak the response
      setState('speaking');
      await textToSpeech.speak(response);

      // After response, listen again
      setState('listening');
      speechRecognition.startListening();
    } catch (err: any) {
      setError(err.message || 'Failed to process input');
      setState('listening');
      speechRecognition.startListening();
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
    conversation.endSession();
    onEnd();
  };

  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (isPaused) return 'Paused';
    if (conversation.isLoading || state === 'processing') return 'Processing...';
    
    switch (state) {
      case 'speaking':
        return 'Brief is speaking';
      case 'listening':
        return 'Listening...';
      case 'idle':
        return 'Starting...';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 animate-fade-in">
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
          disabled={state === 'idle' || state === 'processing'}
        >
          {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
        </Button>
        
        <Button
          variant="brief"
          onClick={handleEnd}
          className="px-8"
        >
          End session
        </Button>
      </div>
    </div>
  );
};

export default BriefingScreen;
