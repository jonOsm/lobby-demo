package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	lobby "github.com/jonosm/multiplayer-lobby"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		log.Printf("Origin check for: %s", r.Header.Get("Origin"))
		return true
	},
}

// Restore type definitions

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
	UserID  string `json:"user_id"`
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

// Add a map to associate WebSocket connections with user IDs
var connToUserID = make(map[*websocket.Conn]string)

func main() {
	fmt.Println("Starting lobby demo server...")

	sessionManager := lobby.NewSessionManager()

	var manager *lobby.LobbyManager // Declare manager variable

	// Register the broadcaster for the library
	broadcaster := func(userID string, message interface{}) {
		for conn, mappedUserID := range connToUserID {
			if mappedUserID == userID {
				writeJSON(conn, message)
			}
		}
	}

	manager = lobby.NewLobbyManagerWithEvents(&lobby.LobbyEvents{
		Broadcaster: broadcaster,
		LobbyStateBuilder: func(l *lobby.Lobby) interface{} {
			return lobbyStateResponseFromLobby(l)
		},
	})

	// Add a simple HTTP endpoint for testing
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Lobby Demo Server is running!")
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("WebSocket connection attempt from: %s", r.RemoteAddr)
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}
		defer func() {
			// Remove session and connection mapping on close
			if userID, exists := connToUserID[conn]; exists {
				sessionManager.RemoveSession(userID)
			}
			delete(connToUserID, conn)
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

			log.Printf("Received message with action: %s", base.Action)

			switch base.Action {
			case "register_user":
				var req RegisterUserRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid register_user message"})
					continue
				}

				// Check if this username already has a session (active or inactive)
				if existingSession, exists := sessionManager.GetSessionByUsername(req.Username); exists {
					log.Printf("Found existing session for username %s: ID=%s, Active=%v", req.Username, existingSession.ID, existingSession.Active)

					// Check if there's already an active connection for this username
					if existingSession.Active {
						userAlreadyConnected := false
						for _, mappedUserID := range connToUserID {
							if mappedUserID == existingSession.ID {
								userAlreadyConnected = true
								break
							}
						}
						if userAlreadyConnected {
							log.Printf("Username %s is already active, cannot reconnect", req.Username)
							writeJSON(conn, ErrorResponse{"error", "username already taken"})
							continue
						}
					}

					// Reconnect to existing session
					log.Printf("Reconnecting user %s to existing session %s", req.Username, existingSession.ID)
					session := sessionManager.CreateSessionWithID(existingSession.ID, req.Username)
					connToUserID[conn] = session.ID
					writeJSON(conn, RegisterUserResponse{
						Action:   "user_registered",
						UserID:   session.ID,
						Username: session.Username,
					})
					continue
				} else {
					log.Printf("No existing session found for username %s, creating new session", req.Username)
				}

				// Create new session
				session := sessionManager.CreateSession(req.Username)
				connToUserID[conn] = session.ID
				log.Printf("New user registered: %s with ID: %s", req.Username, session.ID)
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
				// Remove all calls to manager.BroadcastToLobby and any now-unused variables
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
				// Remove all calls to manager.BroadcastToLobby and any now-unused variables
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
				// Remove all calls to manager.BroadcastToLobby and any now-unused variables
				exists = false
				if _, ok := manager.GetLobbyByID(lobby.LobbyID(req.LobbyID)); ok {
					exists = true
				}
				if exists {
					// Lobby was deleted, send a response indicating the player is no longer in the lobby
					lobbyStateResponse := LobbyStateResponse{
						Action:   "lobby_state",
						LobbyID:  req.LobbyID,
						Players:  []PlayerState{},
						State:    "waiting",
						Metadata: map[string]interface{}{},
					}
					// Send to the leaving player
					writeJSON(conn, lobbyStateResponse)
				} else {
					// Lobby was deleted, send a response indicating the player is no longer in the lobby
					lobbyStateResponse := LobbyStateResponse{
						Action:   "lobby_state",
						LobbyID:  req.LobbyID,
						Players:  []PlayerState{},
						State:    "waiting",
						Metadata: map[string]interface{}{},
					}
					// Send to the leaving player
					writeJSON(conn, lobbyStateResponse)
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

				// Use the library method to set ready status and broadcast
				err := manager.SetPlayerReady(lobby.LobbyID(req.LobbyID), lobby.PlayerID(session.ID), req.Ready)
				if err != nil {
					log.Printf("SetPlayerReady error: %v", err)
					writeJSON(conn, ErrorResponse{"error", err.Error()})
					continue
				}
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
				// Broadcast the updated lobby state to all users in the lobby
				// This line is removed as per the edit hint.
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
				log.Printf("Unknown action received: %s", base.Action)
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
	log.Printf("Validating game start for user %s in lobby %s", username, l.ID)

	// Check if lobby is in waiting state
	if l.State != lobby.LobbyWaiting {
		log.Printf("Lobby is not in waiting state: %v", l.State)
		return errors.New("lobby is not in waiting state")
	}

	// Check if there are enough players (minimum 2)
	if len(l.Players) < 2 {
		log.Printf("Not enough players: %d", len(l.Players))
		return errors.New("need at least 2 players to start the game")
	}

	// Check if all players are ready
	log.Printf("Checking ready status for %d players:", len(l.Players))
	for _, p := range l.Players {
		log.Printf("  Player %s (ID: %s): Ready=%v", p.Username, p.ID, p.Ready)
		if !p.Ready {
			log.Printf("Player %s is not ready", p.Username)
			return errors.New("all players must be ready to start the game")
		}
	}

	// Check if the requesting player is in the lobby
	playerFound := false
	for _, p := range l.Players {
		if p.Username == username {
			playerFound = true
			log.Printf("Requesting player %s found in lobby", username)
			break
		}
	}
	if !playerFound {
		log.Printf("Requesting player %s not found in lobby", username)
		return errors.New("player not found in lobby")
	}

	log.Printf("Game start validation passed for user %s", username)
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
