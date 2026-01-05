import { useState, useCallback } from 'react';
import { useConversation as useElevenLabsConversation } from '@elevenlabs/react';
import { API_BASE_URL } from '@/config/env';
import { useAuth } from './useAuth';

export interface ConversationState {
  sessionId: string | null;      // Backend session ID
  agentId: string | null;        // ElevenLabs agent ID
  conversationId: string | null; // ElevenLabs conversation ID
  status: string;                // SDK status string
  isLoading: boolean;
  error: string | null;
}

/**
 * Frontend hook to:
 * 1) Create a backend session (/api/session/create)
 * 2) Connect to ElevenLabs agent via @elevenlabs/react useConversation
 */
export const useConversation = () => {
  const { user } = useAuth();
  const elevenConversation = useElevenLabsConversation();

  const [state, setState] = useState<ConversationState>({
    sessionId: null,
    agentId: null,
    conversationId: null,
    status: 'idle',
    isLoading: false,
    error: null,
  });

  /**
   * Step 1: Create backend session (returns sessionId + agentId)
   * Step 2: Start ElevenLabs conversation using the agentId
   */
  const startSession = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      // Create session on backend (initializes agent and returns agentId)
      console.log('Creating session on backend');
      const response = await fetch(`${API_BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const data = await response.json();
      if (!data.agentId) {
        throw new Error('Missing agentId from backend response');
      }
      console.log('Session created on backend', data);

      // Connect to ElevenLabs agent
      const conversationId = await elevenConversation.startSession({
        agentId: data.agentId,
        connectionType: 'webrtc',
        userId: user.id,
        metadata: { sessionId: data.sessionId },
      } as any); // Cast to any to avoid SDK type drift during integration

      setState(prev => ({
        ...prev,
        sessionId: data.sessionId,
        agentId: data.agentId,
        conversationId: conversationId || null,
        status: (elevenConversation as any)?.status ?? 'connected',
        isLoading: false,
        error: null,
      }));

      return { sessionId: data.sessionId as string, agentId: data.agentId as string, conversationId };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start conversation';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, [user, elevenConversation]);

  /**
   * Send a text message to the agent (text turn)
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text?.trim()) return;
      try {
        await (elevenConversation as any)?.sendUserMessage?.(text);
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    },
    [elevenConversation]
  );

  /**
   * End the ElevenLabs conversation and clear local state
   */
  const endSession = useCallback(async () => {
    try {
      await (elevenConversation as any)?.endSession?.();
    } catch (error) {
      console.warn('endSession warning:', error);
    }

    setState({
      sessionId: null,
      agentId: null,
      conversationId: null,
      status: 'idle',
      isLoading: false,
      error: null,
    });
  }, [elevenConversation]);

  return {
    ...state,
    sdkStatus: (elevenConversation as any)?.status ?? state.status,
    isSpeaking: (elevenConversation as any)?.isSpeaking ?? false,
    startSession,
    sendMessage,
    endSession,
    elevenConversation,
  };
};

