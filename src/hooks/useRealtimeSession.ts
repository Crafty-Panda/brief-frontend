/**
 * useRealtimeSession Hook
 * 
 * Manages WebSocket connection to chat supervisor backend
 * - Handles session creation
 * - Sends/receives messages
 * - Manages connection state
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL, WS_BASE_URL,  } from '@/config/env';

interface UseRealtimeSessionConfig {
  onMessage?: (message: string) => void;
  onError?: (error: string) => void;
}

interface RealtimeSessionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useRealtimeSession(config: UseRealtimeSessionConfig = {}) {
  const { toast } = useToast();
  const [state, setState] = useState<RealtimeSessionState>({
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
      const sessionResponse = await fetch(`${API_BASE_URL}/api/realtime/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        }
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const { sessionId } = await sessionResponse.json();
      sessionIdRef.current = sessionId;

      // Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${WS_BASE_URL}/api/realtime/chat/${sessionId}`;

      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true, isLoading: false }));
      };
      console.log('connected to websocket');

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'greeting' || message.type === 'response') {
          config.onMessage?.(message.content);
        } else if (message.type === 'error') {
          const errorMsg = message.content;
          setState(prev => ({ ...prev, error: errorMsg }));
          config.onError?.(errorMsg);
        }
      };

      ws.onerror = (error) => {
        const errorMsg = 'WebSocket connection error';
        setState(prev => ({ ...prev, error: errorMsg }));
        config.onError?.(errorMsg);
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, isConnected: false }));
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
