package main

import (
	"encoding/json"
	"errors"
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

// Message types for client-server communication

type CreateLobbyRequest struct {
	Action     string                 `json:"action"`
	Name       string                 `json:"name"`
	MaxPlayers int                    `json:"max_players"`
	Public     bool                   `json:"public"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

type JoinLobbyRequest struct {
	Action   string `json:"action"`
	LobbyID  string `json:"lobby_id"`
	Username string `json:"username"`
}

type LeaveLobbyRequest struct {
	Action   string `json:"action"`
	LobbyID  string `json:"lobby_id"`
	Username string `json:"username"`
}

type SetReadyRequest struct {
	Action   string `json:"action"`
	LobbyID  string `json:"lobby_id"`
	Username string `json:"username"`
	Ready    bool   `json:"ready"`
}

type ListLobbiesRequest struct {
	Action string `json:"action"`
}

type StartGameRequest struct {
	Action   string `json:"action"`
	LobbyID  string `json:"lobby_id"`
	Username string `json:"username"` // Username of the player starting the game
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
	Username string `json:"username"`
	Ready    bool   `json:"ready"`
}

type LobbyListResponse struct {
	Action  string   `json:"action"`
	Lobbies []string `json:"lobbies"`
}

func main() {
	manager := lobby.NewLobbyManager()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("WebSocket connection attempt from: %s", r.RemoteAddr)
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}
		defer conn.Close()
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
			case "create_lobby":
				var req CreateLobbyRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid create_lobby message"})
					continue
				}
				lobby, err := manager.CreateLobby(req.Name, req.MaxPlayers, req.Public, req.Metadata)
				if err != nil {
					writeJSON(conn, ErrorResponse{"error", err.Error()})
					continue
				}
				writeJSON(conn, LobbyStateResponse{
					Action:   "lobby_created",
					LobbyID:  string(lobby.ID),
					Players:  []PlayerState{},
					State:    lobbyStateString(lobby.State),
					Metadata: lobby.Metadata,
				})
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
				player := &lobby.Player{ID: lobby.PlayerID(req.Username), Username: req.Username}
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
				err := manager.LeaveLobby(lobby.LobbyID(req.LobbyID), lobby.PlayerID(req.Username))
				if err != nil {
					writeJSON(conn, ErrorResponse{"error", err.Error()})
					continue
				}
				l, _ := manager.GetLobbyByID(lobby.LobbyID(req.LobbyID))
				writeJSON(conn, lobbyStateResponseFromLobby(l))
			case "set_ready":
				var req SetReadyRequest
				if err := json.Unmarshal(msg, &req); err != nil {
					writeJSON(conn, ErrorResponse{"error", "invalid set_ready message"})
					continue
				}
				l, ok := manager.GetLobbyByID(lobby.LobbyID(req.LobbyID))
				if !ok {
					writeJSON(conn, ErrorResponse{"error", "lobby not found"})
					continue
				}
				for _, p := range l.Players {
					if string(p.ID) == req.Username {
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
				l, ok := manager.GetLobbyByID(lobby.LobbyID(req.LobbyID))
				if !ok {
					writeJSON(conn, ErrorResponse{"error", "lobby not found"})
					continue
				}
				// Validate game can be started
				if err := validateGameStart(l, req.Username); err != nil {
					writeJSON(conn, ErrorResponse{"error", err.Error()})
					continue
				}
				// Start the game
				l.State = lobby.LobbyInGame
				writeJSON(conn, lobbyStateResponseFromLobby(l))
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
