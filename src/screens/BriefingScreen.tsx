import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AudioWaveform from '@/components/AudioWaveform';
import { Pause, Play, RotateCcw } from 'lucide-react';

interface BriefingScreenProps {
  onEnd: () => void;
  onDraftCreated?: () => void;
}

type BriefingState = 'speaking' | 'listening' | 'paused';

const BriefingScreen: React.FC<BriefingScreenProps> = ({ onEnd }) => {
  const [state, setState] = useState<BriefingState>('speaking');
  const [isPaused, setIsPaused] = useState(false);

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

  const handleRepeatLast = () => {
    setState('speaking');
    setIsPaused(false);
  };

  const simulateStateChange = () => {
    // For demo purposes, toggle between speaking and listening
    setState(prev => prev === 'speaking' ? 'listening' : 'speaking');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 animate-fade-in">
      {/* Audio visualization */}
      <div className="mb-8" onClick={simulateStateChange}>
        <AudioWaveform 
          isActive={!isPaused} 
          variant={state === 'listening' ? 'listening' : 'speaking'} 
        />
      </div>
      
      {/* Status text */}
      <p className="text-lg text-brief-text-secondary mb-16 h-7">
        {getStatusText()}
      </p>
      
      {/* Primary controls */}
      <div className="flex items-center gap-6 mb-8">
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
      
      {/* Secondary controls */}
      <div className="flex items-center gap-6">
        <Button
          variant="brief-ghost"
          onClick={handleRepeatLast}
          className="text-sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Repeat last
        </Button>
        
        <Button
          variant="brief-ghost"
          onClick={simulateStateChange}
          className="text-sm"
        >
          What else?
        </Button>
      </div>
    </div>
  );
};

export default BriefingScreen;
