import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';
import OnboardingScreen from '@/screens/OnboardingScreen';
import HomeScreen from '@/screens/HomeScreen';
import BriefingScreen from '@/screens/BriefingScreen';
import DraftConfirmationScreen from '@/screens/DraftConfirmationScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { useAuth } from '@/hooks/useAuth';

type Screen = 'onboarding' | 'home' | 'briefing' | 'draft' | 'settings';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [lastChecked, setLastChecked] = useState<string | undefined>(undefined);
  const { isAuthenticated, isLoading } = useAuth();

  // Handle deep link auth callback for mobile
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => void } | null = null;

    const setupListener = async () => {
      listener = await CapacitorApp.addListener('appUrlOpen', (data) => {
        // Handle deep link: brief://auth?token=xxx&user=xxx
        const url = new URL(data.url);
        if (url.protocol === 'brief:' && url.hostname === 'auth') {
          const token = url.searchParams.get('token');
          const userParam = url.searchParams.get('user');

          if (token && userParam) {
            try {
              const user = JSON.parse(decodeURIComponent(userParam));
              localStorage.setItem('brief-token', token);
              localStorage.setItem('brief-user', JSON.stringify(user));
              localStorage.setItem('brief-onboarded', 'true');
              window.location.reload(); // Reload to pick up new auth state
            } catch (e) {
              console.error('Failed to parse deep link auth:', e);
            }
          }
        }
      });
    };

    setupListener();

    return () => {
      listener?.remove();
    };
  }, []);

  // Check auth state and set initial screen
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('onboarding');
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleOnboardingComplete = () => {
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

  // Show loading spinner while determining auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brief-accent animate-spin" />
      </div>
    );
  }

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
