package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

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

	deps := &lobby.HandlerDeps{
		SessionManager: sessionManager,
		LobbyManager:   nil,
		ConnToUserID:   make(map[interface{}]string),
	}

	broadcaster := func(userID string, message interface{}) {
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
			responseBuilder := lobby.NewResponseBuilder(manager)
			return responseBuilder.BuildLobbyStateResponse(l)
		},
		OnPlayerLeave: func(l *lobby.Lobby, player *lobby.Player) {
			if string(player.ID) == l.OwnerID {
				log.Printf("Host %s left lobby %s, closing lobby for remaining players", player.Username, l.ID)
				manager.BroadcastToLobby(l, map[string]interface{}{
					"action":  "lobby_closed",
					"reason":  "host_left",
					"message": "The host has left the lobby",
				})
				for _, p := range l.Players {
					sessionManager.ClearLobbyID(string(p.ID))
				}
				l.Players = nil
			}
		},
		OnLobbyDeleted: func(l *lobby.Lobby) {
			for _, player := range l.Players {
				sessionManager.ClearLobbyID(string(player.ID))
			}
		},
	})

	deps.LobbyManager = manager

	// Start periodic cleanup of stale sessions (less frequent since we handle reconnection immediately)
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				sessionManager.CleanupStaleSessions(10 * time.Minute)
			}
		}
	}()

	router := lobby.NewMessageRouter()
	router.SetupDefaultHandlersWithCustom(deps, &lobby.HandlerOptions{
		GameStartValidator: validateGameStart,
		ResponseBuilder:    lobby.NewResponseBuilder(manager),
	})

	// HTTP endpoint for WebSocket
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("WebSocket connection attempt from: %s", r.RemoteAddr)
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}
		wsConn := &WebSocketConn{conn: conn}

		conn.SetCloseHandler(func(code int, text string) error {
			if userID, exists := deps.ConnToUserID[wsConn]; exists {
				log.Printf("Connection lost for user %s, keeping session active", userID)
			}
			delete(deps.ConnToUserID, wsConn)
			return nil
		})

		conn.SetPingHandler(func(appData string) error {
			return conn.WriteControl(websocket.PongMessage, []byte(appData), time.Now().Add(time.Second))
		})

		conn.SetPongHandler(func(string) error {
			return conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		})

		// Set initial read deadline
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		go func() {
			ticker := time.NewTicker(30 * time.Second)
			defer ticker.Stop()
			for {
				select {
				case <-ticker.C:
					if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(time.Second)); err != nil {
						log.Printf("Ping failed for %s: %v", r.RemoteAddr, err)
						delete(deps.ConnToUserID, wsConn)
						return
					}
				}
			}
		}()

		defer func() {
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
	log.Fatal(http.ListenAndServe("localhost:8080", nil))
}

// validateGameStart validates game start conditions.
func validateGameStart(l *lobby.Lobby, username string) error {
	if l.State != lobby.LobbyWaiting {
		return errors.New("lobby is not in waiting state")
	}

	if len(l.Players) < 2 {
		return errors.New("need at least 2 players to start the game")
	}

	for _, p := range l.Players {
		if !p.Ready {
			return errors.New("all players must be ready to start the game")
		}
	}

	playerFound := false
	for _, p := range l.Players {
		if p.Username == username {
			playerFound = true
			break
		}
	}
	if !playerFound {
		return errors.New("player not found in lobby")
	}

	return nil
}
