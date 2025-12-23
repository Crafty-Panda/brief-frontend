import React from 'react';

interface AudioWaveformProps {
  isActive?: boolean;
  variant?: 'speaking' | 'listening';
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
  isActive = false, 
  variant = 'speaking' 
}) => {
  if (!isActive) {
    return (
      <div className="flex items-center justify-center w-20 h-20">
        <div className="w-4 h-4 rounded-full bg-brief-accent opacity-40" />
      </div>
    );
  }

  if (variant === 'listening') {
    return (
      <div className="flex items-center justify-center w-20 h-20">
        <div className="w-16 h-16 rounded-full bg-brief-accent-soft flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-brief-accent animate-breathe" />
        </div>
      </div>
    );
  }

  // Speaking waveform
  return (
    <div className="flex items-center justify-center gap-1 w-20 h-20">
      <div className="w-1 bg-brief-accent rounded-full animate-wave" style={{ height: '12px' }} />
      <div className="w-1 bg-brief-accent rounded-full animate-wave-delay-1" style={{ height: '16px' }} />
      <div className="w-1 bg-brief-accent rounded-full animate-wave-delay-2" style={{ height: '24px' }} />
      <div className="w-1 bg-brief-accent rounded-full animate-wave-delay-3" style={{ height: '16px' }} />
      <div className="w-1 bg-brief-accent rounded-full animate-wave-delay-4" style={{ height: '12px' }} />
    </div>
  );
};

export default AudioWaveform;
