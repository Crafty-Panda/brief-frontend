import { useState, useCallback, useRef, useEffect } from 'react';
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
 * Retry helper with exponential backoff
 */
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 500
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on authentication or validation errors
      if (error.message?.includes('Not authenticated') || 
          error.message?.includes('Missing agentId') ||
          error.message?.includes('Failed to create session')) {
        throw error;
      }
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Connection attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Frontend hook to:
 * 1) Create a backend session (/api/session/create)
 * 2) Connect to ElevenLabs agent via @elevenlabs/react useConversation
 */
export const useConversation = () => {
  const { user } = useAuth();
  const elevenConversation = useElevenLabsConversation({
    onError: (error) => {
      console.error('ElevenLabs connection error:', error);
      const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Connection error';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    },
    onConnect: () => {
      console.log('ElevenLabs connected');
      setState(prev => ({
        ...prev,
        status: 'connected',
        error: null,
        isLoading: false,
      }));
    },
    onDisconnect: (details) => {
      console.log('ElevenLabs disconnected', details);
      setState(prev => ({
        ...prev,
        status: 'disconnected',
      }));
    },
    onStatusChange: (status) => {
      console.log('ElevenLabs status changed:', status);
      setState(prev => ({
        ...prev,
        status: String(status),
      }));
    },
  });

  const [state, setState] = useState<ConversationState>({
    sessionId: null,
    agentId: null,
    conversationId: null,
    status: 'idle',
    isLoading: false,
    error: null,
  });

  const isConnectingRef = useRef(false);

  /**
   * Step 1: Create backend session (returns sessionId + agentId)
   * Step 2: Start ElevenLabs conversation using the agentId with retry logic
   */
  const startSession = useCallback(async () => {
    // Prevent concurrent connection attempts
    if (isConnectingRef.current) {
      console.warn('Connection already in progress, skipping...');
      return;
    }

    // Clean up any existing session first
    try {
      const currentStatus = (elevenConversation as any)?.status;
      if (currentStatus && currentStatus !== 'idle' && currentStatus !== 'disconnected') {
        console.log('Cleaning up existing session before starting new one...');
        await (elevenConversation as any)?.endSession?.();
        // Wait a bit for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (cleanupError) {
      console.warn('Error during cleanup:', cleanupError);
    }

    isConnectingRef.current = true;
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

      // Connect to ElevenLabs agent with retry logic
      const connectToElevenLabs = async () => {
        // Small delay to ensure backend agent is fully ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const conversationId = await elevenConversation.startSession({
          agentId: data.agentId,
          connectionType: 'webrtc',
          userId: user.id,
          metadata: { sessionId: data.sessionId },
        } as any); // Cast to any to avoid SDK type drift during integration
        
        return conversationId;
      };

      const conversationId = await retryWithBackoff(connectToElevenLabs, 3, 500);
      console.log('Conversation started', conversationId);

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
      console.error('Failed to start session:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    } finally {
      isConnectingRef.current = false;
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
    isConnectingRef.current = false;
    
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

  // Sync state with SDK status (only update if different to avoid loops)
  useEffect(() => {
    const sdkStatus = (elevenConversation as any)?.status;
    if (sdkStatus && String(sdkStatus) !== state.status) {
      setState(prev => {
        // Only update if status actually changed
        if (String(sdkStatus) === prev.status) return prev;
        return {
          ...prev,
          status: String(sdkStatus),
        };
      });
    }
  }, [(elevenConversation as any)?.status]);

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

