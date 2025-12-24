import { useState, useEffect, useCallback, useRef } from 'react';
import type { WebSocketMessage, WebSocketResponse, Lobby } from '../types/lobby';

export interface UseWebSocketReturn {
  isConnected: boolean;
  lobbies: string[];
  currentLobby: Lobby | null;
  lobbyInfo: Lobby | null;
  username: string;
  userId: string | null;
  error: string | null;
  isLeavingLobby: boolean;
  isRegistered: boolean;
  registerUser: (username: string) => void;
  createLobby: (name: string, maxPlayers: number, isPublic: boolean) => void;
  joinLobby: (lobbyId: string) => void;
  leaveLobby: (lobbyId: string) => void;
  setReady: (lobbyId: string, ready: boolean) => void;
  startGame: (lobbyId: string) => void;
  getLobbyInfo: (lobbyId: string) => void;
  listLobbies: () => void;
  logout: () => void;
}

export function useWebSocket(url: string = 'ws://localhost:8080/ws'): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lobbies, setLobbies] = useState<string[]>([]);
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [lobbyInfo, setLobbyInfo] = useState<Lobby | null>(null);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLeavingLobby, setIsLeavingLobby] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Use ref to store current user ID and token for immediate access
  const currentUserIdRef = useRef<string | null>(null);
  const currentTokenRef = useRef<string | null>(null);

  // Update refs when userId or token changes
  useEffect(() => {
    currentUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    currentTokenRef.current = sessionToken;
  }, [sessionToken]);

  // Ref for listLobbies to avoid stale closure in onmessage handler
  const listLobbiesRef = useRef<() => void>(() => { });

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const registerUser = useCallback((username: string) => {
    const storedToken = localStorage.getItem(`lobby_token_${username}`);
    sendMessage({
      action: 'register_user',
      data: {
        username,
        token: storedToken || undefined,
      },
    });
  }, [sendMessage]);

  useEffect(() => {
    if (isConnected && !isRegistered) {
      const storedUsername = localStorage.getItem('lobby_username');
      if (storedUsername) {
        registerUser(storedUsername);
      }
    }
  }, [isConnected, isRegistered, registerUser]);

  const createLobby = useCallback((name: string, maxPlayers: number, isPublic: boolean) => {
    if (!userId || !sessionToken) {
      setError('User not registered');
      return;
    }
    sendMessage({
      action: 'create_lobby',
      data: {
        name,
        max_players: maxPlayers,
        public: isPublic,
        user_id: userId,
        token: sessionToken,
      },
    });
  }, [sendMessage, userId, sessionToken]);

  const joinLobby = useCallback((lobbyId: string) => {
    if (!userId || !sessionToken) {
      setError('User not registered');
      return;
    }
    sendMessage({
      action: 'join_lobby',
      data: {
        lobby_id: lobbyId,
        user_id: userId,
        token: sessionToken,
      },
    });
  }, [sendMessage, userId, sessionToken]);

  const leaveLobby = useCallback((lobbyId: string) => {
    if (!userId || !sessionToken) {
      setError('User not registered');
      return;
    }
    if (isLeavingLobby) {
      return;
    }

    setIsLeavingLobby(true);
    sendMessage({
      action: 'leave_lobby',
      data: {
        lobby_id: lobbyId,
        user_id: userId,
        token: sessionToken,
      },
    });
  }, [sendMessage, userId, sessionToken, isLeavingLobby]);

  const setReady = useCallback((lobbyId: string, ready: boolean) => {
    if (!userId || !sessionToken) {
      setError('User not registered');
      return;
    }
    sendMessage({
      action: 'set_ready',
      data: {
        lobby_id: lobbyId,
        user_id: userId,
        token: sessionToken,
        ready,
      },
    });
  }, [sendMessage, userId, sessionToken]);

  const startGame = useCallback((lobbyId: string) => {
    if (!userId || !sessionToken) {
      setError('User not registered');
      return;
    }
    sendMessage({
      action: 'start_game',
      data: {
        lobby_id: lobbyId,
        user_id: userId,
        token: sessionToken,
      },
    });
  }, [sendMessage, userId, sessionToken]);

  const getLobbyInfo = useCallback((lobbyId: string) => {
    if (!sessionToken) {
      setError('User not registered');
      return;
    }
    sendMessage({
      action: 'get_lobby_info',
      data: {
        lobby_id: lobbyId,
        token: sessionToken,
      },
    });
  }, [sendMessage, sessionToken]);

  const listLobbies = useCallback(() => {
    if (!sessionToken) {
      setError('User not registered');
      return;
    }
    sendMessage({
      action: 'list_lobbies',
      data: {
        token: sessionToken,
      },
    });
  }, [sendMessage, sessionToken]);

  // Keep listLobbiesRef updated
  useEffect(() => {
    listLobbiesRef.current = listLobbies;
  }, [listLobbies]);

  const logout = useCallback(() => {
    if (!userId) return;
    sendMessage({
      action: 'logout',
      data: { user_id: userId },
    });
    setUserId(null);
    setUsername('');
    setSessionToken(null);
    setIsRegistered(false);
    setCurrentLobby(null);
    setLobbyInfo(null);
    setLobbies([]);
    setError(null);
    // Clear stored credentials
    localStorage.removeItem('lobby_username');
    if (username) {
      localStorage.removeItem(`lobby_token_${username}`);
    }
  }, [sendMessage, userId, username]);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketResponse = JSON.parse(event.data);

        // Type guards for session events
        function isSessionEvent(data: any): data is { event: string; user_id: string; username: string } {
          return (
            typeof data === 'object' &&
            typeof data.event === 'string' &&
            typeof data.user_id === 'string' &&
            typeof data.username === 'string'
          );
        }

        if (isSessionEvent(data)) {
          if (data.event === 'session_created') {
            setUserId(data.user_id);
            setUsername(data.username);
            setIsRegistered(true);
            setError(null);
            localStorage.setItem('lobby_username', data.username);
          }
          if (data.event === 'session_reconnected') {
            setUserId(data.user_id);
            setUsername(data.username);
            setIsRegistered(true);
            setError(null);
          }
          if (data.event === 'session_removed') {
            setUserId(null);
            setUsername('');
            setSessionToken(null);
            setIsRegistered(false);
            localStorage.removeItem('lobby_username');
            if (username) {
              localStorage.removeItem(`lobby_token_${username}`);
            }
          }
          return;
        }

        // Type guard for action-based responses
        function hasAction(data: any): data is { action: string } {
          return typeof data === 'object' && typeof data.action === 'string';
        }

        if (hasAction(data)) {
          switch (data.action) {
            case 'user_registered':
              setUserId(data.user_id);
              setUsername(data.username);
              setSessionToken(data.token);
              setIsRegistered(true);
              setError(null);
              localStorage.setItem('lobby_username', data.username);
              localStorage.setItem(`lobby_token_${data.username}`, data.token);
              currentUserIdRef.current = data.user_id;
              currentTokenRef.current = data.token;
              break;
            case 'left_lobby':
              setIsLeavingLobby(false);
              setCurrentLobby(null);
              setError(null);
              if (sessionToken) {
                listLobbies();
              }
              break;
            case 'lobby_state':
              setIsLeavingLobby(false);
              const currentPlayerInLobby = (data as any).players && (data as any).players.some((p: any) =>
                p.user_id === currentUserIdRef.current || p.user_id === userId || p.username === username
              );

              if (!currentPlayerInLobby) {
                setCurrentLobby(null);
              } else {
                setCurrentLobby({
                  id: data.lobby_id,
                  name: data.lobby_id,
                  maxPlayers: 4,
                  players: (data as any).players,
                  state: data.state as 'waiting' | 'in_game' | 'finished',
                  metadata: data.metadata,
                });
                setError(null);
              }
              break;
            case 'lobby_info':
              setLobbyInfo({
                id: data.lobby_id,
                name: data.name,
                maxPlayers: data.max_players,
                players: (data as any).players,
                state: data.state as 'waiting' | 'in_game' | 'finished',
                metadata: {},
              });
              setError(null);
              break;
            case 'lobby_list':
              setLobbies(data.lobbies);
              setError(null);
              break;
            case 'lobby_closed':
              // Host left the lobby - close it
              setCurrentLobby(null);
              setError(data.message || 'The host has left the lobby');
              if (currentTokenRef.current) {
                listLobbiesRef.current();
              }
              break;
            case 'error':
              setIsLeavingLobby(false);
              setError(data.message);
              switch (data.code) {
                case 'USER_NOT_FOUND':
                case 'USER_INACTIVE':
                case 'INVALID_TOKEN':
                case 'UNAUTHORIZED':
                  setUserId(null);
                  setUsername('');
                  setSessionToken(null);
                  setIsRegistered(false);
                  setCurrentLobby(null);
                  setLobbyInfo(null);
                  setLobbies([]);
                  localStorage.removeItem('lobby_username');
                  if (username) {
                    localStorage.removeItem(`lobby_token_${username}`);
                  }
                  break;
                case 'LOBBY_NOT_FOUND':
                case 'PLAYER_NOT_IN_LOBBY':
                  setCurrentLobby(null);
                  break;
              }
              break;
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
        setError('Invalid message format');
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
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
    lobbyInfo,
    username,
    userId,
    error,
    isLeavingLobby,
    isRegistered,
    registerUser,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    startGame,
    getLobbyInfo,
    listLobbies,
    logout,
  };
} 