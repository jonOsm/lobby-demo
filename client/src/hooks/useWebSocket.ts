import { useState, useEffect, useCallback, useRef } from 'react';
import type { WebSocketMessage, WebSocketResponse, Lobby, Player } from '../types/lobby';

export interface UseWebSocketReturn {
  isConnected: boolean;
  lobbies: string[];
  currentLobby: Lobby | null;
  username: string;
  error: string | null;
  createLobby: (name: string, maxPlayers: number, isPublic: boolean, creatorUsername: string) => void;
  joinLobby: (lobbyId: string, username: string) => void;
  leaveLobby: (lobbyId: string, username: string) => void;
  setReady: (lobbyId: string, username: string, ready: boolean) => void;
  listLobbies: () => void;
  setUsername: (username: string) => void;
}

export function useWebSocket(url: string = 'ws://localhost:8080/ws'): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lobbies, setLobbies] = useState<string[]>([]);
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const createLobby = useCallback((name: string, maxPlayers: number, isPublic: boolean, creatorUsername: string) => {
    sendMessage({
      action: 'create_lobby',
      name,
      max_players: maxPlayers,
      public: isPublic,
    });
    // After creating the lobby, automatically join it
    setTimeout(() => {
      sendMessage({
        action: 'join_lobby',
        lobby_id: name,
        username: creatorUsername,
      });
    }, 100);
  }, [sendMessage]);

  const joinLobby = useCallback((lobbyId: string, username: string) => {
    sendMessage({
      action: 'join_lobby',
      lobby_id: lobbyId,
      username,
    });
  }, [sendMessage]);

  const leaveLobby = useCallback((lobbyId: string, username: string) => {
    sendMessage({
      action: 'leave_lobby',
      lobby_id: lobbyId,
      username,
    });
  }, [sendMessage]);

  const setReady = useCallback((lobbyId: string, username: string, ready: boolean) => {
    sendMessage({
      action: 'set_ready',
      lobby_id: lobbyId,
      username,
      ready,
    });
  }, [sendMessage]);

  const listLobbies = useCallback(() => {
    sendMessage({ action: 'list_lobbies' });
  }, [sendMessage]);

  useEffect(() => {
    console.log('Attempting to connect to WebSocket at:', url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket connected successfully');
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketResponse = JSON.parse(event.data);
        console.log('Received:', data);

        switch (data.action) {
          case 'lobby_created':
          case 'lobby_state':
            setCurrentLobby({
              id: data.lobby_id,
              name: data.lobby_id, // Using lobby_id as name for now
              maxPlayers: 4, // Default, could be enhanced
              players: data.players,
              state: data.state as 'waiting' | 'in_game' | 'finished',
              metadata: data.metadata,
            });
            setError(null);
            break;

          case 'lobby_list':
            setLobbies(data.lobbies);
            setError(null);
            break;

          case 'error':
            setError(data.message);
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
        setError('Invalid message format');
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.error('WebSocket readyState:', ws.readyState);
      setError('Connection error');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return {
    isConnected,
    lobbies,
    currentLobby,
    username,
    error,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    listLobbies,
    setUsername,
  };
} 