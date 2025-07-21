// Lobby and Player types matching the backend API
export interface Player {
  user_id: string;
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
export interface RegisterUserRequest {
  action: 'register_user';
  username: string;
}

export interface CreateLobbyRequest {
  action: 'create_lobby';
  name: string;
  max_players: number;
  public: boolean;
  user_id: string;
  metadata?: Record<string, any>;
}

export interface JoinLobbyRequest {
  action: 'join_lobby';
  lobby_id: string;
  user_id: string;
}

export interface LeaveLobbyRequest {
  action: 'leave_lobby';
  lobby_id: string;
  user_id: string;
}

export interface SetReadyRequest {
  action: 'set_ready';
  lobby_id: string;
  user_id: string;
  ready: boolean;
}

export interface ListLobbiesRequest {
  action: 'list_lobbies';
}

export interface StartGameRequest {
  action: 'start_game';
  lobby_id: string;
  user_id: string;
}

export interface GetLobbyInfoRequest {
  action: 'get_lobby_info';
  lobby_id: string;
}

export interface LogoutRequest {
  action: 'logout';
  user_id: string;
}

// Response types
export interface RegisterUserResponse {
  action: 'user_registered';
  user_id: string;
  username: string;
}

export interface LobbyStateResponse {
  action: 'lobby_state';
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

export interface LobbyInfoResponse {
  action: 'lobby_info';
  lobby_id: string;
  name: string;
  players: Player[];
  state: string;
  max_players: number;
  public: boolean;
}

export interface SessionCreatedEvent {
  event: 'session_created';
  user_id: string;
  username: string;
}

export interface SessionReconnectedEvent {
  event: 'session_reconnected';
  user_id: string;
  username: string;
}

export interface SessionRemovedEvent {
  event: 'session_removed';
  user_id: string;
  username: string;
}

export type WebSocketMessage = 
  | RegisterUserRequest
  | CreateLobbyRequest
  | JoinLobbyRequest
  | LeaveLobbyRequest
  | SetReadyRequest
  | ListLobbiesRequest
  | StartGameRequest
  | GetLobbyInfoRequest
  | LogoutRequest;

export type WebSocketResponse = 
  | RegisterUserResponse
  | LobbyStateResponse
  | LobbyListResponse
  | LobbyInfoResponse
  | ErrorResponse
  | SessionCreatedEvent
  | SessionReconnectedEvent
  | SessionRemovedEvent; 