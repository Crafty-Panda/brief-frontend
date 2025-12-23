import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import BriefLogo from '@/components/BriefLogo';
import { ChevronLeft, Check } from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [briefingMode, setBriefingMode] = useState<'manual' | 'scheduled'>('manual');
  const [scheduledTime, setScheduledTime] = useState('08:00');

  return (
    <div className="min-h-screen bg-background flex flex-col px-8 pt-safe-top pb-safe-bottom animate-fade-in">
      {/* Header */}
      <header className="pt-8 pb-6 flex items-center">
        <Button 
          variant="brief-ghost" 
          size="icon" 
          onClick={onBack}
          className="mr-4 -ml-2"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <BriefLogo size="md" />
      </header>
      
      {/* Settings content */}
      <main className="flex-1 py-4">
        {/* Briefing section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-brief-text-tertiary uppercase tracking-wide mb-4">
            Briefing
          </h2>
          
          <div className="space-y-3">
            <button
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                briefingMode === 'manual' 
                  ? 'bg-brief-accent-soft' 
                  : 'bg-card hover:bg-muted'
              }`}
              onClick={() => setBriefingMode('manual')}
            >
              <span className="text-brief-text-primary">Manual only</span>
              {briefingMode === 'manual' && (
                <Check className="w-5 h-5 text-brief-accent" />
              )}
            </button>
            
            <button
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                briefingMode === 'scheduled' 
                  ? 'bg-brief-accent-soft' 
                  : 'bg-card hover:bg-muted'
              }`}
              onClick={() => setBriefingMode('scheduled')}
            >
              <span className="text-brief-text-primary">Scheduled</span>
              {briefingMode === 'scheduled' && (
                <Check className="w-5 h-5 text-brief-accent" />
              )}
            </button>
            
            {briefingMode === 'scheduled' && (
              <div className="p-4 rounded-xl bg-card">
                <label className="text-sm text-brief-text-secondary mb-2 block">
                  Daily reminder at
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-transparent text-brief-text-primary text-lg font-medium focus:outline-none"
                />
              </div>
            )}
          </div>
        </section>
        
        {/* Permissions section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-brief-text-tertiary uppercase tracking-wide mb-4">
            Permissions
          </h2>
          
          <div className="p-4 rounded-xl bg-card flex items-center justify-between">
            <div>
              <p className="text-brief-text-primary mb-1">Gmail connected</p>
              <p className="text-sm text-brief-text-tertiary">Read-only access</p>
            </div>
            <Button variant="brief-ghost" size="sm">
              Disconnect
            </Button>
          </div>
        </section>
        
        {/* Privacy section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-brief-text-tertiary uppercase tracking-wide mb-4">
            Privacy
          </h2>
          
          <div className="space-y-3">
            <button className="w-full text-left p-4 rounded-xl bg-card hover:bg-muted transition-colors">
              <span className="text-brief-text-primary">Clear session history</span>
            </button>
            <button className="w-full text-left p-4 rounded-xl bg-card hover:bg-muted transition-colors">
              <span className="text-destructive">Delete my data</span>
            </button>
          </div>
        </section>
        
        {/* About section */}
        <section>
          <h2 className="text-sm font-medium text-brief-text-tertiary uppercase tracking-wide mb-4">
            About
          </h2>
          
          <div className="p-4 rounded-xl bg-card">
            <p className="text-brief-text-secondary text-sm leading-relaxed">
              Brief never sends email, never schedules meetings, and stays quiet unless you ask. 
              Your inbox remains untouched. We believe your attention belongs to you.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsScreen;
