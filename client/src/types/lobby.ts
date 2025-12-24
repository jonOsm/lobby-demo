// Lobby and Player types matching the backend API
export interface Player {
  user_id: string;
  username: string;
  ready: boolean;
  can_start_game?: boolean;
}

export interface Lobby {
  id: string;
  name: string;
  maxPlayers: number;
  players: Player[];
  state: 'waiting' | 'in_game' | 'finished';
  metadata?: Record<string, any>;
}

// Request payload types (without action field)
export interface RegisterUserPayload {
  username: string;
  token?: string; // Optional token for reconnection
}

export interface CreateLobbyPayload {
  name: string;
  max_players: number;
  public: boolean;
  user_id: string;
  token: string; // Session token for authentication
  metadata?: Record<string, any>;
}

export interface JoinLobbyPayload {
  lobby_id: string;
  user_id: string;
  token: string; // Session token for authentication
}

export interface LeaveLobbyPayload {
  lobby_id: string;
  user_id: string;
  token: string; // Session token for authentication
}

export interface SetReadyPayload {
  lobby_id: string;
  user_id: string;
  token: string; // Session token for authentication
  ready: boolean;
}

export interface ListLobbiesPayload {
  token: string; // Session token for authentication
}

export interface StartGamePayload {
  lobby_id: string;
  user_id: string;
  token: string; // Session token for authentication
}

export interface GetLobbyInfoPayload {
  lobby_id: string;
  token: string; // Session token for authentication
}

export interface LogoutPayload {
  user_id: string;
}

// WebSocket message types with data wrapper
export interface RegisterUserRequest {
  action: 'register_user';
  data: RegisterUserPayload;
}

export interface CreateLobbyRequest {
  action: 'create_lobby';
  data: CreateLobbyPayload;
}

export interface JoinLobbyRequest {
  action: 'join_lobby';
  data: JoinLobbyPayload;
}

export interface LeaveLobbyRequest {
  action: 'leave_lobby';
  data: LeaveLobbyPayload;
}

export interface SetReadyRequest {
  action: 'set_ready';
  data: SetReadyPayload;
}

export interface ListLobbiesRequest {
  action: 'list_lobbies';
  data: ListLobbiesPayload;
}

export interface StartGameRequest {
  action: 'start_game';
  data: StartGamePayload;
}

export interface GetLobbyInfoRequest {
  action: 'get_lobby_info';
  data: GetLobbyInfoPayload;
}

export interface LogoutRequest {
  action: 'logout';
  data: LogoutPayload;
}

// Response types
export interface RegisterUserResponse {
  action: 'user_registered';
  user_id: string;
  username: string;
  token: string; // Session token for future authentication
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
  code: string;
  message: string;
  details?: string;
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

export interface LobbyLeftResponse {
  action: 'left_lobby';
  lobby_id: string;
  user_id: string;
}

export interface LobbyClosedResponse {
  action: 'lobby_closed';
  reason: string;
  message: string;
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
  | LobbyLeftResponse
  | LobbyClosedResponse
  | ErrorResponse
  | SessionCreatedEvent
  | SessionReconnectedEvent
  | SessionRemovedEvent;