/**
 * useSession Hook
 * 
 * Manages WebSocket connection to chat supervisor backend
 * - Handles session creation
 * - Sends/receives messages
 * - Manages connection state
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL, WS_BASE_URL,  } from '@/config/env';

interface UseSessionConfig {
  onMessage?: (message: string) => void;
  onChunk?: (chunk: string) => void;
  onError?: (error: string) => void;
}

interface SessionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSession(config: UseSessionConfig = {}) {
  const { toast } = useToast();
  const [state, setState] = useState<SessionState>({
    isConnected: false,
    isLoading: false,
    error: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  /**
   * Initialize WebSocket connection
   */
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create session via REST API
      const currentUser = JSON.parse(localStorage.getItem('brief-user') || 'null');
      if (!currentUser?.id) throw new Error('Not authenticated');
      const sessionResponse = await fetch(`${API_BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        }
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }
      console.log('sessionResponse:', sessionResponse);

      const { sessionId } = await sessionResponse.json();
      sessionIdRef.current = sessionId;

      // Connect WebSocket
      // Note: Browser WebSocket API doesn't support custom headers, so we pass userId as query param
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${WS_BASE_URL}/api/session/${sessionId}/chat?userId=${currentUser.id}`;

      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true, isLoading: false }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📥 WebSocket message received:', message);
          
          // Handle streaming chunks - send to chunk handler if available, otherwise to message handler
          if (message.type === 'chunk') {
            if (config.onChunk) {
              config.onChunk(message.content);
            } else {
              config.onMessage?.(message.content);
            }
          }
          // Handle all response types: greeting, summary, response, error
          else if (message.type === 'greeting' || message.type === 'summary' || message.type === 'response') {
            config.onMessage?.(message.content);
          } else if (message.type === 'error') {
            const errorMsg = message.content;
            console.error('WebSocket error:', errorMsg);
            setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
            config.onError?.(errorMsg);
          } else {
            console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data);
          setState(prev => ({ ...prev, error: 'Failed to parse message', isLoading: false }));
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error event:', error);
        const errorMsg = 'WebSocket connection error';
        setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
        config.onError?.(errorMsg);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setState(prev => ({ ...prev, isConnected: false, isLoading: false }));
        
        // If closed unexpectedly (not by us), show error
        if (event.code !== 1000 && event.code !== 1001) {
          const errorMsg = `Connection closed unexpectedly (code: ${event.code})`;
          setState(prev => ({ ...prev, error: errorMsg }));
          config.onError?.(errorMsg);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
      config.onError?.(errorMsg);
      toast({
        title: 'Connection Error',
        description: errorMsg,
        variant: 'destructive'
      });
    }
  }, [config, toast]);

  /**
   * Send message via WebSocket
   */
  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setState(prev => ({ ...prev, error: 'Not connected' }));
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: message
    }));
  }, []);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'close' }));
      wsRef.current.close();
    }
    setState({
      isConnected: false,
      isLoading: false,
      error: null
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    connect,
    sendMessage,
    disconnect,
    sessionId: sessionIdRef.current
  };
}
