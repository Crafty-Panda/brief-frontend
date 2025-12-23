import React from 'react';
import { Button } from '@/components/ui/button';
import BriefLogo from '@/components/BriefLogo';

interface HomeScreenProps {
  onStartBrief: () => void;
  onOpenSettings: () => void;
  lastChecked?: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onStartBrief, 
  onOpenSettings,
  lastChecked 
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col px-8 pt-safe-top pb-safe-bottom animate-fade-in">
      {/* Header */}
      <header className="pt-12 pb-8">
        <BriefLogo size="md" />
      </header>
      
      {/* Main content - centered */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-16">
        <Button 
          variant="brief-large" 
          onClick={onStartBrief}
          className="mb-4"
        >
          Start Brief
        </Button>
        
        <p className="text-sm text-brief-text-tertiary">
          About 5 minutes
        </p>
        
        {/* Status */}
        <div className="mt-16">
          <p className="text-sm text-brief-text-tertiary text-center">
            {lastChecked 
              ? `Last checked: ${lastChecked}`
              : 'No briefing today yet'
            }
          </p>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="pb-8 flex justify-center">
        <Button 
          variant="brief-text" 
          onClick={onOpenSettings}
        >
          Settings
        </Button>
      </footer>
    </div>
  );
};

export default HomeScreen;
