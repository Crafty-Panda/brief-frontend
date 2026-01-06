import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import AudioWaveform from '@/components/AudioWaveform';
import { Loader2, Pause, Play } from 'lucide-react';
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/hooks/useAuth';

interface BriefingScreenProps {
  onEnd: () => void;
  onDraftCreated?: () => void;
}

type BriefingState = 'idle' | 'connecting' | 'connected' | 'error';

const BriefingScreen: React.FC<BriefingScreenProps> = ({ onEnd }) => {
  const [state, setState] = useState<BriefingState>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const conversation = useConversation();
  const { isSpeaking, sdkStatus, startSession, endSession } = conversation;
  const { user } = useAuth();
  const startedRef = useRef(false);

  // Start session on mount (only once per mount)
  useEffect(() => {
    if (!user?.id || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    const run = async () => {
      setState('connecting');
      try {
        console.log('Initializing Session');
        await startSession();
        if (!cancelled) setState('connected');
      } catch (err) {
        console.error('Failed to start conversation:', err);
        if (!cancelled) setState('error');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, startSession]);

  // Sync UI state with SDK status to stop spinner when connected
  useEffect(() => {
    if (sdkStatus === 'connected' && state === 'connecting') {
      setState('connected');
    }
  }, [sdkStatus, state]);

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  };

  const handleEnd = () => {
    endSession();
    onEnd();
  };

  const getStatusText = () => {
    if (state === 'error') return 'Connection error';
    if (isPaused) return 'Paused';
    
    switch (state) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'idle':
        return 'Starting...';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 animate-fade-in">
      {/* Messages */}
      {/* <div className="w-full max-w-md mb-8 h-48 overflow-y-auto rounded-lg bg-slate-50 p-4 border border-slate-200">
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
          isActive={!isPaused && (isSpeaking || state === 'connected')} 
          variant={isSpeaking ? 'speaking' : 'listening'} 
        />
      </div>
      
      {/* Status text */}
      <p className="text-lg text-brief-text-secondary mb-16 h-7 text-center flex items-center gap-2">
        {state === 'connecting' && <Loader2 className="w-4 h-4 animate-spin" />}
        {getStatusText()}
      </p>
      
      {/* Controls */}
      <div className="flex items-center gap-6">
        <Button
          variant="brief-secondary"
          size="icon"
          className="w-14 h-14 rounded-full"
          onClick={handlePauseResume}
          disabled={state === 'connecting' || state === 'error'}
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
