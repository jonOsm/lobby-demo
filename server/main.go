package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	lobby "github.com/jonosm/multiplayer-lobby"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		log.Printf("Origin check for: %s", r.Header.Get("Origin"))
		return true
	},
}

// UserSession represents an active user session
type UserSession struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Conn     *websocket.Conn
}

// SessionManager manages active user sessions
type SessionManager struct {
	mu       sync.RWMutex
	sessions map[string]*UserSession    // userID -> session
	connToID map[*websocket.Conn]string // connection -> userID
}

// NewSessionManager creates a new session manager
func NewSessionManager() *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*UserSession),
		connToID: make(map[*websocket.Conn]string),
	}
}

// GenerateUserID creates a unique user ID
func (sm *SessionManager) GenerateUserID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// CreateSession creates a new user session
func (sm *SessionManager) CreateSession(username string, conn *websocket.Conn) *UserSession {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	userID := sm.GenerateUserID()
	session := &UserSession{
		ID:       userID,
		Username: username,
		Conn:     conn,
	}

	sm.sessions[userID] = session
	sm.connToID[conn] = userID

	return session
}

// GetSessionByID retrieves a session by user ID
func (sm *SessionManager) GetSessionByID(userID string) (*UserSession, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	session, exists := sm.sessions[userID]
	return session, exists
}

// GetSessionByConn retrieves a session by WebSocket connection
func (sm *SessionManager) GetSessionByConn(conn *websocket.Conn) (*UserSession, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	userID, exists := sm.connToID[conn]
	if !exists {
		return nil, false
	}
	session, exists := sm.sessions[userID]
	return session, exists
}

// RemoveSession removes a user session
func (sm *SessionManager) RemoveSession(conn *websocket.Conn) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if userID, exists := sm.connToID[conn]; exists {
		delete(sm.sessions, userID)
		delete(sm.connToID, conn)
	}
}

// IsUsernameTaken checks if a username is already in use
func (sm *SessionManager) IsUsernameTaken(username string) bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	for _, session := range sm.sessions {
		if session.Username == username {
			return true
		}
	}
	return false
}

// Message types for client-server communication

type RegisterUserRequest struct {
	Action   string `json:"action"`
	Username string `json:"username"`
}

type RegisterUserResponse struct {
	Action   string `json:"action"`
	UserID   string `json:"user_id"`
	Username string `json:"username"`
}

type CreateLobbyRequest struct {
	Action     string                 `json:"action"`
	Name       string                 `json:"name"`
	MaxPlayers int                    `json:"max_players"`
	Public     bool                   `json:"public"`
	UserID     string                 `json:"user_id"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

type JoinLobbyRequest struct {
	Action  string `json:"action"`
	LobbyID string `json:"lobby_id"`
	UserID  string `json:"user_id"`
}

type LeaveLobbyRequest struct {
	Action  string `json:"action"`
	LobbyID string `json:"lobby_id"`
	UserID  string `json:"user_id"`
}

type SetReadyRequest struct {
	Action  string `json:"action"`
	LobbyID string `json:"lobby_id"`
	UserID  string `json:"user_id"`
	Ready   bool   `json:"ready"`
}

type ListLobbiesRequest struct {
	Action string `json:"action"`
}

type StartGameRequest struct {
	Action  string `json:"action"`
	LobbyID string `json:"lobby_id"`
	UserID  string `json:"user_id"` // User ID of the player starting the game
}

type GetLobbyInfoRequest struct {
	Action  string `json:"action"`
	LobbyID string `json:"lobby_id"`
}

type LobbyInfoResponse struct {
	Action     string        `json:"action"`
	LobbyID    string        `json:"lobby_id"`
	Name       string        `json:"name"`
	Players    []PlayerState `json:"players"`
	State      string        `json:"state"`
	MaxPlayers int           `json:"max_players"`
	Public     bool          `json:"public"`
}

type ErrorResponse struct {
	Action  string `json:"action"`
	Message string `json:"message"`
}

type LobbyStateResponse struct {
	Action   string                 `json:"action"`
	LobbyID  string                 `json:"lobby_id"`
	Players  []PlayerState          `json:"players"`
	State    string                 `json:"state"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

type PlayerState struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Ready    bool   `json:"ready"`
}

type LobbyListResponse struct {
	Action  string   `json:"action"`
	Lobbies []string `json:"lobbies"`
}

