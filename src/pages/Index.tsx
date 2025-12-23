import React, { useState, useEffect } from 'react';
import OnboardingScreen from '@/screens/OnboardingScreen';
import HomeScreen from '@/screens/HomeScreen';
import BriefingScreen from '@/screens/BriefingScreen';
import DraftConfirmationScreen from '@/screens/DraftConfirmationScreen';
import SettingsScreen from '@/screens/SettingsScreen';

type Screen = 'onboarding' | 'home' | 'briefing' | 'draft' | 'settings';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [lastChecked, setLastChecked] = useState<string | undefined>(undefined);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has completed onboarding (in real app, this would be persisted)
  useEffect(() => {
    const onboarded = localStorage.getItem('brief-onboarded');
    if (onboarded === 'true') {
      setHasCompletedOnboarding(true);
      setCurrentScreen('home');
    }
  }, []);

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('brief-onboarded', 'true');
    setCurrentScreen('home');
  };

  const handleStartBrief = () => {
    setCurrentScreen('briefing');
  };

  const handleEndBrief = () => {
    // Update last checked time
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    setLastChecked(`Today at ${timeString}`);
    setCurrentScreen('home');
  };

  const handleDraftCreated = () => {
    setCurrentScreen('draft');
  };

  const handleOpenGmail = () => {
    // In real app, this would open Gmail
    window.open('https://mail.google.com', '_blank');
    setCurrentScreen('home');
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleBackFromSettings = () => {
    setCurrentScreen('home');
  };

  const handleBackToBrief = () => {
    setCurrentScreen('briefing');
  };

  // Render current screen
  switch (currentScreen) {
    case 'onboarding':
      return <OnboardingScreen onContinue={handleOnboardingComplete} />;
    
    case 'home':
      return (
        <HomeScreen 
          onStartBrief={handleStartBrief}
          onOpenSettings={handleOpenSettings}
          lastChecked={lastChecked}
        />
      );
    
    case 'briefing':
      return (
        <BriefingScreen 
          onEnd={handleEndBrief}
          onDraftCreated={handleDraftCreated}
        />
      );
    
    case 'draft':
      return (
        <DraftConfirmationScreen 
          onOpenGmail={handleOpenGmail}
          onBackToBrief={handleBackToBrief}
        />
      );
    
    case 'settings':
      return <SettingsScreen onBack={handleBackFromSettings} />;
    
    default:
      return <HomeScreen onStartBrief={handleStartBrief} onOpenSettings={handleOpenSettings} />;
  }
};

export default Index;
