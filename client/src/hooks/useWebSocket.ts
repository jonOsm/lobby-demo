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
  setUsername: (username: string) => void;
}

export function useWebSocket(url: string = 'ws://localhost:8080/ws'): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lobbies, setLobbies] = useState<string[]>([]);
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [lobbyInfo, setLobbyInfo] = useState<Lobby | null>(null);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLeavingLobby, setIsLeavingLobby] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Use ref to store current user ID for immediate access
  const currentUserIdRef = useRef<string | null>(null);
  
  // Update ref when userId changes
  useEffect(() => {
    currentUserIdRef.current = userId;
  }, [userId]);
  
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
    sendMessage({
      action: 'register_user',
      username,
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
    if (!userId) {
      console.log('❌ No user ID available');
      setError('User not registered');
      return;
    }
    console.log('✅ Sending create_lobby with user ID:', userId);
    sendMessage({
      action: 'create_lobby',
      name,
      max_players: maxPlayers,
      public: isPublic,
      user_id: userId,
    });
  }, [sendMessage, userId]);

  const joinLobby = useCallback((lobbyId: string) => {
    if (!userId) {
      setError('User not registered');
      return;
    }
    sendMessage({
      action: 'join_lobby',
      lobby_id: lobbyId,
      user_id: userId,
    });
  }, [sendMessage, userId]);

  const leaveLobby = useCallback((lobbyId: string) => {
    if (!userId) {
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
      lobby_id: lobbyId,
      user_id: userId,
    });
  }, [sendMessage, userId, isLeavingLobby]);

  const setReady = useCallback((lobbyId: string, ready: boolean) => {
    if (!userId) {
      setError('User not registered');
      return;
    }
    sendMessage({
      action: 'set_ready',
      lobby_id: lobbyId,
      user_id: userId,
      ready,
    });
  }, [sendMessage, userId]);

  const startGame = useCallback((lobbyId: string) => {
    if (!userId) {
      setError('User not registered');
      return;
    }
    sendMessage({
      action: 'start_game',
      lobby_id: lobbyId,
      user_id: userId,
    });
  }, [sendMessage, userId]);

  const getLobbyInfo = useCallback((lobbyId: string) => {
    sendMessage({
      action: 'get_lobby_info',
      lobby_id: lobbyId,
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
          case 'user_registered':
            console.log('🎉 User registered successfully:', { userId: data.user_id, username: data.username });
            setUserId(data.user_id);
            setUsername(data.username);
            setIsRegistered(true);
            setError(null);
            // Store username for auto-reconnect
            localStorage.setItem('lobby_username', data.username);
            break;
          case 'lobby_state':
            // Reset leaving flag since we got a response
            setIsLeavingLobby(false);
            
            // Check if the current player is still in the lobby
            const currentPlayerInLobby = data.players.some(p => p.user_id === currentUserIdRef.current);
            
            if (!currentPlayerInLobby) {
              // Player is no longer in the lobby, clear current lobby state
              setCurrentLobby(null);
            } else {
              // Player is still in the lobby, update the lobby state
              setCurrentLobby({
                id: data.lobby_id,
                name: data.lobby_id, // Using lobby_id as name for now
                maxPlayers: 4, // Default, could be enhanced
                players: data.players,
                state: data.state as 'waiting' | 'in_game' | 'finished',
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
              players: data.players,
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
            // If the error is related to player not being in lobby or lobby not existing, clear the current lobby state
            if (data.message === 'player not in lobby' || data.message === 'lobby does not exist') {
              setCurrentLobby(null);
            }
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
  }, [url, sendMessage]);

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
    setUsername,
  };
} 