func main() {
	manager := lobby.NewLobbyManager()
	sessionManager := NewSessionManager()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("WebSocket connection attempt from: %s", r.RemoteAddr)
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}
		defer func() {
			sessionManager.RemoveSession(conn)
			conn.Close()
		}()
		log.Printf("WebSocket connection established with: %s", r.RemoteAddr)

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Println("Read error:", err)
				break
			}

			var base struct {
				Action string `json:"action"`
			}
			if err := json.Unmarshal(msg, &base); err != nil {
				log.Println("Invalid message format:", err)
				continue
			}

			switch base.Action {
			case "register_user":
				var req RegisterUserRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid register_user message"})
					continue
				}

				// Check if username is already taken
				if sessionManager.IsUsernameTaken(req.Username) {
					writeJSON(conn, ErrorResponse{"error", "username already taken"})
					continue
				}

				// Create new session
				session := sessionManager.CreateSession(req.Username, conn)
				writeJSON(conn, RegisterUserResponse{
					Action:   "user_registered",
					UserID:   session.ID,
					Username: session.Username,
				})
			case "create_lobby":
				var req CreateLobbyRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid create_lobby message"})
					continue
				}

				// Get user session
				session, exists := sessionManager.GetSessionByID(req.UserID)
				if !exists {
					writeJSON(conn, ErrorResponse{"error", "user not found"})
					continue
				}

				createdLobby, err := manager.CreateLobby(req.Name, req.MaxPlayers, req.Public, req.Metadata)
				if err != nil {
					writeJSON(conn, ErrorResponse{"error", err.Error()})
					continue
				}

				// Automatically add the creator to the lobby
				player := &lobby.Player{ID: lobby.PlayerID(session.ID), Username: session.Username}
				err = manager.JoinLobby(createdLobby.ID, player)
				if err != nil {
					writeJSON(conn, ErrorResponse{"error", "failed to join creator to lobby: " + err.Error()})
					continue
				}

				// Get the updated lobby state
				l, _ := manager.GetLobbyByID(createdLobby.ID)
				writeJSON(conn, lobbyStateResponseFromLobby(l))
			case "list_lobbies":
				lobbies := manager.ListLobbies()
				ids := make([]string, 0, len(lobbies))
				for _, l := range lobbies {
					ids = append(ids, string(l.ID))
				}
				writeJSON(conn, LobbyListResponse{
					Action:  "lobby_list",
					Lobbies: ids,
				})
			case "join_lobby":
				var req JoinLobbyRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid join_lobby message"})
					continue
				}

				// Get user session
				session, exists := sessionManager.GetSessionByID(req.UserID)
				if !exists {
					writeJSON(conn, ErrorResponse{"error", "user not found"})
					continue
				}

				player := &lobby.Player{ID: lobby.PlayerID(session.ID), Username: session.Username}
				err := manager.JoinLobby(lobby.LobbyID(req.LobbyID), player)
				if err != nil {
					writeJSON(conn, ErrorResponse{"error", err.Error()})
					continue
				}
				l, _ := manager.GetLobbyByID(lobby.LobbyID(req.LobbyID))
				writeJSON(conn, lobbyStateResponseFromLobby(l))
			case "leave_lobby":
				var req LeaveLobbyRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid leave_lobby message"})
					continue
				}

				// Get user session
				session, exists := sessionManager.GetSessionByID(req.UserID)
				if !exists {
					writeJSON(conn, ErrorResponse{"error", "user not found"})
					continue
				}

				err := manager.LeaveLobby(lobby.LobbyID(req.LobbyID), lobby.PlayerID(session.ID))
				if err != nil {
					writeJSON(conn, ErrorResponse{"error", err.Error()})
					continue
				}
				// Check if lobby still exists (it might have been deleted if it became empty)
				l, exists := manager.GetLobbyByID(lobby.LobbyID(req.LobbyID))
				if exists {
					writeJSON(conn, lobbyStateResponseFromLobby(l))
				} else {
					// Lobby was deleted, send a response indicating the player is no longer in the lobby
					writeJSON(conn, LobbyStateResponse{
						Action:   "lobby_state",
						LobbyID:  req.LobbyID,
						Players:  []PlayerState{},
						State:    "waiting",
						Metadata: map[string]interface{}{},
					})
				}
			case "set_ready":
				var req SetReadyRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid set_ready message"})
					continue
				}

				// Get user session
				session, exists := sessionManager.GetSessionByID(req.UserID)
				if !exists {
					writeJSON(conn, ErrorResponse{"error", "user not found"})
					continue
				}

				l, ok := manager.GetLobbyByID(lobby.LobbyID(req.LobbyID))
				if !ok {
					writeJSON(conn, ErrorResponse{"error", "lobby not found"})
					continue
				}
				for _, p := range l.Players {
					if string(p.ID) == session.ID {
						p.Ready = req.Ready
					}
				}
				writeJSON(conn, lobbyStateResponseFromLobby(l))
			case "start_game":
				var req StartGameRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid start_game message"})
					continue
				}

				// Get user session
				session, exists := sessionManager.GetSessionByID(req.UserID)
				if !exists {
					writeJSON(conn, ErrorResponse{"error", "user not found"})
					continue
				}

				l, ok := manager.GetLobbyByID(lobby.LobbyID(req.LobbyID))
				if !ok {
					writeJSON(conn, ErrorResponse{"error", "lobby not found"})
					continue
				}
				// Validate game can be started
				if err := validateGameStart(l, session.Username); err != nil {
					writeJSON(conn, ErrorResponse{"error", err.Error()})
					continue
				}
				// Start the game
				l.State = lobby.LobbyInGame
				writeJSON(conn, lobbyStateResponseFromLobby(l))
			case "get_lobby_info":
				var req GetLobbyInfoRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid get_lobby_info message"})
					continue
				}
				l, ok := manager.GetLobbyByID(lobby.LobbyID(req.LobbyID))
				if !ok {
					writeJSON(conn, ErrorResponse{"error", "lobby not found"})
					continue
				}
				writeJSON(conn, lobbyInfoResponseFromLobby(l))
			default:
				writeJSON(conn, ErrorResponse{"error", "unknown action"})
			}
		}
	})

	log.Println("Demo backend started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func writeJSON(conn *websocket.Conn, v interface{}) {
	data, _ := json.Marshal(v)
	conn.WriteMessage(websocket.TextMessage, data)
}

