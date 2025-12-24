import { useState, useEffect, useCallback } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Configure your backend auth URL
const AUTH_BASE_URL = 'http://localhost:3000';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('brief-user');
    const storedToken = localStorage.getItem('brief-token');
    
    if (storedUser && storedToken) {
      setAuthState({
        user: JSON.parse(storedUser),
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Handle token from URL (for web redirects) or deep links (for mobile)
  useEffect(() => {
    const handleAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userParam = urlParams.get('user');
      
      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem('brief-token', token);
          localStorage.setItem('brief-user', JSON.stringify(user));
          localStorage.setItem('brief-onboarded', 'true');
          
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error('Failed to parse auth callback:', e);
        }
      }
    };

    handleAuthCallback();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const authUrl = `${AUTH_BASE_URL}/api/auth/google`;
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // For mobile: Open in-app browser
      // Your backend should redirect back with a deep link like: 
      // brief://auth?token=xxx&user=xxx
      try {
        await Browser.open({ 
          url: authUrl,
          windowName: '_blank',
          presentationStyle: 'popover'
        });
        
        // Listen for app URL open events (deep link callback)
        // This will be handled by Capacitor App plugin
      } catch (error) {
        console.error('Failed to open browser:', error);
      }
    } else {
      // For web: Use popup approach to avoid navigation issues
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Google Sign In',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );
      
      // Listen for message from popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== AUTH_BASE_URL) return;
        
        const { token, user } = event.data;
        if (token && user) {
          localStorage.setItem('brief-token', token);
          localStorage.setItem('brief-user', JSON.stringify(user));
          localStorage.setItem('brief-onboarded', 'true');
          
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
          
          popup?.close();
        }
        
        window.removeEventListener('message', handleMessage);
      };
      
      window.addEventListener('message', handleMessage);
      
      // Fallback: Check for popup close and URL params
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
        }
      }, 500);
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('brief-token');
    localStorage.removeItem('brief-user');
    localStorage.removeItem('brief-onboarded');
    
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem('brief-token');
  }, []);

  return {
    ...authState,
    signInWithGoogle,
    signOut,
    getToken,
  };
};
