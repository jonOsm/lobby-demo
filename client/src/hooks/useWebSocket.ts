import { useState, useEffect, useCallback, useRef } from 'react';
import type { WebSocketMessage, WebSocketResponse, Lobby, Player } from '../types/lobby';

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
      console.log('📤 Sending message:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.log('❌ WebSocket not ready, message not sent:', message);
    }
  }, []);

  const registerUser = useCallback((username: string) => {
    // Check if we have a stored token for this username
    const storedToken = localStorage.getItem(`lobby_token_${username}`);

    sendMessage({
      action: 'register_user',
      data: {
        username,
        token: storedToken || undefined, // Include token if available for reconnection
      },
    });
  }, [sendMessage]);

  // Auto-reconnect and re-register if we have stored credentials
  useEffect(() => {
    if (isConnected && !isRegistered) {
      const storedUsername = localStorage.getItem('lobby_username');
      if (storedUsername) {
        console.log('🔄 Auto-reconnecting with stored username:', storedUsername);
        registerUser(storedUsername);
      }
    }
  }, [isConnected, isRegistered, registerUser]);

  const createLobby = useCallback((name: string, maxPlayers: number, isPublic: boolean) => {
    console.log('🔍 createLobby called with:', { name, maxPlayers, isPublic, userId, isRegistered });
    if (!userId || !sessionToken) {
      console.log('❌ No user ID or token available');
      setError('User not registered');
      return;
    }
    console.log('✅ Sending create_lobby with user ID:', userId);
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
    // Prevent multiple leave requests
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
    console.log('Connecting to WebSocket...');
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
            console.log(`🎉 Welcome, ${data.username}!`);
            console.log(`🎉 Session created for ${data.username}`);
            setUserId(data.user_id);
            setUsername(data.username);
            setIsRegistered(true);
            setError(null);
            localStorage.setItem('lobby_username', data.username);
          }
          if (data.event === 'session_reconnected') {
            console.log(`🔄 Reconnected as ${data.username}`);
            console.log(`🔄 Reconnected as ${data.username}`);
            setUserId(data.user_id);
            setUsername(data.username);
            setIsRegistered(true);
            setError(null);
          }
          if (data.event === 'session_removed') {
            console.log('SESSION_REMOVED EVENT HANDLER FIRED');
            console.trace('session_removed stack trace');
            console.log('🚪 You have been logged out.');
            console.log('🚪 Session removed, logging out.');
            setUserId(null);
            setUsername('');
            setSessionToken(null);
            setIsRegistered(false);
            // Clear stored credentials
            localStorage.removeItem('lobby_username');
            if (username) {
              localStorage.removeItem(`lobby_token_${username}`);
            }
            // Do NOT setError here to avoid duplicate error bubble
            // TODO: redirectToLogin();
          }
          return; // Don't process further if it's a session event
        }

        // Type guard for action-based responses
        function hasAction(data: any): data is { action: string } {
          return typeof data === 'object' && typeof data.action === 'string';
        }

        if (hasAction(data)) {
          switch (data.action) {
            case 'user_registered':
              console.log('🎉 User registered successfully:', { userId: data.user_id, username: data.username });
              setUserId(data.user_id);
              setUsername(data.username);
              setSessionToken(data.token); // Store the session token
              setIsRegistered(true);
              setError(null);
              // Store username and token for auto-reconnect
              localStorage.setItem('lobby_username', data.username);
              localStorage.setItem(`lobby_token_${data.username}`, data.token);
              // Update the ref immediately for use in subsequent messages
              currentUserIdRef.current = data.user_id;
              currentTokenRef.current = data.token;
              break;
            case 'left_lobby':
              // Reset leaving flag since we got a response
              setIsLeavingLobby(false);
              // Clear current lobby state to return to lobby list
              console.log('🚪 Successfully left lobby:', data.lobby_id);
              setCurrentLobby(null);
              setError(null);
              // Refresh lobby list only if we have a valid session
              if (sessionToken) {
                listLobbies();
              }
              break;
            case 'lobby_state':
              // Reset leaving flag since we got a response
              setIsLeavingLobby(false);
              // Debug log for userId and players
              console.log('DEBUG: userId:', userId, 'currentUserIdRef:', currentUserIdRef.current, 'username:', username, 'players:', (data as any).players);

              // Check if the current player is in the lobby
              // Use both userId and currentUserIdRef for robustness during reconnection
              const currentPlayerInLobby = (data as any).players && (data as any).players.some((p: any) => {
                const match = p.user_id === currentUserIdRef.current || p.user_id === userId || p.username === username;
                console.log('DEBUG: Checking player:', p, 'match:', match);
                return match;
              });

              console.log('DEBUG: currentPlayerInLobby:', currentPlayerInLobby);

              if (!currentPlayerInLobby) {
                // Player is no longer in the lobby, clear current lobby state
                console.log('DEBUG: Player not found in lobby, clearing current lobby');
                setCurrentLobby(null);
              } else {
                console.log('DEBUG: Player found in lobby, setting current lobby');
                setCurrentLobby({
                  id: data.lobby_id,
                  name: data.lobby_id, // Using lobby_id as name for now
                  maxPlayers: 4, // Default, could be enhanced
                  players: (data as any).players,
                  state: data.state as 'waiting' | 'in_game' | 'finished',
                  metadata: data.metadata,
                });
                console.log('DEBUG: setCurrentLobby called with', {
                  id: data.lobby_id,
                  name: data.lobby_id,
                  maxPlayers: 4,
                  players: (data as any).players,
                  state: data.state,
                  metadata: data.metadata,
                });
              }
              setError(null);
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
            case 'error':
              // Reset leaving flag since we got a response
              setIsLeavingLobby(false);
              setError(data.message);
              // Log error details for debugging
              if (data.details) {
                console.log('Error details:', data.details);
              }
              // Handle specific error codes
              switch (data.code) {
                case 'USER_NOT_FOUND':
                case 'USER_INACTIVE':
                case 'INVALID_TOKEN':
                case 'UNAUTHORIZED':
                  // User session issues - clear session and allow re-registration
                  console.log('User session issue:', data.code);
                  setUserId(null);
                  setUsername('');
                  setSessionToken(null);
                  setIsRegistered(false);
                  setCurrentLobby(null);
                  setLobbyInfo(null);
                  setLobbies([]);
                  // Clear stored credentials
                  localStorage.removeItem('lobby_username');
                  if (username) {
                    localStorage.removeItem(`lobby_token_${username}`);
                  }
                  break;
                case 'LOBBY_NOT_FOUND':
                case 'PLAYER_NOT_IN_LOBBY':
                  // Lobby/player issues - clear current lobby state
                  setCurrentLobby(null);
                  break;
                case 'USERNAME_TAKEN':
                  // Username conflict - could suggest alternatives
                  console.log('Username taken, suggest alternatives');
                  break;
                default:
                  // Generic error handling
                  console.log('Error code:', data.code);
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