func lobbyStateResponseFromLobby(l *lobby.Lobby) LobbyStateResponse {
	players := make([]PlayerState, 0, len(l.Players))
	for _, p := range l.Players {
		players = append(players, PlayerState{
			UserID:   string(p.ID),
			Username: p.Username,
			Ready:    p.Ready,
		})
	}
	return LobbyStateResponse{
		Action:   "lobby_state",
		LobbyID:  string(l.ID),
		Players:  players,
		State:    lobbyStateString(l.State),
		Metadata: l.Metadata,
	}
}

func lobbyInfoResponseFromLobby(l *lobby.Lobby) LobbyInfoResponse {
	players := make([]PlayerState, 0, len(l.Players))
	for _, p := range l.Players {
		players = append(players, PlayerState{
			UserID:   string(p.ID),
			Username: p.Username,
			Ready:    p.Ready,
		})
	}
	return LobbyInfoResponse{
		Action:     "lobby_info",
		LobbyID:    string(l.ID),
		Name:       l.Name,
		Players:    players,
		State:      lobbyStateString(l.State),
		MaxPlayers: l.MaxPlayers,
		Public:     l.Public,
	}
}

func validateGameStart(l *lobby.Lobby, username string) error {
	// Check if lobby is in waiting state
	if l.State != lobby.LobbyWaiting {
		return errors.New("lobby is not in waiting state")
	}

	// Check if there are enough players (minimum 2)
	if len(l.Players) < 2 {
		return errors.New("need at least 2 players to start the game")
	}

	// Check if all players are ready
	for _, p := range l.Players {
		if !p.Ready {
			return errors.New("all players must be ready to start the game")
		}
	}

	// Check if the requesting player is in the lobby
	playerFound := false
	for _, p := range l.Players {
		if string(p.ID) == username {
			playerFound = true
			break
		}
	}
	if !playerFound {
		return errors.New("player not found in lobby")
	}

	return nil
}

func lobbyStateString(state lobby.LobbyState) string {
	switch state {
	case lobby.LobbyWaiting:
		return "waiting"
	case lobby.LobbyInGame:
		return "in_game"
	case lobby.LobbyFinished:
		return "finished"
	default:
		return "unknown"
	}
}
