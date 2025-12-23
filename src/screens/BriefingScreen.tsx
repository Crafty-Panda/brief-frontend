import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AudioWaveform from '@/components/AudioWaveform';
import { Pause, Play } from 'lucide-react';

interface BriefingScreenProps {
  onEnd: () => void;
  onDraftCreated?: () => void;
}

type BriefingState = 'speaking' | 'listening';

const BriefingScreen: React.FC<BriefingScreenProps> = ({ onEnd }) => {
  const [state, setState] = useState<BriefingState>('speaking');
  const [isPaused, setIsPaused] = useState(false);

  // Simulate switching between speaking and listening
  useEffect(() => {
    if (isPaused) return;

    const speakingDuration = 4000 + Math.random() * 3000; // 4-7 seconds
    const listeningDuration = 2000 + Math.random() * 2000; // 2-4 seconds

    const timeout = setTimeout(() => {
      setState(prev => prev === 'speaking' ? 'listening' : 'speaking');
    }, state === 'speaking' ? speakingDuration : listeningDuration);

    return () => clearTimeout(timeout);
  }, [state, isPaused]);

  const getStatusText = () => {
    if (isPaused) return 'Paused';
    switch (state) {
      case 'speaking':
        return 'Brief is speaking';
      case 'listening':
        return 'Listening...';
      default:
        return '';
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 animate-fade-in">
      {/* Audio visualization */}
      <div className="mb-8">
        <AudioWaveform 
          isActive={!isPaused} 
          variant={state === 'listening' ? 'listening' : 'speaking'} 
        />
      </div>
      
      {/* Status text */}
      <p className="text-lg text-brief-text-secondary mb-16 h-7">
        {getStatusText()}
      </p>
      
      {/* Controls */}
      <div className="flex items-center gap-6">
        <Button
          variant="brief-secondary"
          size="icon"
          className="w-14 h-14 rounded-full"
          onClick={handlePauseResume}
        >
          {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
        </Button>
        
        <Button
          variant="brief"
          onClick={onEnd}
          className="px-8"
        >
          End session
        </Button>
      </div>
    </div>
  );
};

export default BriefingScreen;
