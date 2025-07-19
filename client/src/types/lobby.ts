// Lobby and Player types matching the backend API
export interface Player {
  username: string;
  ready: boolean;
}

export interface Lobby {
  id: string;
  name: string;
  maxPlayers: number;
  players: Player[];
  state: 'waiting' | 'in_game' | 'finished';
  metadata?: Record<string, any>;
}

// WebSocket message types
export interface CreateLobbyRequest {
  action: 'create_lobby';
  name: string;
  max_players: number;
  public: boolean;
  metadata?: Record<string, any>;
}

export interface JoinLobbyRequest {
  action: 'join_lobby';
  lobby_id: string;
  username: string;
}

export interface LeaveLobbyRequest {
  action: 'leave_lobby';
  lobby_id: string;
  username: string;
}

export interface SetReadyRequest {
  action: 'set_ready';
  lobby_id: string;
  username: string;
  ready: boolean;
}

export interface ListLobbiesRequest {
  action: 'list_lobbies';
}

// Response types
export interface LobbyStateResponse {
  action: 'lobby_created' | 'lobby_state';
  lobby_id: string;
  players: Player[];
  state: string;
  metadata?: Record<string, any>;
}

export interface LobbyListResponse {
  action: 'lobby_list';
  lobbies: string[];
}

export interface ErrorResponse {
  action: 'error';
  message: string;
}

export type WebSocketMessage = 
  | CreateLobbyRequest
  | JoinLobbyRequest
  | LeaveLobbyRequest
  | SetReadyRequest
  | ListLobbiesRequest;

export type WebSocketResponse = 
  | LobbyStateResponse
  | LobbyListResponse
  | ErrorResponse; 