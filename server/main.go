package main

import (
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

func main() {
	fmt.Println("Starting lobby demo server...")

	sessionManager := lobby.NewSessionManager()
	var manager *lobby.LobbyManager

	// Prepare handler dependencies
	deps := &lobby.HandlerDeps{
		SessionManager: sessionManager,
		LobbyManager:   nil, // Will be set after manager creation
		ConnToUserID:   make(map[interface{}]string),
	}

	broadcaster := func(userID string, message interface{}) {
		// Find the connection for this user and send the message
		for conn, mappedUserID := range deps.ConnToUserID {
			if mappedUserID == userID {
				if wsConn, ok := conn.(*WebSocketConn); ok {
					wsConn.WriteJSON(message)
				}
			}
		}
	}

	manager = lobby.NewLobbyManagerWithEvents(&lobby.LobbyEvents{
		Broadcaster: broadcaster,
		LobbyStateBuilder: func(l *lobby.Lobby) interface{} {
			return lobbyStateResponseFromLobby(l, manager)
		},
	})

	// Update deps with the manager
	deps.LobbyManager = manager

	// Message router setup
	router := lobby.NewMessageRouter()
	router.Handle("register_user", lobby.RegisterUserHandler(deps))
	router.Handle("create_lobby", lobby.CreateLobbyHandler(deps))
	router.Handle("join_lobby", lobby.JoinLobbyHandler(deps))
	router.Handle("leave_lobby", lobby.LeaveLobbyHandler(deps))
	router.Handle("set_ready", lobby.SetReadyHandler(deps))
	router.Handle("list_lobbies", lobby.ListLobbiesHandler(deps))
	router.Handle("start_game", lobby.StartGameHandler(deps, validateGameStart))
	router.Handle("get_lobby_info", lobby.GetLobbyInfoHandler(deps, toLibraryLobbyInfoResponse))
	router.Handle("logout", lobby.LogoutHandler(deps))

	// HTTP endpoint for WebSocket
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("WebSocket connection attempt from: %s", r.RemoteAddr)
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}
		wsConn := &WebSocketConn{conn: conn}
		defer func() {
			if userID, exists := deps.ConnToUserID[wsConn]; exists {
				sessionManager.RemoveSession(userID)
			}
			delete(deps.ConnToUserID, wsConn)
			conn.Close()
		}()
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Println("Read error:", err)
				break
			}
			err = router.Dispatch(wsConn, msg)
			if err != nil {
				log.Println("Dispatch error:", err)
			}
		}
	})

	// Add a simple HTTP endpoint for testing
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Lobby Demo Server is running!")
	})

	log.Println("Demo backend started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// Local types for response formatting (if still needed)
type PlayerState struct {
	UserID       string `json:"user_id"`
	Username     string `json:"username"`
	Ready        bool   `json:"ready"`
	CanStartGame bool   `json:"can_start_game"`
}

type LobbyStateResponse struct {
	Action   string                 `json:"action"`
	LobbyID  string                 `json:"lobby_id"`
	Players  []PlayerState          `json:"players"`
	State    string                 `json:"state"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
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

func lobbyStateResponseFromLobby(l *lobby.Lobby, manager *lobby.LobbyManager) LobbyStateResponse {
	players := make([]PlayerState, 0, len(l.Players))
	canStartGameFunc := manager.Events.CanStartGame
	for _, p := range l.Players {
		canStart := false
		if canStartGameFunc != nil {
			canStart = canStartGameFunc(l, string(p.ID))
		} else {
			canStart = (l.OwnerID == string(p.ID))
		}
		players = append(players, PlayerState{
			UserID:       string(p.ID),
			Username:     p.Username,
			Ready:        p.Ready,
			CanStartGame: canStart,
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

// Adapter to convert local LobbyInfoResponse to library type
func toLibraryLobbyInfoResponse(l *lobby.Lobby) lobby.LobbyInfoResponse {
	resp := lobbyInfoResponseFromLobby(l)
	players := make([]lobby.PlayerState, len(resp.Players))
	for i, p := range resp.Players {
		players[i] = lobby.PlayerState{
			UserID:       p.UserID,
			Username:     p.Username,
			Ready:        p.Ready,
			CanStartGame: p.CanStartGame,
		}
	}
	return lobby.LobbyInfoResponse{
		Action:     resp.Action,
		LobbyID:    resp.LobbyID,
		Name:       resp.Name,
		Players:    players,
		State:      resp.State,
		MaxPlayers: resp.MaxPlayers,
		Public:     resp.Public,
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
