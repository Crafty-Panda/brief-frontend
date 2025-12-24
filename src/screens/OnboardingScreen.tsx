import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import BriefLogo from '@/components/BriefLogo';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface OnboardingScreenProps {
  onContinue: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onContinue }) => {
  const { signInWithGoogle, isAuthenticated } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // If authenticated, trigger continue
  React.useEffect(() => {
    if (isAuthenticated) {
      onContinue();
    }
  }, [isAuthenticated, onContinue]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 animate-fade-in">
      <div className="flex flex-col items-center text-center max-w-sm">
        <BriefLogo size="lg" className="mb-12" />
        
        <p className="text-xl text-brief-text-secondary leading-relaxed mb-16 font-light">
          Brief gives you a calm, spoken rundown of your inbox so you don't have to open it.
        </p>
        
        <Button 
          variant="brief-large" 
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full mb-6"
        >
          {isSigningIn ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Continue with Gmail'
          )}
        </Button>
        
        <p className="text-sm text-brief-text-tertiary leading-relaxed">
          Read-only access. Brief never sends email without permission.
        </p>
      </div>
    </div>
  );
};

export default OnboardingScreen;
