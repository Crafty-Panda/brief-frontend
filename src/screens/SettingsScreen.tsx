import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import BriefLogo from '@/components/BriefLogo';
import { ChevronLeft, Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { user, signOut } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('brief-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('brief-theme', 'light');
    }
  }, [isDark]);

  const handleSignOut = () => {
    signOut();
    // After sign out, the auth state change will redirect to onboarding
  };

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
        {/* Account section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-brief-text-tertiary uppercase tracking-wide mb-4">
            Account
          </h2>

          <div className="p-4 rounded-xl bg-card">
            <p className="text-foreground mb-1">{user?.email || 'Connected'}</p>
            <p className="text-sm text-brief-text-tertiary">Gmail read-only access</p>
          </div>
        </section>

        {/* Appearance section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-brief-text-tertiary uppercase tracking-wide mb-4">
            Appearance
          </h2>

          <button
            className="w-full flex items-center justify-between p-4 rounded-xl bg-card hover:bg-muted transition-colors"
            onClick={() => setIsDark(!isDark)}
          >
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="w-5 h-5 text-brief-accent" />
              ) : (
                <Sun className="w-5 h-5 text-brief-accent" />
              )}
              <span className="text-foreground">{isDark ? 'Dark mode' : 'Light mode'}</span>
            </div>
          </button>
        </section>

        {/* About section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-brief-text-tertiary uppercase tracking-wide mb-4">
            About
          </h2>

          <div className="p-4 rounded-xl bg-card">
            <p className="text-brief-text-secondary text-sm leading-relaxed">
              Brief gives you a calm, spoken rundown of your inbox so you don't have to open it.
              We never send email, never schedule meetings, and stay quiet unless you ask.
              Your inbox remains untouched.
            </p>
          </div>
        </section>

        {/* Sign Out */}
        <section>
          <button
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-card hover:bg-muted transition-colors"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="text-destructive">Sign out</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default SettingsScreen;
