import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@/config/env';
import { useAuth } from './useAuth';

export interface ConversationState {
  sessionId: string | null;
  state: string;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useConversation = () => {
  const { user } = useAuth();
  const [conversationState, setConversationState] = useState<ConversationState>({
    sessionId: null,
    state: '',
    isActive: false,
    isLoading: false,
    error: null,
  });

  /**
   * Start a new conversation session
   */
  const startSession = useCallback(async (): Promise<string> => {
    setConversationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/conversation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start conversation');
      }

      const data = await response.json();
      
      setConversationState({
        sessionId: data.sessionId,
        state: data.state,
        isActive: true,
        isLoading: false,
        error: null,
      });

      return data.spokenText;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start conversation';
      setConversationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isActive: false,
      }));
      throw err;
    }
  }, [user]);

  /**
   * Process a user turn (send utterance and get response)
   */
  const processTurn = useCallback(async (utterance: string): Promise<string> => {
    if (!conversationState.sessionId) {
      throw new Error('No active session');
    }

    setConversationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/conversation/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          sessionId: conversationState.sessionId,
          utterance,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process turn');
      }

      const data = await response.json();

      setConversationState(prev => ({
        ...prev,
        state: data.state,
        isLoading: false,
        isActive: data.expectedNext !== 'session_end',
      }));

      return data.spokenText;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process turn';
      setConversationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, [conversationState.sessionId, user]);

  /**
   * End the current session
   */
  const endSession = useCallback(() => {
    setConversationState({
      sessionId: null,
      state: '',
      isActive: false,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...conversationState,
    startSession,
    processTurn,
    endSession,
  };
};

